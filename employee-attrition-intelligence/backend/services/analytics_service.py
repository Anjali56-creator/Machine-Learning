"""Analytics service: computes dashboard metrics from the cleaned dataset.

Every number returned here is derived at request time from
`data/processed/cleaned_employee_attrition.csv` - nothing is hardcoded. The CSV
is read once at startup and cached in memory.

Filtering is intentionally simple: a single reusable `apply_filters` function
maps a small set of snake_case filter keys to dataset columns. More filters can
be added by extending `FILTERABLE_COLUMNS` without touching the endpoints.
"""

from __future__ import annotations

import logging
from pathlib import Path

import numpy as np
import pandas as pd

from backend.config import Settings, get_settings
from backend.utils.errors import AnalyticsError

logger = logging.getLogger(__name__)

TARGET = "Attrition_Flag"

# Columns surfaced by the employee-level endpoint. EmployeeNumber is intentionally
# excluded - it is an identifier, not an analytical attribute.
EMPLOYEE_COLUMNS: list[str] = [
    "Age",
    "Department",
    "JobRole",
    "JobLevel",
    "MonthlyIncome",
    "OverTime",
    "JobSatisfaction",
    "YearsAtCompany",
    "BusinessTravel",
    "Attrition",
]

# snake_case filter key -> dataset column name
FILTERABLE_COLUMNS: dict[str, str] = {
    "department": "Department",
    "job_role": "JobRole",
    "gender": "Gender",
    "overtime": "OverTime",
    "job_level": "JobLevel",
    "business_travel": "BusinessTravel",
}


class AnalyticsService:
    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._df: pd.DataFrame | None = None
        self._load_error: str | None = None

    # --- lifecycle -------------------------------------------------------------
    def load(self) -> None:
        try:
            path: Path = self._settings.data_path
            self._df = pd.read_csv(path)
            if TARGET not in self._df.columns:
                raise ValueError(f"{TARGET!r} column missing from {path}")
            self._load_error = None
            logger.info("Loaded analytics dataset: %s rows from %s", len(self._df), path)
        except Exception as exc:  # noqa: BLE001
            self._df = None
            self._load_error = str(exc)
            logger.exception("Failed to load analytics dataset")

    @property
    def ready(self) -> bool:
        return self._df is not None

    @property
    def load_error(self) -> str | None:
        return self._load_error

    # --- filtering -------------------------------------------------------------
    def _base(self, filters: dict | None) -> pd.DataFrame:
        if self._df is None:
            raise AnalyticsError(self._load_error or "Analytics dataset is not loaded")
        return apply_filters(self._df, filters)

    def filter_options(self) -> dict[str, list]:
        if self._df is None:
            raise AnalyticsError(self._load_error or "Analytics dataset is not loaded")
        options: dict[str, list] = {}
        for key, col in FILTERABLE_COLUMNS.items():
            values = sorted(self._df[col].dropna().unique().tolist())
            options[key] = values
        return options

    # --- summary KPIs -------------------------------------------------------
    def summary(self, filters: dict | None = None) -> dict:
        df = self._base(filters)
        total = int(len(df))
        if total == 0:
            return {
                "total_employees": 0,
                "attrition_count": 0,
                "attrition_rate": 0.0,
                "average_age": 0.0,
                "average_monthly_income": 0.0,
                "average_job_satisfaction": 0.0,
                "overtime_percentage": 0.0,
            }
        attrition_count = int(df[TARGET].sum())
        return {
            "total_employees": total,
            "attrition_count": attrition_count,
            "attrition_rate": _pct(attrition_count / total),
            "average_age": round(float(df["Age"].mean()), 1),
            "average_monthly_income": round(float(df["MonthlyIncome"].mean()), 2),
            "average_job_satisfaction": round(float(df["JobSatisfaction"].mean()), 2),
            "overtime_percentage": _pct((df["OverTime"] == "Yes").mean()),
        }

    # --- categorical breakdowns ------------------------------------------------
    def attrition_by_column(self, column: str, filters: dict | None = None) -> list[dict]:
        df = self._base(filters)
        return _group_rate(df, column)

    def attrition_by_binned(
        self,
        source_column: str,
        bins: list[float],
        labels: list[str],
        filters: dict | None = None,
    ) -> list[dict]:
        df = self._base(filters).copy()
        df["_bucket"] = pd.cut(df[source_column], bins=bins, labels=labels, right=True)
        rows = _group_rate(df, "_bucket")
        # Preserve bucket order rather than sorting by rate.
        order = {label: i for i, label in enumerate(labels)}
        return sorted(rows, key=lambda r: order.get(r["category"], len(labels)))

    # --- employee-level rows (for the Employee Insights table) ----------------
    def employees(
        self,
        filters: dict | None = None,
        limit: int = 50,
        offset: int = 0,
        sort_by: str | None = None,
        sort_dir: str = "asc",
    ) -> dict:
        """Return a filtered, paginated slice of employee rows.

        Only analytically useful columns are exposed - `EmployeeNumber` is
        deliberately omitted. `total` is the filtered row count (pre-pagination)
        so the frontend can page through results.
        """
        df = self._base(filters)
        total = int(len(df))

        if sort_by and sort_by in EMPLOYEE_COLUMNS:
            df = df.sort_values(sort_by, ascending=(sort_dir != "desc"))

        page = df.iloc[offset : offset + limit]
        rows = page[EMPLOYEE_COLUMNS].to_dict(orient="records")
        # Normalise numpy scalar types to plain Python for JSON serialisation.
        clean_rows = [
            {k: (v.item() if hasattr(v, "item") else v) for k, v in row.items()}
            for row in rows
        ]
        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "rows": clean_rows,
        }


