import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Generic data-fetching hook with loading / error / success state.
 *
 * @param {Function} fetcher  async function returning data
 * @param {Array}    deps     re-run when these change
 * @param {Object}   options  { enabled }
 */
export function useApi(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const reqId = useRef(0);

  const run = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      if (id === reqId.current) setData(result);
    } catch (err) {
      if (id === reqId.current) {
        setError(err.message || "Something went wrong");
        setData(null);
      }
    } finally {
      if (id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, enabled]);

  return { data, loading, error, refetch: run };
}
