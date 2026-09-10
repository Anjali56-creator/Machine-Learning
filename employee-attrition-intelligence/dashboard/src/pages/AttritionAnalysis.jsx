import ChartCard from "../components/cards/ChartCard";
import SectionHeading from "../components/dashboard/SectionHeading";
import CategoryBarChart from "../components/charts/CategoryBarChart";
import DonutChart from "../components/charts/DonutChart";
import { series } from "../components/charts/chartTheme";
import FilterBar from "../components/filters/FilterBar";
import StateWrapper from "../components/common/StateWrapper";
import { ChartSkeleton } from "../components/common/Skeleton";
import { useBreakdown } from "../hooks/useBreakdown";
import {
  getAttritionByAge,
  getAttritionByBusinessTravel,
  getAttritionByDepartment,
  getAttritionByIncome,
  getAttritionByJobSatisfaction,
  getAttritionByMaritalStatus,
  getAttritionByOvertime,
  getAttritionByRole,
  getAttritionByTenure,
  getSummary,
} from "../services/api";

// derive a one-line "observed" note from a breakdown + overall rate
function note(rows, overall, { noun = "segment", suffix = "" } = {}) {
  if (!rows || !rows.length || overall == null) return null;
  const top = rows.reduce((a, b) => (b.attrition_rate > a.attrition_rate ? b : a));
  const lift = overall ? top.attrition_rate / overall : 0;
  const rel =
    lift >= 1.15
      ? `~${lift.toFixed(1)}× the ${overall}% workforce rate`
      : lift >= 1.03
      ? `slightly above the ${overall}% workforce rate`
      : `near the ${overall}% workforce rate`;
  return (
    <>
      <b>{String(top.category).replace(/_/g, " ")}</b> shows the highest observed attrition{" "}
      {noun ? `among ${noun}s ` : ""}at <b>{top.attrition_rate}%</b> — {rel}
      {suffix}.
    </>
  );
}

function Chart({ q, orientation, height = 280, order }) {
  return (
    <StateWrapper
      loading={q.loading}
      error={q.error}
      isEmpty={(q.data || []).length === 0}
      onRetry={q.refetch}
      skeleton={<ChartSkeleton height={height - 20} />}
    >
      <CategoryBarChart data={q.data || []} orientation={orientation} height={height} order={order} />
    </StateWrapper>
  );
}

export default function AttritionAnalysis() {
  const summary = useBreakdown(getSummary);
  const overall = summary.data?.attrition_rate;

  const dept = useBreakdown(getAttritionByDepartment);
  const role = useBreakdown(getAttritionByRole);
  const overtime = useBreakdown(getAttritionByOvertime);
  const travel = useBreakdown(getAttritionByBusinessTravel);
  const age = useBreakdown(getAttritionByAge);
  const marital = useBreakdown(getAttritionByMaritalStatus);
  const income = useBreakdown(getAttritionByIncome);
  const tenure = useBreakdown(getAttritionByTenure);
  const sat = useBreakdown(getAttritionByJobSatisfaction);

  return (
    <div>
      <div className="page-head">
        <h1>Attrition Analysis</h1>
        <p>Explore the workforce segments associated with employee turnover.</p>
      </div>

      <FilterBar filteredTotal={summary.data?.total_employees} />

      <div className="section">
        <SectionHeading index="1" title="Department" note={note(dept.data, overall, { noun: "department" })} />
        <ChartCard title="Attrition by Department" hint="count vs rate">
          <Chart q={dept} height={300} />
        </ChartCard>
      </div>

      <div className="section">
        <SectionHeading index="2" title="Job Role" note={note(role.data, overall, { noun: "role" })} />
        <ChartCard title="Attrition rate by Job Role" hint="rate · count in tooltip">
          <Chart q={role} orientation="horizontal" height={360} />
        </ChartCard>
      </div>

      <div className="section">
        <SectionHeading
          index="3"
          title="Work Conditions"
          note={(() => {
            const yes = (overtime.data || []).find((r) => r.category === "Yes");
            if (!yes || overall == null) return null;
            return (
              <>
                Employees working overtime show <b>{yes.attrition_rate}%</b> observed attrition
                versus <b>{overall}%</b> across the workforce ({yes.attrition_count} of {yes.total}).
              </>
            );
          })()}
        />
        <div className="grid split-2-1">
          <ChartCard title="Attrition by Business Travel" hint="count vs rate">
            <Chart q={travel} height={280} />
          </ChartCard>
          <ChartCard title="OverTime" hint="workforce split">
            <StateWrapper
              loading={overtime.loading}
              error={overtime.error}
              isEmpty={(overtime.data || []).length === 0}
              onRetry={overtime.refetch}
              skeleton={<ChartSkeleton height={240} />}
            >
              <DonutChart
                data={(overtime.data || []).map((r) => ({
                  name: r.category === "Yes" ? "Works overtime" : "No overtime",
                  value: r.total,
                }))}
                colors={[series.attrition, series.neutralSlice]}
                height={230}
              />
            </StateWrapper>
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <SectionHeading index="4" title="Demographics" note={note(marital.data, overall, { noun: "marital group" })} />
        <div className="grid col-2">
          <ChartCard title="Attrition by Age Group" hint="count vs rate">
            <Chart q={age} height={280} />
          </ChartCard>
          <ChartCard title="Attrition by Marital Status" hint="count vs rate">
            <Chart q={marital} height={280} />
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <SectionHeading index="5" title="Compensation & Tenure" note={note(tenure.data, overall, { noun: "tenure band" })} />
        <div className="grid col-2">
          <ChartCard title="Attrition by Income Range" hint="count vs rate">
            <Chart q={income} height={280} />
          </ChartCard>
          <ChartCard title="Attrition by Tenure" hint="years at company">
            <Chart q={tenure} height={280} />
          </ChartCard>
        </div>
      </div>

      <div className="section">
        <SectionHeading index="6" title="Satisfaction" note={note(sat.data, overall, { noun: "satisfaction level" })} />
        <ChartCard title="Attrition by Job Satisfaction" hint="1 (low) – 4 (very high) · count vs rate">
          <Chart q={sat} height={280} order="label" />
        </ChartCard>
      </div>
    </div>
  );
}
