package audit

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

// runRules applies all rules against the normalized records and returns discrepancies.
func runRules(taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) []entity.Discrepancy {
	// Build indices
	estateByTaxID := make(map[string][]entity.EstateRecord)
	for _, e := range estate {
		if e.TaxID != "" {
			estateByTaxID[e.TaxID] = append(estateByTaxID[e.TaxID], e)
		}
	}

	landByTaxID := make(map[string][]entity.LandRecord)
	for _, l := range land {
		if l.TaxID != "" {
			landByTaxID[l.TaxID] = append(landByTaxID[l.TaxID], l)
		}
	}

	var result []entity.Discrepancy

	result = append(result, ruleR01TerminatedStillHasLand(taskID, land, estateByTaxID)...)
	result = append(result, ruleR02PurposeMismatch(taskID, land, estateByTaxID)...)
	result = append(result, ruleR03LandWithoutEstate(taskID, landByTaxID, estateByTaxID)...)
	result = append(result, ruleR04InvalidTaxID(taskID, land, estate)...)

	return result
}

// R01 - estate terminated but person still in land registry.
func ruleR01TerminatedStillHasLand(taskID uuid.UUID, land []entity.LandRecord, estateByTaxID map[string][]entity.EstateRecord) []entity.Discrepancy {
	// group land by tax_id
	landByTaxID := make(map[string][]entity.LandRecord)
	for _, l := range land {
		if l.TaxID != "" {
			landByTaxID[l.TaxID] = append(landByTaxID[l.TaxID], l)
		}
	}

	seen := make(map[string]bool)
	var out []entity.Discrepancy

	for taxID, estateRecs := range estateByTaxID {
		allTerminated := true
		var terminatedEstate []entity.EstateRecord
		for _, e := range estateRecs {
			if e.TerminatedAt != nil {
				terminatedEstate = append(terminatedEstate, e)
			} else {
				allTerminated = false
			}
		}
		if !allTerminated || len(terminatedEstate) == 0 {
			continue
		}

		landRecs, hasLand := landByTaxID[taxID]
		if !hasLand || seen[taxID] {
			continue
		}
		seen[taxID] = true

		cadastralNums := make([]string, 0, len(landRecs))
		for _, l := range landRecs {
			cadastralNums = append(cadastralNums, l.CadastralNum)
		}

		termDate := ""
		if len(terminatedEstate) > 0 && terminatedEstate[0].TerminatedAt != nil {
			termDate = terminatedEstate[0].TerminatedAt.Format("02.01.2006")
		}

		out = append(out, entity.Discrepancy{
			TaskID:    taskID,
			RuleCode:  entity.RuleTerminatedStillHasLand,
			Severity:  entity.SeverityHigh,
			RiskScore: 40,
			TaxID:     taxID,
			OwnerName: landRecs[0].OwnerName,
			Description: fmt.Sprintf(
				"Право власності на нерухомість припинено (%s), але особа залишається землекористувачем",
				termDate,
			),
			Details: map[string]any{
				"termination_date":  termDate,
				"cadastral_numbers": cadastralNums,
				"estate_count":      len(terminatedEstate),
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	return out
}

var commercialObjectTypes = map[string]bool{
	"нежилова будівля":               true,
	"нежилова будiвля":               true,
	"будівлі промисловості та склади": true,
	"будiвлi промисловостi та склади": true,
	"будівлі торговельні":             true,
	"будiвлi торговельнi":             true,
	"будівлі офісні":                  true,
	"будiвлi офiснi":                  true,
}

// R02 - agricultural land + commercial building registered to same person.
func ruleR02PurposeMismatch(taskID uuid.UUID, land []entity.LandRecord, estateByTaxID map[string][]entity.EstateRecord) []entity.Discrepancy {
	seen := make(map[string]bool)
	var out []entity.Discrepancy

	for _, l := range land {
		if l.TaxID == "" || seen[l.TaxID] {
			continue
		}
		if !strings.HasPrefix(l.PurposeCode, "01.") {
			continue
		}

		estateRecs, ok := estateByTaxID[l.TaxID]
		if !ok {
			continue
		}

		for _, e := range estateRecs {
			objType := strings.ToLower(strings.TrimSpace(e.ObjectType))
			if !commercialObjectTypes[objType] {
				continue
			}
			seen[l.TaxID] = true
			out = append(out, entity.Discrepancy{
				TaskID:    taskID,
				RuleCode:  entity.RulePurposeMismatch,
				Severity:  entity.SeverityHigh,
				RiskScore: 40,
				TaxID:     l.TaxID,
				OwnerName: l.OwnerName,
				Description: fmt.Sprintf(
					"Сільськогосподарська земля (код %s) та комерційна будівля ('%s') зареєстровані на одну особу",
					l.PurposeCode, e.ObjectType,
				),
				Details: map[string]any{
					"purpose_code":    l.PurposeCode,
					"purpose_text":    l.PurposeText,
					"cadastral_num":   l.CadastralNum,
					"object_type":     e.ObjectType,
					"estate_address":  e.Address,
				},
				ResolutionStatus: entity.ResolutionNew,
			})
			break
		}
	}

	return out
}

// R03 - tax ID has land records but no estate records.
func ruleR03LandWithoutEstate(taskID uuid.UUID, landByTaxID map[string][]entity.LandRecord, estateByTaxID map[string][]entity.EstateRecord) []entity.Discrepancy {
	var out []entity.Discrepancy

	for taxID, landRecs := range landByTaxID {
		if _, hasEstate := estateByTaxID[taxID]; hasEstate {
			continue
		}

		cadastralNums := make([]string, 0, len(landRecs))
		totalArea := 0.0
		for _, l := range landRecs {
			cadastralNums = append(cadastralNums, l.CadastralNum)
			totalArea += l.AreaHa
		}

		out = append(out, entity.Discrepancy{
			TaskID:      taskID,
			RuleCode:    entity.RuleLandWithoutEstate,
			Severity:    entity.SeverityMedium,
			RiskScore:   25,
			TaxID:       taxID,
			OwnerName:   landRecs[0].OwnerName,
			Description: "Земельні ділянки без відповідних записів у реєстрі нерухомості",
			Details: map[string]any{
				"cadastral_numbers": cadastralNums,
				"total_area_ha":     totalArea,
				"parcel_count":      len(landRecs),
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	return out
}

// R04 - invalid or missing tax ID.
func ruleR04InvalidTaxID(taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) []entity.Discrepancy {
	var out []entity.Discrepancy

	for _, l := range land {
		if !isValidTaxID(l.TaxID) {
			out = append(out, entity.Discrepancy{
				TaskID:      taskID,
				RuleCode:    entity.RuleInvalidTaxID,
				Severity:    entity.SeverityLow,
				RiskScore:   10,
				TaxID:       l.TaxID,
				OwnerName:   l.OwnerName,
				Description: fmt.Sprintf("Земельний запис з відсутнім або некоректним ІПН (кадастровий номер: %s)", l.CadastralNum),
				Details: map[string]any{
					"source":        "land",
					"cadastral_num": l.CadastralNum,
					"raw_tax_id":    l.Raw["ІПН ЗЕМЛЕКОРИСТУВАЧА"],
				},
				ResolutionStatus: entity.ResolutionNew,
			})
		}
	}

	for _, e := range estate {
		if !isValidTaxID(e.TaxID) {
			out = append(out, entity.Discrepancy{
				TaskID:      taskID,
				RuleCode:    entity.RuleInvalidTaxID,
				Severity:    entity.SeverityLow,
				RiskScore:   10,
				TaxID:       e.TaxID,
				OwnerName:   e.OwnerName,
				Description: fmt.Sprintf("Запис нерухомості з відсутнім або некоректним ІПН (адреса: %s)", e.Address),
				Details: map[string]any{
					"source":     "estate",
					"address":    e.Address,
					"owner_name": e.OwnerName,
				},
				ResolutionStatus: entity.ResolutionNew,
			})
		}
	}

	return out
}

func isValidTaxID(taxID string) bool {
	if taxID == "" {
		return false
	}
	// individuals: 10 digits; legal entities: 8 digits
	return len(taxID) == 10 || len(taxID) == 8
}
