import { useState } from "react";
import ChartCard from "../components/cards/ChartCard";
import PredictionForm from "../components/prediction/PredictionForm";
import PredictionResult from "../components/prediction/PredictionResult";
import { predictAttrition } from "../services/api";

export default function PredictAttrition() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(payload) {
    setSubmitting(true);
    setError(null);
    try {
      const data = await predictAttrition(payload);
      setResult(data);
      setSubmitted(payload);
    } catch (err) {
      setResult(null);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1>Predict Attrition</h1>
        <p>
          Enter an employee profile to estimate attrition risk with the trained pipeline
          (<code>POST /predict</code>). All scoring happens on the backend.
        </p>
      </div>

      <div className="predict-grid">
        <ChartCard title="Employee Profile" hint="30 model inputs">
          <PredictionForm onSubmit={handleSubmit} submitting={submitting} />
        </ChartCard>

        <div className="predict-aside">
          {error && <div className="banner banner--error">{error}</div>}

          {!result && !error && (
            <div className="card">
              <div className="card__head">
                <span className="card__title">Attrition Risk</span>
                <span className="card__hint">awaiting input</span>
              </div>
              <div className="card__body" style={{ padding: "26px 18px" }}>
                <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
                  <svg className="state__icon" style={{ margin: "0 auto 10px" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2 21 7v10l-9 5-9-5V7z" />
                    <path d="M12 12 21 7M12 12v10M12 12 3 7" />
                  </svg>
                  <p style={{ margin: "0 0 4px", color: "var(--text-secondary)", fontWeight: 600 }}>
                    Enter an employee profile to estimate attrition risk
                  </p>
                  <p className="small" style={{ margin: 0 }}>
                    The trained model returns a risk score and the inputs that moved it.
                  </p>
                </div>
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    ["Low", "var(--risk-low)", "score below the medium threshold"],
                    ["Medium", "var(--risk-med)", "between the two thresholds"],
                    ["High", "var(--risk-high)", "at or above the high threshold"],
                  ].map(([lvl, c, desc]) => (
                    <div key={lvl} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 11.5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: c, flexShrink: 0 }} />
                      <b style={{ color: c, width: 52 }}>{lvl}</b>
                      <span className="muted">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {result && <PredictionResult result={result} submitted={submitted} />}
        </div>
      </div>
    </div>
  );
}
