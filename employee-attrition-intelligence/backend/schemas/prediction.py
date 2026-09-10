"""Pydantic request/response models for the /predict endpoint.

Categorical fields use enums whose members are exactly the categories the
pipeline was trained on, so an invalid category is rejected with a 422 and a
clear message before it ever reaches the model. `EmployeeNumber` is deliberately
absent - it is an identifier, not a predictive feature.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class BusinessTravel(str, Enum):
    non_travel = "Non-Travel"
    travel_frequently = "Travel_Frequently"
    travel_rarely = "Travel_Rarely"


class Department(str, Enum):
    human_resources = "Human Resources"
    research_development = "Research & Development"
    sales = "Sales"


class EducationField(str, Enum):
    human_resources = "Human Resources"
    life_sciences = "Life Sciences"
    marketing = "Marketing"
    medical = "Medical"
    other = "Other"
    technical_degree = "Technical Degree"


class Gender(str, Enum):
    female = "Female"
    male = "Male"


class JobRole(str, Enum):
    healthcare_representative = "Healthcare Representative"
    human_resources = "Human Resources"
    laboratory_technician = "Laboratory Technician"
    manager = "Manager"
    manufacturing_director = "Manufacturing Director"
    research_director = "Research Director"
    research_scientist = "Research Scientist"
    sales_executive = "Sales Executive"
    sales_representative = "Sales Representative"


class MaritalStatus(str, Enum):
    divorced = "Divorced"
    married = "Married"
    single = "Single"


class OverTime(str, Enum):
    no = "No"
    yes = "Yes"


class EmployeeFeatures(BaseModel):
    """One employee's features, matching the columns the pipeline expects
    (minus the EmployeeNumber identifier and the Attrition target)."""

    Age: int = Field(..., ge=18, le=100)
    BusinessTravel: BusinessTravel
    DailyRate: int = Field(..., ge=1, le=5000)
    Department: Department
    DistanceFromHome: int = Field(..., ge=1, le=100)
    Education: int = Field(..., ge=1, le=5, description="1=Below College ... 5=Doctor")
    EducationField: EducationField
    EnvironmentSatisfaction: int = Field(..., ge=1, le=4)
    Gender: Gender
    HourlyRate: int = Field(..., ge=1, le=200)
    JobInvolvement: int = Field(..., ge=1, le=4)
    JobLevel: int = Field(..., ge=1, le=5)
    JobRole: JobRole
    JobSatisfaction: int = Field(..., ge=1, le=4)
    MaritalStatus: MaritalStatus
    MonthlyIncome: int = Field(..., ge=1, le=100000)
    MonthlyRate: int = Field(..., ge=1, le=100000)
    NumCompaniesWorked: int = Field(..., ge=0, le=50)
    OverTime: OverTime
    PercentSalaryHike: int = Field(..., ge=0, le=100)
    PerformanceRating: int = Field(..., ge=1, le=4)
    RelationshipSatisfaction: int = Field(..., ge=1, le=4)
    StockOptionLevel: int = Field(..., ge=0, le=3)
    TotalWorkingYears: int = Field(..., ge=0, le=60)
    TrainingTimesLastYear: int = Field(..., ge=0, le=20)
    WorkLifeBalance: int = Field(..., ge=1, le=4)
    YearsAtCompany: int = Field(..., ge=0, le=60)
    YearsInCurrentRole: int = Field(..., ge=0, le=60)
    YearsSinceLastPromotion: int = Field(..., ge=0, le=60)
    YearsWithCurrManager: int = Field(..., ge=0, le=60)

    model_config = ConfigDict(
        use_enum_values=True,
        extra="forbid",
        json_schema_extra={
            "example": {
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
        },
    )


class ContributingFactor(BaseModel):
    feature: str
    direction: str = Field(..., description='"increases" or "decreases" estimated attrition risk')
    weight: float = Field(..., description="Relative contribution magnitude (unitless)")


class PredictionResponse(BaseModel):
    prediction: str = Field(..., description='"Yes" or "No"')
    probability: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model-estimated probability / risk score for Attrition=Yes (not a calibrated statistical guarantee)",
    )
    risk_level: str = Field(..., description='"Low", "Medium" or "High" per configured thresholds')
    thresholds: dict[str, float] = Field(
        ..., description="The medium/high probability cut-offs used to derive risk_level"
    )
    top_factors: list[ContributingFactor] = Field(
        default_factory=list,
        description="Features pushing this prediction toward or away from attrition (model-derived, if supported)",
    )
