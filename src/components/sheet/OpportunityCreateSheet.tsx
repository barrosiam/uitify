import * as React from "react";
import type { Lead } from "@/types/lead";
import type { Opportunity } from "@/types/opportunity";
import { ALLOWED_OPP_STAGES, type OpportunityStage } from "@/types/opportunity";
import {
  createOpportunity,
  existsOpportunityForLead,
  listOpportunities,
} from "@/services/opportunities.service";
import { notify } from "@/lib/toast";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Props = {
  open: boolean;
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: (op: Opportunity) => void;
};

type Form = {
  name: string;
  account: string;
  contactEmail: string;
  amount: number;
  stage: OpportunityStage;
  closeDate: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function OpportunityCreateSheet({
  open,
  lead,
  onOpenChange,
  onCreated,
}: Props) {
  const [form, setForm] = React.useState<Form | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [errName, setErrName] = React.useState<string | null>(null);
  const [errAccount, setErrAccount] = React.useState<string | null>(null);
  const [errEmail, setErrEmail] = React.useState<string | null>(null);
  const [errStage, setErrStage] = React.useState<string | null>(null);

  const [dupExists, setDupExists] = React.useState(false);
  const [dupName, setDupName] = React.useState<string | null>(null);

  const nameRef = React.useRef<HTMLInputElement | null>(null);
  const accountRef = React.useRef<HTMLInputElement | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!lead) {
      setForm(null);
      setErrName(null);
      setErrAccount(null);
      setErrEmail(null);
      setErrStage(null);
      setDupExists(false);
      setDupName(null);
      return;
    }

    setErrName(null);
    setErrAccount(null);
    setErrEmail(null);
    setErrStage(null);

    setForm({
      name: lead.name,
      account: lead.company,
      contactEmail: lead.email,
      amount: 0,
      stage: "Qualification",
      closeDate: plusDays(30),
    });

    (async () => {
      try {
        const exists = await existsOpportunityForLead(lead.id);
        if (!exists) {
          setDupExists(false);
          setDupName(null);
          return;
        }
        const { data } = await listOpportunities({
          _page: 1,
          _limit: 1,
          leadId: lead.id,
        });
        setDupExists(true);
        setDupName(data[0]?.name ?? null);
      } catch {
        setDupExists(false);
        setDupName(null);
      }
    })();
  }, [lead, open]);

  const canSubmit =
    !!form &&
    !saving &&
    !dupExists &&
    form.name.trim().length > 0 &&
    form.account.trim().length > 0 &&
    ALLOWED_OPP_STAGES.includes(form.stage) &&
    EMAIL_RE.test(form.contactEmail.trim().toLowerCase());

  function validate(): boolean {
    if (!form) return false;
    let ok = true;

    if (!form.name.trim()) {
      setErrName("Name is required.");
      nameRef.current?.focus();
      ok = false;
    } else setErrName(null);

    if (!form.account.trim()) {
      if (ok) accountRef.current?.focus();
      setErrAccount("Account name is required.");
      ok = false;
    } else setErrAccount(null);

    if (!ALLOWED_OPP_STAGES.includes(form.stage)) {
      setErrStage("Stage is required.");
      ok = false;
    } else setErrStage(null);

    const email = form.contactEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      if (ok) emailRef.current?.focus();
      setErrEmail("Enter a valid e-mail.");
      ok = false;
    } else setErrEmail(null);

    if (!ok) notify.error("Please fix the validation errors.");
    return ok;
  }

  function safeClose(next: boolean) {
    if (saving) return;
    onOpenChange(next);
  }

  async function handleCreate() {
    if (!lead || !form) return;
    if (!validate()) return;

    try {
      const exists = await existsOpportunityForLead(lead.id);
      if (exists) {
        setDupExists(true);
        notify.error("This lead already has an opportunity.", {
          description: "You cannot create a duplicate for the same lead.",
        });
        return;
      }
    } catch {
      notify.error("Could not verify duplicates. Please try again.");
      return;
    }

    try {
      setSaving(true);

      const op = await notify.promise(
        createOpportunity({
          name: form.name.trim(),
          account: form.account.trim(),
          contactEmail: form.contactEmail.trim().toLowerCase(),
          amount: Number.isFinite(form.amount) ? form.amount : 0,
          stage: form.stage,
          closeDate: form.closeDate,
          leadId: lead.id,
        }),
        {
          loading: "Creating opportunity…",
          success: (o) => `Opportunity "${o.name}" created.`,
          error: (e) => (e instanceof Error ? e.message : "Failed to create."),
        },
      );

      await onCreated?.(op);
      safeClose(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={safeClose}>
      <SheetContent side="right" className="w-full max-w-md p-6">
        <SheetHeader>
          <SheetTitle className="text-center">
            Convert to opportunity
          </SheetTitle>
          <SheetDescription className="text-center">
            Fields marked as required must be filled.
          </SheetDescription>
        </SheetHeader>

        {!form ? (
          <div className="mt-6 text-sm text-muted-foreground">
            No lead selected.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {dupExists && (
              <Alert variant="destructive">
                <AlertTitle>Duplicate blocked</AlertTitle>
                <AlertDescription>
                  This lead already has an opportunity
                  {dupName ? `: "${dupName}"` : ""}. You cannot create another
                  one for the same lead.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                ref={nameRef}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                aria-invalid={Boolean(errName)}
                aria-describedby={errName ? "name-error" : undefined}
              />
              {errName && (
                <p id="name-error" className="text-sm text-destructive">
                  {errName}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="account">Account name *</Label>
              <Input
                id="account"
                ref={accountRef}
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                aria-invalid={Boolean(errAccount)}
                aria-describedby={errAccount ? "account-error" : undefined}
              />
              {errAccount && (
                <p id="account-error" className="text-sm text-destructive">
                  {errAccount}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Contact e-mail *</Label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                value={form.contactEmail}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, contactEmail: v });
                  if (!EMAIL_RE.test(v.trim().toLowerCase()))
                    setErrEmail("Enter a valid e-mail.");
                  else setErrEmail(null);
                }}
                aria-invalid={Boolean(errEmail)}
                aria-describedby={errEmail ? "email-error" : undefined}
              />
              {errEmail && (
                <p id="email-error" className="text-sm text-destructive">
                  {errEmail}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                value={String(form.amount)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: Number(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stage">Stage *</Label>
              <Select
                value={form.stage}
                onValueChange={(v) => {
                  setForm({ ...form, stage: v as OpportunityStage });
                  setErrStage(null);
                }}
              >
                <SelectTrigger
                  id="stage"
                  className="w-full"
                  aria-invalid={Boolean(errStage)}
                >
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_OPP_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errStage && (
                <p className="text-sm text-destructive">{errStage}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="closeDate">Close date</Label>
              <Input
                id="closeDate"
                type="date"
                value={form.closeDate}
                onChange={(e) =>
                  setForm({ ...form, closeDate: e.target.value })
                }
              />
            </div>

            <SheetFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => safeClose(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!canSubmit}>
                {saving ? "Creating…" : "Create"}
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
