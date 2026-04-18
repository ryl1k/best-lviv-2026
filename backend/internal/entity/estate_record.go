package entity

import (
	"time"

	"github.com/google/uuid"
)

// EstateRecord is a single row from the ДРПП (State Real Estate Rights Registry).
// TerminatedAt being non-nil means the ownership right has been revoked.
type EstateRecord struct {
	ID           int64             `json:"id"`
	TaskID       uuid.UUID         `json:"task_id"`
	TaxID        string            `json:"tax_id"`
	OwnerName    string            `json:"owner_name"`
	ObjectType   string            `json:"object_type"`
	Address      string            `json:"address"`
	AddressNorm  string            `json:"address_norm,omitempty"`
	RegisteredAt *time.Time        `json:"registered_at,omitempty"`
	TerminatedAt *time.Time        `json:"terminated_at,omitempty"`
	AreaM2       float64           `json:"area_m2"`
	CoOwnership  string            `json:"co_ownership,omitempty"`
	Share        float64           `json:"share"`
	Raw          map[string]string `json:"raw,omitempty"`
}
