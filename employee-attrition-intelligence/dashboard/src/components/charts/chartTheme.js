/*
 * Shared chart styling, pulled from the CSS design tokens so charts stay in
 * lockstep with the theme.
 *
 * Consistent series mapping:
 *   count / workforce volume .... electric blue   (--chart-count)
 *   attrition rate .............. coral           (--chart-rate)
 *   categorical slices ......... purple -> cyan -> orange -> green -> indigo -> pink
 */
function cssVar(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export const chart = {
  count: cssVar("--chart-count", "#5b8def"),
  rate: cssVar("--chart-rate", "#ff5d63"),
  purple: cssVar("--accent-purple", "#a86cf0"),
  cyan: cssVar("--accent-cyan", "#1fc7f0"),
  neutral: cssVar("--chart-neutral", "#3b3f55"),
  track: cssVar("--chart-track", "#262a3d"),
  grid: cssVar("--chart-grid", "#1c1e2c"),
  text: cssVar("--chart-axis", "#7b8099"),
  surface: cssVar("--surface-raised", "#191a27"),
  border: cssVar("--border-strong", "#363954"),
};

// Categorical palette for donut slices / multi-series (used in defined order).
export const palette = [
  cssVar("--accent-purple", "#a86cf0"),
  cssVar("--accent-cyan", "#1fc7f0"),
  cssVar("--accent-orange", "#f7a24a"),
  cssVar("--accent-green", "#35d986"),
  cssVar("--accent-indigo", "#6d6bf2"),
  cssVar("--accent-pink", "#f57ba8"),
];

// Named accents for pages that pick a specific series colour.
export const series = {
  attrition: cssVar("--accent-coral", "#ff5d63"),
  retention: cssVar("--accent-turquoise", "#4bd7c9"),
  overtime: cssVar("--accent-cyan", "#1fc7f0"),
  neutralSlice: "#333747",
};

export const NO_ANIM = { isAnimationActive: false };

export const axisProps = {
  stroke: chart.text,
  tick: { fill: chart.text, fontSize: 10.5 },
  tickLine: false,
  axisLine: { stroke: chart.grid },
};

export const tooltipStyle = {
  contentStyle: {
    background: chart.surface,
    border: `1px solid ${chart.border}`,
    borderRadius: 8,
    fontSize: 11.5,
    color: "#f3f4fa",
    boxShadow: "0 12px 40px -8px rgba(0,0,0,0.65)",
    padding: "8px 10px",
  },
  labelStyle: { color: chart.text, marginBottom: 4, fontWeight: 600 },
  cursor: { fill: "rgba(255,255,255,0.035)" },
};
