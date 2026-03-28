"use client";
/**
 * app/admin/page.tsx — Full Admin Dashboard
 * Analytics cards + filterable ticket table + inline status update
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, RefreshCw, Search, TicketCheck, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { api, type Ticket } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";

const STATUSES = ["", "OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "MANUAL_REVIEW", "TRANSFERRED"];
const CATEGORIES = [
  "", "Software Issue", "Hardware Issue", "Network Issue",
  "Access / Authentication Issue", "Email & Communication Issue", "General Support",
];

// ── STAT CARD ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color,
}: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <Card className="shadow-none border border-border">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
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

// ── STATUS UPDATE CELL ─────────────────────────────────────────────────────
function StatusCell({ ticket }: { ticket: Ticket }) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (status: string) =>
      api.admin.updateTicket(ticket.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
      toast.success("Status updated");
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  return (
    <Select
      defaultValue={ticket.status}
      onValueChange={(val) => mutate(val ?? ticket.status)}
      disabled={isPending}
    >
      <SelectTrigger className="h-7 w-36 text-xs border-border bg-transparent focus:ring-0 focus:ring-offset-0">
        {isPending ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>
      <SelectContent>
        {STATUSES.slice(1).map((s) => (
          <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ── TICKET ROW ─────────────────────────────────────────────────────────────
function AdminTicketRow({ ticket }: { ticket: Ticket }) {
  const router = useRouter();
  const date = ticket.created_at
    ? new Date(ticket.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <tr
      onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer group"
    >
      <td className="py-3 px-4">
        <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.ticket_id}</code>
      </td>
      <td className="py-3 px-4 max-w-[220px]">
        <p className="text-sm font-medium truncate">{ticket.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ticket.category}</p>
      </td>
      <td className="py-3 px-4">
        <PriorityBadge priority={ticket.priority} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
        <StatusCell ticket={ticket} />
      </td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
    </tr>
  );
}


// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const queryClient = useQueryClient();
  const [statusFilter,   setStatusFilter]   = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search,         setSearch]         = useState("");
  const [page,           setPage]           = useState(1);

  // Analytics
  const { data: analytics } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: api.admin.analytics,
  });

  // Ticket list
  const { data, isLoading } = useQuery({
    queryKey: ["admin-tickets", statusFilter, categoryFilter, page],
    queryFn: () =>
      api.admin.listTickets({
        status:   statusFilter   || undefined,
        category: categoryFilter || undefined,
        page,
        page_size: 25,
      }),
  });

  const tickets = data?.items ?? [];

  // Client-side search by ID or title
  const filtered = search
    ? tickets.filter(
        (t) =>
          t.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
          t.title.toLowerCase().includes(search.toLowerCase())
      )
    : tickets;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage all tickets and monitor system performance.
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Tickets" value={analytics?.total ?? 0}
          icon={<TicketCheck size={16} />}
          color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
        />
        <StatCard
          label="Open" value={analytics?.open ?? 0}
          icon={<Clock size={16} />}
          color="bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400"
        />
        <StatCard
          label="Resolved" value={analytics?.resolved ?? 0}
          icon={<CheckCircle2 size={16} />}
          color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400"
        />
        <StatCard
          label="Manual Review" value={analytics?.manual_review ?? 0}
          icon={<AlertCircle size={16} />}
          color="bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"
        />
      </div>

      {/* Category breakdown */}
      {(analytics?.by_category?.length ?? 0) > 0 && (
        <Card className="shadow-none border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {analytics!.by_category.map((c) => (
              <div
                key={c.category}
                className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-medium">{c.category}</span>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {c.count}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ticket Table */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base">
              All Tickets
              {data?.total !== undefined && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">({data.total})</span>
              )}
            </CardTitle>
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
                queryClient.invalidateQueries({ queryKey: ["admin-analytics"] });
              }}
              className="h-7 px-2 text-muted-foreground gap-1.5"
            >
              <RefreshCw size={12} /> Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search ID or title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-52 text-xs bg-muted/30"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ""); setPage(1); }}>
              <SelectTrigger className="h-8 w-42 text-xs bg-muted/30 border-border">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs">All Statuses</SelectItem>
                {STATUSES.slice(1).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? ""); setPage(1); }}>
              <SelectTrigger className="h-8 w-52 text-xs bg-muted/30 border-border">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" className="text-xs">All Categories</SelectItem>
                {CATEGORIES.slice(1).map((c) => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter || categoryFilter) && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setStatusFilter(""); setCategoryFilter(""); setPage(1); }}
                className="h-8 text-xs text-muted-foreground"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading tickets…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">No tickets found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Ticket ID", "Title / Category", "Priority", "Current Status", "Update Status", "Date"].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => <AdminTicketRow key={t.id} ticket={t} />)}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {(data?.pages ?? 1) > 1 && (
            <div className="flex items-center justify-center gap-3 py-3 border-t border-border text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted text-xs"
              >
                Previous
              </button>
              <span className="text-muted-foreground text-xs">Page {page} of {data?.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
                disabled={page === (data?.pages ?? 1)}
                className="px-3 py-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted text-xs"
              >
                Next
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
