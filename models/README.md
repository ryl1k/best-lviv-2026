# Revela — ML Models

Experimental XGBoost risk classifier trained on ДЗК + ДРПП registry data.

## Setup

```bash
cd models
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Data

Put the raw xlsx files in `data/` (gitignored):
```
data/land.xlsx       # ДЗК — land registry
data/estate.xlsx     # ДРПП — real estate registry
```

## Run

```bash
jupyter notebook risk_classifier.ipynb
```

## What it does

1. **Feature engineering** — aggregates per tax ID: parcel count, total area, purpose codes, estate termination status, commercial object presence
2. **Label generation** — simulates R01/R02/R03/R05 rules to produce binary labels (risk=1 / clean=0)
3. **XGBoost classifier** — trained with class-weight balancing
4. **Outputs**: ROC curve, feature importance chart, SHAP summary plot, saved model (`revela_risk_model.json`)

## Key outputs

| File | Description |
|---|---|
| `roc_curve.png` | ROC-AUC curve on 20% test split |
| `feature_importance.png` | Top 15 features by XGBoost gain |
| `shap_summary.png` | SHAP beeswarm — which features push risk up/down |
| `revela_risk_model.json` | Saved model (load with `xgb.XGBClassifier().load_model(...)`) |

## Limitations

- Labels are rule-generated, so the model partially learns to replicate the rules
- Single OTG dataset (~42k records) — validate on a second OTG before trusting generalization
- Per tax-ID features only — record-level anomalies (R04, R07) are not captured here
