// Package audit implements the core audit processing use case: parsing uploaded
// registry files, running the rule engine, and persisting discrepancies.
package audit

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/usecase/ml"
)

type taskRepo interface {
	Create(ctx context.Context, task entity.Task) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.TaskStatus, errMsg *string) error
	UpdateCompleted(ctx context.Context, id uuid.UUID, stats entity.TaskStats) error
	GetByID(ctx context.Context, id uuid.UUID) (entity.Task, error)
	ListByUserID(ctx context.Context, userID int64) ([]entity.Task, error)
}

type landRecordRepo interface {
	BatchInsert(ctx context.Context, records []entity.LandRecord) error
}

type estateRecordRepo interface {
	BatchInsert(ctx context.Context, records []entity.EstateRecord) error
}

type discrepancyRepo interface {
	BatchInsert(ctx context.Context, discrepancies []entity.Discrepancy) error
	ListByTaskID(ctx context.Context, taskID uuid.UUID, filter entity.DiscrepancyFilter) ([]entity.Discrepancy, int, error)
	GetByID(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error)
	UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error
	SummaryByTaskID(ctx context.Context, taskID uuid.UUID) (entity.DiscrepancySummary, error)
	ListPersonsByTaskID(ctx context.Context, taskID uuid.UUID, page, pageSize int) ([]entity.PersonRisk, int, error)
}

type discrepancyExplainer interface {
	ExplainDiscrepancy(ctx context.Context, d entity.Discrepancy) (string, error)
}

type UseCase struct {
	taskRepo        taskRepo
	landRepo        landRecordRepo
	estateRepo      estateRecordRepo
	discrepancyRepo discrepancyRepo
	explainer       discrepancyExplainer
	mlClient        *ml.Client
	logger          *slog.Logger
}

func New(
	taskRepo taskRepo,
	landRepo landRecordRepo,
	estateRepo estateRecordRepo,
	discrepancyRepo discrepancyRepo,
	explainer discrepancyExplainer,
	mlClient *ml.Client,
	logger *slog.Logger,
) *UseCase {
	return &UseCase{
		taskRepo:        taskRepo,
		landRepo:        landRepo,
		estateRepo:      estateRepo,
		discrepancyRepo: discrepancyRepo,
		explainer:       explainer,
		mlClient:        mlClient,
		logger:          logger,
	}
}

func (u *UseCase) Upload(ctx context.Context, userID int64, landData []byte, estateData []byte, landExt string, estateExt string) (uuid.UUID, error) {
	taskID := uuid.New()
	task := entity.Task{
		ID:        taskID,
		UserID:    userID,
		Status:    entity.TaskStatusPending,
		CreatedAt: time.Now(),
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return uuid.UUID{}, fmt.Errorf("create task: %w", err)
	}

	// Process asynchronously; use Background so it outlives the request context.
	iCtx := context.WithoutCancel(ctx)
	go u.process(iCtx, taskID, landData, estateData, landExt, estateExt)

	return taskID, nil
}

