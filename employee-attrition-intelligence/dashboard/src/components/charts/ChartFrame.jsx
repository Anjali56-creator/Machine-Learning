import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIso = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/*
 * Measures its own width and hands concrete pixel dimensions to a render-prop
 * child.
 *
 * Recharts' <ResponsiveContainer> infers size from its parent and, when many
 * charts mount at once inside CSS grid/flex cards, can measure ~0 on first paint
 * and only recover on a window resize. Measuring here - synchronously before
 * paint, again on the next frame, and on every later resize - removes that
 * failure mode and any empty-chart flash.
 *
 *   <ChartFrame height={300}>{(w, h) => <BarChart width={w} height={h} .../>}</ChartFrame>
 */
export default function ChartFrame({ height = 300, children }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useIso(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth((prev) => (prev === w ? prev : w));
    };

    measure(); // before paint
    const raf = requestAnimationFrame(measure); // after first layout/paint
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return (
    <div ref={ref} style={{ width: "100%", height, minWidth: 0 }}>
      {width > 0 ? children(width, height) : null}
    </div>
  );
}
