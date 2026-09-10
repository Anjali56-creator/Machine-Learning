# Backend — Attrition Analysis & Prediction API

FastAPI service that serves dashboard analytics from the cleaned dataset and ML
predictions from the pre-trained pipeline. It does **not** train anything — it
loads `ml/artifacts/attrition_pipeline.joblib` produced by
`notebooks/03_modeling.ipynb`.

## Layout

```
backend/
├── main.py                     # app, CORS, lifespan (loads model+data once), error handlers, /health
├── config.py                   # paths, CORS origins, risk thresholds (env-overridable, prefix ATTRITION_)
├── api/
│   ├── dependencies.py         # shared optional analytics filters
│   ├── routes_prediction.py    # POST /predict
│   └── routes_dashboard.py     # GET /dashboard/*
├── schemas/
│   ├── prediction.py           # EmployeeFeatures (enums = trained categories), PredictionResponse
│   └── dashboard.py
├── services/
│   ├── model_service.py        # loads pipeline once; predict(); risk_level(); top_factors()
│   └── analytics_service.py    # loads CSV once; summary(); breakdowns; apply_filters()
├── ml/artifacts/               # attrition_pipeline.joblib + model_metadata.json (unchanged)
├── utils/errors.py
└── tests/test_api.py
```

## Run locally

From the **repository root**, with the project venv active:

```bash
pip install -r backend/requirements.txt          # first time only
uvicorn backend.main:app --reload --port 8000
```

- Swagger UI: http://localhost:8000/docs
- Health: http://localhost:8000/health

Optional config: copy `backend/.env.example` to `backend/.env`.

## Tests

```bash
pytest backend/tests -q
```

Tests use the real pipeline and real dataset (no mocks).

## Risk levels

Applied to the model-estimated probability of `Attrition="Yes"` (a risk score,
not a calibrated probability):

| Score range                              | risk_level |
|------------------------------------------|------------|
| `< 0.35`                                 | Low        |
| `>= 0.35` and `< 0.65`                   | Medium     |
| `>= 0.65`                                | High       |

Thresholds live in `config.py` (`risk_medium_threshold`, `risk_high_threshold`)
and can be overridden via `ATTRITION_RISK_MEDIUM_THRESHOLD` /
`ATTRITION_RISK_HIGH_THRESHOLD`.
