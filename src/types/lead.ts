import { type ListParamsBase } from "./api";

export const ALLOWED_STATUS = ["Active", "Pending", "Inactive"] as const;
export type LeadStatus = (typeof ALLOWED_STATUS)[number];
export function isValidStatus(x: unknown): x is LeadStatus {
  return (
    typeof x === "string" && (ALLOWED_STATUS as readonly string[]).includes(x)
  );
}

export const ALLOWED_SOURCES = ["Web", "Referral", "Ads", "Event"] as const;
export type LeadSource = (typeof ALLOWED_SOURCES)[number];
export function isValidSource(x: unknown): x is LeadSource {
  return (
    typeof x === "string" && (ALLOWED_SOURCES as readonly string[]).includes(x)
  );
}

export type Lead = {
  id: string;
  name: string;
  company: string;
  email: string;
  source: LeadSource;
  score: number;
  status: LeadStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type LeadListParams = ListParamsBase<Lead> & {
  status?: LeadStatus | LeadStatus[];
  source?: LeadSource | string;
  name_like?: string;
  email_like?: string;
  company_like?: string;
  score_gte?: number;
  score_lte?: number;
  createdAt_gte?: string;
  createdAt_lte?: string;
};
