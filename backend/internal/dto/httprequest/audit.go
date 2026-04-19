package httprequest

import "time"

type LandRecord struct {
	CadastralNum   string            `json:"cadastral_num" validate:"required"`
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
	Share        float64    `json:"share"`
	RegisteredAt *time.Time `json:"registered_at,omitempty"`
}

type EstateRecord struct {
	TaxID        string     `json:"tax_id"`
	OwnerName    string     `json:"owner_name"`
	ObjectType   string     `json:"object_type"`
	Address      string     `json:"address"`
	RegisteredAt *time.Time `json:"registered_at,omitempty"`
	TerminatedAt *time.Time `json:"terminated_at,omitempty"`
	AreaM2       float64    `json:"area_m2"`
	CoOwnership  string     `json:"co_ownership,omitempty"`
	Share        float64    `json:"share"`
}

type UploadJSON struct {
	LandRecords   []LandRecord   `json:"land_records" validate:"required,min=1"`
	EstateRecords []EstateRecord `json:"estate_records" validate:"required,min=1"`
}
