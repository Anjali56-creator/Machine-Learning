import { createContext, useCallback, useContext, useMemo, useState } from "react";

/*
 * Holds the currently-applied analytics filters. Pages that support filtering
 * read `filters` (pass straight to the API service) and mutate via the helpers.
 * Kept deliberately small - no reducer, no external state library.
 */

const EMPTY = {
  department: [],
  job_role: [],
  gender: [],
  overtime: [],
  job_level: [],
  business_travel: [],
};

const FilterContext = createContext(null);

export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(EMPTY);

  const setFilter = useCallback((key, values) => {
    setFilters((prev) => ({ ...prev, [key]: values }));
  }, []);

  const clearFilters = useCallback(() => setFilters(EMPTY), []);

  const activeCount = useMemo(
    () => Object.values(filters).reduce((n, arr) => n + (arr?.length || 0), 0),
    [filters]
  );

  // Only include non-empty keys so the API query string stays clean.
  const queryFilters = useMemo(() => {
    const out = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v && v.length) out[k] = v;
    });
    return out;
  }, [filters]);

  const value = { filters, queryFilters, setFilter, clearFilters, activeCount };
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within <FilterProvider>");
  return ctx;
}
