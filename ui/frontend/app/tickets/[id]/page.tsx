"use client";
/**
 * app/tickets/[id]/page.tsx — Ticket detail view for users
 */
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge, StatusBadge } from "@/components/shared/Badges";

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => api.tickets.get(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading ticket…
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm font-medium">Ticket not found</p>
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="mt-3">
          <ArrowLeft size={14} className="mr-1" /> Go back
        </Button>
      </div>
    );
  }

  const date = new Date(ticket.created_at).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => router.push("/tickets")} className="text-muted-foreground -ml-2">
        <ArrowLeft size={14} className="mr-1" /> My Tickets
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <code className="text-xs font-mono text-blue-600 dark:text-blue-400">{ticket.ticket_id}</code>
          <h1 className="text-xl font-bold mt-1">{ticket.title}</h1>
          <p className="text-xs text-muted-foreground mt-1">{date}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Info grid */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ticket Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Category</p>
              <span className="text-sm bg-muted px-2 py-1 rounded-md">{ticket.category}</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Priority</p>
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card className="shadow-none border border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
        </CardContent>
      </Card>
    </div>
  );
}
