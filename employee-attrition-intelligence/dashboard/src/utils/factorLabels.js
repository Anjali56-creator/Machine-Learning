import { humanizeField } from "./format";

/*
 * Converts a raw pipeline feature name from POST /predict `top_factors` into a
 * human-readable label. The API values themselves are never modified - this is
 * purely presentational.
 *
 *   "cat__JobRole_Sales Representative"        -> "Job Role: Sales Representative"
 *   "cat__BusinessTravel_Travel_Frequently"   -> "Business Travel: Travel Frequently"
 *   "cat__OverTime_Yes"                        -> "OverTime: Yes"
 *   "num__EnvironmentSatisfaction"            -> "Environment Satisfaction"
 *
 * When `values` (the submitted form payload) is passed, numeric factors are
 * annotated with the value that was entered, so the row is self-explanatory:
 *   "num__TotalWorkingYears"  ->  "Total Working Years: 22"
 */
export function labelForFactor(feature, values) {
  if (!feature) return "";
  const name = feature;

  if (name.startsWith("num__")) {
    const field = name.slice(5);
    const label = humanizeField(field);
    const v = values && values[field];
    return v === undefined || v === null || v === "" ? label : `${label}: ${v}`;
  }

  if (name.startsWith("cat__")) {
    const rest = name.slice(5);
    const idx = rest.indexOf("_");
    if (idx === -1) return humanizeField(rest);
    const field = rest.slice(0, idx);
    const value = rest.slice(idx + 1).replace(/_/g, " ");
    return `${humanizeField(field)}: ${value}`;
  }

  return humanizeField(name);
}
