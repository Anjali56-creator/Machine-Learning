/*
 * Consistent shell for every chart / table block: title, optional hint, body.
 * Keeping this separate from the chart itself makes it trivial to swap or
 * rearrange visualizations later.
 */
export default function ChartCard({ title, hint, right, children, bodyStyle }) {
  return (
    <div className="card">
      <div className="card__head">
        <span className="card__title">{title}</span>
        {right || (hint && <span className="card__hint">{hint}</span>)}
      </div>
      <div className="card__body" style={bodyStyle}>
        {children}
      </div>
    </div>
  );
}
