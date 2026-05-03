"use client";

import { getDB } from "@/lib/store";
import type { DataSource, KBArticle, Request } from "@/types/domain";

export interface DataSourceFilter {
  search?: string;
  type?: DataSource["type"];
  status?: DataSource["status"];
}

export function listDataSources(filter: DataSourceFilter = {}): DataSource[] {
  const db = getDB();
  let result = [...db.dataSources];
  if (filter.type) result = result.filter((d) => d.type === filter.type);
  if (filter.status) result = result.filter((d) => d.status === filter.status);
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q),
    );
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

export function getDataSource(id: string): DataSource | undefined {
  return getDB().dataSources.find((d) => d.id === id);
}

export function articlesUsingSource(sourceId: string): KBArticle[] {
  return getDB().articles.filter((a) => a.relatedSourceIds.includes(sourceId));
}

export function recentRequestsUsingSource(sourceId: string, max = 8): Request[] {
  const db = getDB();
  const requestIds = new Set<string>();
  for (const d of db.deliverables) {
    if (d.sources.some((s) => s.dataSourceId === sourceId)) {
      requestIds.add(d.requestId);
    }
  }
  return db.requests
    .filter((r) => requestIds.has(r.id))
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
    .slice(0, max);
}
