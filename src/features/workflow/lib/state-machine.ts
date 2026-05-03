import type { RequestStatus } from "@/lib/constants";

export type Transition = {
  from: RequestStatus;
  to: RequestStatus;
  label: string;
  allowedRoles: string[];
  requiresComment?: boolean;
};

export const TRANSITIONS: Transition[] = [
  { from: "draft", to: "submitted", label: "Submit", allowedRoles: ["requestor"] },
  { from: "draft", to: "cancelled", label: "Cancel", allowedRoles: ["requestor"] },

  { from: "submitted", to: "pending_approval", label: "Send for Approval", allowedRoles: ["hcis_manager", "engineer"] },
  { from: "submitted", to: "assigned", label: "Assign Directly", allowedRoles: ["hcis_manager"] },
  { from: "submitted", to: "rejected", label: "Reject", allowedRoles: ["hcis_manager"], requiresComment: true },

  { from: "pending_approval", to: "assigned", label: "Approve & Assign", allowedRoles: ["requestor_manager", "data_owner", "hcis_manager"] },
  { from: "pending_approval", to: "rejected", label: "Reject", allowedRoles: ["requestor_manager", "data_owner", "hcis_manager"], requiresComment: true },

  { from: "assigned", to: "in_clarification", label: "Request Clarification", allowedRoles: ["engineer"] },
  { from: "assigned", to: "in_progress", label: "Start Work", allowedRoles: ["engineer"] },
  { from: "assigned", to: "on_hold", label: "Put On Hold", allowedRoles: ["engineer", "hcis_manager"], requiresComment: true },

  { from: "in_clarification", to: "in_progress", label: "Resume Work", allowedRoles: ["engineer"] },
  { from: "in_clarification", to: "on_hold", label: "Put On Hold", allowedRoles: ["engineer", "hcis_manager"] },

  { from: "in_progress", to: "in_review", label: "Submit for Review", allowedRoles: ["engineer"] },
  { from: "in_progress", to: "in_clarification", label: "Need Clarification", allowedRoles: ["engineer"] },
  { from: "in_progress", to: "on_hold", label: "Put On Hold", allowedRoles: ["engineer"] },

  { from: "in_review", to: "pending_requestor_confirmation", label: "Approve & Deliver", allowedRoles: ["reviewer", "hcis_manager"] },
  { from: "in_review", to: "in_progress", label: "Send Back to Engineer", allowedRoles: ["reviewer", "hcis_manager"], requiresComment: true },

  { from: "pending_requestor_confirmation", to: "delivered", label: "Confirm Receipt", allowedRoles: ["requestor"] },
  { from: "pending_requestor_confirmation", to: "reopened", label: "Request Revision", allowedRoles: ["requestor"], requiresComment: true },

  { from: "delivered", to: "closed", label: "Close", allowedRoles: ["requestor", "hcis_manager"] },

  { from: "reopened", to: "in_progress", label: "Resume Work", allowedRoles: ["engineer"] },

  { from: "on_hold", to: "in_progress", label: "Resume", allowedRoles: ["engineer", "hcis_manager"] },
  { from: "on_hold", to: "cancelled", label: "Cancel", allowedRoles: ["hcis_manager"], requiresComment: true },
];

export function getAllowedTransitions(status: RequestStatus, role: string): Transition[] {
  return TRANSITIONS.filter((t) => t.from === status && t.allowedRoles.includes(role));
}

export function canTransition(from: RequestStatus, to: RequestStatus, role: string): boolean {
  return TRANSITIONS.some((t) => t.from === from && t.to === to && t.allowedRoles.includes(role));
}

export const STATUS_ORDER: RequestStatus[] = [
  "draft",
  "submitted",
  "pending_approval",
  "assigned",
  "in_clarification",
  "in_progress",
  "in_review",
  "pending_requestor_confirmation",
  "delivered",
  "closed",
];

export function isPaused(status: RequestStatus): boolean {
  return status === "in_clarification" || status === "pending_requestor_confirmation" || status === "on_hold";
}

export function isTerminal(status: RequestStatus): boolean {
  return status === "closed" || status === "cancelled" || status === "rejected";
}

export function isActive(status: RequestStatus): boolean {
  return !isTerminal(status) && status !== "draft";
}
