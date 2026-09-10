import { labelForFactor } from "../../utils/factorLabels";

/*
 * Renders POST /predict `top_factors` as a numbered list. Values (feature,
 * direction, weight) are shown as returned; only the feature *name* is
 * humanised. These are model-derived contributions (coefficient x standardized
 * input) - they indicate which inputs moved this single estimate up or down,
 * and are not a claim of causality.
 *
 * `scaleMax` is passed by the parent so bar lengths compare across the
 * increases / decreases groups; `values` is the submitted payload, used to show
 * the entered value on numeric factors.
 */
export default function FactorList({ factors = [], scaleMax, values, startIndex = 1 }) {
  if (!factors.length) {
    return <p className="muted small">None among the top contributors.</p>;
  }
  const max = scaleMax || Math.max(...factors.map((f) => f.weight), 0.0001);

  return (
    <div>
      {factors.map((f, i) => {
        const up = f.direction === "increases";
        const w = Math.max(10, (f.weight / max) * 100);
        return (
          <div className="factor" key={i}>
            <span className="factor__rank num">{startIndex + i}</span>
            <span className={"factor__dir " + (up ? "factor__dir--up" : "factor__dir--down")}>
              {up ? "▲" : "▼"}
            </span>
            <span className="factor__name">{labelForFactor(f.feature, values)}</span>
            <span className="factor__bar-track" title={`relative contribution ${f.weight}`}>
              <span
                className="factor__bar"
                style={{ width: `${w}%`, background: up ? "var(--risk-high)" : "var(--risk-low)" }}
              />
            </span>
          </div>
        );
      })}
    </div>
  );
}
