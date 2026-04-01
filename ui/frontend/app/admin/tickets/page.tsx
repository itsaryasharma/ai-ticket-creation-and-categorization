"use client";
/**
 * app/admin/tickets/page.tsx
 * Redirect /admin/tickets to /admin (admin dashboard)
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AdminTicketsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}
