"use client";

import { differenceInHours, eachDayOfInterval, format, subDays } from "date-fns";
import { getDB } from "@/lib/store";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type RequestCategory,
  type RequestStatus,
  type Priority,
} from "@/lib/constants";
import { isTerminal } from "@/features/workflow/lib/state-machine";

export interface KPIs {
  totalRequests: number;
  active: number;
  pendingApproval: number;
  inProgress: number;
  closedThisMonth: number;
  slaCompliance: number;
  averageTatHours: number;
  csatAverage: number;
  csatCount: number;
}

export function computeKPIs(): KPIs {
  const { requests } = getDB();
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const closedThisMonth = requests.filter((r) => {
    if (!r.closedAt) return false;
    const d = new Date(r.closedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const completedRequests = requests.filter((r) => r.deliveredAt && r.submittedAt);
  const onTime = completedRequests.filter((r) => {
    const tat = differenceInHours(new Date(r.deliveredAt!), new Date(r.submittedAt!));
    return tat <= r.slaHours;
  }).length;
  const slaCompliance =
    completedRequests.length > 0 ? (onTime / completedRequests.length) * 100 : 0;

  const tats = completedRequests.map((r) =>
    differenceInHours(new Date(r.deliveredAt!), new Date(r.submittedAt!)),
  );
  const averageTatHours = tats.length > 0 ? tats.reduce((s, t) => s + t, 0) / tats.length : 0;

  const csatRatings = requests.filter((r) => r.csat).map((r) => r.csat!.rating);
  const csatAverage =
    csatRatings.length > 0 ? csatRatings.reduce((s, r) => s + r, 0) / csatRatings.length : 0;

  return {
    totalRequests: requests.length,
    active: requests.filter((r) => !isTerminal(r.status) && r.status !== "draft").length,
    pendingApproval: requests.filter((r) => r.status === "pending_approval").length,
    inProgress: requests.filter((r) => r.status === "in_progress").length,
    closedThisMonth,
    slaCompliance,
    averageTatHours,
    csatAverage,
    csatCount: csatRatings.length,
  };
}

export function volumeOverTime(days = 60): { date: string; submitted: number; closed: number }[] {
  const { requests } = getDB();
  const end = new Date();
  const start = subDays(end, days);
  const dates = eachDayOfInterval({ start, end });
  return dates.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const submitted = requests.filter(
      (r) => r.submittedAt && format(new Date(r.submittedAt), "yyyy-MM-dd") === key,
    ).length;
    const closed = requests.filter(
      (r) => r.closedAt && format(new Date(r.closedAt), "yyyy-MM-dd") === key,
    ).length;
    return { date: format(d, "d MMM"), submitted, closed };
  });
}

export function statusDistribution(): { status: string; count: number; key: RequestStatus }[] {
  const { requests } = getDB();
  const map = new Map<RequestStatus, number>();
  for (const r of requests) {
    map.set(r.status, (map.get(r.status) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ status: STATUS_LABELS[key], count, key }));
}

export function categoryBreakdown(): { category: string; count: number; key: RequestCategory }[] {
  const { requests } = getDB();
  const map = new Map<RequestCategory, number>();
  for (const r of requests) {
    map.set(r.category, (map.get(r.category) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ category: CATEGORY_LABELS[key], count, key }));
}

export function engineerWorkload(): {
  name: string;
  initials: string;
  active: number;
  closed: number;
  hoursLogged: number;
}[] {
  const db = getDB();
  return db.users
    .filter((u) => u.role === "engineer")
    .map((u) => {
      const assigned = db.requests.filter((r) => r.assignedEngineerId === u.id);
      const active = assigned.filter((r) => !isTerminal(r.status) && r.status !== "draft").length;
      const closed = assigned.filter((r) => r.status === "closed").length;
      const hoursLogged = db.efforts
        .filter((e) => e.engineerId === u.id)
        .reduce((s, e) => s + e.hours, 0);
      return { name: u.name, initials: u.initials, active, closed, hoursLogged };
    })
    .sort((a, b) => b.active + b.closed - a.active - a.closed);
}

export function topCategoriesByEffort(): { category: string; hours: number; key: RequestCategory }[] {
  const db = getDB();
  const map = new Map<RequestCategory, number>();
  for (const eff of db.efforts) {
    const req = db.requests.find((r) => r.id === eff.requestId);
    if (!req) continue;
    map.set(req.category, (map.get(req.category) ?? 0) + eff.hours);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key, hours]) => ({ category: CATEGORY_LABELS[key], hours: Math.round(hours * 10) / 10, key }));
}

export function priorityDistribution(): { priority: string; count: number }[] {
  const { requests } = getDB();
  const map = new Map<Priority, number>();
  for (const r of requests) {
    map.set(r.priority, (map.get(r.priority) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([priority, count]) => ({
    priority: priority === "standard" ? "Standard" : priority === "priority" ? "Priority" : "Urgent",
    count,
  }));
}

export function sensitivityDistribution(): { level: string; count: number; color: string }[] {
  const { requests } = getDB();
  const map = new Map<string, number>();
  for (const r of requests) {
    map.set(r.sensitivity, (map.get(r.sensitivity) ?? 0) + 1);
  }
  const colors: Record<string, string> = {
    public: "#10b981",
    internal: "#3b82f6",
    confidential: "#f59e0b",
    restricted: "#ef4444",
  };
  const order = ["public", "internal", "confidential", "restricted"];
  return order
    .filter((l) => map.has(l))
    .map((level) => ({
      level: level.charAt(0).toUpperCase() + level.slice(1),
      count: map.get(level)!,
      color: colors[level],
    }));
}

export function topRequestors(): { name: string; entity: string; count: number }[] {
  const db = getDB();
  const map = new Map<string, number>();
  for (const r of db.requests) {
    map.set(r.requestorId, (map.get(r.requestorId) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([userId, count]) => {
      const user = db.users.find((u) => u.id === userId);
      return { name: user?.name ?? "—", entity: user?.entity ?? "", count };
    });
}

export function sourceUtilization(): { source: string; count: number }[] {
  const db = getDB();
  const map = new Map<string, number>();
  for (const d of db.deliverables) {
    for (const s of d.sources) {
      const ds = db.dataSources.find((x) => x.id === s.dataSourceId);
      const name = ds?.name ?? "Unknown";
      map.set(name, (map.get(name) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([source, count]) => ({ source, count }));
}
