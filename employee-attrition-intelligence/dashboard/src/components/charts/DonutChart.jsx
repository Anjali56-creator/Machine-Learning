import { Cell, Legend, Pie, PieChart, Tooltip } from "recharts";
import ChartFrame from "./ChartFrame";
import { chart, NO_ANIM, palette, tooltipStyle } from "./chartTheme";

/*
 * Generic donut. props:
 *   data      [{ name, value }]
 *   height
 *   colors    optional override array
 *   centerLabel / centerValue  optional text in the middle
 */
export default function DonutChart({ data = [], height = 240, colors = palette, centerLabel, centerValue }) {
  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <ChartFrame height={height}>
        {(w, h) => (
          <PieChart width={w} height={h}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="88%"
              paddingAngle={2}
              stroke={chart.surface}
              {...NO_ANIM}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: chart.text }} />
          </PieChart>
        )}
      </ChartFrame>
      {(centerValue || centerLabel) && (
        <div
          style={{
            position: "absolute",
            top: "calc(50% - 14px)",
            left: 0,
            right: 0,
            transform: "translateY(-50%)",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 700 }}>{centerValue}</div>
          <div style={{ fontSize: 11, color: chart.text }}>{centerLabel}</div>
        </div>
      )}
    </div>
  );
}
