export const fmtInt = (n) =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : Math.round(n).toLocaleString("en-US");

export const fmtMoney = (n) =>
  n === null || n === undefined || Number.isNaN(n)
    ? "—"
    : "$" + Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export const fmtPct = (n, dp = 1) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : `${Number(n).toFixed(dp)}%`;

export const fmtDecimal = (n, dp = 2) =>
  n === null || n === undefined || Number.isNaN(n) ? "—" : Number(n).toFixed(dp);

// Turn "YearsAtCompany" into "Years At Company"
export const humanizeField = (s) =>
  String(s)
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\s+/g, " ");
