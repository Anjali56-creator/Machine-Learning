"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Query


def filter_params(
    department: list[str] | None = Query(default=None),
    job_role: list[str] | None = Query(default=None),
    gender: list[str] | None = Query(default=None),
    overtime: list[str] | None = Query(default=None),
    job_level: list[int] | None = Query(default=None),
    business_travel: list[str] | None = Query(default=None),
) -> dict:
    """Collects the optional analytics filters shared by every dashboard endpoint.

    Each may be repeated in the query string (e.g. `?department=Sales&department=Human+Resources`).
    Absent filters are dropped so the analytics service receives a sparse dict.
    """
    raw = {
        "department": department,
        "job_role": job_role,
        "gender": gender,
        "overtime": overtime,
        "job_level": job_level,
        "business_travel": business_travel,
    }
    return {k: v for k, v in raw.items() if v}
