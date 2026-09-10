/*
 * Numbered section header with an optional data-derived note on the right.
 * `note` should be plain association language sourced from the API.
 */
export default function SectionHeading({ index, title, note }) {
  return (
    <div className="sec-head">
      <div className="sec-head__l">
        {index != null && <span className="sec-head__idx">{index}</span>}
        <h2>{title}</h2>
      </div>
      {note && <div className="sec-head__note">{note}</div>}
    </div>
  );
}
