import ChartCard from "../components/cards/ChartCard";
import KpiCard from "../components/dashboard/KpiCard";
import InsightCard from "../components/dashboard/InsightCard";
import SectionHeading from "../components/dashboard/SectionHeading";
import CategoryBarChart from "../components/charts/CategoryBarChart";
import DonutChart from "../components/charts/DonutChart";
import { series } from "../components/charts/chartTheme";
import FilterBar from "../components/filters/FilterBar";
import StateWrapper from "../components/common/StateWrapper";
import { KpiSkeleton, InsightSkeleton, ChartSkeleton } from "../components/common/Skeleton";
import { useBreakdown } from "../hooks/useBreakdown";
import { useInsights } from "../hooks/useInsights";
import {
  getAttritionByAge,
  getAttritionByDepartment,
  getAttritionByJobSatisfaction,
  getAttritionByOvertime,
  getAttritionByRole,
  getAttritionByTenure,
  getSummary,
} from "../services/api";
import { fmtInt, fmtMoney, fmtPct } from "../utils/format";

export default function Overview() {
  const summary = useBreakdown(getSummary);
  const byDept = useBreakdown(getAttritionByDepartment);
  const byOvertime = useBreakdown(getAttritionByOvertime);
  const byRole = useBreakdown(getAttritionByRole);
  const byAge = useBreakdown(getAttritionByAge);
  const byTenure = useBreakdown(getAttritionByTenure);
  const bySat = useBreakdown(getAttritionByJobSatisfaction);
  const { insights, loading: insightsLoading, error: insightsError } = useInsights();

  const s = summary.data;
  const otDonut = (byOvertime.data || []).map((r) => ({
    name: r.category === "Yes" ? "Works overtime" : "No overtime",
    value: r.total,
  }));

  return (
    <div>
      <div className="page-head">
        <h1>Employee Attrition Intelligence</h1>
        <p>
          Understand where attrition is happening and identify the workforce segments
          requiring attention.
        </p>
      </div>

      <FilterBar filteredTotal={s?.total_employees} />

      {/* KPI ROW */}
      {summary.loading ? (
        <div className="grid kpi-row">
          {Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : summary.error ? (
        <div className="banner banner--error">{summary.error}</div>
      ) : (
        <div className="grid kpi-row">
          <KpiCard label="Total Employees" value={fmtInt(s.total_employees)} sub="in current selection" accent="blue" />
          <KpiCard
            label="Employees Left"
            value={fmtInt(s.attrition_count)}
            sub={`${fmtInt(s.attrition_count)} employees`}
            meter={s.attrition_rate}
            risk
            accent="coral"
          />
          <KpiCard
            label="Attrition Rate"
            value={fmtPct(s.attrition_rate)}
            sub={`${fmtPct(s.attrition_rate)} of workforce`}
            meter={s.attrition_rate}
            risk
            accent="pink"
          />
          <KpiCard label="Avg Monthly Income" value={fmtMoney(s.average_monthly_income)} sub="per employee" accent="yellow" />
          <KpiCard
            label="OverTime"
            value={fmtPct(s.overtime_percentage)}
            sub="work overtime"
            meter={s.overtime_percentage}
            accent="cyan"
          />
        </div>
      )}

      {/* KEY INSIGHTS */}
      <div className="section">
        <SectionHeading
          title="Key Insights"
          note={<>Observed associations from the current selection — <b>not causal claims</b>.</>}
        />
        {insightsError ? (
          <div className="banner banner--error">{insightsError}</div>
        ) : (
          <div className="grid insight-row">
            {insightsLoading
              ? Array.from({ length: 4 }).map((_, i) => <InsightSkeleton key={i} />)
              : insights.map((ins, i) => (
                  <InsightCard
                    key={i}
                    category={ins.category}
                    segment={ins.segment}
                    rate={ins.rate}
                    tone={ins.tone}
                  >
                    {ins.body}
                  </InsightCard>
                ))}
            {!insightsLoading && insights.length === 0 && (
              <div className="insight" style={{ gridColumn: "1 / -1" }}>
                <div className="insight__body">No segment stands out for the current selection.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONCENTRATION */}
      <div className="section">
        <SectionHeading index="1" title="Where attrition is concentrated" />
        <div className="grid split-2-1">
          <ChartCard title="Attrition by Department" hint="count vs rate">
            <StateWrapper
              loading={byDept.loading}
              error={byDept.error}
              isEmpty={(byDept.data || []).length === 0}
              onRetry={byDept.refetch}
              skeleton={<ChartSkeleton height={300} />}
            >
              <CategoryBarChart data={byDept.data || []} height={320} />
            </StateWrapper>
          </ChartCard>

          <ChartCard title="Attrition by OverTime" hint="workforce split">
            <StateWrapper
              loading={byOvertime.loading}
              error={byOvertime.error}
              isEmpty={(byOvertime.data || []).length === 0}
              onRetry={byOvertime.refetch}
              skeleton={<ChartSkeleton height={300} />}
            >
              <DonutChart data={otDonut} colors={[series.attrition, series.neutralSlice]} height={260} />
            </StateWrapper>
          </ChartCard>
        </div>
      </div>

      {/* ROLES */}
      <div className="section">
        <SectionHeading index="2" title="Attrition by job role" />
        <ChartCard title="Attrition rate by Job Role" hint="rate · count in tooltip">
          <StateWrapper
            loading={byRole.loading}
            error={byRole.error}
            isEmpty={(byRole.data || []).length === 0}
            onRetry={byRole.refetch}
            skeleton={<ChartSkeleton height={340} />}
          >
            <CategoryBarChart data={byRole.data || []} orientation="horizontal" height={360} />
          </StateWrapper>
        </ChartCard>
      </div>

      {/* PROFILE */}
      <div className="section">
        <SectionHeading index="3" title="Attrition across the employee lifecycle" />
        <div className="grid col-3">
          <ChartCard title="By Age Group" hint="count vs rate">
            <StateWrapper loading={byAge.loading} error={byAge.error} isEmpty={(byAge.data || []).length === 0} onRetry={byAge.refetch} skeleton={<ChartSkeleton height={240} />}>
              <CategoryBarChart data={byAge.data || []} height={250} />
            </StateWrapper>
          </ChartCard>
          <ChartCard title="By Tenure" hint="years at company">
            <StateWrapper loading={byTenure.loading} error={byTenure.error} isEmpty={(byTenure.data || []).length === 0} onRetry={byTenure.refetch} skeleton={<ChartSkeleton height={240} />}>
              <CategoryBarChart data={byTenure.data || []} height={250} />
            </StateWrapper>
          </ChartCard>
          <ChartCard title="By Job Satisfaction" hint="1 low – 4 high">
            <StateWrapper loading={bySat.loading} error={bySat.error} isEmpty={(bySat.data || []).length === 0} onRetry={bySat.refetch} skeleton={<ChartSkeleton height={240} />}>
              <CategoryBarChart data={bySat.data || []} height={250} order="label" />
            </StateWrapper>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
