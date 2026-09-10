import { useMemo } from "react";
import { useApi } from "./useApi";
import { useFilters } from "../context/FilterContext";
import {
  getSummary,
  getAttritionByOvertime,
  getAttritionByBusinessTravel,
  getAttritionByMaritalStatus,
  getAttritionByDepartment,
  getAttritionByRole,
} from "../services/api";

const MIN_SAMPLE = 20; // ignore tiny segments so a 2-person group can't dominate

function topSegment(rows) {
  if (!rows || !rows.length) return null;
  const eligible = rows.filter((r) => r.total >= MIN_SAMPLE);
  const pool = eligible.length ? eligible : rows;
  return pool.reduce((a, b) => (b.attrition_rate > a.attrition_rate ? b : a));
}

function liftPhrase(rate, overall) {
  if (!overall) return "";
  const lift = rate / overall;
  if (lift >= 1.15) return `about ${lift.toFixed(1)}× the ${overall}% workforce rate`;
  if (lift >= 1.03) return `slightly above the ${overall}% workforce rate`;
  return `close to the ${overall}% workforce rate`;
}

function tone(rate, overall) {
  if (!overall) return "neutral";
  const lift = rate / overall;
  return lift >= 1.3 ? "high" : lift >= 1.05 ? "med" : "low";
}

/*
 * Derives 3-4 "Key Insight" cards from the analytics API for the currently
 * applied filters. Every value comes from the backend; statements are phrased
 * as observed association, not causation.
 */
export function useInsights() {
  const { queryFilters } = useFilters();
  const key = useMemo(() => JSON.stringify(queryFilters), [queryFilters]);

  const q = useApi(
    () =>
      Promise.all([
        getSummary(queryFilters),
        getAttritionByOvertime(queryFilters),
        getAttritionByBusinessTravel(queryFilters),
        getAttritionByMaritalStatus(queryFilters),
        getAttritionByDepartment(queryFilters),
        getAttritionByRole(queryFilters),
      ]),
    [key]
  );

  const insights = useMemo(() => {
    if (!q.data) return [];
    const [summary, overtime, travel, marital, dept, role] = q.data;
    const overall = summary.attrition_rate;
    const out = [];

    const ot = topSegment(overtime);
    if (ot && ot.category === "Yes") {
      out.push({
        category: "Work Conditions",
        segment: "OverTime = Yes",
        rate: ot.attrition_rate,
        tone: tone(ot.attrition_rate, overall),
        body: `Employees working overtime leave at ${ot.attrition_rate}% — ${liftPhrase(
          ot.attrition_rate,
          overall
        )} (${ot.attrition_count} of ${ot.total}).`,
      });
    }

    const tr = topSegment(travel);
    if (tr) {
      out.push({
        category: "Business Travel",
        segment: tr.category.replace(/_/g, " "),
        rate: tr.attrition_rate,
        tone: tone(tr.attrition_rate, overall),
        body: `${tr.category.replace(/_/g, " ")} shows the highest observed attrition among travel groups at ${tr.attrition_rate}% — ${liftPhrase(
          tr.attrition_rate,
          overall
        )}.`,
      });
    }

    const ms = topSegment(marital);
    if (ms) {
      out.push({
        category: "Marital Status",
        segment: `${ms.category} employees`,
        rate: ms.attrition_rate,
        tone: tone(ms.attrition_rate, overall),
        body: `${ms.category} employees have the highest observed attrition at ${ms.attrition_rate}% — ${liftPhrase(
          ms.attrition_rate,
          overall
        )} (${ms.attrition_count} of ${ms.total}).`,
      });
    }

    const dp = topSegment(dept);
    const rl = topSegment(role);
    // Prefer the more specific role signal if its lift is clearly stronger.
    if (rl && dp && rl.attrition_rate >= dp.attrition_rate * 1.1) {
      out.push({
        category: "Job Role",
        segment: rl.category,
        rate: rl.attrition_rate,
        tone: tone(rl.attrition_rate, overall),
        body: `${rl.category}s have elevated observed attrition at ${rl.attrition_rate}% — ${liftPhrase(
          rl.attrition_rate,
          overall
        )} (${rl.attrition_count} of ${rl.total}).`,
      });
    } else if (dp) {
      out.push({
        category: "Department",
        segment: dp.category,
        rate: dp.attrition_rate,
        tone: tone(dp.attrition_rate, overall),
        body: `${dp.category} has the highest observed attrition among departments at ${dp.attrition_rate}% — ${liftPhrase(
          dp.attrition_rate,
          overall
        )}.`,
      });
    }

    return out.slice(0, 4);
  }, [q.data]);

  return { insights, loading: q.loading, error: q.error, refetch: q.refetch };
}
