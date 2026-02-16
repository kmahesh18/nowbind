"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { Loader2, AlertCircle } from "lucide-react";
import { Suspense } from "react";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setError("No token provided");
      return;
    }

    let cancelled = false;

    api
      .get("/auth/magic-link/verify", { token })
      .then(async () => {
        if (cancelled) return;
        // Refresh auth context so user state is populated before redirect
        await refetch();
        if (!cancelled) {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Invalid or expired link. Please request a new one.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, router, refetch]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="mx-auto max-w-sm rounded-lg border bg-card p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="mb-1 font-medium">Login Failed</p>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <a
            href="/login"
            className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Signing you in...</span>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
