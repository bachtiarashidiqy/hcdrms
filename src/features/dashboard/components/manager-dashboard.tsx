"use client";

import { useMemo } from "react";
import {
  Activity,
  Target,
  Clock,
  Hourglass,
  Users,
  Star,
  Database,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/components/shared/app-context";
import {
  computeKPIs,
  volumeOverTime,
  statusDistribution,
  categoryBreakdown,
  engineerWorkload,
  topCategoriesByEffort,
  sensitivityDistribution,
  topRequestors,
  sourceUtilization,
} from "@/features/dashboard/lib/analytics";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import {
  VolumeChart,
  CategoryBarChart,
  StatusDistributionChart,
  WorkloadChart,
  EffortByCategoryChart,
  SensitivityGrid,
} from "@/features/dashboard/components/charts";
import { TopList } from "@/features/dashboard/components/top-list";

export function ManagerDashboard() {
  const { hydrated, version } = useApp();

  const data = useMemo(() => {
    if (!hydrated) return null;
    return {
      kpi: computeKPIs(),
      volume: volumeOverTime(60),
      status: statusDistribution(),
      categories: categoryBreakdown(),
      workload: engineerWorkload(),
      effortByCategory: topCategoriesByEffort(),
      sensitivity: sensitivityDistribution(),
      topRequestors: topRequestors(),
      sources: sourceUtilization(),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, version]);

  if (!data) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  const { kpi } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Active Requests"
          value={kpi.active}
          hint={`${kpi.totalRequests} total`}
          Icon={Activity}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${kpi.slaCompliance.toFixed(1)}%`}
          hint="vs target ≥ 85%"
          tone={kpi.slaCompliance >= 85 ? "positive" : kpi.slaCompliance >= 70 ? "warning" : "negative"}
          Icon={Target}
        />
        <KpiCard
          label="Avg TAT"
          value={`${kpi.averageTatHours.toFixed(0)}h`}
          hint="dari diajukan ke delivered"
          Icon={Clock}
        />
        <KpiCard
          label="Pending Approval"
          value={kpi.pendingApproval}
          hint={`${kpi.inProgress} sedang dikerjakan`}
          Icon={Hourglass}
          tone={kpi.pendingApproval > 5 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <VolumeChart data={data.volume} />
        </div>
        <SensitivityGrid data={data.sensitivity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CategoryBarChart data={data.categories.slice(0, 8)} />
        <StatusDistributionChart data={data.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WorkloadChart data={data.workload} />
        <EffortByCategoryChart data={data.effortByCategory.slice(0, 8)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TopList
          title="Top Requestors"
          description="Requestor dengan volume tertinggi"
          items={data.topRequestors.slice(0, 6).map((r) => ({
            primary: r.name,
            secondary: r.entity,
            count: r.count,
          }))}
          Icon={Users}
        />
        <TopList
          title="Source Utilization"
          description="Sumber data paling sering dipakai"
          items={data.sources.map((s) => ({ primary: s.source, count: s.count }))}
          countLabel="referensi"
          Icon={Database}
        />
        <TopList
          title="Engineer Performer"
          description="Top contributor closed requests"
          items={data.workload
            .slice(0, 6)
            .filter((w) => w.closed > 0)
            .map((w) => ({
              primary: w.name,
              secondary: `${w.hoursLogged.toFixed(0)}h logged`,
              count: w.closed,
              initials: w.initials,
            }))}
          Icon={TrendingUp}
        />
      </div>

      {kpi.csatCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <KpiCard
            label="CSAT Average"
            value={`${kpi.csatAverage.toFixed(2)} / 5`}
            hint={`${kpi.csatCount} responses`}
            Icon={Star}
            tone={kpi.csatAverage >= 4 ? "positive" : kpi.csatAverage >= 3 ? "warning" : "negative"}
          />
          <KpiCard label="Closed bulan ini" value={kpi.closedThisMonth} Icon={Activity} />
          <KpiCard label="Total Request" value={kpi.totalRequests} Icon={Activity} />
        </div>
      )}
    </div>
  );
}
