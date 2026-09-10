import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Cell,
  Legend,
  Line,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartFrame from "./ChartFrame";
import { axisProps, chart, NO_ANIM, tooltipStyle } from "./chartTheme";

// hex lerp for the horizontal "rate" bars: purple -> pink -> orange ramp
function hex2rgb(h) {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const [ar, ag, ab] = hex2rgb(a);
  const [br, bg, bb] = hex2rgb(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}
function rampColor(t) {
  return t < 0.5 ? mix("#a86cf0", "#f57ba8", t / 0.5) : mix("#f57ba8", "#f7a24a", (t - 0.5) / 0.5);
}

/*
 * One reusable breakdown chart used by every analytics page.
 *
 * props:
 *   data        [{ category, total, attrition_count, attrition_rate }]
 *   orientation "vertical" (columns) | "horizontal" (bars, good for long labels)
 *   height      px
 *   order       "rate" (default - largest attrition rate first, as the API sends
 *               it) | "label" (natural order of the category label, for ordinal
 *               scales like Job Satisfaction 1..4 that must read left-to-right)
 *
 * Vertical: employee count as columns (left axis) + attrition rate as a line
 * (right axis, %). Horizontal: attrition-rate bars with count available in the
 * tooltip. Both always expose count *and* rate so a large group's raw count is
 * never mistaken for a high rate.
 */
export default function CategoryBarChart({ data = [], orientation = "vertical", height = 300, order = "rate" }) {
  let rows = data.map((d) => ({ ...d, label: d.category }));
  if (order === "label") {
    const num = (v) => (v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
    rows = [...rows].sort((a, b) => {
      const na = num(a.label);
      const nb = num(b.label);
      if (na !== null && nb !== null) return na - nb;
      return String(a.label).localeCompare(String(b.label));
    });
  }

  if (orientation === "horizontal") {
    return (
      <ChartFrame height={height}>
        {(w, h) => (
          <BarChart
            width={w}
            height={h}
            data={rows}
            layout="vertical"
            margin={{ left: 20, right: 24, top: 4, bottom: 4 }}
          >
            <CartesianGrid stroke={chart.grid} horizontal={false} />
            <XAxis
              type="number"
              unit="%"
              {...axisProps}
              domain={[0, (max) => Math.ceil((max + 5) / 5) * 5]}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={172}
              {...axisProps}
              tick={{ fill: chart.text, fontSize: 10.5 }}
            />
            <Tooltip
              {...tooltipStyle}
              formatter={(value, name, item) => {
                if (name === "attrition_rate")
                  return [
                    `${value}%  (${item.payload.attrition_count} of ${item.payload.total})`,
                    "Attrition rate",
                  ];
                return [value, name];
              }}
            />
            <Bar dataKey="attrition_rate" radius={[0, 4, 4, 0]} maxBarSize={22} {...NO_ANIM}>
              {rows.map((_, i) => (
                <Cell key={i} fill={rampColor(rows.length > 1 ? i / (rows.length - 1) : 0)} />
              ))}
            </Bar>
          </BarChart>
        )}
      </ChartFrame>
    );
  }

  return (
    <ChartFrame height={height}>
      {(w, h) => (
        <ComposedChart width={w} height={h} data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
          <CartesianGrid stroke={chart.grid} vertical={false} />
          <XAxis
            dataKey="label"
            {...axisProps}
            interval={0}
            angle={rows.length > 5 ? -18 : 0}
            textAnchor={rows.length > 5 ? "end" : "middle"}
            height={rows.length > 5 ? 60 : 30}
          />
          <YAxis yAxisId="count" {...axisProps} />
          <YAxis yAxisId="rate" orientation="right" unit="%" {...axisProps} />
          <Tooltip
            {...tooltipStyle}
            formatter={(value, name) => {
              if (name === "Attrition rate") return [`${value}%`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: chart.text }} />
          <Bar
            yAxisId="count"
            dataKey="total"
            name="Employees"
            fill={chart.count}
            radius={[3, 3, 0, 0]}
            maxBarSize={rows.length <= 4 ? 84 : 54}
            {...NO_ANIM}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="attrition_rate"
            name="Attrition rate"
            stroke={chart.rate}
            strokeWidth={2}
            dot={{ r: 3, fill: chart.rate }}
            {...NO_ANIM}
          />
        </ComposedChart>
      )}
    </ChartFrame>
  );
}
