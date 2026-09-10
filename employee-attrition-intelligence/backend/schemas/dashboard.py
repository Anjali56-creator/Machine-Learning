"""Response models for the dashboard analytics endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field


class SummaryResponse(BaseModel):
    total_employees: int
    attrition_count: int
    attrition_rate: float = Field(..., description="Percentage, 1 dp (e.g. 16.1)")
    average_age: float
    average_monthly_income: float
    average_job_satisfaction: float
    overtime_percentage: float = Field(..., description="Percentage of employees with OverTime=Yes")


class CategoryBreakdown(BaseModel):
    category: str
    total: int
    attrition_count: int
    attrition_rate: float = Field(..., description="Percentage, 1 dp")


class FiltersResponse(BaseModel):
    department: list[str]
    job_role: list[str]
    gender: list[str]
    overtime: list[str]
    job_level: list[int]
    business_travel: list[str]


class EmployeeRow(BaseModel):
    Age: int
    Department: str
    JobRole: str
    JobLevel: int
    MonthlyIncome: int
    OverTime: str
    JobSatisfaction: int
    YearsAtCompany: int
    BusinessTravel: str
    Attrition: str


class EmployeesResponse(BaseModel):
    total: int = Field(..., description="Filtered row count before pagination")
    limit: int
    offset: int
    rows: list[EmployeeRow]


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    data_loaded: bool
    model_name: str | None = None
    detail: str | None = None
