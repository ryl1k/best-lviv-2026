package httpresponse

import (
	"time"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type UploadTaskResponse struct {
	TaskID uuid.UUID `json:"task_id"`
}

type TaskStatsResponse struct {
	TotalLand          int `json:"total_land"`
	TotalEstate        int `json:"total_estate"`
	Matched            int `json:"matched"`
	DiscrepanciesCount int `json:"discrepancies_count"`
}

type TaskResponse struct {
	ID           uuid.UUID          `json:"id"`
	Status       string             `json:"status"`
	CreatedAt    time.Time          `json:"created_at"`
	CompletedAt  *time.Time         `json:"completed_at,omitempty"`
	ErrorMessage *string            `json:"error_message,omitempty"`
	Stats        *TaskStatsResponse `json:"stats,omitempty"`
}

func TaskToResponse(t entity.Task) TaskResponse {
	resp := TaskResponse{
		ID:           t.ID,
		Status:       string(t.Status),
		CreatedAt:    t.CreatedAt,
		CompletedAt:  t.CompletedAt,
		ErrorMessage: t.ErrorMessage,
	}
	if t.Stats != nil {
		resp.Stats = &TaskStatsResponse{
			TotalLand:          t.Stats.TotalLand,
			TotalEstate:        t.Stats.TotalEstate,
			Matched:            t.Stats.Matched,
			DiscrepanciesCount: t.Stats.DiscrepanciesCount,
		}
	}
	return resp
}

type DiscrepancyResponse struct {
	ID               int64          `json:"id"`
	TaskID           uuid.UUID      `json:"task_id"`
	RuleCode         string         `json:"rule_code"`
	Severity         string         `json:"severity"`
	RiskScore        int            `json:"risk_score"`
	TaxID            string         `json:"tax_id"`
	OwnerName        string         `json:"owner_name"`
	Description      string         `json:"description"`
	Details          map[string]any `json:"details,omitempty"`
	ResolutionStatus string         `json:"resolution_status"`
}

func DiscrepancyToResponse(d entity.Discrepancy) DiscrepancyResponse {
	return DiscrepancyResponse{
		ID:               d.ID,
		TaskID:           d.TaskID,
		RuleCode:         string(d.RuleCode),
		Severity:         string(d.Severity),
		RiskScore:        d.RiskScore,
		TaxID:            d.TaxID,
		OwnerName:        d.OwnerName,
		Description:      d.Description,
		Details:          d.Details,
		ResolutionStatus: string(d.ResolutionStatus),
	}
}

type PaginatedDiscrepanciesResponse struct {
	Items    []DiscrepancyResponse `json:"items"`
	Total    int                   `json:"total"`
	Page     int                   `json:"page"`
	PageSize int                   `json:"page_size"`
}

type PersonRiskResponse struct {
	TaxID            string   `json:"tax_id"`
	OwnerName        string   `json:"owner_name"`
	TotalRiskScore   int      `json:"total_risk_score"`
	MaxSeverity      string   `json:"max_severity"`
	DiscrepancyCount int      `json:"discrepancy_count"`
	RuleCodes        []string `json:"rule_codes"`
	MLRiskScore      *float64 `json:"ml_risk_score"`
}

type PaginatedPersonsResponse struct {
	Items    []PersonRiskResponse `json:"items"`
	Total    int                  `json:"total"`
	Page     int                  `json:"page"`
	PageSize int                  `json:"page_size"`
}

type SummaryResponse struct {
	TotalCount int            `json:"total_count"`
	BySeverity map[string]int `json:"by_severity"`
	ByRule     map[string]int `json:"by_rule"`
}

func SummaryToResponse(s entity.DiscrepancySummary) SummaryResponse {
	return SummaryResponse{
		TotalCount: s.TotalCount,
		BySeverity: s.BySeverity,
		ByRule:     s.ByRule,
	}
}
