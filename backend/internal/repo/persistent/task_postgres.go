package persistent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type TaskRepo struct {
	pool *pgxpool.Pool
}

func NewTaskRepo(pool *pgxpool.Pool) *TaskRepo {
	return &TaskRepo{pool: pool}
}

func (r *TaskRepo) Create(ctx context.Context, task entity.Task) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO tasks (id, status, created_at) VALUES ($1, $2, $3)`,
		task.ID, string(task.Status), task.CreatedAt,
	)
	if err != nil {
		return fmt.Errorf("task create: %w", err)
	}
	return nil
}

func (r *TaskRepo) UpdateStatus(ctx context.Context, id uuid.UUID, status entity.TaskStatus, errMsg *string) error {
	_, err := r.pool.Exec(ctx,
		`UPDATE tasks SET status = $1, error_message = $2 WHERE id = $3`,
		string(status), errMsg, id,
	)
	if err != nil {
		return fmt.Errorf("task update status: %w", err)
	}
	return nil
}

func (r *TaskRepo) UpdateCompleted(ctx context.Context, id uuid.UUID, stats entity.TaskStats) error {
	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return fmt.Errorf("marshal stats: %w", err)
	}
	now := time.Now()
	_, err = r.pool.Exec(ctx,
		`UPDATE tasks SET status = $1, completed_at = $2, stats = $3 WHERE id = $4`,
		string(entity.TaskStatusCompleted), now, statsJSON, id,
	)
	if err != nil {
		return fmt.Errorf("task update completed: %w", err)
	}
	return nil
}

func (r *TaskRepo) GetByID(ctx context.Context, id uuid.UUID) (entity.Task, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT id, status, created_at, completed_at, error_message, stats FROM tasks WHERE id = $1`,
		id,
	)

	var t entity.Task
	var status string
	var statsJSON []byte

	err := row.Scan(&t.ID, &status, &t.CreatedAt, &t.CompletedAt, &t.ErrorMessage, &statsJSON)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Task{}, entity.ErrTaskNotFound
		}
		return entity.Task{}, fmt.Errorf("task get by id: %w", err)
	}

	t.Status = entity.TaskStatus(status)

	if statsJSON != nil {
		var stats entity.TaskStats
		if err := json.Unmarshal(statsJSON, &stats); err != nil {
			return entity.Task{}, fmt.Errorf("unmarshal stats: %w", err)
		}
		t.Stats = &stats
	}

	return t, nil
}
