"use client";

import { nanoid } from "nanoid";
import { update, getDB } from "@/lib/store";
import { logAudit, transitionRequest, getRequest } from "@/features/request/lib/queries";
import type { Deliverable, DeliverableSource, Attachment } from "@/types/domain";
import { differenceInDays } from "date-fns";

export interface DeliverableInput {
  requestId: string;
  files: { filename: string; size: number; mimeType: string }[];
  sources: DeliverableSource[];
  extractionDate: string;
  caveats?: string;
  scopeIncluded?: string;
  scopeExcluded?: string;
  createdById: string;
}

export function createDeliverable(input: DeliverableInput): Deliverable {
  const db = getDB();
  const existing = db.deliverables.filter((d) => d.requestId === input.requestId);
  const version = existing.length + 1;

  const attachments: Attachment[] = input.files.map((f) => ({
    id: nanoid(),
    filename: f.filename,
    size: f.size,
    mimeType: f.mimeType,
    uploadedBy: input.createdById,
    uploadedAt: new Date().toISOString(),
  }));

  const deliverable: Deliverable = {
    id: nanoid(),
    requestId: input.requestId,
    version,
    files: attachments,
    sources: input.sources,
    extractionDate: input.extractionDate,
    caveats: input.caveats,
    scopeIncluded: input.scopeIncluded,
    scopeExcluded: input.scopeExcluded,
    reviewStatus: "pending",
    createdById: input.createdById,
    createdAt: new Date().toISOString(),
  };

  update("deliverables", (ds) => [deliverable, ...ds]);
  logAudit({
    action: "deliverable.uploaded",
    targetType: "request",
    targetId: input.requestId,
    userId: input.createdById,
    after: { version, sourceCount: input.sources.length },
  });

  transitionRequest(input.requestId, "in_review", input.createdById);

  return deliverable;
}

export function decideReview(
  deliverableId: string,
  reviewerId: string,
  decision: "approved" | "rejected",
  comment?: string,
) {
  update("deliverables", (ds) =>
    ds.map((d) =>
      d.id === deliverableId
        ? {
            ...d,
            reviewStatus: decision,
            reviewerId,
            reviewComment: comment,
            reviewedAt: new Date().toISOString(),
          }
        : d,
    ),
  );

  const db = getDB();
  const deliverable = db.deliverables.find((d) => d.id === deliverableId);
  if (!deliverable) return;

  logAudit({
    action: `review.${decision}`,
    targetType: "request",
    targetId: deliverable.requestId,
    userId: reviewerId,
    after: { deliverableId, comment },
  });

  if (decision === "approved") {
    transitionRequest(deliverable.requestId, "pending_requestor_confirmation", reviewerId, comment);
  } else {
    transitionRequest(deliverable.requestId, "in_progress", reviewerId, comment);
  }
}

export function recordCsat(
  requestId: string,
  userId: string,
  rating: number,
  comment?: string,
  action: "confirm" | "revision" = "confirm",
) {
  update("requests", (rs) =>
    rs.map((r) =>
      r.id === requestId
        ? {
            ...r,
            csat: { rating, comment },
            updatedAt: new Date().toISOString(),
          }
        : r,
    ),
  );

  logAudit({
    action: `requestor.${action}`,
    targetType: "request",
    targetId: requestId,
    userId,
    after: { rating, comment },
  });

  if (action === "confirm") {
    transitionRequest(requestId, "delivered", userId);
    setTimeout(() => transitionRequest(requestId, "closed", userId), 50);
  } else {
    transitionRequest(requestId, "reopened", userId, comment);
  }
}

export function detectCutOffInconsistency(sources: DeliverableSource[]): string | null {
  if (sources.length < 2) return null;
  const dates = sources.map((s) => new Date(s.cutOffDate).getTime()).sort();
  const spreadDays = differenceInDays(new Date(dates[dates.length - 1]), new Date(dates[0]));
  if (spreadDays > 7) {
    return `Cut-off antar sumber data berbeda hingga ${spreadDays} hari. Pertimbangkan untuk align cut-off atau dokumentasikan caveat.`;
  }
  return null;
}

export function pickupRequest(requestId: string, engineerId: string) {
  const req = getRequest(requestId);
  if (!req) return;
  update("requests", (rs) =>
    rs.map((r) =>
      r.id === requestId
        ? {
            ...r,
            assignedEngineerId: engineerId,
            status: r.status === "submitted" || r.status === "pending_approval" || r.status === "assigned" ? "assigned" : r.status,
            updatedAt: new Date().toISOString(),
          }
        : r,
    ),
  );
  logAudit({
    action: "request.pickup",
    targetType: "request",
    targetId: requestId,
    userId: engineerId,
  });
}
