import { withQuery, fetchJson, fetchOk } from "./http";
import type { ListResult } from "@/types/api";
import {
  type Lead,
  type LeadListParams,
  type LeadStatus,
  isValidStatus,
  isValidSource,
} from "@/types/lead";

const base = "/leads" as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listLeads(
  params?: LeadListParams,
): Promise<ListResult<Lead>> {
  const { data, headers } = await fetchJson<Lead[]>(withQuery(base, params), {
    method: "GET",
  });

  const totalHeader = headers.get("X-Total-Count");
  const total = totalHeader ? Number(totalHeader) : undefined;
  const page = params?._page;
  const limit = params?._limit;
  const pages =
    typeof total === "number" && typeof limit === "number"
      ? Math.ceil(total / limit)
      : undefined;

  return { data, total, page, limit, pages };
}

export async function getLead(id: string | number): Promise<Lead> {
  const { data } = await fetchJson<Lead>(`${base}/${id}`, { method: "GET" });
  return data;
}

export async function createLead(
  payload: Omit<Lead, "id" | "createdAt" | "updatedAt"> &
    Partial<Pick<Lead, "id">>,
): Promise<Lead> {
  const now = new Date().toISOString();

  const id =
    payload.id && payload.id.trim()
      ? payload.id
      : (globalThis.crypto?.randomUUID?.() ??
        Math.random().toString(36).slice(2));

  const email = payload.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error("Invalid e-mail.");
  if (!isValidStatus(payload.status)) throw new Error("Invalid status.");
  if (!isValidSource(payload.source)) throw new Error("Invalid source.");

  const body: Lead = {
    id,
    name: payload.name,
    company: payload.company,
    email,
    source: payload.source,
    score: payload.score,
    status: payload.status,
    createdAt: now,
    updatedAt: now,
  };

  const { data } = await fetchJson<Lead>(base, { method: "POST", body });
  return data;
}

export async function patchLead(
  id: string | number,
  partial: Partial<Lead>,
): Promise<Lead> {
  const update: Partial<Lead> = {
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  if (update.email !== undefined) {
    const normalized = update.email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) throw new Error("Invalid e-mail.");
    update.email = normalized;
  }
  if (update.status !== undefined && !isValidStatus(update.status)) {
    throw new Error("Invalid status.");
  }
  if (update.source !== undefined && !isValidSource(update.source)) {
    throw new Error("Invalid source.");
  }

  const { data } = await fetchJson<Lead>(`${base}/${id}`, {
    method: "PATCH",
    body: update,
  });
  return data;
}

export async function putLead(id: string | number, full: Lead): Promise<Lead> {
  if (!EMAIL_RE.test(full.email)) throw new Error("Invalid e-mail.");
  if (!isValidStatus(full.status)) throw new Error("Invalid status.");
  if (!isValidSource(full.source)) throw new Error("Invalid source.");

  const body: Lead = { ...full, updatedAt: new Date().toISOString() };
  const { data } = await fetchJson<Lead>(`${base}/${id}`, {
    method: "PUT",
    body,
  });
  return data;
}

export async function deleteLead(id: string | number): Promise<void> {
  await fetchOk(`${base}/${id}`, { method: "DELETE" });
}

export function updateStatus(
  id: string | number,
  status: LeadStatus,
): Promise<Lead> {
  return patchLead(id, { status });
}

export function updateEmail(id: string | number, email: string): Promise<Lead> {
  return patchLead(id, { email });
}

export function updateEmailAndStatus(
  id: string | number,
  opts: { email?: string; status?: LeadStatus },
): Promise<Lead> {
  const partial: Partial<Lead> = {};
  if (opts.email !== undefined) partial.email = opts.email;
  if (opts.status !== undefined) partial.status = opts.status;
  return Object.keys(partial).length ? patchLead(id, partial) : getLead(id);
}
