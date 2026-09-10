# Dashboard — Employee Attrition Analytics (React + Vite)

Dark, modular analytics UI on top of the FastAPI backend. All numbers come from
the API — nothing is hardcoded or computed in the browser.

## Run

```bash
# 1. backend must be running first (repo root):
uvicorn backend.main:app --reload --port 8000

# 2. frontend:
cd dashboard
npm install          # first time only
cp .env.example .env  # sets VITE_API_URL=http://localhost:8000
npm run dev          # http://localhost:5173
```

`npm run build` → production bundle in `dist/`.

## Structure

```
src/
├── main.jsx / App.jsx           # router + <FilterProvider>
├── styles/
│   ├── theme.css                # design tokens — colors, spacing, radius, type
│   └── app.css                  # component styles
├── services/api.js              # ONE axios client + all endpoint functions
├── context/FilterContext.jsx    # applied analytics filters (multi-select)
├── hooks/
│   ├── useApi.js                # generic loading/error/data fetch
│   ├── useBreakdown.js          # useApi + current filters
│   └── useHealth.js             # polls /health for the header indicator
├── components/
│   ├── layout/   Sidebar, Header, Layout
│   ├── cards/    KpiCard, ChartCard
│   ├── charts/   CategoryBarChart, DonutChart, chartTheme.js
│   ├── filters/  FilterBar, MultiSelect
│   ├── tables/   DataTable
│   ├── prediction/ PredictionForm, PredictionResult, FactorList, predictionFields.js
│   └── common/   StateWrapper, Skeleton
└── pages/        Overview, AttritionAnalysis, EmployeeInsights, PredictAttrition
```

## Where to change things later

| Want to change… | Edit |
|---|---|
| Colors / spacing / fonts | `src/styles/theme.css` |
| Which charts appear on Attrition Analysis | the `<Block>` list in `pages/AttritionAnalysis.jsx` |
| Prediction form fields / grouping / bounds | `components/prediction/predictionFields.js` |
| Add an API call | add a function in `services/api.js` |
| Chart look (axes, tooltip, series colors) | `components/charts/chartTheme.js` |
| Filter options offered | `components/filters/FilterBar.jsx` (`ORDER` / `FIELD_LABELS`) |

## API endpoints consumed

`GET /health`, `GET /dashboard/summary`, `/filters`, `/attrition-by-department`,
`/attrition-by-role`, `/attrition-by-overtime`, `/attrition-by-business-travel`,
`/attrition-by-age`, `/attrition-by-income`, `/attrition-by-tenure`,
`/attrition-by-job-satisfaction`, `/dashboard/employees` (paginated),
`POST /predict`.

Every `/dashboard/*` call forwards the active filters as repeatable query params
(`?department=Sales&department=Human+Resources`).
