// Package ml provides a client for the Python XGBoost risk scoring service.
package ml

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/ryl1k/best-lviv-2026/internal/entity"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

type taxIDFeatures struct {
	TaxID                  string  `json:"tax_id"`
	LandParcelCount        float64 `json:"land_parcel_count"`
	LandTotalAreaHa        float64 `json:"land_total_area_ha"`
	LandMeanAreaHa         float64 `json:"land_mean_area_ha"`
	LandMaxAreaHa          float64 `json:"land_max_area_ha"`
	LandUniquePurposes     float64 `json:"land_unique_purposes"`
	LandMeanNormativeValue float64 `json:"land_mean_normative_value"`
	EstateRecordCount      float64 `json:"estate_record_count"`
	EstateUniqueObjTypes   float64 `json:"estate_unique_object_types"`
	EstateTotalAreaM2      float64 `json:"estate_total_area_m2"`
	InLand                 float64 `json:"in_land"`
	InEstate               float64 `json:"in_estate"`
	InBoth                 float64 `json:"in_both"`
	TaxIDLength            float64 `json:"tax_id_length"`
	IsLegalEntity          float64 `json:"is_legal_entity"`
}

type scoreRequest struct {
	Records []taxIDFeatures `json:"records"`
}

type scoreResult struct {
	TaxID       string  `json:"tax_id"`
	MLRiskScore float64 `json:"ml_risk_score"`
}

type scoreResponse struct {
	Scores []scoreResult `json:"scores"`
}

// ScoreRecords computes per-tax-id features from land/estate records and returns ML risk scores.
func (c *Client) ScoreRecords(ctx context.Context, land []entity.LandRecord, estate []entity.EstateRecord) (map[string]float64, error) {
	features := buildFeatures(land, estate)
	if len(features) == 0 {
		return nil, nil
	}

	body, err := json.Marshal(scoreRequest{Records: features})
	if err != nil {
		return nil, fmt.Errorf("marshal: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/score", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("new request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http post: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("ml service returned %d", resp.StatusCode)
	}

	var result scoreResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decode: %w", err)
	}

	scores := make(map[string]float64, len(result.Scores))
	for _, s := range result.Scores {
		scores[s.TaxID] = s.MLRiskScore
	}
	return scores, nil
}

func buildFeatures(land []entity.LandRecord, estate []entity.EstateRecord) []taxIDFeatures {
	type landAgg struct {
		parcelCount       float64
		totalAreaHa       float64
		maxAreaHa         float64
		normativeValueSum float64
		normativeValueCnt float64
		purposeSet        map[string]struct{}
	}
	type estateAgg struct {
		recordCount float64
		objTypeSet  map[string]struct{}
		totalAreaM2 float64
	}

	landByTax := make(map[string]*landAgg)
	for _, l := range land {
		if l.TaxID == "" {
			continue
		}
		a, ok := landByTax[l.TaxID]
		if !ok {
			a = &landAgg{purposeSet: make(map[string]struct{})}
			landByTax[l.TaxID] = a
		}
		a.parcelCount++
		a.totalAreaHa += l.AreaHa
		if l.AreaHa > a.maxAreaHa {
			a.maxAreaHa = l.AreaHa
		}
		if l.NormativeValue > 0 {
			a.normativeValueSum += l.NormativeValue
			a.normativeValueCnt++
		}
		if l.PurposeText != "" {
			a.purposeSet[l.PurposeText] = struct{}{}
		}
	}

	estateByTax := make(map[string]*estateAgg)
	for _, e := range estate {
		if e.TaxID == "" {
			continue
		}
		a, ok := estateByTax[e.TaxID]
		if !ok {
			a = &estateAgg{objTypeSet: make(map[string]struct{})}
			estateByTax[e.TaxID] = a
		}
		a.recordCount++
		if e.ObjectType != "" {
			a.objTypeSet[e.ObjectType] = struct{}{}
		}
		a.totalAreaM2 += e.AreaM2
	}

	allTaxIDs := make(map[string]struct{})
	for id := range landByTax {
		allTaxIDs[id] = struct{}{}
	}
	for id := range estateByTax {
		allTaxIDs[id] = struct{}{}
	}

	result := make([]taxIDFeatures, 0, len(allTaxIDs))
	for taxID := range allTaxIDs {
		f := taxIDFeatures{
			TaxID:         taxID,
			TaxIDLength:   float64(len(taxID)),
			IsLegalEntity: boolToFloat(len(taxID) == 8),
		}

		if la, ok := landByTax[taxID]; ok {
			f.InLand = 1
			f.LandParcelCount = la.parcelCount
			f.LandTotalAreaHa = la.totalAreaHa
			f.LandMaxAreaHa = la.maxAreaHa
			f.LandUniquePurposes = float64(len(la.purposeSet))
			if la.normativeValueCnt > 0 {
				f.LandMeanAreaHa = la.totalAreaHa / la.parcelCount
				f.LandMeanNormativeValue = la.normativeValueSum / la.normativeValueCnt
			}
		}

		if ea, ok := estateByTax[taxID]; ok {
			f.InEstate = 1
			f.EstateRecordCount = ea.recordCount
			f.EstateUniqueObjTypes = float64(len(ea.objTypeSet))
			f.EstateTotalAreaM2 = ea.totalAreaM2
		}

		if f.InLand == 1 && f.InEstate == 1 {
			f.InBoth = 1
		}

		result = append(result, f)
	}
	return result
}

func boolToFloat(b bool) float64 {
	if b {
		return 1
	}
	return 0
}
