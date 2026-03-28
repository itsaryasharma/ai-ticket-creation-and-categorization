"use client";
/**
 * components/layout/AppSidebar.tsx
 * Clean SaaS sidebar — Linear/Vercel inspired.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Ticket, LogOut, Shield, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tickets",   icon: Ticket,          label: "My Tickets"  },
];

const ADMIN_NAV = [
  { href: "/admin", icon: Shield, label: "Admin Panel" },
];

export default function AppSidebar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const { user, logout, isAdmin } = useAuth();

  function handleLogout() {
    logout();
    toast.success("Logged out");
    router.push("/landing");
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-card flex flex-col h-screen sticky top-0">
      {/* Brand — click to go to landing */}
      <Link href="/landing" className="h-14 flex items-center gap-2.5 px-5 border-b border-border hover:bg-muted/30 transition-colors">
        <span className="text-xl">🎫</span>
        <span className="font-bold text-sm tracking-tight">
          Ticket<span className="text-blue-500">AI</span>
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href
                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Icon size={15} />
            {label}
            {pathname === href && (
              <ChevronRight size={12} className="ml-auto opacity-60" />
            )}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Admin
              </p>
            </div>
            {ADMIN_NAV.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="border-t border-border p-3 space-y-1">
        <div className="px-3 py-1.5">
          <p className="text-xs font-medium truncate">{user?.full_name || user?.email}</p>
          {user?.full_name && (
            <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
