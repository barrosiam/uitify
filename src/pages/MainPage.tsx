import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";

import LeadsTable, {
  type Sort as LeadSort,
} from "@/components/table/LeadTable";
import OpportunitiesTable, {
  type OppSort,
} from "@/components/table/OpportunitiesTable";

import LeadEditorSheet from "@/components/sheet/LeadEditorSheet";
import OpportunityCreateSheet from "@/components/sheet/OpportunityCreateSheet";

import { useLeadsSearch } from "@/hooks/useLeadsSearch";
import { useOpportunitiesSearch } from "@/hooks/useOpportunitiesSearch";

import { type Lead, type LeadStatus, ALLOWED_STATUS } from "@/types/lead";
import { type Opportunity } from "@/types/opportunity";
import { ALLOWED_OPP_STAGES } from "@/types/opportunity";

import { notify } from "@/lib/toast";

const ALL_STATUSES = "All statuses" as const;
const STATUS_FILTERS = [ALL_STATUSES, ...ALLOWED_STATUS] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];
const isStatusFilter = (v: string): v is StatusFilter =>
  (STATUS_FILTERS as readonly string[]).includes(v);

const ALL_STAGES = "All stages" as const;
const STAGE_FILTERS = [ALL_STAGES, ...ALLOWED_OPP_STAGES] as const;
type StageFilter = (typeof STAGE_FILTERS)[number];
const isStageFilter = (v: string): v is StageFilter =>
  (STAGE_FILTERS as readonly string[]).includes(v);

