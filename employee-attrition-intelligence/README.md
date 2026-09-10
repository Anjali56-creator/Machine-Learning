# Employee Attrition Intelligence

An end-to-end workforce analytics product that explains **where employee attrition
is concentrated** and estimates the **attrition risk of an individual employee**
from a trained ML pipeline.

Notebooks for the data science, a FastAPI service for analytics + inference, and a
React dashboard ("Attrition Intelligence") on top.

---

## Problem statement

Voluntary attrition is expensive and uneven — it clusters in particular roles,
tenures and work conditions. This project turns the IBM HR Analytics dataset into:

1. reproducible **analysis** of which segments leave more often (association, not
   causation);
2. a **prediction** model for the probability that a given employee profile leaves;
3. a **dashboard** an HR manager can actually use to investigate.

## Dataset

**IBM HR Analytics Employee Attrition & Performance** — 1,470 employees, 35 raw
columns, target `Attrition` (Yes/No), ~16.1 % positive class (imbalanced).
Publicly available (Kaggle / IBM sample data). Files:

- `data/raw/WA_Fn-UseC_-HR-Employee-Attrition.csv` — original
- `data/processed/cleaned_employee_attrition.csv` — after cleaning

## Tech stack

| Layer | Tools |
|---|---|
| Data science | Python, pandas, scikit-learn, XGBoost, matplotlib/seaborn, Jupyter |
| Backend | FastAPI, Pydantic, Uvicorn, joblib |
| Frontend | React 18, Vite, React Router, Recharts, Axios |
| SQL | SQLite-compatible schema + analytical queries (`sql/`) |

## Architecture

```
notebooks/            data science (cleaning -> EDA -> modeling), produces:
  └─ backend/ml/artifacts/attrition_pipeline.joblib   (preprocessing + model)
                          model_metadata.json          (feature order, metrics)

backend/              FastAPI — loads the artifact once, never retrains
  ├─ api/             routes: /health, /dashboard/*, /predict
  ├─ services/        model_service (inference) · analytics_service (aggregations)
  ├─ schemas/         Pydantic request/response models
  └─ tests/           pytest against the real pipeline + dataset

dashboard/            React SPA, all numbers from the API (nothing hardcoded)
  └─ src/{pages,components,hooks,services,context,styles}

sql/                  schema.sql + analysis_queries.sql
```

## Data cleaning (`notebooks/01_cleaning.ipynb`)

- Dropped 3 constant columns: `EmployeeCount`, `Over18`, `StandardHours`.
- Added numeric target `Attrition_Flag` (1 = Yes).
- 0 duplicate rows, no missing values.
- `EmployeeNumber` flagged as an identifier — **excluded from modeling**.
- Feature audit: 5 categorical, 3 binary, 22 numerical.

## EDA (`notebooks/02_eda.ipynb`)

Attrition is higher for: `OverTime = Yes`, `Travel_Frequently`, `Single`
employees, and Sales roles; and for younger, lower-income, shorter-tenure, lower
job-satisfaction employees. All stated as **observed association**.

## ML methodology (`notebooks/03_modeling.ipynb` + `scripts` parity)

- Leakage-safe `Pipeline`: `ColumnTransformer` (`StandardScaler` on numerics,
  `OneHotEncoder(handle_unknown="ignore")` on categoricals) → classifier.
- **Stratified** 80/20 split; **5-fold stratified** cross-validation on the train
  split only.
- Imbalance handled with `class_weight="balanced"` / `scale_pos_weight`.
- Model chosen by **recall on `Attrition = Yes`** (missing a leaver costs more
  than a false alarm), with ROC-AUC / PR-AUC as tie-breakers — **not** accuracy.

### Model comparison (5-fold CV, recall on positive class)

| Model | Notes |
|---|---|
| **Logistic Regression** (`class_weight="balanced"`) | **selected** — best recall on this small dataset |
| Random Forest | biased toward majority even with balancing |
| HistGradientBoosting | similar |
| XGBoost | similar; no meaningful gain here |

