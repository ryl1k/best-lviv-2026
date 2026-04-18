package subscription

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/ryl1k/best-lviv-2026/internal/repo"
)

type UseCase struct {
	logger      *slog.Logger
	subRepo     repo.SubscriptionRepo
	userSubRepo repo.UserSubscriptionRepo
	txRepo      repo.SubscriptionTransactionRepo
}

func New(
	logger *slog.Logger,
	subRepo repo.SubscriptionRepo,
	userSubRepo repo.UserSubscriptionRepo,
	txRepo repo.SubscriptionTransactionRepo,
) *UseCase {
	return &UseCase{
		logger:      logger.WithGroup("subscription_usecase"),
		subRepo:     subRepo,
		userSubRepo: userSubRepo,
		txRepo:      txRepo,
	}
}

func (uc *UseCase) List(ctx context.Context) ([]entity.Subscription, error) {
	subs, err := uc.subRepo.List(ctx)
	if err != nil {
		return nil, fmt.Errorf("list subscriptions: %w", err)
	}
	return subs, nil
}

func (uc *UseCase) Purchase(ctx context.Context, userID int, subscriptionID int64) (entity.UserSubscription, error) {
	_, err := uc.userSubRepo.GetActive(ctx, userID)
	if err == nil {
		return entity.UserSubscription{}, entity.ErrAlreadySubscribed
	}
	if !errors.Is(err, entity.ErrNoActiveSubscription) {
		return entity.UserSubscription{}, fmt.Errorf("check active subscription: %w", err)
	}

	sub, err := uc.subRepo.GetByID(ctx, subscriptionID)
	if err != nil {
		return entity.UserSubscription{}, fmt.Errorf("get subscription: %w", err)
	}

	now := time.Now().UTC()
	userSub, err := uc.userSubRepo.Create(ctx, entity.UserSubscription{
		UserID:         userID,
		SubscriptionID: sub.ID,
		StartsAt:       now,
		ExpiresAt:      now.AddDate(0, 1, 0),
	})
	if err != nil {
		return entity.UserSubscription{}, fmt.Errorf("create user subscription: %w", err)
	}

	_, txErr := uc.txRepo.Create(ctx, entity.SubscriptionTransaction{
		UserID:         userID,
		SubscriptionID: sub.ID,
		AmountUAH:      sub.PriceUAH,
	})
	if txErr != nil {
		uc.logger.Error("failed to record subscription transaction", "error", txErr, "user_id", userID, "subscription_id", sub.ID)
	}

	userSub.Subscription = &sub
	return userSub, nil
}

func (uc *UseCase) GetUserSubscription(ctx context.Context, userID int) (entity.UserSubscription, error) {
	userSub, err := uc.userSubRepo.GetActive(ctx, userID)
	if err != nil {
		return entity.UserSubscription{}, fmt.Errorf("get user subscription: %w", err)
	}
	return userSub, nil
}
