import { useState } from "react";
import { SECTIONS, defaultFormState, toPayload, validate } from "./predictionFields";

function Field({ field, value, error, onChange }) {
  const id = `f-${field.name}`;
  const isSelect = field.type === "select";
  const objectOptions = isSelect && typeof field.options[0] === "object";

  return (
    <div className={"field" + (error ? " field--invalid" : "")}>
      <label htmlFor={id}>{field.label}</label>
      {isSelect ? (
        <select id={id} value={value} onChange={(e) => onChange(field.name, e.target.value)}>
          {field.options.map((opt) =>
            objectOptions ? (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ) : (
              <option key={opt} value={opt}>{opt}</option>
            )
          )}
        </select>
      ) : (
        <input
          id={id}
          type="number"
          value={value}
          min={field.min}
          max={field.max}
          step={field.step || 1}
          onChange={(e) => onChange(field.name, e.target.value)}
        />
      )}
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}

export default function PredictionForm({ onSubmit, submitting }) {
  const [state, setState] = useState(defaultFormState);
  const [errors, setErrors] = useState({});

  function handleChange(name, value) {
    setState((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validate(state);
    setErrors(found);
    if (Object.keys(found).length === 0) onSubmit(toPayload(state));
  }

  function handleReset() {
    setState(defaultFormState());
    setErrors({});
  }

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} noValidate>
      {SECTIONS.map((section) => (
        <div className="form-section" key={section.title}>
          <div className="form-section__title">{section.title}</div>
          <div className="form-grid">
            {section.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={state[field.name]}
                error={errors[field.name]}
                onChange={handleChange}
              />
            ))}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18 }}>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting ? "Estimating…" : "Estimate Attrition Risk"}
        </button>
        <button type="button" className="btn btn--ghost" onClick={handleReset} disabled={submitting}>
          Reset
        </button>
        {errorCount > 0 && (
          <span className="small" style={{ color: "var(--risk-high)" }}>
            {errorCount} field{errorCount > 1 ? "s" : ""} need attention
          </span>
        )}
      </div>
    </form>
  );
}
