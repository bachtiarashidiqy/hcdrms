import { Badge } from "@/components/ui/badge";
import { PRIORITY_LABELS, type Priority } from "@/lib/constants";
import { cn } from "@/lib/utils";

const COLORS: Record<Priority, string> = {
  standard: "bg-slate-100 text-slate-700 border-slate-200",
  priority: "bg-blue-100 text-blue-700 border-blue-200",
  urgent: "bg-red-100 text-red-700 border-red-200",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn("font-normal", COLORS[priority])}>
      {PRIORITY_LABELS[priority]}
    </Badge>
  );
}
