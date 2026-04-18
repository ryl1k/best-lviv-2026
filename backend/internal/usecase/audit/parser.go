package audit

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
	"github.com/xuri/excelize/v2"
)

// landColumnAliases maps normalized header variants to canonical field names.
var landColumnAliases = map[string]string{
	"кадастровий номер":                              "cadastral_num",
	"кадастровийномер":                               "cadastral_num",
	"іпн землекористувача":                           "tax_id",
	"іпнземлекористувача":                            "tax_id",
	"ідентифікаційний номер землекористувача":        "tax_id",
	"землекористувач":                                "owner_name",
	"цільове призначення":                            "purpose_text",
	"цільовепризначення":                             "purpose_text",
	"площа, га":                                      "area_ha",
	"площа":                                          "area_ha",
	"усереднена нормативна грошова оцінка":           "normative_value",
	"нормативна грошова оцінка":                      "normative_value",
	"нормативнагрошовоцінка":                         "normative_value",
	"дата державної реєстрації права власності":      "registered_at",
	"датадержавноїреєстраціїправавласності":          "registered_at",
	"коатуу":                                         "koatuu",
	"форма власності":                                "ownership_form",
	"формавласності":                                 "ownership_form",
	"вид використання":                               "land_use_type",
	"видвикористання":                                "land_use_type",
	"місцезнаходження":                               "location",
	"адреса":                                         "location",
}

var estateColumnAliases = map[string]string{
	"податковий номер пп":                           "tax_id",
	"податковийномерпп":                             "tax_id",
	"іпн":                                           "tax_id",
	"назва платника":                                "owner_name",
	"назваплатника":                                 "owner_name",
	"тип об'єкта":                                   "object_type",
	"типоб'єкта":                                    "object_type",
	"тип об єкта":                                   "object_type",
	"адреса об'єкта":                                "address",
	"адресаоб'єкта":                                 "address",
	"адреса об єкта":                                "address",
	"адреса":                                        "address",
	"дата держ. реєстр. права власн":               "registered_at",
	"датадерж.реєстр.прававласн":                    "registered_at",
	"дата держ реєстр права власн":                  "registered_at",
	"дата держ. реєстр. прип. права власн":          "terminated_at",
	"датадерж.реєстр.прип.прававласн":               "terminated_at",
	"дата держ реєстр прип права власн":             "terminated_at",
	"загальна площа":                                "area_m2",
	"загальнаплоща":                                 "area_m2",
	"площа":                                         "area_m2",
	"співвласники":                                   "co_ownership",
	"частка":                                        "share",
}

func normalizeHeader(h string) string {
	h = strings.ToLower(strings.TrimSpace(h))
	// replace Ukrainian і -> i for consistent matching
	h = strings.ReplaceAll(h, "\u0456", "i")
	return h
}

func mapHeaders(headers []string, aliases map[string]string) map[int]string {
	result := make(map[int]string)
	for i, h := range headers {
		norm := normalizeHeader(h)
		if field, ok := aliases[norm]; ok {
			result[i] = field
		} else {
			// also try without spaces
			noSpace := strings.ReplaceAll(norm, " ", "")
			if field, ok := aliases[noSpace]; ok {
				result[i] = field
			} else {
				result[i] = norm // keep original for raw map
			}
		}
	}
	return result
}

