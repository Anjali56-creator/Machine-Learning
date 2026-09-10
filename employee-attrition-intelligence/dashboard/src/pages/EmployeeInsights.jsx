import { useEffect, useMemo, useState } from "react";
import ChartCard from "../components/cards/ChartCard";
import KpiCard from "../components/dashboard/KpiCard";
import DataTable from "../components/tables/DataTable";
import FilterBar from "../components/filters/FilterBar";
import StateWrapper from "../components/common/StateWrapper";
import { KpiSkeleton } from "../components/common/Skeleton";
import { useApi } from "../hooks/useApi";
import { useBreakdown } from "../hooks/useBreakdown";
import { useFilters } from "../context/FilterContext";
import { getEmployees, getSummary } from "../services/api";
import { fmtInt, fmtMoney, fmtDecimal, fmtPct } from "../utils/format";

const PAGE_SIZE = 25;

const COLUMNS = [
  { key: "Age", label: "Age", align: "right" },
  { key: "Department", label: "Department" },
  { key: "JobRole", label: "Job Role", strong: true },
  { key: "JobLevel", label: "Level", align: "right" },
  { key: "MonthlyIncome", label: "Monthly Income", align: "right", render: (r) => fmtMoney(r.MonthlyIncome) },
  { key: "OverTime", label: "OverTime", render: (r) => (
      <span style={{ color: r.OverTime === "Yes" ? "var(--risk-med)" : "var(--text-muted)" }}>{r.OverTime}</span>
    ) },
  { key: "JobSatisfaction", label: "Job Sat.", align: "right" },
  { key: "YearsAtCompany", label: "Years @ Co.", align: "right" },
  { key: "BusinessTravel", label: "Business Travel" },
  {
    key: "Attrition",
    label: "Attrition",
    render: (r) => (
      <span className={"badge " + (r.Attrition === "Yes" ? "badge--yes" : "badge--no")}>{r.Attrition}</span>
    ),
  },
];

export default function EmployeeInsights() {
  const { queryFilters } = useFilters();
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filterKey = useMemo(() => JSON.stringify(queryFilters), [queryFilters]);
  useEffect(() => setPage(0), [filterKey]);

  const summary = useBreakdown(getSummary);
  const table = useApi(
    () => getEmployees(queryFilters, { limit: PAGE_SIZE, offset: page * PAGE_SIZE, sortBy, sortDir }),
    [filterKey, page, sortBy, sortDir]
  );

  function handleSort(key) {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const data = table.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const s = summary.data;

  return (
    <div>
      <div className="page-head">
        <h1>Employee Insights</h1>
        <p>Explore employee-level patterns and identify profiles associated with attrition.</p>
      </div>

      <FilterBar filteredTotal={s?.total_employees} />

      {summary.loading ? (
        <div className="grid kpi-row">
          {Array.from({ length: 5 }).map((_, i) => <KpiSkeleton key={i} />)}
        </div>
      ) : summary.error ? (
        <div className="banner banner--error">{summary.error}</div>
      ) : (
        <div className="grid kpi-row">
          <KpiCard label="Employees" value={fmtInt(s.total_employees)} sub="match current filters" accent="blue" />
          <KpiCard label="Left" value={fmtInt(s.attrition_count)} sub={`${fmtInt(s.attrition_count)} employees`} meter={s.attrition_rate} risk accent="coral" />
          <KpiCard label="Attrition Rate" value={fmtPct(s.attrition_rate)} sub="of selection" meter={s.attrition_rate} risk accent="pink" />
          <KpiCard label="Avg Age" value={fmtDecimal(s.average_age, 1)} sub="years" accent="indigo" />
          <KpiCard label="Avg Job Satisfaction" value={fmtDecimal(s.average_job_satisfaction, 2)} sub="1 low – 4 high" accent="turquoise" />
        </div>
      )}

      <div className="section">
        <ChartCard
          title="Employee Records"
          right={
            <span className="card__hint num">
              {total > 0
                ? `${fmtInt(page * PAGE_SIZE + 1)}–${fmtInt(Math.min((page + 1) * PAGE_SIZE, total))} of ${fmtInt(total)}`
                : ""}
            </span>
          }
          bodyStyle={{ padding: 0 }}
        >
          <StateWrapper
            loading={table.loading}
            error={table.error}
            isEmpty={!table.loading && (data?.rows || []).length === 0}
            onRetry={table.refetch}
            emptyLabel="No employees match the current filters."
          >
            {data && (
              <>
                <DataTable
                  columns={COLUMNS}
                  rows={data.rows}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <div className="pager num">
                  <button className="btn btn--ghost" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                    ← Prev
                  </button>
                  <span>Page {page + 1} / {totalPages}</span>
                  <button
                    className="btn btn--ghost"
                    onClick={() => setPage((p) => (p + 1 < totalPages ? p + 1 : p))}
                    disabled={page + 1 >= totalPages}
                  >
                    Next →
                  </button>
                </div>
              </>
            )}
          </StateWrapper>
        </ChartCard>
      </div>
    </div>
  );
}
