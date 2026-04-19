package persistent

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type LandRecordRepo struct {
	pool *pgxpool.Pool
}

func NewLandRecordRepo(pool *pgxpool.Pool) *LandRecordRepo {
	return &LandRecordRepo{pool: pool}
}

func (r *LandRecordRepo) BatchInsert(ctx context.Context, records []entity.LandRecord) error {
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

func (r *LandRecordRepo) insertBatch(ctx context.Context, records []entity.LandRecord) error {
	batch := &pgx.Batch{}
	const q = `INSERT INTO land_records
		(task_id, cadastral_num, koatuu, ownership_form, purpose_code, purpose_text,
		 location, land_use_type, area_ha, normative_value, tax_id, owner_name, share, registered_at, raw)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NULL)`

	for _, rec := range records {
		batch.Queue(q,
			rec.TaskID, rec.CadastralNum, rec.Koatuu, rec.OwnershipForm,
			rec.PurposeCode, rec.PurposeText, rec.Location, rec.LandUseType,
			rec.AreaHa, rec.NormativeValue, rec.TaxID, rec.OwnerName,
			rec.Share, rec.RegisteredAt,
		)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	for range records {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("land_record batch insert: %w", err)
		}
	}
	return nil
}
