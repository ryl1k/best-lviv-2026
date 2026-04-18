package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
)

type AuthUseCase interface{}

type SubscriptionUseCase interface {
	List(ctx context.Context) ([]entity.Subscription, error)
	Purchase(ctx context.Context, userID int, subscriptionID int64) (entity.UserSubscription, error)
	GetUserSubscription(ctx context.Context, userID int) (entity.UserSubscription, error)
	IncrementCSVTries(ctx context.Context, userSubID int64) error
}

type AuditUseCase interface {
	Upload(ctx context.Context, userID int64, landData []byte, estateData []byte, landExt string, estateExt string) (uuid.UUID, error)
	UploadFromRecords(ctx context.Context, userID int64, landRecords []entity.LandRecord, estateRecords []entity.EstateRecord) (uuid.UUID, error)
	ListTasks(ctx context.Context, userID int64) ([]entity.Task, error)
	GetTask(ctx context.Context, taskID uuid.UUID) (entity.Task, error)
	GetResults(ctx context.Context, taskID uuid.UUID, filter repo.DiscrepancyFilter) ([]entity.Discrepancy, int, error)
	GetSummary(ctx context.Context, taskID uuid.UUID) (repo.DiscrepancySummary, error)
	GetDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error)
	UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error
	Export(ctx context.Context, taskID uuid.UUID) ([]entity.Discrepancy, error)
	GetPersons(ctx context.Context, taskID uuid.UUID, page, pageSize int) ([]repo.PersonRisk, int, error)
	ExplainDiscrepancy(ctx context.Context, taskID uuid.UUID, discID int64) (string, error)
}
