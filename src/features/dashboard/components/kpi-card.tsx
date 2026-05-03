import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  hint?: string;
  Icon?: LucideIcon;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  tone?: "default" | "positive" | "negative" | "warning";
}

const TONE_CLASS: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-foreground",
  positive: "text-emerald-600",
  negative: "text-red-600",
  warning: "text-amber-600",
};

export function KpiCard({ label, value, hint, Icon, trend, tone = "default" }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-5 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          {Icon && <Icon className="size-4 text-muted-foreground" />}
        </div>
        <div className={cn("text-2xl font-semibold tabular-nums", TONE_CLASS[tone])}>{value}</div>
        {(hint || trend) && (
          <div className="flex items-center justify-between text-xs">
            {hint && <span className="text-muted-foreground">{hint}</span>}
            {trend && (
              <span
                className={cn(
                  "font-medium",
                  trend.direction === "up" && "text-emerald-600",
                  trend.direction === "down" && "text-red-600",
                  trend.direction === "flat" && "text-muted-foreground",
                )}
              >
                {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
