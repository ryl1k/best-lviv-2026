// Package subscription manages subscription tiers, purchases, and usage tracking.
package subscription

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type subscriptionRepo interface {
	List(ctx context.Context) ([]entity.Subscription, error)
	GetByID(ctx context.Context, id int64) (entity.Subscription, error)
	GetByTier(ctx context.Context, tier entity.SubscriptionTier) (entity.Subscription, error)
}

type userSubscriptionRepo interface {
	GetActive(ctx context.Context, userID int) (entity.UserSubscription, error)
	Create(ctx context.Context, sub entity.UserSubscription) (entity.UserSubscription, error)
	IncrementSatelliteTries(ctx context.Context, id int64) error
	IncrementCSVTries(ctx context.Context, id int64) error
}

type subscriptionTransactionRepo interface {
	Create(ctx context.Context, tx entity.SubscriptionTransaction) (entity.SubscriptionTransaction, error)
}

type UseCase struct {
	logger      *slog.Logger
	subRepo     subscriptionRepo
	userSubRepo userSubscriptionRepo
	txRepo      subscriptionTransactionRepo
}

func New(
	logger *slog.Logger,
	subRepo subscriptionRepo,
	userSubRepo userSubscriptionRepo,
	txRepo subscriptionTransactionRepo,
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
	activeSub, err := uc.userSubRepo.GetActive(ctx, userID)
	if err == nil {
		if activeSub.Subscription == nil || activeSub.Subscription.Tier != entity.TierOneShot {
			return entity.UserSubscription{}, entity.ErrAlreadySubscribed
		}
	} else if !errors.Is(err, entity.ErrNoActiveSubscription) {
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

func (uc *UseCase) AssignFreeTier(ctx context.Context, userID int) error {
	// No free tier exists — new users start without a subscription.
	return nil
}

func (uc *UseCase) IncrementCSVTries(ctx context.Context, userSubID int64) error {
	if err := uc.userSubRepo.IncrementCSVTries(ctx, userSubID); err != nil {
		return fmt.Errorf("increment csv tries: %w", err)
	}
	return nil
}
