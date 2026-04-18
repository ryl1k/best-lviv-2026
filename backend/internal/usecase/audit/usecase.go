package audit

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
)

type UseCase struct {
	taskRepo       repo.TaskRepo
	landRepo       repo.LandRecordRepo
	estateRepo     repo.EstateRecordRepo
	discrepancyRepo repo.DiscrepancyRepo
	logger         *slog.Logger
}

func New(
	taskRepo repo.TaskRepo,
	landRepo repo.LandRecordRepo,
	estateRepo repo.EstateRecordRepo,
	discrepancyRepo repo.DiscrepancyRepo,
	logger *slog.Logger,
) *UseCase {
	return &UseCase{
		taskRepo:        taskRepo,
		landRepo:        landRepo,
		estateRepo:      estateRepo,
		discrepancyRepo: discrepancyRepo,
		logger:          logger,
	}
}

func (u *UseCase) Upload(ctx context.Context, landData []byte, estateData []byte, landExt string, estateExt string) (uuid.UUID, error) {
	taskID := uuid.New()
	task := entity.Task{
		ID:        taskID,
		Status:    entity.TaskStatusPending,
		CreatedAt: time.Now(),
	}

	if err := u.taskRepo.Create(ctx, task); err != nil {
		return uuid.UUID{}, fmt.Errorf("create task: %w", err)
	}

	// Process asynchronously; use Background so it outlives the request context.
	go u.process(context.Background(), taskID, landData, estateData, landExt, estateExt)

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

	// Count matched tax IDs
	estateByTaxID := make(map[string]struct{})
	for _, e := range estateRecords {
		if e.TaxID != "" {
			estateByTaxID[e.TaxID] = struct{}{}
		}
	}
	matched := 0
	for _, l := range landRecords {
		if _, ok := estateByTaxID[l.TaxID]; ok {
			matched++
		}
	}

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

	log.Info("task completed", "stats", stats)
}

func (u *UseCase) GetTask(ctx context.Context, taskID uuid.UUID) (entity.Task, error) {
	return u.taskRepo.GetByID(ctx, taskID)
}

func (u *UseCase) GetResults(ctx context.Context, taskID uuid.UUID, filter repo.DiscrepancyFilter) ([]entity.Discrepancy, int, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return nil, 0, err
	}
	return u.discrepancyRepo.ListByTaskID(ctx, taskID, filter)
}

func (u *UseCase) GetSummary(ctx context.Context, taskID uuid.UUID) (repo.DiscrepancySummary, error) {
	if _, err := u.taskRepo.GetByID(ctx, taskID); err != nil {
		return repo.DiscrepancySummary{}, err
	}
	return u.discrepancyRepo.SummaryByTaskID(ctx, taskID)
}

func (u *UseCase) GetDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error) {
	return u.discrepancyRepo.GetByID(ctx, taskID, discID)
}

func (u *UseCase) UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error {
	switch status {
	case entity.ResolutionNew, entity.ResolutionInReview, entity.ResolutionConfirmed, entity.ResolutionDismissed:
	default:
		return entity.ErrInvalidResolutionStatus
	}
	return u.discrepancyRepo.UpdateResolutionStatus(ctx, taskID, discID, status)
}
