package repo

import (
	"context"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type UserRepo interface {
	GetByUsername(ctx context.Context, username string) (entity.User, error)
}

type TaskRepo interface {
	Create(ctx context.Context, task entity.Task) error
	UpdateStatus(ctx context.Context, id uuid.UUID, status entity.TaskStatus, errMsg *string) error
	UpdateCompleted(ctx context.Context, id uuid.UUID, stats entity.TaskStats) error
	GetByID(ctx context.Context, id uuid.UUID) (entity.Task, error)
}

type LandRecordRepo interface {
	BatchInsert(ctx context.Context, records []entity.LandRecord) error
}

type EstateRecordRepo interface {
	BatchInsert(ctx context.Context, records []entity.EstateRecord) error
}

type DiscrepancyRepo interface {
	BatchInsert(ctx context.Context, discrepancies []entity.Discrepancy) error
	ListByTaskID(ctx context.Context, taskID uuid.UUID, filter DiscrepancyFilter) ([]entity.Discrepancy, int, error)
	GetByID(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error)
	UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error
	SummaryByTaskID(ctx context.Context, taskID uuid.UUID) (DiscrepancySummary, error)
	ListPersonsByTaskID(ctx context.Context, taskID uuid.UUID, page, pageSize int) ([]PersonRisk, int, error)
}

type PersonRisk struct {
	TaxID            string
	OwnerName        string
	TotalRiskScore   int
	MaxSeverity      string
	DiscrepancyCount int
	RuleCodes        []string
}

type DiscrepancyFilter struct {
	Severity         string
	RuleCode         string
	ResolutionStatus string
	TaxID            string
	Search           string
	Page             int
	PageSize         int
	SortBy           string
}

type DiscrepancySummary struct {
	TotalCount int
	BySeverity map[string]int
	ByRule     map[string]int
}
