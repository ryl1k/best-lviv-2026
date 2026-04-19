package audit

import (
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

// levenshtein computes the edit distance between two strings (rune-aware).
func levenshtein(a, b string) int {
	ra, rb := []rune(a), []rune(b)
	la, lb := len(ra), len(rb)
	if la == 0 {
		return lb
	}
	if lb == 0 {
		return la
	}
	dp := make([][]int, la+1)
	for i := range dp {
		dp[i] = make([]int, lb+1)
		dp[i][0] = i
	}
	for j := 0; j <= lb; j++ {
		dp[0][j] = j
	}
	for i := 1; i <= la; i++ {
		for j := 1; j <= lb; j++ {
			cost := 1
			if ra[i-1] == rb[j-1] {
				cost = 0
			}
			dp[i][j] = min3(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)
		}
	}
	return dp[la][lb]
}

func min3(a, b, c int) int {
	if a < b {
		if a < c {
			return a
		}
		return c
	}
	if b < c {
		return b
	}
	return c
}

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
	result = append(result, ruleR05DuplicateRecord(taskID, land, estate)...)
	result = append(result, ruleR06NameMismatch(taskID, land, estate)...)
	result = append(result, ruleR07IncompleteRecord(taskID, land, estate)...)

	return result
}

// R01 - person has at least one terminated estate record but still appears as active land user.
func ruleR01TerminatedStillHasLand(taskID uuid.UUID, land []entity.LandRecord, estateByTaxID map[string][]entity.EstateRecord) []entity.Discrepancy {
	landByTaxID := make(map[string][]entity.LandRecord)
	for _, l := range land {
		if l.TaxID != "" {
			landByTaxID[l.TaxID] = append(landByTaxID[l.TaxID], l)
		}
	}

	seen := make(map[string]bool)
	var out []entity.Discrepancy

	for taxID, estateRecs := range estateByTaxID {
		var terminatedEstate []entity.EstateRecord
		hasActiveEstate := false
		for _, e := range estateRecs {
			if e.TerminatedAt != nil {
				terminatedEstate = append(terminatedEstate, e)
			} else {
				hasActiveEstate = true
			}
		}
		// Only flag if all estate is terminated — person with active estate is not suspicious
		if len(terminatedEstate) == 0 || hasActiveEstate {
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

// All keys use Latin i (after normalizeObjectType is applied).
var commercialObjectTypes = map[string]bool{
	"нежитлова будiвля":               true,
	"нежилова будiвля":                true,
	"будiвлi промисловостi та склади": true,
	"будiвлi торговельнi":             true,
	"будiвлi офiснi":                  true,
	"нежитловi будiвлi":               true,
}

func normalizeObjectType(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	return strings.ReplaceAll(s, "\u0456", "i") // Ukrainian і → Latin i
}

// R02 - agricultural land + commercial building registered to same person.
func ruleR02PurposeMismatch(taskID uuid.UUID, land []entity.LandRecord, estateByTaxID map[string][]entity.EstateRecord) []entity.Discrepancy {
	seen := make(map[string]bool)
	var out []entity.Discrepancy

	for _, l := range land {
		if l.TaxID == "" || seen[l.TaxID] {
			continue
		}
		// Legal entities (8-digit ЄДРПОУ) legitimately own mixed property — skip
		if len(l.TaxID) == 8 {
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
			if !commercialObjectTypes[normalizeObjectType(e.ObjectType)] {
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
					"raw_tax_id":    l.TaxID,
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

// R05 - duplicate cadastral number in land or duplicate (tax_id + address_norm + area_m2) in estate.
func ruleR05DuplicateRecord(taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) []entity.Discrepancy {
	var out []entity.Discrepancy

	// Land: duplicate cadastral numbers
	landByCadastral := make(map[string][]entity.LandRecord)
	for _, l := range land {
		if l.CadastralNum != "" {
			landByCadastral[l.CadastralNum] = append(landByCadastral[l.CadastralNum], l)
		}
	}
	for cadastralNum, recs := range landByCadastral {
		if len(recs) < 2 {
			continue
		}
		out = append(out, entity.Discrepancy{
			TaskID:    taskID,
			RuleCode:  entity.RuleDuplicateRecord,
			Severity:  entity.SeverityMedium,
			RiskScore: 30,
			TaxID:     recs[0].TaxID,
			OwnerName: recs[0].OwnerName,
			Description: fmt.Sprintf(
				"Дублікат земельного запису з кадастровим номером %s (%d записів)",
				cadastralNum, len(recs),
			),
			Details: map[string]any{
				"source":        "land",
				"cadastral_num": cadastralNum,
				"count":         len(recs),
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	// Estate: duplicate (tax_id + address_norm + area_m2)
	type estateKey struct {
		taxID    string
		addrNorm string
		areaM2   float64
	}
	estateByKey := make(map[estateKey][]entity.EstateRecord)
	for _, e := range estate {
		// skip records with no identifying info — can't meaningfully deduplicate
		if e.TaxID == "" || (e.AddressNorm == "" && e.AreaM2 == 0) {
			continue
		}
		k := estateKey{taxID: e.TaxID, addrNorm: e.AddressNorm, areaM2: e.AreaM2}
		estateByKey[k] = append(estateByKey[k], e)
	}
	for k, recs := range estateByKey {
		if len(recs) < 2 {
			continue
		}
		out = append(out, entity.Discrepancy{
			TaskID:    taskID,
			RuleCode:  entity.RuleDuplicateRecord,
			Severity:  entity.SeverityMedium,
			RiskScore: 30,
			TaxID:     k.taxID,
			OwnerName: recs[0].OwnerName,
			Description: fmt.Sprintf(
				"Дублікат запису нерухомості (адреса: %s, площа: %.1f м²) - %d записів",
				recs[0].Address, k.areaM2, len(recs),
			),
			Details: map[string]any{
				"source":  "estate",
				"address": recs[0].Address,
				"area_m2": k.areaM2,
				"count":   len(recs),
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	return out
}

// R06 - same tax ID has different normalized owner names across registries (Levenshtein > 3).
func ruleR06NameMismatch(taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) []entity.Discrepancy {
	type nameEntry struct {
		normalized string
		original   string
	}

	namesByTaxID := make(map[string][]nameEntry)

	addName := func(taxID, ownerName string) {
		if taxID == "" || ownerName == "" {
			return
		}
		n := strings.ToLower(normalizeName(ownerName))
		for _, e := range namesByTaxID[taxID] {
			if e.normalized == n {
				return
			}
		}
		namesByTaxID[taxID] = append(namesByTaxID[taxID], nameEntry{normalized: n, original: ownerName})
	}

	for _, l := range land {
		addName(l.TaxID, l.OwnerName)
	}
	for _, e := range estate {
		addName(e.TaxID, e.OwnerName)
	}

	var out []entity.Discrepancy
	for taxID, entries := range namesByTaxID {
		if len(entries) < 2 {
			continue
		}

		hasMismatch := false
		for i := 0; i < len(entries) && !hasMismatch; i++ {
			for j := i + 1; j < len(entries); j++ {
				if levenshtein(entries[i].normalized, entries[j].normalized) > 3 {
					hasMismatch = true
					break
				}
			}
		}
		if !hasMismatch {
			continue
		}

		names := make([]string, 0, len(entries))
		for _, e := range entries {
			names = append(names, e.original)
		}

		out = append(out, entity.Discrepancy{
			TaskID:      taskID,
			RuleCode:    entity.RuleNameInconsistency,
			Severity:    entity.SeverityMedium,
			RiskScore:   25,
			TaxID:       taxID,
			OwnerName:   entries[0].original,
			Description: "Один ІПН має різні варіанти написання імені власника в реєстрах",
			Details: map[string]any{
				"names": names,
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	return out
}

// R07 - record missing critical fields (area, address/location, or owner name).
func ruleR07IncompleteRecord(taskID uuid.UUID, land []entity.LandRecord, estate []entity.EstateRecord) []entity.Discrepancy {
	var out []entity.Discrepancy

	for _, l := range land {
		if l.OwnerName != "" {
			continue
		}
		out = append(out, entity.Discrepancy{
			TaskID:      taskID,
			RuleCode:    entity.RuleIncompleteRecord,
			Severity:    entity.SeverityLow,
			RiskScore:   5,
			TaxID:       l.TaxID,
			OwnerName:   l.OwnerName,
			Description: "Земельний запис без імені власника",
			Details: map[string]any{
				"source":        "land",
				"missing_fields": []string{"owner_name"},
				"cadastral_num": l.CadastralNum,
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	for _, e := range estate {
		if e.OwnerName != "" {
			continue
		}
		out = append(out, entity.Discrepancy{
			TaskID:      taskID,
			RuleCode:    entity.RuleIncompleteRecord,
			Severity:    entity.SeverityLow,
			RiskScore:   5,
			TaxID:       e.TaxID,
			OwnerName:   e.OwnerName,
			Description: "Запис нерухомості без імені власника",
			Details: map[string]any{
				"source":         "estate",
				"missing_fields": []string{"owner_name"},
				"address":        e.Address,
			},
			ResolutionStatus: entity.ResolutionNew,
		})
	}

	return out
}
