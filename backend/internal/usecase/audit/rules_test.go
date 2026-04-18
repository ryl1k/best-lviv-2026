package audit

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

var testTaskID = uuid.MustParse("00000000-0000-0000-0000-000000000001")

func ptrTime(s string) *time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return &t
}

// ── R01 ──────────────────────────────────────────────────────────────────────

func TestR01_fires_when_all_estate_terminated(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "1234:1:2:3", OwnerName: "Іваненко І.І."},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко І.І.", TerminatedAt: ptrTime("2020-01-01")},
	}
	estateByTaxID := map[string][]entity.EstateRecord{"1234567890": estate}

	result := ruleR01TerminatedStillHasLand(testTaskID, land, estateByTaxID)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
	if result[0].RuleCode != entity.RuleTerminatedStillHasLand {
		t.Errorf("wrong rule code: %s", result[0].RuleCode)
	}
}

func TestR01_no_fire_when_mixed_terminated_and_active(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "1234:1:2:3"},
	}
	estateByTaxID := map[string][]entity.EstateRecord{
		"1234567890": {
			{TaskID: testTaskID, TaxID: "1234567890", TerminatedAt: ptrTime("2020-01-01")},
			{TaskID: testTaskID, TaxID: "1234567890", TerminatedAt: nil},
		},
	}
	result := ruleR01TerminatedStillHasLand(testTaskID, land, estateByTaxID)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies when active estate exists, got %d", len(result))
	}
}

func TestR01_no_fire_when_estate_active(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "1234:1:2:3"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", TerminatedAt: nil},
	}
	estateByTaxID := map[string][]entity.EstateRecord{"1234567890": estate}

	result := ruleR01TerminatedStillHasLand(testTaskID, land, estateByTaxID)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── R02 ──────────────────────────────────────────────────────────────────────

func TestR02_fires_on_agri_land_with_commercial_building(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", PurposeCode: "01.01", CadastralNum: "111", OwnerName: "Петренко"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", ObjectType: "нежилова будівля"},
	}
	estateByTaxID := map[string][]entity.EstateRecord{"1234567890": estate}

	result := ruleR02PurposeMismatch(testTaskID, land, estateByTaxID)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
	if result[0].Severity != entity.SeverityHigh {
		t.Errorf("expected HIGH severity")
	}
}

func TestR02_no_fire_on_residential_estate(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", PurposeCode: "01.01"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", ObjectType: "квартира"},
	}
	estateByTaxID := map[string][]entity.EstateRecord{"1234567890": estate}

	result := ruleR02PurposeMismatch(testTaskID, land, estateByTaxID)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── R03 ──────────────────────────────────────────────────────────────────────

func TestR03_fires_when_no_estate(t *testing.T) {
	landByTaxID := map[string][]entity.LandRecord{
		"1234567890": {{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "111"}},
	}
	estateByTaxID := map[string][]entity.EstateRecord{}

	result := ruleR03LandWithoutEstate(testTaskID, landByTaxID, estateByTaxID)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR03_no_fire_when_estate_exists(t *testing.T) {
	landByTaxID := map[string][]entity.LandRecord{
		"1234567890": {{TaskID: testTaskID, TaxID: "1234567890"}},
	}
	estateByTaxID := map[string][]entity.EstateRecord{
		"1234567890": {{TaskID: testTaskID, TaxID: "1234567890"}},
	}

	result := ruleR03LandWithoutEstate(testTaskID, landByTaxID, estateByTaxID)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── R04 ──────────────────────────────────────────────────────────────────────

func TestR04_fires_on_missing_tax_id(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "", CadastralNum: "111"},
	}
	result := ruleR04InvalidTaxID(testTaskID, land, nil)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR04_fires_on_wrong_length_tax_id(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "123", CadastralNum: "111"},
	}
	result := ruleR04InvalidTaxID(testTaskID, land, nil)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR04_no_fire_on_valid_tax_id(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890"},
	}
	result := ruleR04InvalidTaxID(testTaskID, land, nil)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── R05 ──────────────────────────────────────────────────────────────────────

func TestR05_fires_on_duplicate_cadastral_num(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "DUPE:1:2:3"},
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "DUPE:1:2:3"},
	}
	result := ruleR05DuplicateRecord(testTaskID, land, nil)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
	if result[0].RuleCode != entity.RuleDuplicateRecord {
		t.Errorf("wrong rule code")
	}
}

func TestR05_fires_on_duplicate_estate(t *testing.T) {
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", Address: "вул. Шевченка 1", AddressNorm: "вул. шевченка 1", AreaM2: 50.0},
		{TaskID: testTaskID, TaxID: "1234567890", Address: "вул. Шевченка 1", AddressNorm: "вул. шевченка 1", AreaM2: 50.0},
	}
	result := ruleR05DuplicateRecord(testTaskID, nil, estate)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR05_no_fire_on_unique_records(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "AAA:1"},
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "BBB:2"},
	}
	result := ruleR05DuplicateRecord(testTaskID, land, nil)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── R06 ──────────────────────────────────────────────────────────────────────

func TestR06_fires_when_names_differ_significantly(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко Іван Іванович"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Петренко Петро Петрович"},
	}
	result := ruleR06NameMismatch(testTaskID, land, estate)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR06_no_fire_when_names_match(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко Іван"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко Іван"},
	}
	result := ruleR06NameMismatch(testTaskID, land, estate)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

func TestR06_no_fire_on_minor_typo(t *testing.T) {
	// Levenshtein distance of 1 — should not fire
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко"},
	}
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненкo"}, // last char swapped
	}
	result := ruleR06NameMismatch(testTaskID, land, estate)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies for minor typo, got %d", len(result))
	}
}

// ── R07 ──────────────────────────────────────────────────────────────────────

func TestR07_fires_on_missing_land_fields(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", CadastralNum: "111", OwnerName: "", AreaHa: 0, Location: ""},
	}
	result := ruleR07IncompleteRecord(testTaskID, land, nil)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR07_fires_on_missing_estate_fields(t *testing.T) {
	estate := []entity.EstateRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "", AreaM2: 0, Address: ""},
	}
	result := ruleR07IncompleteRecord(testTaskID, nil, estate)
	if len(result) != 1 {
		t.Fatalf("expected 1 discrepancy, got %d", len(result))
	}
}

func TestR07_no_fire_on_complete_record(t *testing.T) {
	land := []entity.LandRecord{
		{TaskID: testTaskID, TaxID: "1234567890", OwnerName: "Іваненко", AreaHa: 1.5, Location: "вул. Шевченка"},
	}
	result := ruleR07IncompleteRecord(testTaskID, land, nil)
	if len(result) != 0 {
		t.Errorf("expected 0 discrepancies, got %d", len(result))
	}
}

// ── Levenshtein helper ────────────────────────────────────────────────────────

func TestLevenshtein(t *testing.T) {
	cases := []struct {
		a, b string
		want int
	}{
		{"", "", 0},
		{"abc", "", 3},
		{"", "abc", 3},
		{"abc", "abc", 0},
		{"abc", "axc", 1},
		{"kitten", "sitting", 3},
	}
	for _, c := range cases {
		got := levenshtein(c.a, c.b)
		if got != c.want {
			t.Errorf("levenshtein(%q, %q) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}
