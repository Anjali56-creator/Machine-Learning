import { useApi } from "../../hooks/useApi";
import { getFilters, getSummary } from "../../services/api";
import { useFilters } from "../../context/FilterContext";
import { fmtInt } from "../../utils/format";
import MultiSelect from "./MultiSelect";

const FIELD_LABELS = {
  department: "Department",
  job_role: "Job Role",
  gender: "Gender",
  overtime: "OverTime",
  job_level: "Job Level",
  business_travel: "Business Travel",
};
const ORDER = ["department", "job_role", "gender", "overtime", "job_level", "business_travel"];

/*
 * Analytics control panel. Reads option lists from /dashboard/filters, writes
 * selections into FilterContext, and shows the active selection as removable
 * chips plus a "showing X of Y employees" readout.
 *
 * `filteredTotal` is the count for the current filter set (the page already has
 * it from its own summary call); the unfiltered baseline is fetched here once.
 */
export default function FilterBar({ filteredTotal }) {
  const { filters, setFilter, clearFilters, activeCount } = useFilters();
  const { data: options, loading, error } = useApi(getFilters, []);
  const { data: baseline } = useApi(() => getSummary(), []);
  const total = baseline?.total_employees;

  const chips = ORDER.flatMap((key) =>
    (filters[key] || []).map((v) => ({ key, value: v }))
  );

  return (
    <div className="filterbar-wrap">
      <div className="filter-bar">
        <span className="filter-bar__icon" title="Filters">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M1.5 3h13M4 8h8M6.5 13h3" />
          </svg>
        </span>
        {ORDER.map((key) => (
          <MultiSelect
            key={key}
            label={FIELD_LABELS[key]}
            options={options?.[key] || []}
            value={filters[key]}
            onChange={(vals) => setFilter(key, vals)}
            disabled={loading || !!error}
          />
        ))}
        <div className="filter-bar__spacer" />
        {error ? (
          <span className="filter-bar__meta" style={{ color: "var(--risk-high)" }}>
            Filter options unavailable
          </span>
        ) : (
          <span className="filter-bar__meta num">
            Showing{" "}
            <b>{filteredTotal != null ? fmtInt(filteredTotal) : total != null ? fmtInt(total) : "—"}</b>
            {total != null ? <> of {fmtInt(total)}</> : null} employees
          </span>
        )}
        {activeCount > 0 && (
          <button className="btn btn--ghost" onClick={clearFilters}>
            Clear all
          </button>
        )}
      </div>

      {chips.length > 0 && (
        <div className="active-chips">
          {chips.map(({ key, value }) => (
            <span className="chip" key={key + value}>
              <span className="muted">{FIELD_LABELS[key]}:</span> <b>{String(value)}</b>
              <span
                className="chip__x"
                role="button"
                aria-label={`Remove ${value}`}
                onClick={() =>
                  setFilter(
                    key,
                    (filters[key] || []).filter((v) => v !== value)
                  )
                }
              >
                <svg viewBox="0 0 10 10" width="9" height="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" />
                </svg>
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
