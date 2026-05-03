import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Request, ApprovalStep } from "@/types/domain";
import { STATUS_LABELS, type RequestStatus } from "@/lib/constants";
import { STATUS_ORDER, isTerminal } from "@/features/workflow/lib/state-machine";

export function WorkflowTimeline({ request, approvals }: { request: Request; approvals: ApprovalStep[] }) {
  const currentIndex = STATUS_ORDER.indexOf(request.status);
  const terminal = isTerminal(request.status);

  const steps: { status: RequestStatus; label: string; reached: boolean; current: boolean }[] =
    STATUS_ORDER.map((s, i) => ({
      status: s,
      label: STATUS_LABELS[s],
      reached: currentIndex >= i || terminal,
      current: !terminal && currentIndex === i,
    }));

  if (terminal) {
    steps.push({
      status: request.status,
      label: STATUS_LABELS[request.status],
      reached: true,
      current: true,
    });
  }

  return (
    <ol className="space-y-3">
      {steps.map((step) => {
        const Icon = step.current ? Clock : step.reached ? CheckCircle2 : Circle;
        return (
          <li key={step.status} className="flex items-start gap-3">
            <Icon
              className={cn(
                "size-4 mt-0.5 shrink-0",
                step.current
                  ? "text-amber-500"
                  : step.reached
                    ? "text-emerald-600"
                    : "text-muted-foreground/50",
              )}
            />
            <div className="flex-1 min-w-0">
              <div
                className={cn(
                  "text-sm",
                  step.current
                    ? "font-medium"
                    : step.reached
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                {step.label}
              </div>
              {step.status === "pending_approval" && approvals.length > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {approvals.filter((a) => a.decision === "approved").length} dari {approvals.length} approver
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
