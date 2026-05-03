"use client";

import Link from "next/link";
import { useMemo } from "react";
import { differenceInHours } from "date-fns";
import { Activity, Clock, CheckCircle2, BookOpen, Inbox, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/shared/app-context";
import { listRequests } from "@/features/request/lib/queries";
import { getDB } from "@/lib/store";
import { isTerminal } from "@/features/workflow/lib/state-machine";
import { KpiCard } from "@/features/dashboard/components/kpi-card";
import { StatusBadge } from "@/features/request/components/status-badge";
import { SlaIndicator } from "@/features/request/components/sla-indicator";

export function PersonalDashboard() {
  const { currentUser, hydrated, version } = useApp();

  const data = useMemo(() => {
    if (!hydrated || !currentUser) return null;
    const db = getDB();

    const isEngineer = currentUser.role === "engineer" || currentUser.role === "reviewer";
    const myRequests = isEngineer
      ? listRequests({ assignedEngineerId: currentUser.id })
      : listRequests({ requestorId: currentUser.id });

    const active = myRequests.filter((r) => !isTerminal(r.status) && r.status !== "draft");
    const closed = myRequests.filter((r) => r.status === "closed");
    const completedWithTat = myRequests.filter((r) => r.deliveredAt && r.submittedAt);
    const onTime = completedWithTat.filter((r) => {
      const tat = differenceInHours(new Date(r.deliveredAt!), new Date(r.submittedAt!));
      return tat <= r.slaHours;
    });
    const slaRate = completedWithTat.length > 0 ? (onTime.length / completedWithTat.length) * 100 : 0;
    const tats = completedWithTat.map((r) =>
      differenceInHours(new Date(r.deliveredAt!), new Date(r.submittedAt!)),
    );
    const avgTat = tats.length > 0 ? tats.reduce((s, t) => s + t, 0) / tats.length : 0;

    const myArticles = db.articles.filter((a) => a.ownerId === currentUser.id);

    return {
      isEngineer,
      active,
      closed,
      slaRate,
      avgTat,
      myArticles,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentUser, version]);

  if (!data || !currentUser) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label={data.isEngineer ? "Active Pekerjaan" : "Active Request"}
          value={data.active.length}
          Icon={Activity}
        />
        <KpiCard
          label="Closed (total)"
          value={data.closed.length}
          Icon={CheckCircle2}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${data.slaRate.toFixed(0)}%`}
          tone={data.slaRate >= 85 ? "positive" : data.slaRate >= 70 ? "warning" : "negative"}
          Icon={Clock}
        />
        <KpiCard
          label={data.isEngineer ? "Avg TAT" : "Avg Wait"}
          value={`${data.avgTat.toFixed(0)}h`}
          Icon={Clock}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Inbox className="size-4" />
            {data.isEngineer ? "Worklist Aktif" : "Request Saya"}
          </CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={data.isEngineer ? "/worklist" : "/requests"} />}>
            Lihat semua
            <ArrowRight className="size-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {data.active.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {data.isEngineer
                ? "Tidak ada pekerjaan aktif. Cek group queue di /worklist."
                : "Belum ada request aktif. Buat request baru di /requests/new."}
            </p>
          ) : (
            <div className="space-y-2">
              {data.active.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/requests/${r.id}`}
                  className="flex items-center gap-3 rounded-md border p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium line-clamp-1">{r.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.code}</div>
                  </div>
                  <StatusBadge status={r.status} />
                  <SlaIndicator request={r} />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {data.isEngineer && data.myArticles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="size-4" />
              KB Contribution ({data.myArticles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.myArticles.slice(0, 4).map((a) => (
              <Link
                key={a.id}
                href={`/kb/${a.id}`}
                className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm hover:bg-muted transition-colors"
              >
                <span className="line-clamp-1">{a.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{a.views} views</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
