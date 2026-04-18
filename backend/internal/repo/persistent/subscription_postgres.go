package persistent

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

// SubscriptionRepo

type SubscriptionRepo struct {
	pool *pgxpool.Pool
}

func NewSubscriptionRepo(pool *pgxpool.Pool) *SubscriptionRepo {
	return &SubscriptionRepo{pool: pool}
}

func (r *SubscriptionRepo) List(ctx context.Context) ([]entity.Subscription, error) {
	query := `
		SELECT id, tier, name, price_uah, max_satellite_tries, max_csv_tries, created_at, updated_at
		FROM subscriptions
		ORDER BY price_uah ASC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list subscriptions: %w", err)
	}
	defer rows.Close()

	var subs []entity.Subscription
	for rows.Next() {
		var s entity.Subscription
		if err := rows.Scan(&s.ID, &s.Tier, &s.Name, &s.PriceUAH, &s.MaxSatelliteTries, &s.MaxCSVTries, &s.CreatedAt, &s.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan subscription: %w", err)
		}
		subs = append(subs, s)
	}
	return subs, nil
}

func (r *SubscriptionRepo) GetByID(ctx context.Context, id int64) (entity.Subscription, error) {
	query := `
		SELECT id, tier, name, price_uah, max_satellite_tries, max_csv_tries, created_at, updated_at
		FROM subscriptions
		WHERE id = $1
	`
	var s entity.Subscription
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&s.ID, &s.Tier, &s.Name, &s.PriceUAH, &s.MaxSatelliteTries, &s.MaxCSVTries, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Subscription{}, fmt.Errorf("subscription %d: %w", id, entity.ErrSubscriptionNotFound)
		}
		return entity.Subscription{}, fmt.Errorf("get subscription: %w", err)
	}
	return s, nil
}

// UserSubscriptionRepo

type UserSubscriptionRepo struct {
	pool *pgxpool.Pool
}

func NewUserSubscriptionRepo(pool *pgxpool.Pool) *UserSubscriptionRepo {
	return &UserSubscriptionRepo{pool: pool}
}

func (r *UserSubscriptionRepo) GetActive(ctx context.Context, userID int) (entity.UserSubscription, error) {
	query := `
		SELECT us.id, us.user_id, us.subscription_id,
		       us.satellite_tries_used, us.csv_tries_used,
		       us.starts_at, us.expires_at, us.created_at,
		       s.id, s.tier, s.name, s.price_uah, s.max_satellite_tries, s.max_csv_tries, s.created_at, s.updated_at
		FROM user_subscriptions us
		JOIN subscriptions s ON s.id = us.subscription_id
		WHERE us.user_id = $1 AND us.expires_at > NOW()
		ORDER BY us.created_at DESC
		LIMIT 1
	`
	var us entity.UserSubscription
	var sub entity.Subscription
	err := r.pool.QueryRow(ctx, query, userID).Scan(
		&us.ID, &us.UserID, &us.SubscriptionID,
		&us.SatelliteTriesUsed, &us.CSVTriesUsed,
		&us.StartsAt, &us.ExpiresAt, &us.CreatedAt,
		&sub.ID, &sub.Tier, &sub.Name, &sub.PriceUAH, &sub.MaxSatelliteTries, &sub.MaxCSVTries, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.UserSubscription{}, fmt.Errorf("user %d: %w", userID, entity.ErrNoActiveSubscription)
		}
		return entity.UserSubscription{}, fmt.Errorf("get active subscription: %w", err)
	}
	us.Subscription = &sub
	return us, nil
}

func (r *UserSubscriptionRepo) Create(ctx context.Context, sub entity.UserSubscription) (entity.UserSubscription, error) {
	query := `
		INSERT INTO user_subscriptions (user_id, subscription_id, starts_at, expires_at)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, subscription_id, satellite_tries_used, csv_tries_used, starts_at, expires_at, created_at
	`
	err := r.pool.QueryRow(ctx, query, sub.UserID, sub.SubscriptionID, sub.StartsAt, sub.ExpiresAt).Scan(
		&sub.ID, &sub.UserID, &sub.SubscriptionID,
		&sub.SatelliteTriesUsed, &sub.CSVTriesUsed,
		&sub.StartsAt, &sub.ExpiresAt, &sub.CreatedAt,
	)
	if err != nil {
		return entity.UserSubscription{}, fmt.Errorf("create user subscription: %w", err)
	}
	return sub, nil
}

func (r *UserSubscriptionRepo) IncrementSatelliteTries(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE user_subscriptions SET satellite_tries_used = satellite_tries_used + 1 WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("increment satellite tries: %w", err)
	}
	return nil
}

func (r *UserSubscriptionRepo) IncrementCSVTries(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE user_subscriptions SET csv_tries_used = csv_tries_used + 1 WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("increment csv tries: %w", err)
	}
	return nil
}

// SubscriptionTransactionRepo

type SubscriptionTransactionRepo struct {
	pool *pgxpool.Pool
}

func NewSubscriptionTransactionRepo(pool *pgxpool.Pool) *SubscriptionTransactionRepo {
	return &SubscriptionTransactionRepo{pool: pool}
}

func (r *SubscriptionTransactionRepo) Create(ctx context.Context, tx entity.SubscriptionTransaction) (entity.SubscriptionTransaction, error) {
	query := `
		INSERT INTO subscription_transactions (user_id, subscription_id, amount_uah)
		VALUES ($1, $2, $3)
		RETURNING id, user_id, subscription_id, amount_uah, created_at
	`
	err := r.pool.QueryRow(ctx, query, tx.UserID, tx.SubscriptionID, tx.AmountUAH).Scan(
		&tx.ID, &tx.UserID, &tx.SubscriptionID, &tx.AmountUAH, &tx.CreatedAt,
	)
	if err != nil {
		return entity.SubscriptionTransaction{}, fmt.Errorf("create subscription transaction: %w", err)
	}
	return tx, nil
}