def apply_filters(df: pd.DataFrame, filters: dict | None) -> pd.DataFrame:
    """Return a filtered copy of `df`.

    `filters` maps snake_case keys (see FILTERABLE_COLUMNS) to a value or list of
    values. Unknown keys and None values are ignored so callers can pass sparse
    filter dicts freely.
    """
    if not filters:
        return df
    mask = pd.Series(True, index=df.index)
    for key, value in filters.items():
        if value is None or key not in FILTERABLE_COLUMNS:
            continue
        col = FILTERABLE_COLUMNS[key]
        if isinstance(value, (list, tuple, set)):
            values = list(value)
            if not values:
                continue
            mask &= df[col].isin(values)
        else:
            mask &= df[col] == value
    return df[mask]


def _group_rate(df: pd.DataFrame, column: str) -> list[dict]:
    if column not in df.columns:
        raise AnalyticsError(f"Unknown analytics column: {column!r}")
    grouped = df.groupby(column, observed=True)[TARGET].agg(["count", "sum"])
    rows = []
    for category, row in grouped.iterrows():
        total = int(row["count"])
        attr = int(row["sum"])
        rows.append(
            {
                "category": str(category),
                "total": total,
                "attrition_count": attr,
                "attrition_rate": _pct(attr / total) if total else 0.0,
            }
        )
    rows.sort(key=lambda r: r["attrition_rate"], reverse=True)
    return rows


def _pct(fraction: float) -> float:
    """Fraction -> percentage rounded to 1 dp (e.g. 0.2063 -> 20.6)."""
    return round(float(fraction) * 100, 1)


# Age / income / tenure bucket definitions, kept here so endpoints stay thin.
AGE_BINS = [17, 25, 35, 45, 55, 61]
AGE_LABELS = ["18-25", "26-35", "36-45", "46-55", "56-60"]

INCOME_BINS = [0, 3000, 6000, 10000, 20000]
INCOME_LABELS = ["<3K", "3K-6K", "6K-10K", "10K+"]

TENURE_BINS = [-1, 2, 5, 10, 20, 60]
TENURE_LABELS = ["0-2", "3-5", "6-10", "11-20", "20+"]


analytics_service = AnalyticsService()
