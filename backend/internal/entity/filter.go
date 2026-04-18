// Package entity contains pure domain types shared across all application layers.
package entity

// DiscrepancyFilter holds optional filters and pagination for discrepancy queries.
type DiscrepancyFilter struct {
	Severity         string
	RuleCode         string
	ResolutionStatus string
	TaxID            string
	Search           string
	Page             int
	PageSize         int
	SortBy           string
}

// DiscrepancySummary aggregates discrepancy counts for a single task.
type DiscrepancySummary struct {
	TotalCount int
	BySeverity map[string]int
	ByRule     map[string]int
}

// PersonRisk represents an owner's aggregated risk profile across all discrepancies.
type PersonRisk struct {
	TaxID            string
	OwnerName        string
	TotalRiskScore   int
	MaxSeverity      string
	DiscrepancyCount int
	RuleCodes        []string
}
