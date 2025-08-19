import { withQuery, fetchJson, fetchOk } from "@/services/http";
import type { ListResult } from "@/types/api";
import type { Opportunity } from "@/types/opportunity";
import { ALLOWED_OPP_STAGES } from "@/types/opportunity";

export type OpportunityListParams = {
  _page?: number;
  _limit?: number;
  _sort?: keyof Opportunity;
  _order?: "asc" | "desc";
  stage?: Opportunity["stage"] | Opportunity["stage"][];
  name_like?: string;
  account_like?: string;
  leadId?: string | number;
};

export type CreateOpportunityInput = Omit<
  Opportunity,
  "id" | "createdAt" | "updatedAt"
> &
  Partial<Pick<Opportunity, "id">>;

const base = "/opportunities" as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listOpportunities(
  params?: OpportunityListParams,
): Promise<ListResult<Opportunity>> {
  const { data, headers } = await fetchJson<Opportunity[]>(
    withQuery(base, params),
    { method: "GET" },
  );
  const totalHeader = headers.get("X-Total-Count");
  const total = totalHeader ? Number(totalHeader) : undefined;
  const page = params?._page;
  const limit = params?._limit;
  const pages = total && limit ? Math.ceil(total / limit) : undefined;
  return { data, total, page, limit, pages };
}

export async function existsOpportunityForLead(
  leadId: string | number,
): Promise<boolean> {
  const { data, total } = await listOpportunities({
    _page: 1,
    _limit: 1,
    leadId,
  });
  return (total ?? data.length) > 0;
}

export async function getOpportunity(
  id: string | number,
): Promise<Opportunity> {
  const { data } = await fetchJson<Opportunity>(`${base}/${id}`, {
    method: "GET",
  });
  return data;
}

export async function createOpportunity(
  payload: CreateOpportunityInput,
): Promise<Opportunity> {
  const now = new Date().toISOString();
  const id =
    payload.id ??
    globalThis.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2);

  const email = payload.contactEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) throw new Error("Invalid e-mail.");

  if (!ALLOWED_OPP_STAGES.includes(payload.stage)) {
    throw new Error("Invalid stage.");
  }

  const body: Opportunity = {
    ...payload,
    id,
    contactEmail: email,
    createdAt: now,
    updatedAt: now,
  };

  const { data } = await fetchJson<Opportunity>(base, {
    method: "POST",
    body,
  });
  return data;
}

export async function patchOpportunity(
  id: string | number,
  partial: Partial<Opportunity>,
): Promise<Opportunity> {
  const update: Partial<Opportunity> = {
    ...partial,
    updatedAt: new Date().toISOString(),
  };

  if (update.contactEmail !== undefined) {
    const normalized = String(update.contactEmail).trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) throw new Error("Invalid e-mail.");
    update.contactEmail = normalized as Opportunity["contactEmail"];
  }

  if (
    update.stage !== undefined &&
    !ALLOWED_OPP_STAGES.includes(update.stage)
  ) {
    throw new Error("Invalid stage.");
  }

  const { data } = await fetchJson<Opportunity>(`${base}/${id}`, {
    method: "PATCH",
    body: update,
  });
  return data;
}

export async function deleteOpportunity(id: string | number): Promise<void> {
  await fetchOk(`${base}/${id}`, { method: "DELETE" });
}
