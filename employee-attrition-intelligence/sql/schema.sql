-- Employee Attrition Intelligence — relational schema (SQLite / portable ANSI)
-- Mirrors the cleaned dataset produced by notebooks/01_cleaning.ipynb
-- (data/processed/cleaned_employee_attrition.csv). Constant columns
-- (EmployeeCount, Over18, StandardHours) are already dropped upstream.

DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
    EmployeeNumber            INTEGER PRIMARY KEY,   -- identifier only, never a model feature
    Attrition                 TEXT    NOT NULL CHECK (Attrition IN ('Yes', 'No')),
    Attrition_Flag            INTEGER NOT NULL CHECK (Attrition_Flag IN (0, 1)),

    -- Demographics
    Age                       INTEGER NOT NULL,
    Gender                    TEXT    NOT NULL,
    MaritalStatus             TEXT    NOT NULL,
    DistanceFromHome          INTEGER NOT NULL,
    Education                 INTEGER NOT NULL,      -- 1..5
    EducationField            TEXT    NOT NULL,

    -- Role
    Department                TEXT    NOT NULL,
    JobRole                   TEXT    NOT NULL,
    JobLevel                  INTEGER NOT NULL,      -- 1..5
    BusinessTravel            TEXT    NOT NULL,

    -- Work conditions
    OverTime                  TEXT    NOT NULL CHECK (OverTime IN ('Yes', 'No')),
    JobInvolvement            INTEGER NOT NULL,      -- 1..4
    NumCompaniesWorked        INTEGER NOT NULL,
    TrainingTimesLastYear     INTEGER NOT NULL,

    -- Tenure / experience
    TotalWorkingYears         INTEGER NOT NULL,
    YearsAtCompany            INTEGER NOT NULL,
    YearsInCurrentRole        INTEGER NOT NULL,
    YearsSinceLastPromotion   INTEGER NOT NULL,
    YearsWithCurrManager      INTEGER NOT NULL,

    -- Compensation
    MonthlyIncome             INTEGER NOT NULL,
    DailyRate                 INTEGER NOT NULL,
    HourlyRate                INTEGER NOT NULL,
    MonthlyRate               INTEGER NOT NULL,
    PercentSalaryHike         INTEGER NOT NULL,
    StockOptionLevel          INTEGER NOT NULL,      -- 0..3

    -- Satisfaction / performance (1..4 unless noted)
    EnvironmentSatisfaction   INTEGER NOT NULL,
    JobSatisfaction           INTEGER NOT NULL,
    RelationshipSatisfaction  INTEGER NOT NULL,
    WorkLifeBalance           INTEGER NOT NULL,
    PerformanceRating         INTEGER NOT NULL
);

CREATE INDEX idx_employees_department  ON employees (Department);
CREATE INDEX idx_employees_jobrole     ON employees (JobRole);
CREATE INDEX idx_employees_overtime    ON employees (OverTime);
CREATE INDEX idx_employees_attrition   ON employees (Attrition_Flag);

-- Load the cleaned CSV (run inside the sqlite3 shell from the repo root):
--   sqlite3 attrition.db
--   .mode csv
--   .import --skip 1 data/processed/cleaned_employee_attrition.csv employees
