"use client";
/**
 * app/providers.tsx
 * Wraps the entire app with QueryClient, ThemeProvider, and AuthProvider.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, retry: 1 },
      },
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <AuthProvider>
          {children}
          <Toaster richColors position="bottom-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
