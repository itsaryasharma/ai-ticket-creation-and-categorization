"use client";
/**
 * app/login/page.tsx — Full Login Page
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => api.auth.login(form),
    onSuccess: (data) => {
      login(data);
      toast.success("Welcome back!", { description: "Redirecting to your dashboard…" });
      // Role-based redirect
      if (data.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    },
    onError: (err: Error) => {
      toast.error("Login failed", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.warning("Please fill in all fields");
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to your TicketAI account"
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-1.5"
        >
          <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
          />
        </motion.div>

        {/* Password */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
              Password
            </Label>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-900/30 mt-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-700/60" />
        <span className="text-slate-600 text-xs">or</span>
        <div className="flex-1 h-px bg-slate-700/60" />
      </div>

      {/* Admin shortcut */}
      <Link href="/admin">
        <Button
          variant="outline"
          className="w-full h-10 border-slate-700 bg-transparent text-slate-400 hover:text-white hover:border-slate-500 hover:bg-slate-800 transition-all text-sm"
        >
          <Shield className="mr-2 h-3.5 w-3.5" />
          Continue as Admin
        </Button>
      </Link>
    </AuthCard>
  );
}
