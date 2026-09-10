/*
 * Single source of truth for backend communication. Components import these
 * functions - never call fetch/axios directly elsewhere.
 */
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 12000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Turn a filter object { department: ["Sales"], overtime: ["Yes"] } into
 * repeatable query params: ?department=Sales&overtime=Yes
 */
function toParams(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, values]) => {
    if (!values) return;
    const list = Array.isArray(values) ? values : [values];
    list.forEach((v) => {
      if (v !== undefined && v !== null && v !== "") params.append(key, v);
    });
  });
  return params;
}

/** Normalise axios errors into a plain message the UI can render. */
function normaliseError(err) {
  if (err.response) {
    const detail = err.response.data?.detail || err.response.data?.message;
    return new Error(
      typeof detail === "string"
        ? detail
        : `Request failed (${err.response.status})`
    );
  }
  return new Error("Unable to connect to the analytics API.");
}

async function get(path, filters, extraParams) {
  try {
    const params = toParams(filters);
    if (extraParams) {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") params.append(k, v);
      });
    }
    const res = await client.get(path, { params });
    return res.data;
  } catch (err) {
    throw normaliseError(err);
  }
}

// --- Meta -------------------------------------------------------------------
export const getHealth = () => get("/health");

// --- Dashboard analytics --------------------------------------------------
export const getSummary = (filters) => get("/dashboard/summary", filters);
export const getFilters = () => get("/dashboard/filters");
export const getAttritionByDepartment = (filters) =>
  get("/dashboard/attrition-by-department", filters);
export const getAttritionByRole = (filters) =>
  get("/dashboard/attrition-by-role", filters);
export const getAttritionByOvertime = (filters) =>
  get("/dashboard/attrition-by-overtime", filters);
export const getAttritionByBusinessTravel = (filters) =>
  get("/dashboard/attrition-by-business-travel", filters);
export const getAttritionByMaritalStatus = (filters) =>
  get("/dashboard/attrition-by-marital-status", filters);
export const getAttritionByJobLevel = (filters) =>
  get("/dashboard/attrition-by-job-level", filters);
export const getAttritionByAge = (filters) =>
  get("/dashboard/attrition-by-age", filters);
export const getAttritionByIncome = (filters) =>
  get("/dashboard/attrition-by-income", filters);
export const getAttritionByTenure = (filters) =>
  get("/dashboard/attrition-by-tenure", filters);
export const getAttritionByJobSatisfaction = (filters) =>
  get("/dashboard/attrition-by-job-satisfaction", filters);
export const getEmployees = (filters, { limit = 25, offset = 0, sortBy, sortDir } = {}) =>
  get("/dashboard/employees", filters, {
    limit,
    offset,
    sort_by: sortBy,
    sort_dir: sortDir,
  });

// --- Prediction -----------------------------------------------------------
export async function predictAttrition(payload) {
  try {
    const res = await client.post("/predict", payload);
    return res.data;
  } catch (err) {
    throw normaliseError(err);
  }
}

export { BASE_URL };
