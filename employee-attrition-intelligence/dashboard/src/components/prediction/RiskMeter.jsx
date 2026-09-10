/*
 * Horizontal risk meter. Zone widths come from the API-returned thresholds; the
 * marker sits at the model-estimated probability. Nothing is recomputed here.
 */
export default function RiskMeter({ probability, thresholds }) {
  const pct = Math.max(0, Math.min(100, probability * 100));
  const med = (thresholds?.medium ?? 0.35) * 100;
  const high = (thresholds?.high ?? 0.65) * 100;

  return (
    <div className="meter">
      <div className="meter__track">
        <div className="meter__zone meter__zone--low" style={{ width: `${med}%` }} />
        <div className="meter__zone meter__zone--med" style={{ width: `${high - med}%` }} />
        <div className="meter__zone meter__zone--high" style={{ width: `${100 - high}%` }} />
        <div className="meter__marker" style={{ left: `${pct}%` }} />
      </div>
      <div className="meter__zones">
        <span style={{ width: `${med}%`, color: "var(--risk-low)" }}>Low</span>
        <span style={{ width: `${high - med}%`, color: "var(--risk-med)" }}>Medium</span>
        <span style={{ width: `${100 - high}%`, color: "var(--risk-high)" }}>High</span>
      </div>
      <div className="meter__ends num">
        <span>0%</span>
        <span>
          thresholds {Math.round(med)}% / {Math.round(high)}%
        </span>
        <span>100%</span>
      </div>
    </div>
  );
}
