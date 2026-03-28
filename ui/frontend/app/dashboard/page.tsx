"use client";
/**
 * app/dashboard/page.tsx
 * Dashboard: Raise Ticket (shows only ticket ID on success) + Tracker + Ticket history.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Send, CheckCircle2, Clock, TicketCheck,
  RefreshCw, ChevronRight, Copy, Search,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, type Ticket } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";

// ── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="border border-border shadow-none">
      <CardContent className="p-5 flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── TICKET CREATED CONFIRMATION (minimal) ─────────────────────────────────
function TicketConfirmation({ ticketId, onDismiss }: { ticketId: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(ticketId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 shadow-none">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Ticket Raised Successfully</p>
                <p className="text-xs text-green-700/70 dark:text-green-500 mt-0.5">
                  Your issue has been classified and queued for resolution.
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Dismiss
            </button>
          </div>

          {/* Ticket ID highlight */}
          <div className="mt-4 p-3 rounded-lg bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-0.5">
                Your Ticket ID
              </p>
              <code className="text-base font-mono font-bold text-foreground tracking-wider">
                {ticketId}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copy}
              className="text-xs gap-1.5 h-8 shrink-0"
            >
              <Copy size={12} />
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Save this ID — use it below to track your ticket status at any time.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── TICKET TRACKER ────────────────────────────────────────────────────────
function TicketTracker() {
  const [input, setInput]   = useState("");
  const [searched, setSearched] = useState("");

  const { data: ticket, isLoading, isError, refetch } = useQuery({
    queryKey: ["track-ticket", searched],
    queryFn: () => api.tickets.get(searched),
    enabled: !!searched,
    retry: false,
  });

  function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    const val = input.trim();
    if (!val) return;
    setSearched(val);
    refetch();
  }

  return (
    <Card className="shadow-none border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Search size={14} className="text-blue-500" />
          Track a Ticket
        </CardTitle>
        <p className="text-sm text-muted-foreground">Enter your ticket ID to check current status.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleTrack} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. TIC-A1B2C3D4"
            className="h-9 text-sm bg-muted/30"
          />
          <Button type="submit" size="sm" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white shrink-0">
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : "Track"}
          </Button>
        </form>

        {/* Result */}
        <AnimatePresence mode="wait">
          {searched && (
            <motion.div
              key={searched}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {isError ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
                  🔍 No ticket found for <code className="font-mono">{searched}</code>. Check the ID and try again.
                </div>
              ) : ticket ? (
                <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.ticket_id}</code>
                    <div className="flex gap-1.5 flex-wrap">
                      <PriorityBadge priority={ticket.priority} />
                      <StatusBadge status={ticket.status} />
                    </div>
                  </div>
                  <p className="text-sm font-medium">{ticket.title}</p>
                  <p className="text-xs text-muted-foreground">{ticket.category}</p>
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// ── TICKET ROW ────────────────────────────────────────────────────────────
function TicketRow({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const date = ticket.created_at
    ? new Date(ticket.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <tr
      onClick={() => router.push(`/tickets/${ticket.id}`)}
      className="border-b border-border hover:bg-muted/40 transition-colors group cursor-pointer"
    >
      <td className="py-3 px-4">
        <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.ticket_id}</code>
      </td>
      <td className="py-3 px-4 max-w-[260px]">
        <p className="text-sm truncate">{ticket.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{ticket.category}</p>
      </td>
      <td className="py-3 px-4"><PriorityBadge priority={ticket.priority} /></td>
      <td className="py-3 px-4"><StatusBadge status={ticket.status} /></td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
      <td className="py-3 px-4">
        <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </td>
    </tr>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => api.tickets.list({ page_size: 20 }),
    enabled: !!localStorage.getItem("access_token"),
  });

  const tickets = ticketsData?.items ?? [];
  const total   = ticketsData?.total ?? 0;
  const open    = tickets.filter((t) => t.status.toUpperCase().includes("OPEN")).length;
  const resolved = tickets.filter((t) => t.status.toUpperCase().includes("RESOLVED")).length;

  const { mutate: raiseTicket, isPending } = useMutation({
    mutationFn: () => api.tickets.create(description),
    onSuccess: (data) => {
      setConfirmedId(data.ai_output.ticket_id);
      setDescription("");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to create ticket", { description: err.message });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      toast.warning("Please describe your issue in at least 10 characters");
      return;
    }
    setConfirmedId(null);
    raiseTicket();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
          <span className="text-blue-600">{user?.full_name?.split(" ")[0] || "there"}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Raise a support ticket or track an existing one below.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Tickets" value={total}   icon={<TicketCheck  size={16} />} />
        <StatCard label="Open"          value={open}    icon={<Clock        size={16} />} />
        <StatCard label="Resolved"      value={resolved} icon={<CheckCircle2 size={16} />} />
      </div>

      {/* Raise Ticket */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send size={15} className="text-blue-500" />
            Raise a Support Ticket
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe your issue — AI will classify it instantly.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. My Slack is crashing on MacBook whenever I try to join a meeting. Getting error 500."
              rows={4}
              className="resize-none text-sm bg-muted/30 border-border focus:border-blue-400"
              disabled={isPending}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{description.length} characters</span>
              <Button type="submit" disabled={isPending} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white px-5">
                {isPending ? (
                  <><Loader2 size={13} className="mr-2 animate-spin" /> Analyzing…</>
                ) : (
                  <><Send size={13} className="mr-2" /> Submit</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Ticket ID Confirmation (minimal) */}
      <AnimatePresence>
        {confirmedId && (
          <TicketConfirmation
            ticketId={confirmedId}
            onDismiss={() => setConfirmedId(null)}
          />
        )}
      </AnimatePresence>

      {/* Ticket Tracker */}
      <TicketTracker />

      {/* Ticket History */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">My Tickets</CardTitle>
          <Button
            variant="ghost" size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["tickets"] })}
            className="text-muted-foreground h-7 px-2 gap-1.5"
          >
            <RefreshCw size={12} /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {ticketsLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading tickets…
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">No tickets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Submit your first ticket above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Ticket ID", "Title / Category", "Priority", "Status", "Date", ""].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => <TicketRow key={t.id} ticket={t} />)}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
