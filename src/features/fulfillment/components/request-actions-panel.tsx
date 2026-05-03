"use client";

import { useState } from "react";
import { Upload, Clock, CheckCircle2, RotateCcw, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/components/shared/app-context";
import { DeliverableUploadDialog } from "@/features/fulfillment/components/deliverable-upload-dialog";
import { EffortLogDialog } from "@/features/fulfillment/components/effort-log-dialog";
import { CsatDialog } from "@/features/fulfillment/components/csat-dialog";
import type { Request } from "@/types/domain";

export function RequestActionsPanel({ request }: { request: Request }) {
  const { currentUser } = useApp();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [csatOpen, setCsatOpen] = useState<"confirm" | "revision" | null>(null);

  if (!currentUser) return null;

  const isAssignedEngineer = currentUser.id === request.assignedEngineerId;
  const isRequestor = currentUser.id === request.requestorId;
  const canUpload = isAssignedEngineer && (request.status === "in_progress" || request.status === "reopened");
  const canLogEffort =
    isAssignedEngineer &&
    !["draft", "closed", "cancelled", "rejected"].includes(request.status);
  const canConfirm = isRequestor && request.status === "pending_requestor_confirmation";

  if (!canUpload && !canLogEffort && !canConfirm) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="size-4" />
            Tindakan Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {canUpload && (
            <Button onClick={() => setUploadOpen(true)} className="w-full justify-start">
              <Upload className="size-4" />
              Upload Deliverable
            </Button>
          )}
          {canLogEffort && (
            <EffortLogDialog
              requestId={request.id}
              trigger={
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="size-4" />
                  Catat Effort
                </Button>
              }
            />
          )}
          {canConfirm && (
            <>
              <Button onClick={() => setCsatOpen("confirm")} className="w-full justify-start">
                <CheckCircle2 className="size-4" />
                Konfirmasi & Tutup
              </Button>
              <Button
                variant="outline"
                onClick={() => setCsatOpen("revision")}
                className="w-full justify-start"
              >
                <RotateCcw className="size-4" />
                Minta Revisi
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <DeliverableUploadDialog
        requestId={request.id}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />
      <CsatDialog
        requestId={request.id}
        open={csatOpen !== null}
        onOpenChange={(o) => !o && setCsatOpen(null)}
        mode={csatOpen ?? "confirm"}
      />
    </>
  );
}
