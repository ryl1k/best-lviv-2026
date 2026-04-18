package audit

import (
	"strings"
	"unicode"

	"golang.org/x/text/unicode/norm"
)

// normalizeTaxID strips spaces and ensures exactly 10 or 8 digits.
func normalizeTaxID(raw string) string {
	var b strings.Builder
	for _, r := range raw {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// normalizeAddress lowercases, collapses spaces, and replaces Cyrillic і with Latin i
// to handle the common data quality issue found in the registry files.
func normalizeAddress(raw string) string {
	s := norm.NFC.String(raw)
	s = strings.ToLower(s)
	// collapse whitespace
	s = strings.Join(strings.Fields(s), " ")
	// normalize Ukrainian і (U+0456) -> i (U+0069) to prevent address mismatches
	s = strings.ReplaceAll(s, "\u0456", "i")
	return s
}

// normalizeName trims whitespace and collapses internal spaces.
func normalizeName(raw string) string {
	return strings.Join(strings.Fields(strings.TrimSpace(raw)), " ")
}

// parsePurposeCode extracts the numeric code prefix from a purpose string like "01.01 Для ведення...".
func parsePurposeCode(purposeText string) string {
	parts := strings.SplitN(strings.TrimSpace(purposeText), " ", 2)
	if len(parts) > 0 {
		return parts[0]
	}
	return ""
}
