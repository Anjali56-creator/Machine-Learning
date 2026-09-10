"""Dashboard analytics endpoints.

All values are computed from the cleaned dataset by `analytics_service`. Every
endpoint accepts the shared optional filters (see `filter_params`).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status

from backend.api.dependencies import filter_params
from backend.schemas.dashboard import (
    CategoryBreakdown,
    EmployeesResponse,
    FiltersResponse,
    SummaryResponse,
)
from backend.services.analytics_service import (
    AGE_BINS,
    AGE_LABELS,
    INCOME_BINS,
    INCOME_LABELS,
    TENURE_BINS,
    TENURE_LABELS,
    analytics_service,
)
from backend.utils.errors import AnalyticsError

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _guard() -> None:
    if not analytics_service.ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Analytics dataset is not available",
        )


def _safe(fn, *args, **kwargs):
    _guard()
    try:
        return fn(*args, **kwargs)
    except AnalyticsError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)
        ) from exc
    except Exception as exc:  # noqa: BLE001
        logger.exception("Analytics computation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compute analytics",
        ) from exc


@router.get("/summary", response_model=SummaryResponse)
def summary(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.summary, filters)


@router.get("/attrition-by-department", response_model=list[CategoryBreakdown])
def attrition_by_department(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "Department", filters)


@router.get("/attrition-by-role", response_model=list[CategoryBreakdown])
def attrition_by_role(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "JobRole", filters)


@router.get("/attrition-by-overtime", response_model=list[CategoryBreakdown])
def attrition_by_overtime(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "OverTime", filters)


@router.get("/attrition-by-business-travel", response_model=list[CategoryBreakdown])
def attrition_by_business_travel(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "BusinessTravel", filters)


@router.get("/attrition-by-marital-status", response_model=list[CategoryBreakdown])
def attrition_by_marital_status(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "MaritalStatus", filters)


@router.get("/attrition-by-job-level", response_model=list[CategoryBreakdown])
def attrition_by_job_level(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "JobLevel", filters)


@router.get("/attrition-by-job-satisfaction", response_model=list[CategoryBreakdown])
def attrition_by_job_satisfaction(filters: dict = Depends(filter_params)):
    return _safe(analytics_service.attrition_by_column, "JobSatisfaction", filters)


@router.get("/attrition-by-age", response_model=list[CategoryBreakdown])
def attrition_by_age(filters: dict = Depends(filter_params)):
    return _safe(
        analytics_service.attrition_by_binned, "Age", AGE_BINS, AGE_LABELS, filters
    )


@router.get("/attrition-by-income", response_model=list[CategoryBreakdown])
def attrition_by_income(filters: dict = Depends(filter_params)):
    return _safe(
        analytics_service.attrition_by_binned,
        "MonthlyIncome",
        INCOME_BINS,
        INCOME_LABELS,
        filters,
    )


@router.get("/attrition-by-tenure", response_model=list[CategoryBreakdown])
def attrition_by_tenure(filters: dict = Depends(filter_params)):
    return _safe(
        analytics_service.attrition_by_binned,
        "YearsAtCompany",
        TENURE_BINS,
        TENURE_LABELS,
        filters,
    )


@router.get("/employees", response_model=EmployeesResponse)
def employees(
    filters: dict = Depends(filter_params),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort_by: str | None = Query(default=None),
    sort_dir: str = Query(default="asc", pattern="^(asc|desc)$"),
):
    return _safe(
        analytics_service.employees, filters, limit, offset, sort_by, sort_dir
    )


@router.get("/filters", response_model=FiltersResponse)
def filters():
    return _safe(analytics_service.filter_options)
