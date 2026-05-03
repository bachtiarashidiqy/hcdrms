"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ShieldCheck, FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { decideReview } from "@/features/fulfillment/lib/queries";
import { getDB } from "@/lib/store";
import type { Request, Deliverable } from "@/types/domain";

const REVIEWER_ROLES = ["reviewer", "hcis_manager"];

export function ReviewGate({
  request,
  deliverables,
}: {
  request: Request;
  deliverables: Deliverable[];
}) {
  const { currentUser } = useApp();
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const [comment, setComment] = useState("");

  if (!currentUser || !REVIEWER_ROLES.includes(currentUser.role)) return null;
  if (request.status !== "in_review") return null;

  const latest = deliverables.find((d) => d.reviewStatus === "pending") ?? deliverables[0];
  if (!latest) return null;

  const sources = latest.sources.map((s) => {
    const ds = getDB().dataSources.find((x) => x.id === s.dataSourceId);
    return { name: ds?.name ?? "—", cutOff: s.cutOffDate };
  });

  const decide = (decision: "approved" | "rejected", commentText: string) => {
    decideReview(latest.id, currentUser.id, decision, commentText);
    toast.success(decision === "approved" ? "Deliverable disetujui & diteruskan ke requestor" : "Deliverable dikembalikan ke engineer");
    setPending(null);
    setComment("");
  };

  const checklist = [
    { label: "Sumber data tercatat", ok: latest.sources.length > 0 },
    { label: "Tanggal ekstraksi tercatat", ok: !!latest.extractionDate },
    { label: "File deliverable terlampir", ok: latest.files.length > 0 },
    { label: "Caveats/limitations dijelaskan", ok: !!latest.caveats },
    { label: "Scope dicover dijelaskan", ok: !!latest.scopeIncluded },
  ];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="size-4" />
            Review Gate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="size-4" />
            <AlertDescription className="text-xs">
              Sebagai reviewer, Anda gatekeeper kualitas. Pastikan checklist terpenuhi sebelum approve.
            </AlertDescription>
          </Alert>

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Deliverable v{latest.version}</div>
            <div className="text-xs text-muted-foreground mb-2">
              Diajukan {format(new Date(latest.createdAt), "d MMM yyyy HH:mm", { locale: localeID })} ·
              Ekstraksi {latest.extractionDate}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {latest.files.map((f) => (
                <span key={f.id} className="inline-flex items-center gap-1 text-xs rounded bg-muted px-2 py-1">
                  <FileText className="size-3" />
                  {f.filename}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mb-1">Sumber data:</div>
            <ul className="text-xs space-y-0.5 mb-3">
              {sources.map((s, i) => (
                <li key={i} className="flex justify-between">
                  <span>{s.name}</span>
                  <span className="font-mono text-muted-foreground">cut-off {s.cutOff}</span>
                </li>
              ))}
            </ul>
            {latest.caveats && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-2 text-xs">
                <span className="font-medium">⚠ Caveats:</span> {latest.caveats}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Review Checklist</div>
            <ul className="space-y-1">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-xs">
                  <span className={c.ok ? "text-emerald-600" : "text-muted-foreground"}>
                    {c.ok ? "✓" : "○"}
                  </span>
                  <span className={c.ok ? "" : "text-muted-foreground"}>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={() => setPending("approved")} className="flex-1">
              Approve & Deliver
            </Button>
            <Button
              variant="outline"
              onClick={() => setPending("rejected")}
              className="flex-1"
            >
              Send Back
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending === "approved" ? "Approve & Deliver" : "Send Back to Engineer"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-sm">
              {pending === "approved" ? "Catatan untuk requestor (opsional)" : "Alasan dikembalikan (wajib)"}
            </Label>
            <Textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                pending === "approved"
                  ? "Mis: data sudah valid, dengan caveat cut-off..."
                  : "Mis: cut-off tidak konsisten antar sumber, mohon align"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Batal
            </Button>
            <Button
              variant={pending === "rejected" ? "destructive" : "default"}
              disabled={pending === "rejected" && !comment.trim()}
              onClick={() => pending && decide(pending, comment.trim())}
            >
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
