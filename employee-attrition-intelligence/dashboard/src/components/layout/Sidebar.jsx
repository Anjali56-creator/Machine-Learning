import { NavLink } from "react-router-dom";
import { useApi } from "../../hooks/useApi";
import { getSummary } from "../../services/api";
import { fmtInt } from "../../utils/format";

const I = {
  overview: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.75" y="1.75" width="5.5" height="5.5" rx="1" />
      <rect x="8.75" y="1.75" width="5.5" height="5.5" rx="1" />
      <rect x="1.75" y="8.75" width="5.5" height="5.5" rx="1" />
      <rect x="8.75" y="8.75" width="5.5" height="5.5" rx="1" />
    </svg>
  ),
  analysis: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 14V2M2 14h12" />
      <path d="M5 11V8M8.5 11V5M12 11V9" />
    </svg>
  ),
  insights: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="3" />
      <path d="M10.5 10.5 14 14" />
      <path d="M6 4.5v3M4.5 6h3" />
    </svg>
  ),
  predict: (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5 14 5v6L8 14.5 2 11V5z" />
      <path d="M8 7.5 14 5M8 7.5v7M8 7.5 2 5" />
    </svg>
  ),
};

const NAV = [
  { to: "/", label: "Overview", icon: I.overview, end: true },
  { to: "/attrition-analysis", label: "Attrition Analysis", icon: I.analysis },
  { to: "/employee-insights", label: "Employee Insights", icon: I.insights },
  { to: "/predict", label: "Predict Attrition", icon: I.predict },
];

export default function Sidebar({ open, onNavigate }) {
  // Unfiltered dataset size, straight from the API - never hardcoded.
  const { data } = useApi(() => getSummary(), []);
  const totalLabel = data ? `${fmtInt(data.total_employees)} employee records` : "Loading records…";

  return (
    <aside className={"sidebar" + (open ? " sidebar--open" : "")}>
      <div className="brand">
        <span className="brand__mark">
          <svg viewBox="0 0 32 32" aria-hidden>
            <path
              d="M16 6 L26 26 H21.6 L19.8 22 H12.2 L10.4 26 H6 Z M13.6 18.4 H18.4 L16 12.6 Z"
              fill="#fff"
            />
          </svg>
        </span>
        <span className="brand__text">
          <span className="brand__name">ATTRITION INTELLIGENCE</span>
          <span className="brand__tag">Risk &amp; Workforce Analytics</span>
        </span>
      </div>

      <nav className="nav">
        <div className="nav__section">Workspace</div>
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => "nav-item" + (isActive ? " nav-item--active" : "")}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__context">
        <h4>Dataset</h4>
        <p>
          <strong>IBM HR Analytics</strong>
          <br />
          {totalLabel}
          <br />
          Target: <strong>Attrition</strong>
        </p>
      </div>
    </aside>
  );
}
