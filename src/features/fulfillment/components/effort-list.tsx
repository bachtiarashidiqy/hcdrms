import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/features/request/lib/queries";
import type { EffortLog } from "@/types/domain";

const PHASE_LABELS: Record<EffortLog["phase"], string> = {
  clarification: "Clarification",
  extraction: "Extraction",
  processing: "Processing",
  review: "Review",
  revision: "Revision",
};

export function EffortList({ efforts }: { efforts: EffortLog[] }) {
  if (efforts.length === 0) return null;

  const total = efforts.reduce((s, e) => s + e.hours, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 justify-between">
          <span className="flex items-center gap-2">
            <Clock className="size-4" />
            Effort Log ({efforts.length})
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            Total {total.toFixed(1)} jam
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {efforts.slice(0, 8).map((eff) => {
          const engineer = getUser(eff.engineerId);
          return (
            <div key={eff.id} className="flex items-start justify-between gap-3 text-sm rounded-md border p-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{engineer?.name ?? "—"}</span>
                  <Badge variant="secondary" className="font-normal text-[10px]">
                    {PHASE_LABELS[eff.phase]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(eff.loggedAt), "d MMM yyyy", { locale: localeID })}
                  </span>
                </div>
                {eff.notes && <p className="text-xs text-muted-foreground mt-1">{eff.notes}</p>}
              </div>
              <span className="text-sm font-mono">{eff.hours}h</span>
            </div>
          );
        })}
        {efforts.length > 8 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{efforts.length - 8} entry lainnya
          </p>
        )}
      </CardContent>
    </Card>
  );
}
