package middleware

import (
	"context"
	"log/slog"

	"github.com/ryl1k/best-lviv-2026/internal/dto"
)

type authUseCase interface {
	Validate(ctx context.Context, tokeString string) (dto.UserClaims, error)
}

type Middleware struct {
	logger      *slog.Logger
	authUseCase authUseCase
}

func NewMiddleware(l *slog.Logger, authUseCase authUseCase) *Middleware {
	l = l.WithGroup("middleware")
	return &Middleware{
		logger:      l,
		authUseCase: authUseCase,
	}
}
