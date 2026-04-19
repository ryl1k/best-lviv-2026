package persistent

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type MLScoreRepo struct {
	pool *pgxpool.Pool
}

func NewMLScoreRepo(pool *pgxpool.Pool) *MLScoreRepo {
	return &MLScoreRepo{pool: pool}
}

func (r *MLScoreRepo) BatchUpsert(ctx context.Context, taskID uuid.UUID, scores map[string]float64) error {
	if len(scores) == 0 {
		return nil
	}
	batch := &pgx.Batch{}
	for taxID, score := range scores {
		batch.Queue(
			`INSERT INTO ml_scores (task_id, tax_id, score) VALUES ($1, $2, $3)
			 ON CONFLICT (task_id, tax_id) DO UPDATE SET score = EXCLUDED.score`,
			taskID, taxID, score,
		)
	}
	return r.pool.SendBatch(ctx, batch).Close()
}

func (r *MLScoreRepo) GetByTaskID(ctx context.Context, taskID uuid.UUID) (map[string]float64, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT tax_id, score FROM ml_scores WHERE task_id = $1`, taskID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make(map[string]float64)
	for rows.Next() {
		var taxID string
		var score float64
		if err := rows.Scan(&taxID, &score); err != nil {
			return nil, err
		}
		result[taxID] = score
	}
	return result, rows.Err()
}
