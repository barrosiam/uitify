const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export function buildQuery(params?: QueryParams): string {
  if (!params) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item === undefined || item === null || item === "") continue;
        qs.append(k, String(item));
      }
    } else {
      qs.set(k, String(v));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export function withQuery(path: string, params?: QueryParams): string {
  return `${path.startsWith("/") ? path : `/${path}`}${buildQuery(params)}`;
}

type JsonMethods = "GET" | "POST" | "PUT" | "PATCH";
type NoBodyMethods = "GET" | "DELETE" | "HEAD";

type JsonRequestInit = Omit<RequestInit, "body"> & {
  method?: JsonMethods;
  body?: BodyInit | Record<string, unknown>;
};

function shouldSerialize(body: unknown): body is Record<string, unknown> {
  return (
    typeof body === "object" &&
    body !== null &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  );
}

export async function fetchJson<T>(
  path: string,
  init: JsonRequestInit = {},
): Promise<{ data: T; headers: Headers }> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  let body = init.body;
  if (shouldSerialize(body)) {
    if (!headers.has("Content-Type"))
      headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...init, headers, body });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json"))
    throw new Error("Unexpected non-JSON response");

  const data = (await res.json()) as T;
  return { data, headers: res.headers };
}

export async function fetchOk(
  path: string,
  init: Omit<RequestInit, "body"> & { method?: NoBodyMethods } = {},
): Promise<{ headers: Headers }> {
  const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return { headers: res.headers };
}