export default function CRMPage() {
  const [tab, setTab] = React.useState<"leads" | "opps">("leads");

  const [leadPage, setLeadPage] = React.useState(1);
  const [leadPageSize, setLeadPageSize] = React.useState(10);
  const [leadSort, setLeadSort] = React.useState<LeadSort>({
    field: "score",
    order: "desc",
  });
  const [leadSearch, setLeadSearch] = React.useState("");
  const [leadStatus, setLeadStatus] =
    React.useState<StatusFilter>(ALL_STATUSES);
  const [leadRefreshKey, setLeadRefreshKey] = React.useState(0);

  React.useEffect(() => {
    setLeadPage(1);
  }, [leadSearch, leadStatus, leadPageSize]);

  const {
    rows: leadRows,
    total: leadTotal,
    loading: leadLoading,
  } = useLeadsSearch({
    page: leadPage,
    pageSize: leadPageSize,
    search: leadSearch,
    sort: leadSort,
    status:
      leadStatus !== ALL_STATUSES ? (leadStatus as LeadStatus) : undefined,
    refreshKey: leadRefreshKey,
    onError: (err) =>
      notify.error("Failed to load leads", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  const [leadEditorOpen, setLeadEditorOpen] = React.useState(false);
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  function onLeadRowClick(row: Lead) {
    setSelectedLead(row);
    setLeadEditorOpen(true);
  }

  const [convertOpen, setConvertOpen] = React.useState(false);
  const [convertLead, setConvertLead] = React.useState<Lead | null>(null);
  function onConvertRequest(lead: Lead) {
    setConvertLead(lead);
    setConvertOpen(true);
  }

  const [oppPage, setOppPage] = React.useState(1);
  const [oppPageSize, setOppPageSize] = React.useState(10);
  const [oppSort, setOppSort] = React.useState<OppSort>({
    field: "amount",
    order: "desc",
  });
  const [oppSearch, setOppSearch] = React.useState("");
  const [oppStage, setOppStage] = React.useState<StageFilter>(ALL_STAGES);
  const [oppRefreshKey, setOppRefreshKey] = React.useState(0);

  React.useEffect(() => {
    setOppPage(1);
  }, [oppSearch, oppStage, oppPageSize]);

  const {
    rows: oppRows,
    total: oppTotal,
    loading: oppLoading,
  } = useOpportunitiesSearch({
    page: oppPage,
    pageSize: oppPageSize,
    search: oppSearch,
    stage:
      oppStage !== ALL_STAGES ? (oppStage as Opportunity["stage"]) : undefined,
    sort: oppSort,
    refreshKey: oppRefreshKey,
    onError: (err) =>
      notify.error("Failed to load opportunities", {
        description: err instanceof Error ? err.message : String(err),
      }),
  });

  function handleOpportunityCreated(op: Opportunity) {
    setOppRefreshKey((k) => k + 1);
    setTab("opps");
  }

  const hasLeadFilters =
    leadSearch.trim().length > 0 || leadStatus !== ALL_STATUSES;

  const resetLeadFilters = () => {
    setLeadSearch("");
    setLeadStatus(ALL_STATUSES);
    setLeadPage(1);
    notify.info("Lead filters reset.");
  };

  const hasOppFilters = oppSearch.trim().length > 0 || oppStage !== ALL_STAGES;

  const resetOppFilters = () => {
    setOppSearch("");
    setOppStage(ALL_STAGES);
    setOppPage(1);
    notify.info("Opportunity filters reset.");
  };

  return (
    <section className="mx-auto w-full max-w-6xl p-4 md:p-6 space-y-4">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "leads" | "opps")}>
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="opps">Opportunities</TabsTrigger>
        </TabsList>

        {/* ------------------------------- LEADS TAB ------------------------------- */}
        <TabsContent value="leads" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8 lg:col-span-9">
              <Search
                className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Search leads by name or company"
                placeholder="Search by name or company..."
                value={leadSearch}
                onChange={(e) => setLeadSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="md:col-span-4 lg:col-span-2">
              <Select
                value={leadStatus}
                onValueChange={(v) => {
                  if (isStatusFilter(v)) {
                    setLeadStatus(v);
                    notify.info("Status filter", { description: v });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent align="end" sideOffset={4}>
                  {STATUS_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 lg:col-span-2 md:col-start-1 lg:col-start-auto">
              <Select
                value={String(leadPageSize)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setLeadPageSize(n);
                  notify.info("Page size changed", {
                    description: `${n} items per page`,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent align="start" sideOffset={4}>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 lg:col-span-1 flex md:justify-end">
              {hasLeadFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={resetLeadFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <LeadsTable
            rows={leadRows}
            loading={leadLoading}
            total={leadTotal}
            page={leadPage}
            pageSize={leadPageSize}
            sort={leadSort}
            onSortChange={setLeadSort}
            onPageChange={setLeadPage}
            onRowClick={onLeadRowClick}
          />
        </TabsContent>

        {/* --------------------------- OPPORTUNITIES TAB --------------------------- */}
        <TabsContent value="opps" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
            <div className="relative md:col-span-8 lg:col-span-9">
              <Search
                className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Search opportunities by name or account"
                placeholder="Search by name or account..."
                value={oppSearch}
                onChange={(e) => setOppSearch(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="md:col-span-4 lg:col-span-2">
              <Select
                value={oppStage}
                onValueChange={(v) => {
                  if (isStageFilter(v)) {
                    setOppStage(v);
                    notify.info("Stage filter", { description: v });
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent align="end" sideOffset={4}>
                  {STAGE_FILTERS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 lg:col-span-2 md:col-start-1 lg:col-start-auto">
              <Select
                value={String(oppPageSize)}
                onValueChange={(v) => {
                  const n = Number(v);
                  setOppPageSize(n);
                  notify.info("Page size changed", {
                    description: `${n} items per page`,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Items per page" />
                </SelectTrigger>
                <SelectContent align="start" sideOffset={4}>
                  {[5, 10, 25, 50].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 lg:col-span-1 flex md:justify-end">
              {hasOppFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full md:w-auto"
                  onClick={resetOppFilters}
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <OpportunitiesTable
            rows={oppRows}
            loading={oppLoading}
            total={oppTotal}
            page={oppPage}
            pageSize={oppPageSize}
            sort={oppSort}
            onSortChange={setOppSort}
            onPageChange={setOppPage}
          />
        </TabsContent>
      </Tabs>

      <LeadEditorSheet
        open={leadEditorOpen}
        lead={selectedLead}
        onOpenChange={setLeadEditorOpen}
        onSaved={() => setLeadRefreshKey((k) => k + 1)}
        onConvertRequest={onConvertRequest}
      />

      <OpportunityCreateSheet
        open={convertOpen}
        lead={convertLead}
        onOpenChange={setConvertOpen}
        onCreated={handleOpportunityCreated}
      />
    </section>
  );
}
