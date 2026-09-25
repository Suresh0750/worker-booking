"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* <Suspense fallback={null}>
          <RouteProgressBar />
        </Suspense> */}
        {children}
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: "var(--font-plus-jakarta)",
            fontSize: "14px",
            borderRadius: "12px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

/* ─── Route-change progress bar ─────────────────────────────── */

function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const start = () => {
      setVisible(true);
      setProgress(0);

      const tick = () => {
        setProgress((prev) => {
          if (prev >= 92) return 92;
          const jitter = (92 - prev) * 0.08 + Math.random() * 2;
          return Math.min(92, prev + jitter);
        });
        raf = window.requestAnimationFrame(tick);
      };

      raf = window.requestAnimationFrame(tick);

      timeout = setTimeout(() => {
        setProgress(100);
        window.setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 350);
      }, 450);
    };

    start();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed left-0 right-0 top-0 z-[200] h-1 overflow-hidden bg-transparent transition-opacity duration-200",
        visible ? "opacity-100" : "opacity-0"
      )}
      aria-hidden
    >
      <div
        className="h-full w-full origin-left bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600 shadow-[0_0_10px_var(--brand-500)] animate-progress-bar"
        style={{
          transform: `translateX(-${100 - progress}%)`,
        }}
      />
    </div>
  );
}
