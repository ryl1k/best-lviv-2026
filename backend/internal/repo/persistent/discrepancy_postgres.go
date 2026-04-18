// Package persistent provides PostgreSQL-backed implementations of the repository interfaces.
package persistent

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type DiscrepancyRepo struct {
	pool *pgxpool.Pool
}

func NewDiscrepancyRepo(pool *pgxpool.Pool) *DiscrepancyRepo {
	return &DiscrepancyRepo{pool: pool}
}

func (r *DiscrepancyRepo) BatchInsert(ctx context.Context, discrepancies []entity.Discrepancy) error {
	if len(discrepancies) == 0 {
		return nil
	}

	const batchSize = 500
	for i := 0; i < len(discrepancies); i += batchSize {
		end := i + batchSize
		if end > len(discrepancies) {
			end = len(discrepancies)
		}
		if err := r.insertBatch(ctx, discrepancies[i:end]); err != nil {
			return err
		}
	}
	return nil
}

func (r *DiscrepancyRepo) insertBatch(ctx context.Context, discrepancies []entity.Discrepancy) error {
	batch := &pgx.Batch{}
	const q = `INSERT INTO discrepancies
		(task_id, rule_code, severity, risk_score, tax_id, owner_name, description, details, resolution_status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`

	for _, d := range discrepancies {
		detailsJSON, _ := json.Marshal(d.Details)
		batch.Queue(q,
			d.TaskID, string(d.RuleCode), string(d.Severity), d.RiskScore,
			d.TaxID, d.OwnerName, d.Description, detailsJSON, string(d.ResolutionStatus),
		)
	}

	br := r.pool.SendBatch(ctx, batch)
	defer br.Close()

	for range discrepancies {
		if _, err := br.Exec(); err != nil {
			return fmt.Errorf("discrepancy batch insert: %w", err)
		}
	}
	return nil
}

func (r *DiscrepancyRepo) ListByTaskID(ctx context.Context, taskID uuid.UUID, filter entity.DiscrepancyFilter) ([]entity.Discrepancy, int, error) {
	args := []any{taskID}
	conds := []string{"task_id = $1"}
	idx := 2

	if filter.Severity != "" {
		conds = append(conds, fmt.Sprintf("severity = $%d", idx))
		args = append(args, filter.Severity)
		idx++
	}
	if filter.RuleCode != "" {
		conds = append(conds, fmt.Sprintf("rule_code = $%d", idx))
		args = append(args, filter.RuleCode)
		idx++
	}
	if filter.ResolutionStatus != "" {
		conds = append(conds, fmt.Sprintf("resolution_status = $%d", idx))
		args = append(args, filter.ResolutionStatus)
		idx++
	}
	if filter.TaxID != "" {
		conds = append(conds, fmt.Sprintf("tax_id = $%d", idx))
		args = append(args, filter.TaxID)
		idx++
	}
	if filter.Search != "" {
		conds = append(conds, fmt.Sprintf("(owner_name ILIKE $%d OR description ILIKE $%d)", idx, idx))
		args = append(args, "%"+filter.Search+"%")
		idx++
	}

	where := strings.Join(conds, " AND ")

	var total int
	if err := r.pool.QueryRow(ctx,
		fmt.Sprintf("SELECT COUNT(*) FROM discrepancies WHERE %s", where), args...,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("discrepancy count: %w", err)
	}

	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 50
	}
	page := filter.Page
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageSize

	sortBy := "risk_score DESC"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}

	rows, err := r.pool.Query(ctx,
		fmt.Sprintf(`SELECT id, task_id, rule_code, severity, risk_score, tax_id, owner_name, description, details, resolution_status
			FROM discrepancies WHERE %s ORDER BY %s LIMIT $%d OFFSET $%d`,
			where, sortBy, idx, idx+1,
		),
		append(args, pageSize, offset)...,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("discrepancy list: %w", err)
	}
	defer rows.Close()

	var result []entity.Discrepancy
	for rows.Next() {
		d, err := scanDiscrepancy(rows)
		if err != nil {
			return nil, 0, err
		}
		result = append(result, d)
	}
	return result, total, nil
}