func (u *UseCase) process(ctx context.Context, taskID uuid.UUID, landData, estateData []byte, landExt, estateExt string) {
	log := u.logger.With("task_id", taskID)
	log.Info("task processing started")

	if err := u.taskRepo.UpdateStatus(ctx, taskID, entity.TaskStatusProcessing, nil); err != nil {
		log.Error("failed to update task status to PROCESSING", "error", err)
		return
	}

	fail := func(err error) {
		msg := err.Error()
		log.Error("task processing failed", "error", err)
		if updateErr := u.taskRepo.UpdateStatus(ctx, taskID, entity.TaskStatusFailed, &msg); updateErr != nil {
			log.Error("failed to update task status to FAILED", "error", updateErr)
		}
	}

	landRecords, err := ParseLandFile(landData, landExt, taskID)
	if err != nil {
		fail(fmt.Errorf("parse land file: %w", err))
		return
	}
	log.Info("land records parsed", "count", len(landRecords))

	estateRecords, err := ParseEstateFile(estateData, estateExt, taskID)
	if err != nil {
		fail(fmt.Errorf("parse estate file: %w", err))
		return
	}
	log.Info("estate records parsed", "count", len(estateRecords))

	discrepancies := runRules(taskID, landRecords, estateRecords)
	log.Info("rules applied", "discrepancies", len(discrepancies))

	if err := u.landRepo.BatchInsert(ctx, landRecords); err != nil {
		fail(fmt.Errorf("insert land records: %w", err))
		return
	}

	if err := u.estateRepo.BatchInsert(ctx, estateRecords); err != nil {
		fail(fmt.Errorf("insert estate records: %w", err))
		return
	}

	if err := u.discrepancyRepo.BatchInsert(ctx, discrepancies); err != nil {
		fail(fmt.Errorf("insert discrepancies: %w", err))
		return
	}

	// Count unique tax IDs present in both registries
	estateByTaxID := make(map[string]struct{})
	for _, e := range estateRecords {
		if e.TaxID != "" {
			estateByTaxID[e.TaxID] = struct{}{}
		}
	}
	matchedTaxIDs := make(map[string]struct{})
	for _, l := range landRecords {
		if l.TaxID != "" {
			if _, ok := estateByTaxID[l.TaxID]; ok {
				matchedTaxIDs[l.TaxID] = struct{}{}
			}
		}
	}
	matched := len(matchedTaxIDs)

	stats := entity.TaskStats{
		TotalLand:          len(landRecords),
		TotalEstate:        len(estateRecords),
		Matched:            matched,
		DiscrepanciesCount: len(discrepancies),
	}

	if err := u.taskRepo.UpdateCompleted(ctx, taskID, stats); err != nil {
		log.Error("failed to mark task completed", "error", err)
		return
	}

	u.scoreWithML(ctx, log, taskID, landRecords, estateRecords)

	log.Info("task completed", "stats", stats)
}

func (u *UseCase) ListTasks(ctx context.Context, userID int64) ([]entity.Task, error) {
	return u.taskRepo.ListByUserID(ctx, userID)
}

func (u *UseCase) UploadFromRecords(ctx context.Context, userID int64, landRecords []entity.LandRecord, estateRecords []entity.EstateRecord) (uuid.UUID, error) {
	taskID := uuid.New()
	task := entity.Task{
		ID:        taskID,
		UserID:    userID,
		Status:    entity.TaskStatusPending,
		CreatedAt: time.Now(),
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return uuid.UUID{}, fmt.Errorf("create task: %w", err)
	}

	for i := range landRecords {
		landRecords[i].TaskID = taskID
	}
	for i := range estateRecords {
		estateRecords[i].TaskID = taskID
	}

	iCtx := context.WithoutCancel(ctx)
	go u.processRecords(iCtx, taskID, landRecords, estateRecords)

	return taskID, nil
}

