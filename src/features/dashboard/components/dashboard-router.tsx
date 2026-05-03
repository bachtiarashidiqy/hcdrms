"use client";

import { PageHeader } from "@/components/shared/page-header";
import { useApp } from "@/components/shared/app-context";
import { ROLE_LABELS } from "@/lib/constants";
import { ManagerDashboard } from "@/features/dashboard/components/manager-dashboard";
import { PersonalDashboard } from "@/features/dashboard/components/personal-dashboard";

const MANAGER_ROLES = ["hcis_manager", "admin"];

export function DashboardRouter() {
  const { currentUser, hydrated } = useApp();

  if (!hydrated) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="text-sm text-muted-foreground">Memuat data...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <div className="text-sm text-muted-foreground">User tidak ditemukan.</div>
      </div>
    );
  }

  const isManager = MANAGER_ROLES.includes(currentUser.role);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={
          isManager
            ? "Operasional tim HCIS — volume, SLA, beban kerja, dan trend strategis."
            : `Ringkasan personal · ${ROLE_LABELS[currentUser.role]}`
        }
      />
      {isManager ? <ManagerDashboard /> : <PersonalDashboard />}
    </div>
  );
}
