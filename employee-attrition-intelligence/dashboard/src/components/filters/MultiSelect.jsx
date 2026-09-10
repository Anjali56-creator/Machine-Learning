import { useEffect, useRef, useState } from "react";

/*
 * Compact checkbox dropdown for multi-value filtering. Controlled: parent owns
 * `value` (array) and receives updates via `onChange`.
 */
export default function MultiSelect({ label, options = [], value = [], onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function toggle(opt) {
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  }

  const summary = value.length === 0 ? "All" : value.length === 1 ? String(value[0]) : `${value.length} selected`;

  return (
    <div className="ms" ref={ref}>
      <div
        className={"ms__control" + (value.length ? " ms__control--on" : "")}
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
      >
        <span className="ms__k">{label}</span>
        <span>{summary}</span>
        {value.length > 1 && <span className="ms__count num">{value.length}</span>}
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </div>
      {open && !disabled && (
        <div className="ms__menu">
          {options.length === 0 && <div className="ms__option muted">No options</div>}
          {options.map((opt) => (
            <label key={opt} className="ms__option">
              <input type="checkbox" checked={value.includes(opt)} onChange={() => toggle(opt)} />
              <span>{String(opt)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
