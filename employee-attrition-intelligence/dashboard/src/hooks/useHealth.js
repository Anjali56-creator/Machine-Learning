import { useEffect, useRef, useState } from "react";
import { getHealth } from "../services/api";

/*
 * Polls GET /health so the header can show a live API-connection indicator.
 * `online` is null until the first response.
 */
export function useHealth(intervalMs = 20000) {
  const [state, setState] = useState({ online: null, modelLoaded: null });
  const timer = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const data = await getHealth();
        if (!cancelled)
          setState({ online: true, modelLoaded: !!data.model_loaded, raw: data });
      } catch {
        if (!cancelled) setState({ online: false, modelLoaded: null });
      }
    }

    check();
    timer.current = setInterval(check, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer.current);
    };
  }, [intervalMs]);

  return state;
}
