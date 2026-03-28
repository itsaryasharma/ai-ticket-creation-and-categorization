"use client";
/**
 * app/admin/tickets/[id]/page.tsx
 * Admin ticket detail — full editable view with save functionality.
 * All data sourced from backend JSON (create_it_ticket output stored in DB).
 */
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Save, Loader2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";

// ── CONSTANTS ─────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Software Issue",
  "Hardware Issue",
  "Network Issue",
  "Access & Authentication",
  "Email & Communication",
  "General Support",
];

const PRIORITIES = [
  "P1 - Critical",
  "P2 - Medium",
  "P3 - Low",
];

const STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "TRANSFERRED",
];

// ── FIELD ROW ─────────────────────────────────────────────────────────────
function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_1fr] items-start gap-4 py-3 border-b border-border last:border-0">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">
        {label}
      </Label>
      <div>{children}</div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function AdminTicketDetailPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const queryClient = useQueryClient();

  // ── Fetch ticket ──────────────────────────────────────────────────────
  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["admin-ticket", id],
    queryFn: () => api.admin.getTicket(id),
    enabled: !!id,
  });

  // ── Form state ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    title:       "",
    description: "",
    category:    "",
    priority:    "",
    status:      "",
  });
  const [dirty, setDirty] = useState(false);

  // Sync form when ticket loads
  useEffect(() => {
    if (ticket) {
      setForm({
        title:       ticket.title,
        description: ticket.description,
        category:    ticket.category,
        priority:    ticket.priority,
        status:      ticket.status.replace(/\s*\(.*\)/, "").replace(/^(OPEN|AUTO_ASSIGN).*/, "OPEN").trim(),
      });
      setDirty(false);
    }
  }, [ticket]);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setDirty(true);
  }

  // ── Save mutation ─────────────────────────────────────────────────────
  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: () => api.admin.updateTicket(id, form),
    onSuccess: () => {
      toast.success("Ticket updated successfully");
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["admin-ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (e: Error) => toast.error("Save failed", { description: e.message }),
  });

  // ── Loading / Error states ────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading ticket…
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 text-center space-y-3">
        <div className="text-4xl">🔍</div>
        <p className="text-sm font-medium">Ticket not found</p>
        <p className="text-xs text-muted-foreground">
          The ticket may have been deleted or the ID is invalid.
        </p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin")}>
          <ArrowLeft size={14} className="mr-1" /> Back to Admin
        </Button>
      </div>
    );
  }

  // Entity display: deduplicated by text, grouped by label
  const entities = (ticket.entities ?? []).filter(
    (e, i, arr) => arr.findIndex((x) => x.text === e.text) === i
  );

  // ── Format created date ───────────────────────────────────────────────
  const createdAt = (() => {
    try {
      return new Date(ticket.created_at).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return ticket.created_at; }
  })();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">

      {/* Header nav */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost" size="sm"
          onClick={() => router.push("/admin")}
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeft size={14} className="mr-1" /> Admin Dashboard
        </Button>

        <Button
          onClick={() => save()}
          disabled={!dirty || saving}
          size="sm"
          className="bg-blue-600 hover:bg-blue-500 text-white gap-2 min-w-[120px]"
        >
          {saving ? (
            <><Loader2 size={13} className="animate-spin" /> Saving…</>
          ) : (
            <><Save size={13} /> Save Changes</>
          )}
        </Button>
      </div>

      {/* Ticket ID + meta */}
      <div className="flex items-start gap-4 flex-wrap">
        <div>
          <code className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded">
            {ticket.ticket_id}
          </code>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Clock size={11} />
            <span>{createdAt}</span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap mt-1">
          <PriorityBadge priority={ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      {/* Main info card */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-1">
          <CardTitle className="text-sm">Ticket Details</CardTitle>
          <p className="text-xs text-muted-foreground">
            All fields are editable. Click Save Changes to persist.
          </p>
        </CardHeader>
        <CardContent className="divide-y divide-border">

          {/* Title */}
          <FieldRow label="Title">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="h-9 text-sm bg-muted/30 border-border"
              placeholder="Ticket title"
            />
          </FieldRow>

          {/* Category */}
          <FieldRow label="Category">
            <Select value={form.category} onValueChange={(v) => set("category", v ?? form.category)}>
              <SelectTrigger className="h-9 text-sm bg-muted/30 border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {/* Priority */}
          <FieldRow label="Priority">
            <Select value={form.priority} onValueChange={(v) => set("priority", v ?? form.priority)}>
              <SelectTrigger className="h-9 text-sm bg-muted/30 border-border">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {/* Status */}
          <FieldRow label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v ?? form.status)}>
              <SelectTrigger className="h-9 text-sm bg-muted/30 border-border">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldRow>

          {/* AI Confidence (read-only) */}
          <FieldRow label="AI Confidence">
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 max-w-[200px] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    ticket.confidence >= 0.8 ? "bg-green-500" :
                    ticket.confidence >= 0.6 ? "bg-yellow-500" : "bg-red-400"
                  }`}
                  style={{ width: `${Math.round(ticket.confidence * 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {Math.round(ticket.confidence * 100)}%
              </span>
            </div>
          </FieldRow>

        </CardContent>
      </Card>

      {/* Description card */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Issue Description</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={5}
            className="resize-none text-sm bg-muted/30 border-border"
            placeholder="Describe the issue…"
          />
          {entities.length > 0 && (
            <div className="pt-1 space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Extracted Context
              </p>
              <div className="flex flex-wrap gap-2">
                {entities.map((e, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted border border-border text-xs"
                  >
                    <span className="text-muted-foreground font-medium capitalize">
                      {e.label.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}:
                    </span>
                    <span className="font-semibold text-foreground">{e.text}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom save */}
      {dirty && (
        <div className="flex justify-end">
          <Button
            onClick={() => save()}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 text-white gap-2"
          >
            {saving ? (
              <><Loader2 size={14} className="animate-spin" /> Saving…</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </Button>
        </div>
      )}

    </div>
  );
}
