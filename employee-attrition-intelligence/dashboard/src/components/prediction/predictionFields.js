/*
 * Declarative description of the POST /predict form. Edit this to change field
 * grouping, labels, bounds or defaults - PredictionForm renders from it. Bounds
 * mirror the backend Pydantic schema; categorical options mirror the trained
 * pipeline's known categories. All 30 model features are present (EmployeeNumber
 * is not a feature and is intentionally absent).
 */

const RATING_4 = {
  type: "select",
  options: [
    { value: 1, label: "1 – Low" },
    { value: 2, label: "2 – Medium" },
    { value: 3, label: "3 – High" },
    { value: 4, label: "4 – Very High" },
  ],
};

export const SECTIONS = [
  {
    title: "Personal",
    fields: [
      { name: "Age", label: "Age", type: "number", min: 18, max: 100, default: 35 },
      { name: "Gender", label: "Gender", type: "select", options: ["Female", "Male"], default: "Male" },
      {
        name: "MaritalStatus",
        label: "Marital Status",
        type: "select",
        options: ["Divorced", "Married", "Single"],
        default: "Single",
      },
      {
        name: "Education",
        label: "Education",
        type: "select",
        options: [
          { value: 1, label: "1 – Below College" },
          { value: 2, label: "2 – College" },
          { value: 3, label: "3 – Bachelor" },
          { value: 4, label: "4 – Master" },
          { value: 5, label: "5 – Doctor" },
        ],
        default: 3,
      },
      {
        name: "EducationField",
        label: "Education Field",
        type: "select",
        options: ["Human Resources", "Life Sciences", "Marketing", "Medical", "Other", "Technical Degree"],
        default: "Life Sciences",
      },
    ],
  },
  {
    title: "Role",
    fields: [
      {
        name: "Department",
        label: "Department",
        type: "select",
        options: ["Human Resources", "Research & Development", "Sales"],
        default: "Research & Development",
      },
      {
        name: "JobRole",
        label: "Job Role",
        type: "select",
        options: [
          "Healthcare Representative",
          "Human Resources",
          "Laboratory Technician",
          "Manager",
          "Manufacturing Director",
          "Research Director",
          "Research Scientist",
          "Sales Executive",
          "Sales Representative",
        ],
        default: "Research Scientist",
      },
      { name: "JobLevel", label: "Job Level", type: "number", min: 1, max: 5, default: 2 },
      {
        name: "BusinessTravel",
        label: "Business Travel",
        type: "select",
        options: ["Non-Travel", "Travel_Frequently", "Travel_Rarely"],
        default: "Travel_Rarely",
      },
    ],
  },
  {
    title: "Work",
    fields: [
      { name: "OverTime", label: "OverTime", type: "select", options: ["No", "Yes"], default: "No" },
      { name: "DistanceFromHome", label: "Distance From Home (km)", type: "number", min: 1, max: 100, default: 5 },
      { name: "YearsAtCompany", label: "Years At Company", type: "number", min: 0, max: 60, default: 5 },
      { name: "YearsInCurrentRole", label: "Years In Current Role", type: "number", min: 0, max: 60, default: 3 },
      { name: "YearsWithCurrManager", label: "Years With Current Manager", type: "number", min: 0, max: 60, default: 3 },
      { name: "YearsSinceLastPromotion", label: "Years Since Last Promotion", type: "number", min: 0, max: 60, default: 1 },
      { name: "TotalWorkingYears", label: "Total Working Years", type: "number", min: 0, max: 60, default: 7 },
      { name: "NumCompaniesWorked", label: "Companies Worked Before", type: "number", min: 0, max: 50, default: 2 },
      { name: "TrainingTimesLastYear", label: "Trainings Last Year", type: "number", min: 0, max: 20, default: 3 },
    ],
  },
  {
    title: "Compensation",
    fields: [
      { name: "MonthlyIncome", label: "Monthly Income", type: "number", min: 1, max: 100000, default: 5000 },
      { name: "DailyRate", label: "Daily Rate", type: "number", min: 1, max: 5000, default: 800 },
      { name: "HourlyRate", label: "Hourly Rate", type: "number", min: 1, max: 200, default: 65 },
      { name: "MonthlyRate", label: "Monthly Rate", type: "number", min: 1, max: 100000, default: 14000 },
      { name: "PercentSalaryHike", label: "Percent Salary Hike", type: "number", min: 0, max: 100, default: 14 },
      { name: "StockOptionLevel", label: "Stock Option Level", type: "number", min: 0, max: 3, default: 0 },
    ],
  },
  {
    title: "Satisfaction",
    fields: [
      { name: "EnvironmentSatisfaction", label: "Environment Satisfaction", ...RATING_4, default: 3 },
      { name: "JobSatisfaction", label: "Job Satisfaction", ...RATING_4, default: 3 },
      { name: "JobInvolvement", label: "Job Involvement", ...RATING_4, default: 3 },
      { name: "RelationshipSatisfaction", label: "Relationship Satisfaction", ...RATING_4, default: 3 },
      {
        name: "WorkLifeBalance",
        label: "Work-Life Balance",
        type: "select",
        options: [
          { value: 1, label: "1 – Bad" },
          { value: 2, label: "2 – Good" },
          { value: 3, label: "3 – Better" },
          { value: 4, label: "4 – Best" },
        ],
        default: 3,
      },
      {
        name: "PerformanceRating",
        label: "Performance Rating",
        type: "select",
        options: [
          { value: 1, label: "1 – Low" },
          { value: 2, label: "2 – Good" },
          { value: 3, label: "3 – Excellent" },
          { value: 4, label: "4 – Outstanding" },
        ],
        default: 3,
      },
    ],
  },
];

export const ALL_FIELDS = SECTIONS.flatMap((s) => s.fields);

export function defaultFormState() {
  const state = {};
  ALL_FIELDS.forEach((f) => {
    state[f.name] = f.default;
  });
  return state;
}

export function validate(state) {
  const errors = {};
  ALL_FIELDS.forEach((f) => {
    const raw = state[f.name];
    if (raw === "" || raw === null || raw === undefined) {
      errors[f.name] = "Required";
      return;
    }
    if (f.type === "number") {
      const n = Number(raw);
      if (Number.isNaN(n)) errors[f.name] = "Must be a number";
      else if (f.min !== undefined && n < f.min) errors[f.name] = `Min ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.name] = `Max ${f.max}`;
    }
  });
  return errors;
}

export function toPayload(state) {
  const payload = {};
  ALL_FIELDS.forEach((f) => {
    const raw = state[f.name];
    if (f.type === "number") payload[f.name] = Number(raw);
    else if (f.options && typeof f.options[0] === "object") payload[f.name] = Number(raw);
    else payload[f.name] = raw;
  });
  return payload;
}
