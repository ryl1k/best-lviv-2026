package entity

import (
	"time"

	"github.com/google/uuid"
)

// LandRecord is a single row from the ДЗК (State Land Cadastre) registry.
type LandRecord struct {
	ID             int64             `json:"id"`
	TaskID         uuid.UUID         `json:"task_id"`
	CadastralNum   string            `json:"cadastral_num"`
	Koatuu         string            `json:"koatuu,omitempty"`
	OwnershipForm  string            `json:"ownership_form,omitempty"`
	PurposeCode    string            `json:"purpose_code,omitempty"`
	PurposeText    string            `json:"purpose_text,omitempty"`
	Location       string            `json:"location"`
	LandUseType    string            `json:"land_use_type,omitempty"`
	AreaHa         float64           `json:"area_ha"`
	NormativeValue float64           `json:"normative_value,omitempty"`
	TaxID          string            `json:"tax_id"`
	OwnerName      string            `json:"owner_name"`
	Share          float64           `json:"share"`
	RegisteredAt   *time.Time        `json:"registered_at,omitempty"`
	Raw            map[string]string `json:"raw,omitempty"`
}
