"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ArrowLeft, Calendar, Building2, Tag, User as UserIcon, FileText, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/components/shared/app-context";
import {
  getRequest,
  getUser,
  getClarifications,
  getDeliverables,
  getApprovals,
  getEfforts,
} from "@/features/request/lib/queries";
import { StatusBadge } from "@/features/request/components/status-badge";
import { PriorityBadge } from "@/features/request/components/priority-badge";
import { SensitivityBadge } from "@/features/request/components/sensitivity-badge";
import { SlaIndicator } from "@/features/request/components/sla-indicator";
import { WorkflowTimeline } from "@/features/workflow/components/timeline";
import { TransitionActions } from "@/features/workflow/components/transition-actions";
import { ClarificationThread } from "@/features/workflow/components/clarification-thread";
import { ApprovalPanel } from "@/features/workflow/components/approval-panel";
import { RequestActionsPanel } from "@/features/fulfillment/components/request-actions-panel";
import { EffortList } from "@/features/fulfillment/components/effort-list";
import { ReviewGate } from "@/features/fulfillment/components/review-gate";
import { CATEGORY_LABELS, OUTPUT_FORMAT_LABELS } from "@/lib/constants";

export function RequestDetail({ id }: { id: string }) {
  const { hydrated, version } = useApp();

  const data = useMemo(() => {
    if (!hydrated) return null;
    const req = getRequest(id);
    if (!req) return null;
    return {
      req,
      requestor: getUser(req.requestorId),
      engineer: req.assignedEngineerId ? getUser(req.assignedEngineerId) : null,
      reviewer: req.reviewerId ? getUser(req.reviewerId) : null,
      clarifications: getClarifications(id),
      deliverables: getDeliverables(id),
      approvals: getApprovals(id),
      efforts: getEfforts(id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id, version]);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Request tidak ditemukan.</p>
        <Button variant="link" nativeButton={false} render={<Link href="/requests" />} className="mt-2">
          Kembali ke daftar
        </Button>
      </div>
    );
  }

  const { req, requestor, engineer, reviewer, clarifications, deliverables, approvals, efforts } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" size="xs" nativeButton={false} render={<Link href="/requests" />}>
              <ArrowLeft className="size-3.5" />
              Requests
            </Button>
            <span>·</span>
            <span className="font-mono text-xs">{req.code}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{req.title}</h1>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <StatusBadge status={req.status} />
            <PriorityBadge priority={req.priority} />
            <SensitivityBadge level={req.sensitivity} />
            <SlaIndicator request={req} />
          </div>
        </div>
        <TransitionActions request={req} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="size-4" />
                Tujuan & Spesifikasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Tujuan penggunaan data</div>
                <p className="leading-relaxed">{req.purpose}</p>
              </div>
              <Separator />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Periode data" value={formatPeriod(req.period)} />
                <DetailField label="Granularity" value={req.granularity === "aggregate" ? "Aggregate" : "Individual"} />
                <DetailField
                  label="Output format"
                  value={req.outputFormats.map((f) => OUTPUT_FORMAT_LABELS[f]).join(", ")}
                />
                <DetailField
                  label="Tanggal dibutuhkan"
                  value={format(new Date(req.dueDate), "d MMM yyyy", { locale: localeID })}
                />
                <DetailField
                  label="Scope entitas"
                  value={req.scopeEntities.length > 2 ? `${req.scopeEntities.length} entitas` : req.scopeEntities.join(", ")}
                />
                <DetailField label="Scope unit organisasi" value={req.scopeOrgUnits.slice(0, 3).join(", ") || "—"} />
              </div>
            </CardContent>
          </Card>

          {approvals.length > 0 && <ApprovalPanel request={req} />}

          <ReviewGate request={req} deliverables={deliverables} />

          <ClarificationThread requestId={req.id} clarifications={clarifications} />

          <EffortList efforts={efforts} />

          {deliverables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="size-4" />
                  Deliverables ({deliverables.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {deliverables.map((d) => (
                  <div key={d.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Versi {d.version}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(d.createdAt), "d MMM yyyy HH:mm", { locale: localeID })}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cut-off: {d.extractionDate} · {d.sources.length} sumber data
                    </div>
                    {d.caveats && <p className="text-xs italic text-muted-foreground">⚠ {d.caveats}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {d.files.slice(0, 3).map((f) => (
                        <span key={f.id} className="inline-flex items-center gap-1 text-xs rounded bg-muted px-2 py-1">
                          <FileText className="size-3" />
                          {f.filename}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <RequestActionsPanel request={req} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">People</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <PersonRow label="Requestor" user={requestor} entity={req.requestorEntity} />
              {engineer && <PersonRow label="Engineer" user={engineer} />}
              {reviewer && <PersonRow label="Reviewer" user={reviewer} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailField
                label="Kategori"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Tag className="size-3.5 text-muted-foreground" />
                    {CATEGORY_LABELS[req.category]}
                  </span>
                }
              />
              <DetailField
                label="Diajukan"
                value={
                  req.submittedAt
                    ? format(new Date(req.submittedAt), "d MMM yyyy HH:mm", { locale: localeID })
                    : "—"
                }
              />
              <DetailField
                label="Dibuat"
                value={format(new Date(req.createdAt), "d MMM yyyy HH:mm", { locale: localeID })}
              />
              {req.deliveredAt && (
                <DetailField
                  label="Dikirim"
                  value={format(new Date(req.deliveredAt), "d MMM yyyy HH:mm", { locale: localeID })}
                />
              )}
              {req.closedAt && (
                <DetailField
                  label="Ditutup"
                  value={format(new Date(req.closedAt), "d MMM yyyy HH:mm", { locale: localeID })}
                />
              )}
              <DetailField label="SLA target" value={`${req.slaHours} jam`} />
              {efforts.length > 0 && (
                <DetailField
                  label="Total effort"
                  value={`${efforts.reduce((s, e) => s + e.hours, 0).toFixed(1)} jam`}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkflowTimeline request={req} approvals={approvals} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm">{value}</div>
    </div>
  );
}

function PersonRow({
  label,
  user,
  entity,
}: {
  label: string;
  user: ReturnType<typeof getUser>;
  entity?: string;
}) {
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <Avatar className="size-9">
        <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight flex-1 min-w-0">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{user.name}</span>
        {entity && <span className="text-xs text-muted-foreground line-clamp-1">{entity}</span>}
      </div>
    </div>
  );
}

function formatPeriod(period: { type: string; date?: string; startDate?: string; endDate?: string }): string {
  if (period.type === "point-in-time" && period.date) {
    return `Per ${format(new Date(period.date), "d MMM yyyy", { locale: localeID })}`;
  }
  if (period.type === "range" && period.startDate && period.endDate) {
    return `${format(new Date(period.startDate), "d MMM yyyy", { locale: localeID })} – ${format(new Date(period.endDate), "d MMM yyyy", { locale: localeID })}`;
  }
  return "—";
}
