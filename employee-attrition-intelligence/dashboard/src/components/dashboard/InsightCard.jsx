/*
 * A single derived-insight tile. Text/numbers come from `useInsights`, computed
 * from the analytics API. The accent colour is chosen by insight category so
 * each cue is visually distinct (coral = work conditions, cyan = travel,
 * green = relationship, purple = org structure). Phrased as association, never
 * causation.
 */
const BY_CATEGORY = {
  "Work Conditions": "var(--accent-coral)",
  "Business Travel": "var(--accent-cyan)",
  "Marital Status": "var(--accent-turquoise)",
  Department: "var(--accent-purple)",
  "Job Role": "var(--accent-lilac)",
};
const BY_TONE = {
  high: "var(--risk-high)",
  med: "var(--risk-med)",
  low: "var(--risk-low)",
  neutral: "var(--accent-blue)",
};

export default function InsightCard({ category, segment, rate, tone = "high", children }) {
  const color = BY_CATEGORY[category] || BY_TONE[tone] || BY_TONE.neutral;
  return (
    <div className="insight" style={{ "--tone": color }}>
      <div className="insight__cat">{category}</div>
      <div className="insight__headline">
        <span className="insight__seg">{segment}</span>
        {rate != null && <span className="insight__rate num">{rate}%</span>}
      </div>
      <div className="insight__body">{children}</div>
    </div>
  );
}
