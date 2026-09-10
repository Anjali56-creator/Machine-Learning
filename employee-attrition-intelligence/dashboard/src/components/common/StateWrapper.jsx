/*
 * Standard wrapper for any API-driven region: loading / error / empty fallbacks
 * so pages never show blank charts or fabricated values.
 */
export default function StateWrapper({
  loading,
  error,
  isEmpty,
  onRetry,
  skeleton,
  emptyLabel = "No data for the current selection.",
  children,
}) {
  if (loading) {
    return (
      skeleton || (
        <div className="state">
          <div className="spinner" />
          <span>Loading…</span>
        </div>
      )
    );
  }

  if (error) {
    return (
      <div className="state">
        <svg className="state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M12 8v5M12 16.5v.01" />
          <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        </svg>
        <span>{error}</span>
        {onRetry && (
          <button className="btn btn--ghost" onClick={onRetry}>
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="state">
        <svg className="state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
        <span>{emptyLabel}</span>
      </div>
    );
  }

  return children;
}