func ParseLandFile(data []byte, ext string, taskID uuid.UUID) ([]entity.LandRecord, error) {
	rows, err := readRows(data, ext)
	if err != nil {
		return nil, fmt.Errorf("parse land file: %w", err)
	}
	if len(rows) < 2 {
		return nil, nil
	}

	colMap := mapHeaders(rows[0], landColumnAliases)
	var records []entity.LandRecord

	for _, row := range rows[1:] {
		if isEmptyRow(row) {
			continue
		}
		raw := make(map[string]string)
		fields := make(map[string]string)

		for i, val := range row {
			if i >= len(rows[0]) {
				break
			}
			header := rows[0][i]
			raw[header] = val
			if field, ok := colMap[i]; ok {
				fields[field] = strings.TrimSpace(val)
			}
		}

		rec := entity.LandRecord{
			TaskID:        taskID,
			CadastralNum:  fields["cadastral_num"],
			Koatuu:        fields["koatuu"],
			OwnershipForm: fields["ownership_form"],
			PurposeText:   fields["purpose_text"],
			PurposeCode:   parsePurposeCode(fields["purpose_text"]),
			Location:      fields["location"],
			LandUseType:   fields["land_use_type"],
			TaxID:         normalizeTaxID(fields["tax_id"]),
			OwnerName:     normalizeName(fields["owner_name"]),
			Raw:           raw,
		}

		if v := fields["area_ha"]; v != "" {
			rec.AreaHa, _ = strconv.ParseFloat(strings.ReplaceAll(v, ",", "."), 64)
		}
		if v := fields["normative_value"]; v != "" {
			rec.NormativeValue, _ = strconv.ParseFloat(strings.ReplaceAll(v, ",", "."), 64)
		}
		if v := fields["share"]; v != "" {
			rec.Share, _ = strconv.ParseFloat(strings.ReplaceAll(v, ",", "."), 64)
		}
		if v := fields["registered_at"]; v != "" {
			if t := parseDate(v); t != nil {
				rec.RegisteredAt = t
			}
		}

		records = append(records, rec)
	}

	return records, nil
}

func ParseEstateFile(data []byte, ext string, taskID uuid.UUID) ([]entity.EstateRecord, error) {
	rows, err := readRows(data, ext)
	if err != nil {
		return nil, fmt.Errorf("parse estate file: %w", err)
	}
	if len(rows) < 2 {
		return nil, nil
	}

	colMap := mapHeaders(rows[0], estateColumnAliases)
	var records []entity.EstateRecord

	for _, row := range rows[1:] {
		if isEmptyRow(row) {
			continue
		}
		raw := make(map[string]string)
		fields := make(map[string]string)

		for i, val := range row {
			if i >= len(rows[0]) {
				break
			}
			header := rows[0][i]
			raw[header] = val
			if field, ok := colMap[i]; ok {
				fields[field] = strings.TrimSpace(val)
			}
		}

		addr := fields["address"]
		rec := entity.EstateRecord{
			TaskID:      taskID,
			TaxID:       normalizeTaxID(fields["tax_id"]),
			OwnerName:   normalizeName(fields["owner_name"]),
			ObjectType:  fields["object_type"],
			Address:     addr,
			AddressNorm: normalizeAddress(addr),
			CoOwnership: fields["co_ownership"],
			Raw:         raw,
		}

		if v := fields["area_m2"]; v != "" {
			rec.AreaM2, _ = strconv.ParseFloat(strings.ReplaceAll(v, ",", "."), 64)
		}
		if v := fields["share"]; v != "" {
			rec.Share, _ = strconv.ParseFloat(strings.ReplaceAll(v, ",", "."), 64)
		}
		if v := fields["registered_at"]; v != "" {
			if t := parseDate(v); t != nil {
				rec.RegisteredAt = t
			}
		}
		if v := fields["terminated_at"]; v != "" {
			if t := parseDate(v); t != nil {
				rec.TerminatedAt = t
			}
		}

		records = append(records, rec)
	}

	return records, nil
}

func readRows(data []byte, ext string) ([][]string, error) {
	switch strings.ToLower(ext) {
	case ".xlsx", ".xls":
		return readXLSX(data)
	case ".csv":
		return readCSV(data)
	default:
		return nil, entity.ErrUnsupportedFileFormat
	}
}

func readXLSX(data []byte) ([][]string, error) {
	f, err := excelize.OpenReader(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("open xlsx: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("no sheets in xlsx file")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("get rows: %w", err)
	}
	return rows, nil
}

func readCSV(data []byte) ([][]string, error) {
	r := csv.NewReader(bytes.NewReader(data))
	r.LazyQuotes = true
	r.TrimLeadingSpace = true
	return r.ReadAll()
}

var dateFormats = []string{
	"02.01.2006",
	"2006-01-02",
	"01/02/2006",
	"2006/01/02",
	"02-01-2006",
}

func parseDate(s string) *time.Time {
	s = strings.TrimSpace(s)
	for _, format := range dateFormats {
		if t, err := time.Parse(format, s); err == nil {
			return &t
		}
	}
	return nil
}

func isEmptyRow(row []string) bool {
	for _, v := range row {
		if strings.TrimSpace(v) != "" {
			return false
		}
	}
	return true
}
