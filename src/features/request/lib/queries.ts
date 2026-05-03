"use client";

import { getDB, update } from "@/lib/store";
import type {
  Request,
  ClarificationMessage,
  Deliverable,
  ApprovalStep,
  EffortLog,
  AuditLog,
  User,
} from "@/types/domain";
import type { RequestStatus, Priority } from "@/lib/constants";
import { SLA_HOURS } from "@/lib/constants";
import { nanoid } from "nanoid";

export interface RequestFilter {
  status?: RequestStatus[];
  category?: string[];
  priority?: Priority[];
  assignedEngineerId?: string;
  requestorId?: string;
  search?: string;
}

export function listRequests(filter: RequestFilter = {}): Request[] {
  const db = getDB();
  let result = [...db.requests];

  if (filter.status?.length) {
    result = result.filter((r) => filter.status!.includes(r.status));
  }
  if (filter.category?.length) {
    result = result.filter((r) => filter.category!.includes(r.category));
  }
  if (filter.priority?.length) {
    result = result.filter((r) => filter.priority!.includes(r.priority));
  }
  if (filter.assignedEngineerId) {
    result = result.filter((r) => r.assignedEngineerId === filter.assignedEngineerId);
  }
  if (filter.requestorId) {
    result = result.filter((r) => r.requestorId === filter.requestorId);
  }
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q),
    );
  }

  return result.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
}

export function getRequest(id: string): Request | undefined {
  return getDB().requests.find((r) => r.id === id);
}

export function getUser(id: string): User | undefined {
  return getDB().users.find((u) => u.id === id);
}

export function getClarifications(requestId: string): ClarificationMessage[] {
  return getDB()
    .clarifications.filter((c) => c.requestId === requestId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
}

export function getDeliverables(requestId: string): Deliverable[] {
  return getDB()
    .deliverables.filter((d) => d.requestId === requestId)
    .sort((a, b) => b.version - a.version);
}

export function getApprovals(requestId: string): ApprovalStep[] {
  return getDB()
    .approvals.filter((a) => a.requestId === requestId)
    .sort((a, b) => a.level - b.level);
}

export function getEfforts(requestId: string): EffortLog[] {
  return getDB()
    .efforts.filter((e) => e.requestId === requestId)
    .sort((a, b) => (b.loggedAt > a.loggedAt ? 1 : -1));
}

export function getAudits(requestId: string): AuditLog[] {
  return getDB()
    .audits.filter((a) => a.targetType === "request" && a.targetId === requestId)
    .sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
}

export function nextRequestCode(): string {
  const db = getDB();
  const year = new Date().getFullYear();
  const max = db.requests
    .filter((r) => r.code.startsWith(`HCDRMS-${year}`))
    .reduce((m, r) => {
      const n = parseInt(r.code.split("-").pop() ?? "0", 10);
      return isNaN(n) ? m : Math.max(m, n);
    }, 0);
  return `HCDRMS-${year}-${String(max + 1).padStart(4, "0")}`;
}

export function createRequest(
  partial: Omit<
    Request,
    "id" | "code" | "status" | "slaHours" | "slaPausedSeconds" | "createdAt" | "updatedAt"
  > & { status?: RequestStatus },
): Request {
  const now = new Date().toISOString();
  const req: Request = {
    ...partial,
    id: nanoid(),
    code: nextRequestCode(),
    status: partial.status ?? "draft",
    slaHours: SLA_HOURS[partial.priority],
    slaPausedSeconds: 0,
    createdAt: now,
    updatedAt: now,
  };
  update("requests", (rs) => [req, ...rs]);
  logAudit({ action: "request.created", targetType: "request", targetId: req.id, userId: req.requestorId });
  return req;
}

export function transitionRequest(
  id: string,
  toStatus: RequestStatus,
  userId: string,
  comment?: string,
) {
  const db = getDB();
  const req = db.requests.find((r) => r.id === id);
  if (!req) return;
  const before = req.status;
  const updates: Partial<Request> = { status: toStatus, updatedAt: new Date().toISOString() };
  if (toStatus === "submitted" && !req.submittedAt) updates.submittedAt = new Date().toISOString();
  if (toStatus === "delivered" && !req.deliveredAt) updates.deliveredAt = new Date().toISOString();
  if (toStatus === "closed" && !req.closedAt) updates.closedAt = new Date().toISOString();

  update("requests", (rs) => rs.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  logAudit({
    action: `request.status_change`,
    targetType: "request",
    targetId: id,
    userId,
    before: { status: before },
    after: { status: toStatus, comment },
  });
}

export function assignEngineer(requestId: string, engineerId: string, userId: string) {
  update("requests", (rs) =>
    rs.map((r) =>
      r.id === requestId
        ? {
            ...r,
            assignedEngineerId: engineerId,
            status: r.status === "submitted" || r.status === "pending_approval" ? "assigned" : r.status,
            updatedAt: new Date().toISOString(),
          }
        : r,
    ),
  );
  logAudit({
    action: "request.assigned",
    targetType: "request",
    targetId: requestId,
    userId,
    after: { engineerId },
  });
}

export function addClarification(
  requestId: string,
  authorId: string,
  content: string,
  mentions: string[] = [],
) {
  const msg: ClarificationMessage = {
    id: nanoid(),
    requestId,
    authorId,
    content,
    mentions,
    createdAt: new Date().toISOString(),
  };
  update("clarifications", (cs) => [...cs, msg]);
  logAudit({
    action: "clarification.added",
    targetType: "request",
    targetId: requestId,
    userId: authorId,
  });
  return msg;
}

export function logEffort(
  requestId: string,
  engineerId: string,
  hours: number,
  phase: EffortLog["phase"],
  notes?: string,
) {
  const log: EffortLog = {
    id: nanoid(),
    requestId,
    engineerId,
    hours,
    phase,
    notes,
    loggedAt: new Date().toISOString(),
  };
  update("efforts", (es) => [...es, log]);
  return log;
}

export function logAudit(params: Omit<AuditLog, "id" | "timestamp" | "ip"> & { ip?: string }) {
  const log: AuditLog = {
    id: nanoid(),
    ip: params.ip ?? "127.0.0.1",
    timestamp: new Date().toISOString(),
    userId: params.userId,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    before: params.before,
    after: params.after,
  };
  update("audits", (as) => [log, ...as]);
}

export function computeSlaStatus(req: Request): {
  remainingHours: number;
  percentUsed: number;
  state: "on_track" | "warning" | "breached" | "completed";
} {
  if (req.status === "closed" || req.status === "delivered") {
    return { remainingHours: 0, percentUsed: 100, state: "completed" };
  }
  if (!req.submittedAt) {
    return { remainingHours: req.slaHours, percentUsed: 0, state: "on_track" };
  }
  const submittedMs = new Date(req.submittedAt).getTime();
  const nowMs = Date.now();
  const elapsedMs = nowMs - submittedMs - req.slaPausedSeconds * 1000;
  const elapsedHours = elapsedMs / (1000 * 60 * 60);
  const remainingHours = req.slaHours - elapsedHours;
  const percentUsed = Math.min(100, (elapsedHours / req.slaHours) * 100);
  let state: "on_track" | "warning" | "breached" = "on_track";
  if (percentUsed >= 100) state = "breached";
  else if (percentUsed >= 75) state = "warning";
  return { remainingHours, percentUsed, state };
}
