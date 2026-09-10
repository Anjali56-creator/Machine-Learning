export default function Skeleton({ height = 14, width = "100%", style }) {
  return <div className="skeleton" style={{ height, width, ...style }} />;
}

export function ChartSkeleton({ height = 240 }) {
  const bars = [52, 76, 40, 92, 60, 70, 46, 64];
  return (
    <div className="chart-skeleton" style={{ height }}>
      {bars.map((h, i) => (
        <div key={i} className="skeleton bar" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function KpiSkeleton() {
  return (
    <div className="kpi">
      <Skeleton height={10} width="50%" />
      <Skeleton height={24} width="65%" style={{ marginTop: 9 }} />
      <Skeleton height={9} width="42%" style={{ marginTop: 9 }} />
      <Skeleton height={4} width="100%" style={{ marginTop: 10 }} />
    </div>
  );
}

export function InsightSkeleton() {
  return (
    <div className="insight insight--skel">
      <Skeleton height={9} width="38%" />
      <Skeleton height={16} width="60%" style={{ marginTop: 8 }} />
      <Skeleton height={10} width="100%" style={{ marginTop: 10 }} />
      <Skeleton height={10} width="80%" style={{ marginTop: 5 }} />
    </div>
  );
}
