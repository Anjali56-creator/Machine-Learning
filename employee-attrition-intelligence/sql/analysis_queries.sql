-- Employee Attrition Intelligence — analytical queries
-- These mirror the aggregations the FastAPI /dashboard/* endpoints compute in
-- pandas, expressed in SQL for reference / ad-hoc analysis.

-- 1. Headline KPIs -----------------------------------------------------------
SELECT
    COUNT(*)                                             AS total_employees,
    SUM(Attrition_Flag)                                  AS employees_left,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)     AS attrition_rate_pct,
    ROUND(AVG(Age), 1)                                   AS avg_age,
    ROUND(AVG(MonthlyIncome), 2)                         AS avg_monthly_income,
    ROUND(AVG(JobSatisfaction), 2)                       AS avg_job_satisfaction,
    ROUND(100.0 * SUM(OverTime = 'Yes') / COUNT(*), 1)   AS overtime_pct
FROM employees;

-- 2. Attrition by department (count + rate) --------------------------------
SELECT
    Department                                          AS category,
    COUNT(*)                                            AS total,
    SUM(Attrition_Flag)                                 AS attrition_count,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)    AS attrition_rate
FROM employees
GROUP BY Department
ORDER BY attrition_rate DESC;

-- 3. Attrition by job role ------------------------------------------------
SELECT
    JobRole                                             AS category,
    COUNT(*)                                            AS total,
    SUM(Attrition_Flag)                                 AS attrition_count,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)    AS attrition_rate
FROM employees
GROUP BY JobRole
ORDER BY attrition_rate DESC;

-- 4. Attrition by overtime ----------------------------------------------
SELECT
    OverTime                                            AS category,
    COUNT(*)                                            AS total,
    SUM(Attrition_Flag)                                 AS attrition_count,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)    AS attrition_rate
FROM employees
GROUP BY OverTime
ORDER BY attrition_rate DESC;

-- 5. Attrition by age band --------------------------------------------
SELECT
    CASE
        WHEN Age <= 25 THEN '18-25'
        WHEN Age <= 35 THEN '26-35'
        WHEN Age <= 45 THEN '36-45'
        WHEN Age <= 55 THEN '46-55'
        ELSE '56-60'
    END                                                AS age_band,
    COUNT(*)                                            AS total,
    SUM(Attrition_Flag)                                 AS attrition_count,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)    AS attrition_rate
FROM employees
GROUP BY age_band
ORDER BY age_band;

-- 6. Attrition by income band ---------------------------------------
SELECT
    CASE
        WHEN MonthlyIncome < 3000  THEN '<3K'
        WHEN MonthlyIncome < 6000  THEN '3K-6K'
        WHEN MonthlyIncome < 10000 THEN '6K-10K'
        ELSE '10K+'
    END                                                AS income_band,
    COUNT(*)                                            AS total,
    SUM(Attrition_Flag)                                 AS attrition_count,
    ROUND(100.0 * SUM(Attrition_Flag) / COUNT(*), 1)    AS attrition_rate
FROM employees
GROUP BY income_band;

-- 7. Highest-risk segments vs the overall rate (the "Key Insights" logic) --
WITH overall AS (SELECT AVG(Attrition_Flag) AS r FROM employees)
SELECT 'OverTime=Yes'      AS segment, ROUND(100.0*AVG(Attrition_Flag),1) AS rate,
       ROUND(AVG(Attrition_Flag) / (SELECT r FROM overall), 2) AS lift_vs_overall
FROM employees WHERE OverTime = 'Yes'
UNION ALL
SELECT 'Single',           ROUND(100.0*AVG(Attrition_Flag),1),
       ROUND(AVG(Attrition_Flag) / (SELECT r FROM overall), 2)
FROM employees WHERE MaritalStatus = 'Single'
UNION ALL
SELECT 'Travel_Frequently', ROUND(100.0*AVG(Attrition_Flag),1),
       ROUND(AVG(Attrition_Flag) / (SELECT r FROM overall), 2)
FROM employees WHERE BusinessTravel = 'Travel_Frequently'
ORDER BY lift_vs_overall DESC;
