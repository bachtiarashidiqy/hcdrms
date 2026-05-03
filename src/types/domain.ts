import type {
  Role,
  RequestCategory,
  RequestStatus,
  SensitivityLevel,
  Priority,
  Granularity,
  OutputFormat,
} from "@/lib/constants";

export type ID = string;

export type Entity = string;

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  entity: Entity;
  function: string;
  department?: string;
  managerId?: ID;
  avatarUrl?: string;
  initials: string;
}

export interface DataSource {
  id: ID;
  name: string;
  type: "database" | "dashboard" | "api" | "file" | "shared_folder";
  owner: string;
  refreshFrequency: "real-time" | "daily" | "weekly" | "monthly" | "ad-hoc";
  latency?: string;
  accessMethod: string;
  contactAdmin: string;
  status: "active" | "deprecated";
  description: string;
  fields?: string[];
  knownIssues?: string;
  lastSuccessfulAccess?: string;
}

export interface RequestPeriod {
  type: "point-in-time" | "range";
  date?: string;
  startDate?: string;
  endDate?: string;
}

export interface Request {
  id: ID;
  code: string;
  title: string;
  category: RequestCategory;
  purpose: string;
  requestorId: ID;
  requestorEntity: Entity;
  requestorFunction: string;
  period: RequestPeriod;
  scopeEntities: Entity[];
  scopeOrgUnits: string[];
  granularity: Granularity;
  outputFormats: OutputFormat[];
  dueDate: string;
  priority: Priority;
  sensitivity: SensitivityLevel;
  status: RequestStatus;
  assignedEngineerId?: ID;
  reviewerId?: ID;
  slaHours: number;
  slaPausedAt?: string;
  slaPausedSeconds: number;
  submittedAt?: string;
  deliveredAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
  csat?: { rating: number; comment?: string };
}

export interface Attachment {
  id: ID;
  filename: string;
  size: number;
  mimeType: string;
  uploadedBy: ID;
  uploadedAt: string;
}

export interface ApprovalStep {
  id: ID;
  requestId: ID;
  level: number;
  approverId: ID;
  approverRole: Role;
  decision: "pending" | "approved" | "rejected" | "delegated";
  comment?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface ClarificationMessage {
  id: ID;
  requestId: ID;
  authorId: ID;
  content: string;
  mentions: ID[];
  attachments?: Attachment[];
  createdAt: string;
}

export interface DeliverableSource {
  dataSourceId: ID;
  cutOffDate: string;
  refreshFrequency: string;
  formulaReference?: string;
  formulaInline?: string;
  notes?: string;
}

export interface Deliverable {
  id: ID;
  requestId: ID;
  version: number;
  files: Attachment[];
  sources: DeliverableSource[];
  extractionDate: string;
  caveats?: string;
  scopeIncluded?: string;
  scopeExcluded?: string;
  reviewStatus: "pending" | "approved" | "rejected";
  reviewerId?: ID;
  reviewComment?: string;
  reviewedAt?: string;
  createdById: ID;
  createdAt: string;
}

export interface KBArticle {
  id: ID;
  type: "article" | "formula" | "template" | "standard_answer" | "data_dictionary";
  title: string;
  content: string;
  formulaCode?: string;
  formulaLanguage?: "sql" | "dax" | "powerquery_m" | "excel" | "python";
  parameters?: { name: string; description: string; required: boolean }[];
  category?: RequestCategory;
  tags: string[];
  ownerId: ID;
  status: "draft" | "published" | "deprecated";
  version: number;
  relatedSourceIds: ID[];
  relatedRequestIds: ID[];
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  views: number;
}

export interface EffortLog {
  id: ID;
  requestId: ID;
  engineerId: ID;
  hours: number;
  phase: "clarification" | "extraction" | "processing" | "review" | "revision";
  notes?: string;
  loggedAt: string;
}

export interface AuditLog {
  id: ID;
  userId: ID;
  action: string;
  targetType: string;
  targetId: ID;
  before?: unknown;
  after?: unknown;
  ip: string;
  userAgent?: string;
  timestamp: string;
}

export interface Notification {
  id: ID;
  userId: ID;
  type: "request_submitted" | "request_assigned" | "status_change" | "clarification" | "mention" | "sla_warning" | "sla_breach" | "delivery" | "closure" | "kb_update";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}
