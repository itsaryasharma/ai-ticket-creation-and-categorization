"use client";
/**
 * components/auth/AuthCard.tsx
 * Shared shell for login and register pages.
 * Framer Motion entrance animation, gradient background, glass card.
 */
import { motion } from "framer-motion";
import Link from "next/link";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-[300px] h-[300px] bg-violet-600/8 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Logo + brand */}
        <div className="text-center mb-8">
          <Link href="/landing" className="inline-flex items-center gap-2 group">
            <span className="text-3xl">🎫</span>
            <span className="text-xl font-bold text-white tracking-tight">
              Ticket<span className="text-blue-400">AI</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-8 shadow-2xl shadow-black/40">
          <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
          <p className="text-slate-400 text-sm mb-6">{subtitle}</p>

          {children}

          <div className="mt-6 text-center text-sm text-slate-500">
            {footer}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
