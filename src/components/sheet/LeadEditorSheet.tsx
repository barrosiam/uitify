import * as React from "react";
import type { Lead, LeadStatus, LeadSource } from "@/types/lead";
import { ALLOWED_STATUS, ALLOWED_SOURCES } from "@/types/lead";
import { patchLead } from "@/services/leads.service";
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

type Props = {
  open: boolean;
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updated: Lead) => void;
  onConvertRequest?: (lead: Lead) => void;
};

type FormState = {
  name: string;
  company: string;
  email: string;
  score: number;
  status: LeadStatus;
  source: LeadSource;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EDITABLE_KEYS = ["email", "status"] as const;
type EditableKey = (typeof EDITABLE_KEYS)[number];
type EditablePatch = Partial<Pick<Lead, EditableKey>>;

export default function LeadEditorSheet({
  open,
  lead,
  onOpenChange,
  onSaved,
  onConvertRequest,
}: Props) {
  const [form, setForm] = React.useState<FormState | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [emailErr, setEmailErr] = React.useState<string | null>(null);
  const emailRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!lead) {
      setForm(null);
      setError(null);
      setEmailErr(null);
      return;
    }
    setForm({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      score: lead.score,
      status: lead.status,
      source: lead.source,
    });
    setError(null);
    setEmailErr(null);
  }, [lead?.id, open]);

  const isDirty = React.useMemo(() => {
    if (!lead || !form) return false;
    return EDITABLE_KEYS.some((k) => form[k] !== lead[k]);
  }, [lead, form]);

  const isValidEmail = React.useMemo(
    () => (form ? EMAIL_RE.test(form.email.trim().toLowerCase()) : false),
    [form?.email],
  );

  function buildPatch(): EditablePatch {
    if (!lead || !form) return {};
    const normalizedEmail = form.email.trim().toLowerCase();
    const next: FormState = { ...form, email: normalizedEmail };

    const patch: Partial<Pick<Lead, "email" | "status">> = {};
    if (next.email !== lead.email) patch.email = next.email;
    if (next.status !== lead.status) patch.status = next.status;
    return patch;
  }

  function resetForm() {
    if (!lead) return;
    setForm({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      score: lead.score,
      status: lead.status,
      source: lead.source,
    });
    setEmailErr(null);
    setError(null);
    notify.info("Changes reset.");
  }

  function safeClose(next: boolean) {
    if (saving) return;
    onOpenChange(next);
  }

  async function handleSave() {
    if (!lead || !form) return;

    if (!form.email.trim()) {
      setEmailErr("E-mail is required.");
      emailRef.current?.focus();
      notify.error("Please fix the validation errors.");
      return;
    }
    if (!isValidEmail) {
      setEmailErr("Enter a valid e-mail.");
      emailRef.current?.focus();
      notify.error("Please fix the validation errors.");
      return;
    }

    const patch = buildPatch();
    if (Object.keys(patch).length === 0) {
      safeClose(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const updated = await notify.promise(patchLead(lead.id, patch), {
        loading: "Saving lead…",
        success: () => "Lead updated successfully.",
        error: (e) => (e instanceof Error ? e.message : "Failed to save."),
      });

      onSaved?.(updated);
      safeClose(false);
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : "Failed to save.";
      if (/HTTP\s+4\d\d/.test(String(msg))) {
        setError("Validation failed. Please review the fields and try again.");
      } else if (/HTTP\s+5\d\d/.test(String(msg))) {
        setError("Server error. Please try again in a moment.");
      } else if (/Failed to fetch|NetworkError|TypeError/.test(String(msg))) {
        setError("Network error. Check your connection and try again.");
      } else {
        setError(msg);
      }
      notify.error("Unable to save lead.", { description: msg });
    } finally {
      setSaving(false);
    }
  }

  function handleConvert() {
    if (lead) onConvertRequest?.(lead);
  }

  function onEmailKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSave();
    }
  }

  return (
    <Sheet open={open} onOpenChange={safeClose}>
      <SheetContent side="right" className="w-full max-w-md p-6">
        <SheetHeader>
          <SheetTitle className="text-center">Edit lead</SheetTitle>
          <SheetDescription className="text-center">
            Update fields and click save.
          </SheetDescription>
        </SheetHeader>

        {!form ? (
          <div className="mt-6 text-sm text-muted-foreground">
            No lead selected.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} disabled />
              <p className="text-sm text-muted-foreground">
                Name cannot be edited
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" value={form.company} disabled />
              <p className="text-sm text-muted-foreground">
                Company cannot be edited
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Select value={form.source} disabled>
                <SelectTrigger id="source" className="w-full">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Source cannot be edited
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={100}
                value={String(form.score)}
                disabled
              />
              <p className="text-sm text-muted-foreground">
                Score cannot be edited
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                ref={emailRef}
                type="email"
                value={form.email}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((f) => (f ? { ...f, email: v } : f));
                  if (!v.trim()) setEmailErr("E-mail is required.");
                  else if (!EMAIL_RE.test(v.trim().toLowerCase()))
                    setEmailErr("Enter a valid e-mail.");
                  else setEmailErr(null);
                }}
                onKeyDown={onEmailKeyDown}
                aria-invalid={Boolean(emailErr)}
                aria-describedby={emailErr ? "email-error" : undefined}
              />
              {emailErr && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {emailErr}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => (f ? { ...f, status: v as LeadStatus } : f))
                }
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {ALLOWED_STATUS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <SheetFooter className="gap-2">
              <Button
                variant="secondary"
                onClick={handleConvert}
                disabled={!lead}
              >
                Convert to opportunity
              </Button>
              <Button
                variant="ghost"
                onClick={resetForm}
                disabled={saving || !isDirty}
              >
                Reset
              </Button>
              <Button
                variant="outline"
                onClick={() => safeClose(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  saving || !isDirty || Boolean(emailErr) || !isValidEmail
                }
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </SheetFooter>

            <div
              className="pt-2 text-xs text-muted-foreground"
              aria-live="polite"
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
