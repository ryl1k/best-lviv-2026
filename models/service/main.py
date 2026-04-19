from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import numpy as np
import os

app = FastAPI(title="Revela ML Service")

MODEL_PATH = os.getenv("MODEL_PATH", "revela_risk_model.json")

model = xgb.Booster()
model.load_model(MODEL_PATH)

FEATURE_COLS = [
    "land_parcel_count",
    "land_total_area_ha",
    "land_mean_area_ha",
    "land_max_area_ha",
    "land_unique_purposes",
    "land_mean_normative_value",
    "estate_record_count",
    "estate_unique_object_types",
    "estate_total_area_m2",
    "in_land",
    "in_estate",
    "in_both",
    "tax_id_length",
    "is_legal_entity",
]


class TaxIDFeatures(BaseModel):
    tax_id: str
    land_parcel_count: float = 0
    land_total_area_ha: float = 0
    land_mean_area_ha: float = 0
    land_max_area_ha: float = 0
    land_unique_purposes: float = 0
    land_mean_normative_value: float = 0
    estate_record_count: float = 0
    estate_unique_object_types: float = 0
    estate_total_area_m2: float = 0
    in_land: float = 0
    in_estate: float = 0
    in_both: float = 0
    tax_id_length: float = 0
    is_legal_entity: float = 0


class ScoreRequest(BaseModel):
    records: list[TaxIDFeatures]


class ScoreResult(BaseModel):
    tax_id: str
    ml_risk_score: float


class ScoreResponse(BaseModel):
    scores: list[ScoreResult]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    if not req.records:
        raise HTTPException(status_code=400, detail="records is empty")

    X = np.array([
        [getattr(r, col) for col in FEATURE_COLS]
        for r in req.records
    ], dtype=np.float32)

    dmat = xgb.DMatrix(X, feature_names=FEATURE_COLS)
    probs = model.predict(dmat)

    return ScoreResponse(scores=[
        ScoreResult(tax_id=r.tax_id, ml_risk_score=float(p))
        for r, p in zip(req.records, probs)
    ])
