"use client";
/**
 * app/tickets/page.tsx — User ticket list (full page)
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ChevronRight, Search, Ticket } from "lucide-react";
import { api, type Ticket as TicketType } from "@/lib/api";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function TicketRow({ ticket, onClick }: { ticket: TicketType; onClick: () => void }) {
  const date = ticket.created_at
    ? new Date(ticket.created_at).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      })
    : "—";

  return (
    <tr
      onClick={onClick}
      className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors group"
    >
      <td className="py-3 px-4">
        <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.ticket_id}</code>
      </td>
      <td className="py-3 px-4 max-w-[300px]">
        <p className="text-sm font-medium truncate">{ticket.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{ticket.category}</p>
      </td>
      <td className="py-3 px-4"><PriorityBadge priority={ticket.priority} /></td>
      <td className="py-3 px-4"><StatusBadge status={ticket.status} /></td>
      <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{date}</td>
      <td className="py-3 px-4 text-right">
        <ChevronRight size={14} className="ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </td>
    </tr>
  );
}

export default function TicketsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage]     = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["tickets", page],
    queryFn: () => api.tickets.list({ page, page_size: 20 }),
    enabled: !!localStorage.getItem("access_token"),
  });

  const tickets = data?.items ?? [];
  const filtered = tickets.filter(
    (t) =>
      t.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Ticket size={20} className="text-blue-500" /> My Tickets
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All support requests you have submitted.
        </p>
      </div>

      <Card className="shadow-none border border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Tickets ({data?.total ?? 0})</CardTitle>
          <div className="relative w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ID or title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm bg-muted/30"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm font-medium">{search ? "No matches found" : "No tickets yet"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {search ? "Try a different search." : "Go to Dashboard and raise your first ticket."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Ticket ID", "Title / Category", "Priority", "Status", "Date", ""].map((h) => (
                      <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <TicketRow
                      key={t.id}
                      ticket={t}
                      onClick={() => router.push(`/tickets/${t.id}`)}
                    />
                  ))}
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
                className="px-3 py-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted"
              >
                Previous
              </button>
              <span className="text-muted-foreground text-xs">
                Page {page} of {data?.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data?.pages ?? 1, p + 1))}
                disabled={page === (data?.pages ?? 1)}
                className="px-3 py-1 rounded-md border border-border disabled:opacity-40 hover:bg-muted"
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
