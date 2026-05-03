export const ROLES = [
  "requestor",
  "requestor_manager",
  "engineer",
  "reviewer",
  "hcis_manager",
  "data_owner",
  "admin",
  "auditor",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  requestor: "Requestor",
  requestor_manager: "Requestor Manager",
  engineer: "HCIS Engineer",
  reviewer: "HCIS Reviewer",
  hcis_manager: "HCIS Manager",
  data_owner: "Data Owner",
  admin: "System Admin",
  auditor: "Auditor",
};

export const REQUEST_CATEGORIES = [
  "master_data",
  "headcount_demografi",
  "organization_structure",
  "compensation_analytics",
  "talent_performance",
  "learning",
  "attrition_movement",
  "custom_analytics",
  "lainnya",
] as const;

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  master_data: "Master Data",
  headcount_demografi: "Headcount & Demografi",
  organization_structure: "Organization & Structure",
  compensation_analytics: "Compensation Analytics",
  talent_performance: "Talent & Performance",
  learning: "Learning",
  attrition_movement: "Attrition & Movement",
  custom_analytics: "Custom Analytics",
  lainnya: "Lainnya",
};

export const REQUEST_STATUSES = [
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
  "rejected",
  "on_hold",
  "cancelled",
  "reopened",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const STATUS_LABELS: Record<RequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending_approval: "Pending Approval",
  assigned: "Assigned",
  in_clarification: "In Clarification",
  in_progress: "In Progress",
  in_review: "In Review",
  pending_requestor_confirmation: "Pending Confirmation",
  delivered: "Delivered",
  closed: "Closed",
  rejected: "Rejected",
  on_hold: "On Hold",
  cancelled: "Cancelled",
  reopened: "Re-opened",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  submitted: "bg-blue-100 text-blue-700 border-blue-200",
  pending_approval: "bg-amber-100 text-amber-700 border-amber-200",
  assigned: "bg-indigo-100 text-indigo-700 border-indigo-200",
  in_clarification: "bg-orange-100 text-orange-700 border-orange-200",
  in_progress: "bg-cyan-100 text-cyan-700 border-cyan-200",
  in_review: "bg-violet-100 text-violet-700 border-violet-200",
  pending_requestor_confirmation: "bg-yellow-100 text-yellow-700 border-yellow-200",
  delivered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  closed: "bg-green-100 text-green-700 border-green-200",
  rejected: "bg-red-100 text-red-700 border-red-200",
  on_hold: "bg-zinc-100 text-zinc-700 border-zinc-200",
  cancelled: "bg-stone-100 text-stone-700 border-stone-200",
  reopened: "bg-pink-100 text-pink-700 border-pink-200",
};

export const SENSITIVITY_LEVELS = ["public", "internal", "confidential", "restricted"] as const;
export type SensitivityLevel = (typeof SENSITIVITY_LEVELS)[number];

export const SENSITIVITY_LABELS: Record<SensitivityLevel, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

export const PRIORITIES = ["standard", "priority", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Record<Priority, string> = {
  standard: "Standard",
  priority: "Priority",
  urgent: "Urgent",
};

export const GRANULARITY = ["aggregate", "individual"] as const;
export type Granularity = (typeof GRANULARITY)[number];

export const OUTPUT_FORMATS = ["excel", "csv", "pdf", "powerbi_link", "dashboard_url"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  excel: "Excel",
  csv: "CSV",
  pdf: "PDF",
  powerbi_link: "Power BI Link",
  dashboard_url: "Dashboard URL",
};

export const SLA_HOURS: Record<Priority, number> = {
  standard: 72,
  priority: 24,
  urgent: 8,
};

export const GROUP_ENTITIES = [
  "Energi Nusantara (Persero) — Holding",
  "Nusantara Hulu Energi",
  "Nusantara Niaga Bahari",
  "Nusantara Maritim Shipping",
  "Nusantara Power Generasi",
  "Nusantara Geotermal",
  "Nusantara Gas Distribusi",
  "Kilang Nusantara Internasional",
] as const;

/** @deprecated kept for backwards compatibility — use GROUP_ENTITIES */
export const PERTAMINA_ENTITIES = GROUP_ENTITIES;

export const FUNCTIONS = [
  "Human Capital",
  "Finance",
  "Internal Audit",
  "Legal",
  "Strategic Planning",
  "Corporate Communications",
  "Operation",
  "Commercial",
  "IT",
  "Risk Management",
] as const;