func (u *UseCase) processRecords(ctx context.Context, taskID uuid.UUID, landRecords []entity.LandRecord, estateRecords []entity.EstateRecord) {
	log := u.logger.With("task_id", taskID)
	log.Info("task processing started")

	if err := u.taskRepo.UpdateStatus(ctx, taskID, entity.TaskStatusProcessing, nil); err != nil {
		log.Error("failed to update task status to PROCESSING", "error", err)
		return
	}

	fail := func(err error) {
		msg := err.Error()
		log.Error("task processing failed", "error", err)
		if updateErr := u.taskRepo.UpdateStatus(ctx, taskID, entity.TaskStatusFailed, &msg); updateErr != nil {
			log.Error("failed to update task status to FAILED", "error", updateErr)
		}
	}

	discrepancies := runRules(taskID, landRecords, estateRecords)
	log.Info("rules applied", "discrepancies", len(discrepancies))

	if err := u.landRepo.BatchInsert(ctx, landRecords); err != nil {
		fail(fmt.Errorf("insert land records: %w", err))
		return
	}

	if err := u.estateRepo.BatchInsert(ctx, estateRecords); err != nil {
		fail(fmt.Errorf("insert estate records: %w", err))
		return
	}

	if err := u.discrepancyRepo.BatchInsert(ctx, discrepancies); err != nil {
		fail(fmt.Errorf("insert discrepancies: %w", err))
		return
	}

	estateByTaxID := make(map[string]struct{})
	for _, e := range estateRecords {
		if e.TaxID != "" {
			estateByTaxID[e.TaxID] = struct{}{}
		}
	}
	matchedTaxIDs := make(map[string]struct{})
	for _, l := range landRecords {
		if l.TaxID != "" {
			if _, ok := estateByTaxID[l.TaxID]; ok {
				matchedTaxIDs[l.TaxID] = struct{}{}
			}
		}
	}

	stats := entity.TaskStats{
		TotalLand:          len(landRecords),
		TotalEstate:        len(estateRecords),
		Matched:            len(matchedTaxIDs),
		DiscrepanciesCount: len(discrepancies),
	}

	if err := u.taskRepo.UpdateCompleted(ctx, taskID, stats); err != nil {
		log.Error("failed to mark task completed", "error", err)
		return
	}

	u.scoreWithML(ctx, log, taskID, landRecords, estateRecords)

	log.Info("task completed", "stats", stats)
}

func (u *UseCase) GetTask(ctx context.Context, taskID uuid.UUID) (entity.Task, error) {
	return u.taskRepo.GetByID(ctx, taskID)
}

func (u *UseCase) GetResults(ctx context.Context, taskID uuid.UUID, filter entity.DiscrepancyFilter) ([]entity.Discrepancy, int, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return nil, 0, err
	}
	return u.discrepancyRepo.ListByTaskID(ctx, taskID, filter)
}

func (u *UseCase) GetSummary(ctx context.Context, taskID uuid.UUID) (entity.DiscrepancySummary, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return entity.DiscrepancySummary{}, err
	}
	return u.discrepancyRepo.SummaryByTaskID(ctx, taskID)
}

func (u *UseCase) GetDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error) {
	return u.discrepancyRepo.GetByID(ctx, taskID, discID)
}

func (u *UseCase) Export(ctx context.Context, taskID uuid.UUID) ([]entity.Discrepancy, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return nil, err
	}
	items, _, err := u.discrepancyRepo.ListByTaskID(ctx, taskID, entity.DiscrepancyFilter{
		Page:     1,
		PageSize: 100_000,
	})
	return items, err
}

func (u *UseCase) ExplainDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (string, error) {
	d, err := u.discrepancyRepo.GetByID(ctx, taskID, discID)
	if err != nil {
		return "", err
	}
	if u.explainer == nil {
		return "", entity.ErrNotConfigured
	}
	return u.explainer.ExplainDiscrepancy(ctx, d)
}

func (u *UseCase) GetPersons(ctx context.Context, taskID uuid.UUID, page, pageSize int) ([]entity.PersonRisk, int, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return nil, 0, err
	}
	return u.discrepancyRepo.ListPersonsByTaskID(ctx, taskID, page, pageSize)
}

func (u *UseCase) UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error {
	switch status {
	case entity.ResolutionNew, entity.ResolutionInReview, entity.ResolutionConfirmed, entity.ResolutionDismissed:
	default:
		return entity.ErrInvalidResolutionStatus
	}
	return u.discrepancyRepo.UpdateResolutionStatus(ctx, taskID, discID, status)
}

func (u *UseCase) scoreWithML(ctx context.Context, log *slog.Logger, taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) {
	if u.mlClient == nil {
		return
	}
	scores, err := u.mlClient.ScoreRecords(ctx, land, estate)
	if err != nil {
		log.Warn("ml scoring failed", "error", err)
		return
	}
	log.Info("ml scoring complete", "scored_tax_ids", len(scores))
}
