"use client";
/**
 * app/admin/layout.tsx — Admin layout with role guard
 * Redirects non-admins to /dashboard
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AppSidebar from "@/components/layout/AppSidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) router.push("/login");
      else if (!isAdmin) router.push("/dashboard");
    }
  }, [user, loading, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!user || !isAdmin) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
