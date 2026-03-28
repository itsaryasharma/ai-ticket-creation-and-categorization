"use client";
/**
 * app/tickets/layout.tsx — Portal layout for /tickets (reuses AppSidebar + auth guard)
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
