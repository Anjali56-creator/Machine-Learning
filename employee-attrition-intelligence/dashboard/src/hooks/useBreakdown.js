import { useMemo } from "react";
import { useApi } from "./useApi";
import { useFilters } from "../context/FilterContext";

/*
 * Small convenience wrapper: runs an analytics fetcher with the currently
 * applied filters and re-fetches whenever they change.
 */
export function useBreakdown(fetcher) {
  const { queryFilters } = useFilters();
  const key = useMemo(() => JSON.stringify(queryFilters), [queryFilters]);
  return useApi(() => fetcher(queryFilters), [key]);
}
