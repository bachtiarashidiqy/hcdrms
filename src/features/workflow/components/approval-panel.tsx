"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp } from "@/components/shared/app-context";
import { update } from "@/lib/store";
import { logAudit, getApprovals, getUser } from "@/features/request/lib/queries";
import { ROLE_LABELS } from "@/lib/constants";
import type { Request, ApprovalStep } from "@/types/domain";
import { cn } from "@/lib/utils";

export function ApprovalPanel({ request }: { request: Request }) {
  const { currentUser, version } = useApp();
  const [pending, setPending] = useState<{ step: ApprovalStep; decision: "approved" | "rejected" } | null>(null);
  const [comment, setComment] = useState("");

  const approvals = useMemo(() => getApprovals(request.id), [request.id, version]);

  if (approvals.length === 0) return null;

  const myPending = currentUser
    ? approvals.find((a) => a.approverId === currentUser.id && a.decision === "pending")
    : null;

  const decide = (step: ApprovalStep, decision: "approved" | "rejected", commentText: string) => {
    update("approvals", (list) =>
      list.map((a) =>
        a.id === step.id
          ? { ...a, decision, comment: commentText, decidedAt: new Date().toISOString() }
          : a,
      ),
    );
    if (currentUser) {
      logAudit({
        action: `approval.${decision}`,
        targetType: "request",
        targetId: request.id,
        userId: currentUser.id,
        after: { level: step.level, comment: commentText },
      });
    }
    toast.success(decision === "approved" ? "Approval diberikan" : "Approval ditolak");
    setPending(null);
    setComment("");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Approval Chain
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {approvals.map((step) => {
            const approver = getUser(step.approverId);
            const Icon =
              step.decision === "approved"
                ? CheckCircle2
                : step.decision === "rejected"
                  ? XCircle
                  : Clock;
            const colorClass =
              step.decision === "approved"
                ? "text-emerald-600"
                : step.decision === "rejected"
                  ? "text-red-600"
                  : "text-amber-600";
            return (
              <div key={step.id} className="flex items-start gap-3 rounded-md border p-3">
                <Icon className={cn("size-4 mt-0.5", colorClass)} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Level {step.level}</span>
                    <Avatar className="size-5">
                      <AvatarFallback className="text-[9px]">{approver?.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{approver?.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {ROLE_LABELS[step.approverRole]}
                    </span>
                  </div>
                  {step.comment && (
                    <p className="text-xs text-muted-foreground italic">"{step.comment}"</p>
                  )}
                  {step.decidedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(step.decidedAt), "d MMM yyyy HH:mm", { locale: localeID })}
                    </p>
                  )}
                </div>
                {currentUser?.id === step.approverId && step.decision === "pending" && (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPending({ step, decision: "approved" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setPending({ step, decision: "rejected" })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
          {myPending && (
            <p className="text-xs text-amber-600">
              Anda memiliki approval pending untuk request ini di Level {myPending.level}.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.decision === "approved" ? "Approve Request" : "Reject Request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                pending?.decision === "approved"
                  ? "Catatan approval (opsional)"
                  : "Alasan penolakan (wajib)"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Batal
            </Button>
            <Button
              variant={pending?.decision === "rejected" ? "destructive" : "default"}
              disabled={pending?.decision === "rejected" && !comment.trim()}
              onClick={() => pending && decide(pending.step, pending.decision, comment.trim())}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
