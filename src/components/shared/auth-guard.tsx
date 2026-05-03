"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/components/shared/app-context";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { currentUser, hydrated } = useApp();

  useEffect(() => {
    if (hydrated && !currentUser) {
      router.replace("/login");
    }
  }, [hydrated, currentUser, router]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Memuat sesi...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Mengarahkan ke halaman login...
      </div>
    );
  }

  return <>{children}</>;
}