### Final model — held-out test metrics

| Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---|---|---|---|---|
| 0.75 | 0.35 | **0.64** | 0.45 | 0.80 | 0.56 |

These are the honest baseline for a 1,470-row imbalanced problem — not inflated.
The fitted pipeline is saved to `backend/ml/artifacts/` and loaded directly by the
API (no notebook dependency at serving time).

## API endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | status + `model_loaded` / `data_loaded` |
| GET | `/dashboard/summary` | KPI block |
| GET | `/dashboard/filters` | distinct values for every filter |
| GET | `/dashboard/attrition-by-department` \| `-role` \| `-overtime` \| `-business-travel` \| `-marital-status` \| `-job-level` \| `-job-satisfaction` \| `-age` \| `-income` \| `-tenure` | `{category,total,attrition_count,attrition_rate}[]` |
| GET | `/dashboard/employees` | paginated employee rows (no `EmployeeNumber`), server-side sort |
| POST | `/predict` | `{prediction, probability, risk_level, thresholds, top_factors}` |

Every `/dashboard/*` route accepts repeatable filters:
`?department=Sales&department=Human+Resources` (department, job_role, gender,
overtime, job_level, business_travel). CORS is restricted to the configured
frontend origins.

`top_factors` are **model-derived contributions** (coefficient × standardized
input) — they indicate which inputs moved a single estimate. They are **not**
SHAP values and **not** causal claims.

Risk levels (thresholds in `backend/config.py`, env-overridable):
`< 0.35` Low · `0.35–0.65` Medium · `≥ 0.65` High.

## Running it

### Backend (from `employee-attrition-intelligence/`)

```bash
python -m venv .venv && .venv/Scripts/activate          # or source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000
#  docs  -> http://localhost:8000/docs
#  health-> http://localhost:8000/health
pytest backend/tests -q                                  # 12 tests, real pipeline + data
```

Optional config: copy `backend/.env.example` → `backend/.env`.

### Frontend (from `employee-attrition-intelligence/dashboard/`)

```bash
npm install
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm run dev                 # http://localhost:5173
npm run build               # production bundle in dist/
```

Start the backend first, then the frontend.

### SQL (optional)

```bash
sqlite3 attrition.db < sql/schema.sql
# then, in the sqlite3 shell: .mode csv ; .import --skip 1 data/processed/cleaned_employee_attrition.csv employees
sqlite3 attrition.db < sql/analysis_queries.sql
```

## Dashboard pages

- **Overview** — KPI row, runtime-derived "Key Insights" cards, concentration
  charts (Department / OverTime / Job Role), lifecycle charts.
- **Attrition Analysis** — six numbered sections, each with a data-derived note.
- **Employee Insights** — filterable, sortable, paginated employee table with
  attrition badges.
- **Predict Attrition** — 30-input profile form → risk panel (meter with
  green→amber→coral zones) + numbered model-derived factors.

All values come from the API; the app shows an explicit "Unable to connect to the
analytics API" state rather than fabricated numbers when the backend is down.

## Screenshots

_Add screenshots of the four dashboard pages here._

## Design system

Centralised in `dashboard/src/styles/theme.css` — dark navy-indigo surfaces with a
strategic accent ramp (purple brand · blue workforce data · cyan/turquoise
secondary · coral/pink attrition · yellow/orange compensation & attention · green
low-risk · indigo supporting). Chart colours are mapped in
`dashboard/src/components/charts/chartTheme.js`.

## Future improvements

- Calibrated probabilities (`CalibratedClassifierCV`) and a tuned decision
  threshold instead of 0.5.
- SHAP explanations behind a feature flag, clearly separated from the current
  linear contributions.
- Persist filters to the URL; saved segment views.
- A retraining script + model registry so the artifact is regenerated in CI.
- Automated frontend tests (Vitest / Testing Library).
- Optional Postgres backing store using the schema in `sql/`.
