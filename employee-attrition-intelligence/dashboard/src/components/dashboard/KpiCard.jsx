/*
 * KPI tile. `accent` selects one theme colour used for the edge bar, meter fill,
 * card tint and (when `risk`) the value text. `meter` (0-100) draws a thin
 * proportion bar so the number has context - no fabricated trend arrows (there
 * is no time series in the dataset).
 */
const ACCENT = {
  purple: "var(--accent-purple)",
  lilac: "var(--accent-lilac)",
  indigo: "var(--accent-indigo)",
  blue: "var(--accent-blue)",
  cyan: "var(--accent-cyan)",
  turquoise: "var(--accent-turquoise)",
  green: "var(--accent-green)",
  yellow: "var(--accent-yellow)",
  orange: "var(--accent-orange)",
  pink: "var(--accent-pink)",
  coral: "var(--accent-coral)",
};

export default function KpiCard({ label, value, sub, meter, risk, accent = "purple" }) {
  return (
    <div className="kpi" style={{ "--k": ACCENT[accent] || ACCENT.purple }}>
      <span className="kpi__accent" />
      <div className="kpi__label">{label}</div>
      <div className={"kpi__value num" + (risk ? " kpi__value--risk" : "")}>{value}</div>
      {sub && <div className="kpi__sub">{sub}</div>}
      {typeof meter === "number" && (
        <div className="kpi__meter">
          <i style={{ width: `${Math.max(2, Math.min(100, meter))}%` }} />
        </div>
      )}
    </div>
  );
}
