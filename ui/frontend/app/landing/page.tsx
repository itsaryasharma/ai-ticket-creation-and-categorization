"use client";
/**
 * app/landing/page.tsx — Production-quality SaaS landing page
 * Client-focused, product preview, dark/light toggle, no jargon.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import {
  ArrowRight, ChevronRight, Sun, Moon,
  ClipboardCheck, Zap, BarChart3, ShieldCheck,
  Clock, LayoutDashboard, CheckCircle2, CheckCheck, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── THEME TOGGLE (mounted guard prevents SSR undefined addListener error) ─
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-8 h-8" />;
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

// ── MOCK TICKET DATA ───────────────────────────────────────────────────────
const MOCK_TICKETS = [
  { id: "TIC-2847", title: "Outlook not syncing on Windows 11",  cat: "Email",    priority: "P2", pStyle: "text-orange-500", status: "Open",        sStyle: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "TIC-2851", title: "VPN disconnects every 30 minutes",   cat: "Network",  priority: "P1", pStyle: "text-red-500",    status: "In Progress", sStyle: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300" },
  { id: "TIC-2863", title: "Cannot access shared drive",         cat: "Access",   priority: "P2", pStyle: "text-orange-500", status: "Open",        sStyle: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  { id: "TIC-2844", title: "Printer not detected after update",  cat: "Hardware", priority: "P3", pStyle: "text-green-600",  status: "Resolved",    sStyle: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  { id: "TIC-2839", title: "Browser crashes on employee portal", cat: "Software", priority: "P1", pStyle: "text-red-500",    status: "Resolved",    sStyle: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
];

// ── SECTION LABEL ──────────────────────────────────────────────────────────
function Label({ text }: { text: string }) {
  return (
    <p className="text-xs font-bold tracking-[0.18em] uppercase text-blue-600 dark:text-blue-400 mb-4">
      {text}
    </p>
  );
}

// ── FEATURES ───────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: ClipboardCheck, title: "Auto-Categorize Issues",       desc: "Every ticket is instantly classified — Software, Hardware, Network, Access, and more. No manual sorting required." },
  { icon: Zap,            title: "Instant Priority Assignment",  desc: "Critical issues are flagged immediately. Priority is set automatically so your team always knows what to address first." },
  { icon: BarChart3,      title: "Real-Time Dashboard",          desc: "A live view of all tickets, statuses, and team workload — so you're never in the dark about your IT queue." },
  { icon: ShieldCheck,    title: "Admin Control & Override",     desc: "Admins can review, edit, reassign, or escalate any ticket at any time. You stay in control." },
  { icon: Clock,          title: "Faster Resolution Times",      desc: "Structured tickets reach the right team instantly — eliminating misrouting and hours of back-and-forth." },
  { icon: LayoutDashboard, title: "Unified Ticket Management",   desc: "All issues, across all users, in one place. Filter by status, category, or priority with a single click." },
];

// ── WORKFLOW STEPS ─────────────────────────────────────────────────────────
const STEPS = [
  { icon: "✍️",        step: "01", title: "Describe the Issue",             desc: "Users type their problem in plain language — no dropdowns, no forms, no categories to choose." },
  { icon: "⚡",        step: "02", title: "AI Classifies & Prioritizes",    desc: "TicketAI instantly categorizes the issue and sets priority level — automatically, in seconds." },
  { icon: CheckCheck,  step: "03", title: "Team Resolves It",               desc: "Admins see structured, prioritized tickets and resolve them faster with full edit and status control." },
];

// ── MAIN PAGE ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router      = useRouter();
  const workflowRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-blue-100 dark:selection:bg-blue-950">

      {/* ── NAVBAR ─────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <button
            onClick={() => router.push("/landing")}
            className="flex items-center gap-2 font-bold text-base hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="text-xl">🎫</span>
            Ticket<span className="text-blue-600">AI</span>
          </button>

          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <button onClick={() => workflowRef.current?.scrollIntoView({ behavior: "smooth" })} className="hover:text-foreground transition-colors">How It Works</button>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#preview"  className="hover:text-foreground transition-colors">Preview</a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => router.push("/login")} className="hidden sm:inline-flex text-sm">
              Login
            </Button>
            <Button size="sm" onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-500 text-white text-sm">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────── */}
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-7">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-3 py-1 rounded-full">
              <Zap size={11} /> AI-Powered IT Helpdesk
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]"
          >
            Resolve IT issues faster,<br />
            <span className="text-blue-600">with zero manual sorting</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            TicketAI turns user complaints into structured, prioritized support tickets — instantly.
            Less manual work. Faster response. Better IT operations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex items-center justify-center gap-3 flex-wrap"
          >
            <Button size="lg" onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-500 text-white gap-2 px-7 h-11">
              Start Free <ArrowRight size={15} />
            </Button>
            <Button variant="outline" size="lg" onClick={() => workflowRef.current?.scrollIntoView({ behavior: "smooth" })} className="gap-2 px-7 h-11">
              See How It Works <ChevronRight size={15} />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── PRODUCT PREVIEW ─────────────────────────────────────────────── */}
      <section id="preview" className="px-6 pb-24 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.2 }}>
            {/* Browser chrome */}
            <div className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card">
              {/* Title bar */}
              <div className="border-b border-border bg-muted/50 px-5 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                  <div className="w-3 h-3 rounded-full bg-green-400/60" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background border border-border rounded-md px-5 py-1 text-[11px] text-muted-foreground w-60 text-center">
                    ticketai.app/admin
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
                  Active
                </span>
              </div>

              {/* Stats bar */}
              <div className="px-5 py-3 border-b border-border flex items-center gap-6 bg-card flex-wrap">
                {[
                  { value: "5", label: "Total",     color: "" },
                  { value: "3", label: "Open",       color: "text-blue-500" },
                  { value: "2", label: "P1 Critical",color: "text-red-500" },
                  { value: "2", label: "Resolved",   color: "text-green-500" },
                ].map(({ value, label, color }) => (
                  <div key={label} className="text-center min-w-[48px]">
                    <p className={`text-xl font-bold leading-none ${color}`}>{value}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-24">Ticket ID</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Title</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-24">Category</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-16">Priority</th>
                    <th className="text-left py-2.5 px-4 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-28">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TICKETS.map((t) => (
                    <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4">
                        <code className="text-[11px] font-mono text-blue-500">{t.id}</code>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-medium truncate max-w-[260px]">{t.title}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-muted-foreground">{t.cat}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-bold ${t.pStyle}`}>{t.priority}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${t.sStyle}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">
              Sample admin dashboard — tickets auto-classified and prioritized by AI
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── IMPACT NUMBERS ──────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "AI-driven", label: "Categorization with human-in-the-loop validation" },
            { value: "<10s",      label: "Ticket creation time" },
            { value: "6",         label: "Issue categories covered" },
            { value: "100%",      label: "Tickets structured and tracked" },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl font-extrabold text-blue-600">{value}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-snug">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────── */}
      <div ref={workflowRef} />
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Label text="How It Works" />
            <h2 className="text-3xl font-bold">From complaint to resolved — in minutes</h2>
            <p className="text-muted-foreground mt-3 text-base max-w-xl mx-auto leading-relaxed">
              No forms to fill out. No categories to choose. Just describe the issue and TicketAI handles the rest.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ icon, step, title, desc }) => (
              <div key={step} className="p-6 rounded-xl border border-border bg-card hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center mb-4">
                  {typeof icon === "string" ? (
                    <span className="text-lg">{icon}</span>
                  ) : (
                    <CheckCheck size={18} className="text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <span className="text-[11px] font-bold text-blue-500 tracking-widest">{step}</span>
                <h3 className="font-semibold text-base mt-1.5 mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-muted/30 border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <Label text="Features" />
            <h2 className="text-3xl font-bold">Everything your IT team needs</h2>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="p-6 rounded-xl border border-border bg-card hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={18} />
                </div>
                <p className="font-semibold text-sm mb-2">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ────────────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Label text="Built for Real Teams" />
            <h2 className="text-3xl font-bold leading-snug">
              Stop wasting time on<br />manual ticket management
            </h2>
            <p className="text-muted-foreground mt-4 text-base leading-relaxed">
              Traditional helpdesks require users to pick categories, set priorities, and describe
              issues in exact formats. TicketAI removes all of that friction — users just describe
              the problem, and the system handles classification and routing.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No more tickets buried in the wrong category",
                "Critical issues surface automatically, not after hours",
                "Admin team focuses on resolving, not sorting",
                "Full audit trail — every ticket, every change, logged",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm">
                  <CheckCircle2 size={15} className="text-green-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={() => router.push("/login")} className="mt-7 bg-blue-600 hover:bg-blue-500 text-white gap-2">
              Start Using TicketAI <ArrowRight size={13} />
            </Button>
          </div>

          {/* Mini ticket cards */}
          <div className="space-y-4">
            {[
              { id: "TIC-2851", title: "VPN disconnects every 30 minutes", cat: "Network Issue", priority: "P1 – Critical", pColor: "text-red-500", status: "In Progress", sColor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", icon: AlertCircle, iColor: "text-yellow-500" },
              { id: "TIC-2839", title: "Browser crashes on employee portal", cat: "Software Issue", priority: "P1 – Critical", pColor: "text-red-500", status: "Resolved", sColor: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300", icon: CheckCircle2, iColor: "text-green-500" },
            ].map((t) => (
              <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <code className="text-[11px] font-mono text-blue-500">{t.id}</code>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${t.sColor}`}>{t.status}</span>
                </div>
                <p className="text-sm font-semibold mb-2">{t.title}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{t.cat}</span>
                  <span className={`text-xs font-bold ${t.pColor}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-blue-600 text-white text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold">Ready to modernize your IT support?</h2>
          <p className="text-blue-100 text-base leading-relaxed max-w-lg mx-auto">
            Get started in minutes. Register, raise your first ticket, and see the difference immediately.
          </p>
          <Button size="lg" onClick={() => router.push("/login")} className="bg-white text-blue-600 hover:bg-blue-50 font-bold gap-2 px-10 h-12">
            Get Started Free <ArrowRight size={15} />
          </Button>
        </motion.div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-base mb-3">
                <span>🎫</span>
                Ticket<span className="text-blue-600">AI</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI-powered IT ticket management. Less sorting, faster resolution, better operations.
              </p>
            </div>

            {/* Product */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Product</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features"     className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
                <li><a href="#preview"      className="hover:text-foreground transition-colors">Product Preview</a></li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Account</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><button onClick={() => router.push("/login")}     className="hover:text-foreground transition-colors">Login</button></li>
                <li><button onClick={() => router.push("/login")}     className="hover:text-foreground transition-colors">Register</button></li>
                <li><button onClick={() => router.push("/dashboard")} className="hover:text-foreground transition-colors">Dashboard</button></li>
              </ul>
            </div>

            {/* Project Info */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Project</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Infosys Springboard 6.0</li>
                <li>AI Internship Project</li>
                <li className="text-xs pt-1 opacity-70">FastAPI · Next.js · Python</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-10 pt-6 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-muted-foreground">© 2026 TicketAI. All rights reserved.</p>
            <p className="text-xs text-muted-foreground opacity-70">Built with FastAPI, Next.js 14, Python AI/ML</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
