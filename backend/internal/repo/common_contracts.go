package repo

import (
	"context"

	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type UserRepo interface {
	GetByUsername(ctx context.Context, username string) (entity.User, error)
}
