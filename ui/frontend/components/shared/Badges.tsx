"use client";
/**
 * components/shared/Badges.tsx
 * Color-coded Priority and Status badges used across the app.
 */
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  "P1 - Critical": "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
  "P2 - Medium":   "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400",
  "P3 - Low":      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN:          "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400",
  IN_PROGRESS:   "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400",
  RESOLVED:      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400",
  CLOSED:        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400",
  MANUAL_REVIEW: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400",
  TRANSFERRED:   "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400",
};

const baseClass = "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border";

function getStatusKey(status: string): string {
  const s = status.toUpperCase();
  if (s.includes("MANUAL")) return "MANUAL_REVIEW";
  if (s.includes("PROGRESS")) return "IN_PROGRESS";
  if (s.includes("OPEN")) return "OPEN";
  return s;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority] ?? "bg-slate-100 text-slate-600 border-slate-200";
  return <span className={cn(baseClass, style)}>{priority}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const key   = getStatusKey(status);
  const style = STATUS_STYLES[key] ?? "bg-slate-100 text-slate-600 border-slate-200";
  const label = status.replace(/[_]/g, " ").replace(/\(.*\)/, "").trim();
  return <span className={cn(baseClass, style)}>{label}</span>;
}

export function EntityChip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
      {text}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const pct  = Math.round(value * 100);
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </div>
  );
}
