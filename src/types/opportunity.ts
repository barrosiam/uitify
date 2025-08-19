export const ALLOWED_OPP_STAGES = [
  "Qualification",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;
export type OpportunityStage = (typeof ALLOWED_OPP_STAGES)[number];

export type Opportunity = {
  id: string;
  name: string;
  account: string;
  contactEmail: string;
  amount: number;
  stage: OpportunityStage;
  closeDate?: string;
  leadId?: string;
  createdAt?: string;
  updatedAt?: string;
};
