"use client";

import type {
  User,
  Request,
  ClarificationMessage,
  Deliverable,
  ApprovalStep,
  EffortLog,
  AuditLog,
  KBArticle,
  DataSource,
  Notification,
} from "@/types/domain";

export interface DB {
  users: User[];
  requests: Request[];
  clarifications: ClarificationMessage[];
  deliverables: Deliverable[];
  approvals: ApprovalStep[];
  efforts: EffortLog[];
  audits: AuditLog[];
  articles: KBArticle[];
  dataSources: DataSource[];
  notifications: Notification[];
}

const STORAGE_KEY = "hcdrms_db_v1";

let memoryDB: DB | null = null;
const subscribers = new Set<() => void>();

function emptyDB(): DB {
  return {
    users: [],
    requests: [],
    clarifications: [],
    deliverables: [],
    approvals: [],
    efforts: [],
    audits: [],
    articles: [],
    dataSources: [],
    notifications: [],
  };
}

export function getDB(): DB {
  if (memoryDB) return memoryDB;
  if (typeof window === "undefined") {
    memoryDB = emptyDB();
    return memoryDB;
  }
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      memoryDB = JSON.parse(raw) as DB;
      return memoryDB;
    } catch {
      // fall through to seed
    }
  }
  memoryDB = emptyDB();
  return memoryDB;
}

export function setDB(db: DB) {
  memoryDB = db;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }
  notify();
}

export function update<T extends keyof DB>(table: T, mutator: (current: DB[T]) => DB[T]) {
  const db = getDB();
  const next: DB = { ...db, [table]: mutator(db[table]) };
  setDB(next);
}

export function subscribe(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  for (const fn of subscribers) fn();
}

export function resetDB(seed: DB) {
  setDB(seed);
}

export function hasSeed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) !== null;
}
