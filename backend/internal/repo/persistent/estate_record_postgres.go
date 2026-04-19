package persistent

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type EstateRecordRepo struct {
	pool *pgxpool.Pool
}

func NewEstateRecordRepo(pool *pgxpool.Pool) *EstateRecordRepo {
	return &EstateRecordRepo{pool: pool}
}

func (r *EstateRecordRepo) BatchInsert(ctx context.Context, records []entity.EstateRecord) error {
	if len(records) == 0 {
		return nil
	}

	const batchSize = 500
	for i := 0; i < len(records); i += batchSize {
		end := i + batchSize
		if end > len(records) {
			end = len(records)
		}
		if err := r.insertBatch(ctx, records[i:end]); err != nil {
			return err
		}
	}
	return nil
}

func (r *EstateRecordRepo) insertBatch(ctx context.Context, records []entity.EstateRecord) error {
	batch := &pgx.Batch{}
	const q = `INSERT INTO estate_records
		(task_id, tax_id, owner_name, object_type, address, address_norm,
		 registered_at, terminated_at, area_m2, co_ownership, share, raw)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NULL)`

	for _, rec := range records {
		batch.Queue(q,
			rec.TaskID, rec.TaxID, rec.OwnerName, rec.ObjectType,
			rec.Address, rec.AddressNorm, rec.RegisteredAt, rec.TerminatedAt,
			rec.AreaM2, rec.CoOwnership, rec.Share,
		)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	for range records {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("estate_record batch insert: %w", err)
		}
	}
	return nil
}
