package entity

import "github.com/google/uuid"

// Severity classifies how serious a discrepancy is: LOW, MEDIUM, or HIGH.
type Severity string

// RuleCode identifies which rule engine rule produced a discrepancy.
type RuleCode string

// ResolutionStatus tracks the review lifecycle of a discrepancy.
type ResolutionStatus string

const (
	SeverityLow    Severity = "LOW"
	SeverityMedium Severity = "MEDIUM"
	SeverityHigh   Severity = "HIGH"

	// R01: person has terminated estate but is still an active land user.
	RuleTerminatedStillHasLand RuleCode = "R01_TERMINATED_STILL_HAS_LAND"
	// R02: agricultural land + commercial building registered to same individual.
	RulePurposeMismatch RuleCode = "R02_PURPOSE_MISMATCH"
	// R03: tax ID appears in land registry but has no estate records.
	RuleLandWithoutEstate RuleCode = "R03_LAND_WITHOUT_ESTATE"
	// R04: tax ID is missing, empty, or wrong length.
	RuleInvalidTaxID RuleCode = "R04_INVALID_TAX_ID"
	// R05: duplicate cadastral number in land, or duplicate (tax_id+address+area) in estate.
	RuleDuplicateRecord RuleCode = "R05_DUPLICATE_RECORD"
	// R06: same tax ID has different owner name spellings across registries (Levenshtein > 3).
	RuleNameInconsistency RuleCode = "R06_NAME_INCONSISTENCY"
	// R07: record is missing owner name, area, or address.
	RuleIncompleteRecord RuleCode = "R07_INCOMPLETE_RECORD"

	ResolutionNew       ResolutionStatus = "NEW"
	ResolutionInReview  ResolutionStatus = "IN_REVIEW"
	ResolutionConfirmed ResolutionStatus = "CONFIRMED"
	ResolutionDismissed ResolutionStatus = "DISMISSED"
)

// Discrepancy is the output of the rule engine for a single detected anomaly.
type Discrepancy struct {
	ID               int64            `json:"id"`
	TaskID           uuid.UUID        `json:"task_id"`
	RuleCode         RuleCode         `json:"rule_code"`
	Severity         Severity         `json:"severity"`
	RiskScore        int              `json:"risk_score"`
	TaxID            string           `json:"tax_id"`
	OwnerName        string           `json:"owner_name"`
	Description      string           `json:"description"`
	Details          map[string]any   `json:"details"`
	ResolutionStatus ResolutionStatus `json:"resolution_status"`
}
