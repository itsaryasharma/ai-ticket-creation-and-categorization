"use client";
/**
 * app/register/page.tsx — Full Register Page
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AuthCard from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex gap-3 mt-1.5 flex-wrap"
    >
      {checks.map((c) => (
        <span
          key={c.label}
          className={`flex items-center gap-1 text-xs transition-colors ${
            c.ok ? "text-green-400" : "text-slate-500"
          }`}
        >
          <Check size={10} className={c.ok ? "opacity-100" : "opacity-30"} />
          {c.label}
        </span>
      ))}
    </motion.div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => api.auth.register(form),
    onSuccess: (data) => {
      login(data);
      toast.success("Account created!", {
        description: "Welcome to TicketAI. Redirecting to your dashboard…",
      });
      router.push("/dashboard");
    },
    onError: (err: Error) => {
      toast.error("Registration failed", { description: err.message });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.warning("Please fill in all required fields");
      return;
    }
    if (form.password.length < 6) {
      toast.warning("Password must be at least 6 characters");
      return;
    }
    mutation.mutate();
  };

  return (
    <AuthCard
      title="Create your account"
      subtitle="Start managing tickets with AI — free forever"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-1.5"
        >
          <Label htmlFor="name" className="text-slate-300 text-sm font-medium">
            Full name <span className="text-slate-500 font-normal">(optional)</span>
          </Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Jane Smith"
            value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
            className="bg-slate-800/60 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
          />
        </motion.div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.12 }}
          className="space-y-1.5"
        >
          <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
            Email address <span className="text-red-400">*</span>
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
          transition={{ delay: 0.16 }}
          className="space-y-1.5"
        >
          <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
            Password <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Create a strong password"
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
          <PasswordStrength password={form.password} />
        </motion.div>

        {/* Terms */}
        <p className="text-xs text-slate-600 leading-relaxed">
          By creating an account you agree to our{" "}
          <span className="text-slate-400 cursor-pointer hover:text-slate-300">Terms of Service</span>{" "}
          and{" "}
          <span className="text-slate-400 cursor-pointer hover:text-slate-300">Privacy Policy</span>.
        </p>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-900/30"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </AuthCard>
  );
}