func (r *DiscrepancyRepo) GetByID(ctx context.Context, taskID uuid.UUID, discID int64) (entity.Discrepancy, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT id, task_id, rule_code, severity, risk_score, tax_id, owner_name, description, details, resolution_status
		 FROM discrepancies WHERE id = $1 AND task_id = $2`,
		discID, taskID,
	)
	d, err := scanDiscrepancy(row)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return entity.Discrepancy{}, entity.ErrDiscrepancyNotFound
		}
		return entity.Discrepancy{}, fmt.Errorf("discrepancy get by id: %w", err)
	}
	return d, nil
}

func (r *DiscrepancyRepo) UpdateResolutionStatus(ctx context.Context, taskID uuid.UUID, discID int64, status entity.ResolutionStatus) error {
	ct, err := r.pool.Exec(ctx,
		`UPDATE discrepancies SET resolution_status = $1 WHERE id = $2 AND task_id = $3`,
		string(status), discID, taskID,
	)
	if err != nil {
		return fmt.Errorf("discrepancy update resolution: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return entity.ErrDiscrepancyNotFound
	}
	return nil
}

func (r *DiscrepancyRepo) SummaryByTaskID(ctx context.Context, taskID uuid.UUID) (entity.DiscrepancySummary, error) {
	summary := entity.DiscrepancySummary{
		BySeverity: make(map[string]int),
		ByRule:     make(map[string]int),
	}

	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*) FROM discrepancies WHERE task_id = $1`, taskID,
	).Scan(&total); err != nil {
		return summary, fmt.Errorf("summary total count: %w", err)
	}
	summary.TotalCount = total

	rows, err := r.pool.Query(ctx,
		`SELECT severity, COUNT(*) FROM discrepancies WHERE task_id = $1 GROUP BY severity`, taskID,
	)
	if err != nil {
		return summary, fmt.Errorf("summary by severity: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var sev string
		var cnt int
		if err := rows.Scan(&sev, &cnt); err != nil {
			return summary, err
		}
		summary.BySeverity[sev] = cnt
	}

	rows2, err := r.pool.Query(ctx,
		`SELECT rule_code, COUNT(*) FROM discrepancies WHERE task_id = $1 GROUP BY rule_code`, taskID,
	)
	if err != nil {
		return summary, fmt.Errorf("summary by rule: %w", err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var rule string
		var cnt int
		if err := rows2.Scan(&rule, &cnt); err != nil {
			return summary, err
		}
		summary.ByRule[rule] = cnt
	}

	return summary, nil
}

func (r *DiscrepancyRepo) ListPersonsByTaskID(ctx context.Context, taskID uuid.UUID, page, pageSize int) ([]entity.PersonRisk, int, error) {
	if pageSize <= 0 {
		pageSize = 50
	}
	if page <= 0 {
		page = 1
	}
	offset := (page - 1) * pageSize

	var total int
	if err := r.pool.QueryRow(ctx,
		`SELECT COUNT(DISTINCT tax_id) FROM discrepancies WHERE task_id = $1 AND tax_id != ''`, taskID,
	).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("persons count: %w", err)
	}

	rows, err := r.pool.Query(ctx, `
		SELECT
			tax_id,
			COALESCE(MAX(owner_name) FILTER (WHERE owner_name != ''), '') AS owner_name,
			SUM(rule_score)        AS total_risk_score,
			CASE MAX(sev_rank) WHEN 3 THEN 'HIGH' WHEN 2 THEN 'MEDIUM' ELSE 'LOW' END AS max_severity,
			SUM(rule_count)        AS discrepancy_count,
			array_agg(rule_code ORDER BY rule_code) AS rule_codes
		FROM (
			SELECT
				tax_id,
				MAX(owner_name)  AS owner_name,
				rule_code,
				MAX(risk_score)  AS rule_score,
				MAX(CASE severity WHEN 'HIGH' THEN 3 WHEN 'MEDIUM' THEN 2 ELSE 1 END) AS sev_rank,
				COUNT(*)         AS rule_count
			FROM discrepancies
			WHERE task_id = $1 AND tax_id != ''
			GROUP BY tax_id, rule_code
		) sub
		GROUP BY tax_id
		ORDER BY total_risk_score DESC
		LIMIT $2 OFFSET $3`,
		taskID, pageSize, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("persons list: %w", err)
	}
	defer rows.Close()

	var result []entity.PersonRisk
	for rows.Next() {
		var p entity.PersonRisk
		if err := rows.Scan(&p.TaxID, &p.OwnerName, &p.TotalRiskScore, &p.MaxSeverity, &p.DiscrepancyCount, &p.RuleCodes); err != nil {
			return nil, 0, fmt.Errorf("persons scan: %w", err)
		}
		result = append(result, p)
	}
	return result, total, nil
}

type scanner interface {
	Scan(dest ...any) error
}

func scanDiscrepancy(s scanner) (entity.Discrepancy, error) {
	var d entity.Discrepancy
	var ruleCode, severity, resolution string
	var detailsJSON []byte

	if err := s.Scan(
		&d.ID, &d.TaskID, &ruleCode, &severity, &d.RiskScore,
		&d.TaxID, &d.OwnerName, &d.Description, &detailsJSON, &resolution,
	); err != nil {
		return entity.Discrepancy{}, err
	}

	d.RuleCode = entity.RuleCode(ruleCode)
	d.Severity = entity.Severity(severity)
	d.ResolutionStatus = entity.ResolutionStatus(resolution)

	if detailsJSON != nil {
		if err := json.Unmarshal(detailsJSON, &d.Details); err != nil {
			return entity.Discrepancy{}, fmt.Errorf("unmarshal details: %w", err)
		}
	}

	return d, nil
}
