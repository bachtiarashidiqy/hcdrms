"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ChevronRight,
  Inbox,
  ListChecks,
  ShieldCheck,
  Users,
  ClipboardCheck,
  Building2,
  Settings,
  Eye,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApp } from "@/components/shared/app-context";
import { getDB } from "@/lib/store";
import { ROLE_LABELS, type Role } from "@/lib/constants";
import type { User } from "@/types/domain";

const ROLE_DESCRIPTIONS: Record<Role, { description: string; Icon: typeof Inbox; color: string }> = {
  requestor: {
    description: "Submit request data, klarifikasi, terima hasil",
    Icon: Inbox,
    color: "text-blue-600",
  },
  requestor_manager: {
    description: "Approve request bawahan untuk data sensitif",
    Icon: ClipboardCheck,
    color: "text-cyan-600",
  },
  engineer: {
    description: "Pickup dari worklist, ekstraksi, upload deliverable",
    Icon: ListChecks,
    color: "text-emerald-600",
  },
  reviewer: {
    description: "QC deliverable sebelum sampai ke requestor",
    Icon: Eye,
    color: "text-violet-600",
  },
  hcis_manager: {
    description: "Dashboard analytics, assignment, master data",
    Icon: Sparkles,
    color: "text-amber-600",
  },
  data_owner: {
    description: "Approval data domain (Payroll, Talent, OD)",
    Icon: Building2,
    color: "text-pink-600",
  },
  admin: {
    description: "System configuration, user, role, kategori",
    Icon: Settings,
    color: "text-slate-600",
  },
  auditor: {
    description: "Read-only audit log untuk compliance review",
    Icon: ShieldCheck,
    color: "text-red-600",
  },
};

const DEMO_ROLES_ORDER: Role[] = [
  "requestor",
  "requestor_manager",
  "engineer",
  "reviewer",
  "hcis_manager",
  "data_owner",
  "auditor",
  "admin",
];

export function LoginPage() {
  const router = useRouter();
  const { currentUser, setCurrentUserId, hydrated } = useApp();

  useEffect(() => {
    if (hydrated && currentUser) {
      router.replace("/dashboard");
    }
  }, [hydrated, currentUser, router]);

  const accounts = useMemo(() => {
    if (!hydrated) return [] as { role: Role; user: User }[];
    const db = getDB();
    return DEMO_ROLES_ORDER.map((role) => {
      const user = db.users.find((u) => u.role === role);
      return user ? { role, user } : null;
    }).filter(Boolean) as { role: Role; user: User }[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  const handleLogin = (userId: string) => {
    setCurrentUserId(userId);
    router.push("/dashboard");
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Memuat...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-5xl space-y-8">
        <header className="text-center space-y-3">
          <div className="inline-flex items-center justify-center size-14 rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="size-7" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">HC-DRMS</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Human Capital Data Request Management System · Energi Nusantara HCIS
          </p>
        </header>

        <Alert className="max-w-3xl mx-auto">
          <Sparkles className="size-4" />
          <AlertDescription className="text-xs">
            <span className="font-medium">Mode Demo / Proof of Concept.</span> Pilih salah satu akun di
            bawah untuk masuk sebagai role tersebut. Pada production, login akan terintegrasi dengan
            Active Directory korporat (SSO).
          </AlertDescription>
        </Alert>

        <div>
          <h2 className="text-sm font-semibold mb-3 text-center">Pilih Akun untuk Demo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {accounts.map(({ role, user }) => {
              const meta = ROLE_DESCRIPTIONS[role];
              return (
                <button
                  key={user.id}
                  onClick={() => handleLogin(user.id)}
                  className="text-left group"
                >
                  <Card className="p-4 h-full hover:shadow-lg hover:border-primary/40 transition-all cursor-pointer">
                    <CardContent className="p-0 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`size-9 rounded-lg bg-muted flex items-center justify-center ${meta.color}`}>
                          <meta.Icon className="size-4" />
                        </div>
                        <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <div className="space-y-1">
                        <Badge variant="secondary" className="font-normal text-[10px]">
                          {ROLE_LABELS[role]}
                        </Badge>
                        <div className="flex items-center gap-2 pt-1">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium line-clamp-1">{user.name}</div>
                            <div className="text-[10px] text-muted-foreground line-clamp-1">
                              {user.entity}
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 pt-1">
                          {meta.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>
            <span className="font-medium">Tips demo:</span> Anda bisa berpindah role kapan saja via dropdown
            avatar di kanan-atas (Demo Role Switcher).
          </p>
          <p>BRD v1.0 · Phase 1 PoC</p>
        </div>
      </div>
    </div>
  );
}
