"""Basic API smoke tests.

Run from the repository root with:  pytest backend/tests -q
These exercise the real trained pipeline and the real cleaned dataset - no mocks.
"""

from __future__ import annotations

import copy

import pytest
from fastapi.testclient import TestClient

from backend.main import app

VALID_EMPLOYEE = {
    "Age": 35,
    "BusinessTravel": "Travel_Rarely",
    "DailyRate": 800,
    "Department": "Research & Development",
    "DistanceFromHome": 5,
    "Education": 3,
    "EducationField": "Life Sciences",
    "EnvironmentSatisfaction": 3,
    "Gender": "Male",
    "HourlyRate": 60,
    "JobInvolvement": 3,
    "JobLevel": 2,
    "JobRole": "Research Scientist",
    "JobSatisfaction": 3,
    "MaritalStatus": "Single",
    "MonthlyIncome": 5000,
    "MonthlyRate": 15000,
    "NumCompaniesWorked": 2,
    "OverTime": "Yes",
    "PercentSalaryHike": 14,
    "PerformanceRating": 3,
    "RelationshipSatisfaction": 3,
    "StockOptionLevel": 0,
    "TotalWorkingYears": 7,
    "TrainingTimesLastYear": 3,
    "WorkLifeBalance": 3,
    "YearsAtCompany": 5,
    "YearsInCurrentRole": 3,
    "YearsSinceLastPromotion": 1,
    "YearsWithCurrManager": 3,
}


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:  # triggers lifespan -> loads model + data
        yield c


def test_health_reports_model_and_data_loaded(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["model_loaded"] is True
    assert body["data_loaded"] is True
    assert body["status"] == "ok"


def test_predict_valid_employee(client):
    r = client.post("/predict", json=VALID_EMPLOYEE)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["prediction"] in {"Yes", "No"}
    assert 0.0 <= body["probability"] <= 1.0
    assert body["risk_level"] in {"Low", "Medium", "High"}
    # risk_level must be consistent with the returned thresholds
    med, high = body["thresholds"]["medium"], body["thresholds"]["high"]
    p = body["probability"]
    expected = "High" if p >= high else "Medium" if p >= med else "Low"
    assert body["risk_level"] == expected


def test_predict_probability_matches_pipeline(client):
    """The API probability must equal the pipeline's P(Attrition=Yes) for the
    same input - i.e. positive-class extraction is correct."""
    import pandas as pd

    from backend.services.model_service import model_service

    frame = pd.DataFrame([VALID_EMPLOYEE])[model_service._feature_order]
    pos_idx = list(model_service._pipeline.classes_).index(1)
    direct = float(model_service._pipeline.predict_proba(frame)[0][pos_idx])

    api_p = client.post("/predict", json=VALID_EMPLOYEE).json()["probability"]
    assert round(direct, 4) == pytest.approx(api_p, abs=1e-4)


def test_predict_invalid_category_returns_422(client):
    bad = copy.deepcopy(VALID_EMPLOYEE)
    bad["Department"] = "Marketing"  # not a real Department value
    r = client.post("/predict", json=bad)
    assert r.status_code == 422


def test_predict_missing_field_returns_422(client):
    bad = copy.deepcopy(VALID_EMPLOYEE)
    del bad["Age"]
    r = client.post("/predict", json=bad)
    assert r.status_code == 422


def test_predict_out_of_range_returns_422(client):
    bad = copy.deepcopy(VALID_EMPLOYEE)
    bad["Age"] = 5
    r = client.post("/predict", json=bad)
    assert r.status_code == 422


def test_dashboard_summary_matches_dataset(client):
    r = client.get("/dashboard/summary")
    assert r.status_code == 200
    body = r.json()
    # Full IBM HR dataset: 1470 employees, 237 leavers, 16.1% attrition.
    assert body["total_employees"] == 1470
    assert body["attrition_count"] == 237
    assert body["attrition_rate"] == pytest.approx(16.1, abs=0.1)


def test_attrition_by_department_shape(client):
    r = client.get("/dashboard/attrition-by-department")
    assert r.status_code == 200
    rows = r.json()
    assert {row["category"] for row in rows} == {
        "Sales",
        "Research & Development",
        "Human Resources",
    }
    for row in rows:
        assert row["total"] >= row["attrition_count"] >= 0
        assert 0 <= row["attrition_rate"] <= 100


def test_dashboard_filters_endpoint(client):
    r = client.get("/dashboard/filters")
    assert r.status_code == 200
    body = r.json()
    assert "Sales" in body["department"]
    assert body["overtime"] == ["No", "Yes"]


def test_dashboard_filter_applied(client):
    unfiltered = client.get("/dashboard/summary").json()["total_employees"]
    filtered = client.get(
        "/dashboard/summary", params={"department": "Sales"}
    ).json()["total_employees"]
    assert 0 < filtered < unfiltered


def test_employees_endpoint_pagination_and_filter(client):
    r = client.get("/dashboard/employees", params={"limit": 10, "offset": 0})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1470
    assert len(body["rows"]) == 10
    assert "EmployeeNumber" not in body["rows"][0]
    assert set(body["rows"][0].keys()) == {
        "Age", "Department", "JobRole", "JobLevel", "MonthlyIncome",
        "OverTime", "JobSatisfaction", "YearsAtCompany", "BusinessTravel", "Attrition",
    }

    filtered = client.get(
        "/dashboard/employees", params={"department": "Sales", "limit": 5}
    ).json()
    assert filtered["total"] == 446
    assert all(row["Department"] == "Sales" for row in filtered["rows"])


def test_cors_preflight_allows_frontend_origin(client):
    r = client.options(
        "/dashboard/summary",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.status_code == 200
    assert r.headers.get("access-control-allow-origin") == "http://localhost:5173"
