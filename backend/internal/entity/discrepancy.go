package entity

import "github.com/google/uuid"

type Severity string
type RuleCode string
type ResolutionStatus string

const (
	SeverityLow    Severity = "LOW"
	SeverityMedium Severity = "MEDIUM"
	SeverityHigh   Severity = "HIGH"

	RuleTerminatedStillHasLand RuleCode = "R01_TERMINATED_STILL_HAS_LAND"
	RulePurposeMismatch        RuleCode = "R02_PURPOSE_MISMATCH"
	RuleLandWithoutEstate      RuleCode = "R03_LAND_WITHOUT_ESTATE"
	RuleInvalidTaxID           RuleCode = "R04_INVALID_TAX_ID"
	RuleDuplicateRecord        RuleCode = "R05_DUPLICATE_RECORD"
	RuleNameInconsistency      RuleCode = "R06_NAME_INCONSISTENCY"
	RuleIncompleteRecord       RuleCode = "R07_INCOMPLETE_RECORD"

	ResolutionNew       ResolutionStatus = "NEW"
	ResolutionInReview  ResolutionStatus = "IN_REVIEW"
	ResolutionConfirmed ResolutionStatus = "CONFIRMED"
	ResolutionDismissed ResolutionStatus = "DISMISSED"
)

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
