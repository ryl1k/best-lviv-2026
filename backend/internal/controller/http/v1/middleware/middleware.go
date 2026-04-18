package middleware

import (
	"context"
	"log/slog"

	"github.com/ryl1k/best-lviv-2026/internal/dto"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type authUseCase interface {
	Validate(ctx context.Context, tokeString string) (dto.UserClaims, error)
}

type subscriptionUseCase interface {
	GetUserSubscription(ctx context.Context, userID int) (entity.UserSubscription, error)
}

type Middleware struct {
	logger              *slog.Logger
	authUseCase         authUseCase
	subscriptionUseCase subscriptionUseCase
}

func NewMiddleware(l *slog.Logger, authUseCase authUseCase, subscriptionUseCase subscriptionUseCase) *Middleware {
	l = l.WithGroup("middleware")
	return &Middleware{
		logger:              l,
		authUseCase:         authUseCase,
		subscriptionUseCase: subscriptionUseCase,
	}
}
