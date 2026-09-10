import { useLocation } from "react-router-dom";
import { useHealth } from "../../hooks/useHealth";

const TITLES = {
  "/": "Overview",
  "/attrition-analysis": "Attrition Analysis",
  "/employee-insights": "Employee Insights",
  "/predict": "Predict Attrition",
};

export default function Header({ onMenuClick }) {
  const { online } = useHealth();
  const { pathname } = useLocation();
  const page = TITLES[pathname] || "";

  const cls =
    online === null ? "api-status" : online ? "api-status api-status--ok" : "api-status api-status--off";
  const text = online === null ? "Checking API" : online ? "API Connected" : "API Offline";

  return (
    <header className="header">
      <div className="header__left">
        <button className="menu-toggle" onClick={onMenuClick} aria-label="Toggle navigation">
          <svg viewBox="0 0 16 16" width="15" height="15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <span className="header__crumb">
          <b>Attrition Intelligence</b>
          <span>/</span>
          {page}
        </span>
      </div>
      <div className={cls}>
        <span className="api-status__dot" />
        {text}
      </div>
    </header>
  );
}
