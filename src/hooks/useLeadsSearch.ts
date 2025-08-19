import * as React from "react";
import { listLeads } from "@/services/leads.service";
import type { Lead, LeadStatus } from "@/types/lead";

export type Sort = { field: keyof Lead; order: "asc" | "desc" } | null;

type Params = {
  page: number;
  pageSize: number;
  search: string;
  status?: LeadStatus;
  sort: Sort;
  debounceMs?: number;
  refreshKey?: number;
  onError?: (err: unknown) => void;
};

type Result = {
  rows: Lead[];
  total: number;
  loading: boolean;
  error: string | null;
};

function errToMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Unexpected error.";
}

export function useLeadsSearch({
  page,
  pageSize,
  search,
  status,
  sort,
  debounceMs = 300,
  refreshKey = 0,
  onError,
}: Params): Result {
  const [rows, setRows] = React.useState<Lead[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [debouncedSearch, setDebouncedSearch] = React.useState(search);
  React.useEffect(() => {
    const t = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      debounceMs,
    );
    return () => window.clearTimeout(t);
  }, [search, debounceMs]);

  const reqId = React.useRef(0);
  const lastToastKey = React.useRef<string | null>(null);

  React.useEffect(() => {
    const id = ++reqId.current;
    const active = () => id === reqId.current;

    async function run() {
      try {
        setLoading(true);
        setError(null);

        if (!debouncedSearch) {
          const { data, total: t } = await listLeads({
            _page: page,
            _limit: pageSize,
            _sort: sort?.field,
            _order: sort?.order,
            status,
          });
          if (!active()) return;
          setRows(data);
          setTotal(t ?? 0);
          return;
        }

        const term = debouncedSearch;
        const CAP = Math.max(page * pageSize, 200);

        const [byName, byCompany] = await Promise.all([
          listLeads({
            _page: 1,
            _limit: CAP,
            _sort: sort?.field,
            _order: sort?.order,
            status,
            name_like: term,
          }),
          listLeads({
            _page: 1,
            _limit: CAP,
            _sort: sort?.field,
            _order: sort?.order,
            status,
            company_like: term,
          }),
        ]);

        if (!active()) return;

        const map = new Map<string, Lead>();
        for (const r of byName.data) map.set(r.id, r);
        for (const r of byCompany.data) map.set(r.id, r);
        let merged = Array.from(map.values());

        if (sort?.field) {
          const dir = sort.order === "asc" ? 1 : -1;
          const f = sort.field;
          merged = merged.sort((a, b) => {
            const av = a[f] as unknown as number | string;
            const bv = b[f] as unknown as number | string;
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
          });
        }

        const totalMerged = merged.length;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageSlice = merged.slice(start, end);

        setRows(pageSlice);
        setTotal(totalMerged);
      } catch (e) {
        if (!active()) return;
        const msg = errToMessage(e);
        setRows([]);
        setTotal(0);
        setError(msg);

        const key = `${id}:${msg}`;
        if (lastToastKey.current !== key) {
          lastToastKey.current = key;
          onError?.(e);
        }
      } finally {
        if (active()) setLoading(false);
      }
    }

    void run();
  }, [
    page,
    pageSize,
    status,
    debouncedSearch,
    sort?.field,
    sort?.order,
    refreshKey,
  ]);

  return { rows, total, loading, error };
}
