import { fmtPct } from "../../utils/format";
import FactorList from "./FactorList";
import RiskMeter from "./RiskMeter";

/*
 * Renders the POST /predict response. prediction / probability / risk_level all
 * come straight from FastAPI - nothing is recomputed in the browser.
 */
export default function PredictionResult({ result, submitted }) {
  const { prediction, probability, risk_level, thresholds, top_factors } = result;
  const yes = prediction === "Yes";

  const factors = top_factors || [];
  const increasing = factors.filter((f) => f.direction === "increases");
  const decreasing = factors.filter((f) => f.direction === "decreases");
  const scaleMax = Math.max(...factors.map((f) => f.weight), 0.0001);

  const riskColor =
    risk_level === "High"
      ? "var(--risk-high)"
      : risk_level === "Medium"
      ? "var(--risk-med)"
      : "var(--risk-low)";

  return (
    <>
      <div className="card" style={{ borderColor: `color-mix(in srgb, ${riskColor} 26%, var(--border))` }}>
        <div className="card__head">
          <span className="card__title">Attrition Risk</span>
          <span className="card__hint">POST /predict</span>
        </div>
        <div
          className="card__body risk-panel"
          style={{ background: `linear-gradient(180deg, color-mix(in srgb, ${riskColor} 8%, transparent), transparent 55%)` }}
        >
          <div className="risk-panel__eyebrow">Model-estimated risk</div>
          <div className={"risk-panel__level risk-panel__level--" + risk_level}>{risk_level.toUpperCase()}</div>
          <div className="risk-panel__pct num" style={{ color: riskColor }}>{fmtPct(probability * 100)}</div>
          <div className="risk-panel__cap">model-estimated probability of attrition</div>

          <RiskMeter probability={probability} thresholds={thresholds} />

          <div className={"risk-panel__verdict " + (yes ? "risk-panel__verdict--yes" : "risk-panel__verdict--no")}>
            Prediction: <b>{yes ? "Likely to leave" : "Likely to stay"}</b>{" "}
            <span className="muted">({prediction})</span>
          </div>
          <p className="small muted" style={{ marginTop: 8, marginBottom: 0 }}>
            A relative risk score from the trained model, not a calibrated probability.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <span className="card__title">Model-derived factors</span>
          <span className="card__hint">not causal</span>
        </div>
        <div className="card__body">
          <div className="fgroup__label" style={{ color: "var(--risk-high)" }}>
            Increases estimated risk
          </div>
          <FactorList factors={increasing} scaleMax={scaleMax} values={submitted} startIndex={1} />
          <div className="fgroup__label" style={{ color: "var(--risk-low)" }}>
            Decreases estimated risk
          </div>
          <FactorList
            factors={decreasing}
            scaleMax={scaleMax}
            values={submitted}
            startIndex={increasing.length + 1}
          />
        </div>
      </div>
    </>
  );
}
