package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
)

type AuthUseCase interface{}

type AuditUseCase interface {
	Upload(ctx context.Context, landData []byte, estateData []byte, landExt string, estateExt string) (uuid.UUID, error)
	GetTask(ctx context.Context, taskID uuid.UUID) (entity.Task, error)
	GetResults(ctx context.Context, taskID uuid.UUID, filter repo.DiscrepancyFilter) ([]entity.Discrepancy, int, error)
	GetSummary(ctx context.Context, taskID uuid.UUID) (repo.DiscrepancySummary, error)
	GetDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error)
	UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error
}
