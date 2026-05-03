import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Request } from "@/types/domain";
import { computeSlaStatus } from "@/features/request/lib/queries";

export function SlaIndicator({ request, compact = false }: { request: Request; compact?: boolean }) {
  const sla = computeSlaStatus(request);

  if (sla.state === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
        <CheckCircle2 className="size-3.5" />
        {!compact && <span>Selesai</span>}
      </span>
    );
  }

  const colorClass =
    sla.state === "breached"
      ? "text-red-600"
      : sla.state === "warning"
        ? "text-amber-600"
        : "text-emerald-600";
  const Icon = sla.state === "on_track" ? Clock : AlertTriangle;

  const hoursLabel =
    sla.remainingHours >= 0
      ? `${Math.floor(sla.remainingHours)}h tersisa`
      : `Lewat ${Math.abs(Math.floor(sla.remainingHours))}h`;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", colorClass)}>
      <Icon className="size-3.5" />
      {compact ? `${Math.floor(sla.remainingHours)}h` : hoursLabel}
    </span>
  );
}
