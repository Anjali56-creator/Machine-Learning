/*
 * Presentational table. Columns describe how to render each field; sorting is
 * delegated upward (server-side) via onSort so large datasets stay paginated.
 *
 * columns: [{ key, label, align, render?(row), sortable?, strong? }]
 */
export default function DataTable({ columns, rows, sortBy, sortDir, onSort }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const active = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  className={(col.align === "right" ? "num " : "") + (active ? "sorted" : "")}
                  onClick={() => col.sortable !== false && onSort?.(col.key)}
                  style={{ cursor: col.sortable === false ? "default" : "pointer" }}
                >
                  {col.label}
                  {active ? (sortDir === "desc" ? " ↓" : " ↑") : ""}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={
                    (col.align === "right" ? "num " : "") + (col.strong ? "strong" : "")
                  }
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
