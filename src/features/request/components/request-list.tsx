"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowUpRight, Filter, Search } from "lucide-react";
import { useApp } from "@/components/shared/app-context";
import { listRequests, getUser } from "@/features/request/lib/queries";
import { StatusBadge } from "@/features/request/components/status-badge";
import { PriorityBadge } from "@/features/request/components/priority-badge";
import { SlaIndicator } from "@/features/request/components/sla-indicator";
import {
  REQUEST_CATEGORIES,
  CATEGORY_LABELS,
  REQUEST_STATUSES,
  STATUS_LABELS,
  type RequestCategory,
  type RequestStatus,
} from "@/lib/constants";

type Scope = "all" | "mine" | "assigned";

const SCOPE_OPTIONS_BY_ROLE: Record<string, Scope[]> = {
  requestor: ["mine"],
  requestor_manager: ["mine", "all"],
  engineer: ["assigned", "all"],
  reviewer: ["all", "assigned"],
  hcis_manager: ["all", "mine", "assigned"],
  data_owner: ["all"],
  admin: ["all", "mine", "assigned"],
  auditor: ["all"],
};

const SCOPE_LABELS: Record<Scope, string> = {
  all: "Semua request",
  mine: "Diajukan oleh saya",
  assigned: "Ditugaskan ke saya",
};

export function RequestList({ defaultScope }: { defaultScope?: Scope }) {
  const { currentUser, hydrated, version } = useApp();

  const allowedScopes: Scope[] = useMemo(() => {
    if (!currentUser) return ["mine"];
    return SCOPE_OPTIONS_BY_ROLE[currentUser.role] ?? ["mine"];
  }, [currentUser]);

  const initialScope: Scope =
    defaultScope && allowedScopes.includes(defaultScope) ? defaultScope : allowedScopes[0];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<RequestCategory | "all">("all");
  const [scope, setScope] = useState<Scope>(initialScope);

  // Reset scope ke yang valid untuk role saat user berganti role di tengah sesi
  useMemo(() => {
    if (!allowedScopes.includes(scope)) {
      setScope(allowedScopes[0]);
    }
  }, [allowedScopes, scope]);

  const requests = useMemo(() => {
    if (!hydrated || !currentUser) return [];
    // RBAC enforcement: requestor selalu di-clamp ke "mine" tidak peduli state
    const effectiveScope: Scope =
      currentUser.role === "requestor" ? "mine" : scope;
    return listRequests({
      search: search || undefined,
      status: statusFilter === "all" ? undefined : [statusFilter],
      category: categoryFilter === "all" ? undefined : [categoryFilter],
      requestorId: effectiveScope === "mine" ? currentUser.id : undefined,
      assignedEngineerId: effectiveScope === "assigned" ? currentUser.id : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentUser, search, statusFilter, categoryFilter, scope, version]);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Memuat data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari kode, judul, atau tujuan..."
            className="pl-8"
          />
        </div>
        {allowedScopes.length > 1 && (
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowedScopes.map((s) => (
                <SelectItem key={s} value={s}>
                  {SCOPE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RequestStatus | "all")}>
          <SelectTrigger className="w-44">
            <Filter className="size-3.5 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {REQUEST_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter}
          onValueChange={(v) => setCategoryFilter(v as RequestCategory | "all")}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {REQUEST_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table className="min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-28 hidden sm:table-cell">Kode</TableHead>
              <TableHead>Judul</TableHead>
              <TableHead className="w-40 hidden lg:table-cell">Requestor</TableHead>
              <TableHead className="w-32 hidden xl:table-cell">Kategori</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-24 hidden md:table-cell">Prioritas</TableHead>
              <TableHead className="w-28">SLA</TableHead>
              <TableHead className="w-24 hidden lg:table-cell">Tanggal</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-12">
                  Belum ada request yang sesuai filter.
                </TableCell>
              </TableRow>
            ) : (
              requests.slice(0, 100).map((req) => {
                const requestor = getUser(req.requestorId);
                return (
                  <TableRow key={req.id} className="group">
                    <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                      {req.code}
                    </TableCell>
                    <TableCell className="max-w-[280px]">
                      <Link
                        href={`/requests/${req.id}`}
                        className="font-medium hover:underline line-clamp-2 break-words"
                      >
                        {req.title}
                      </Link>
                      <span className="font-mono text-[10px] text-muted-foreground sm:hidden">
                        {req.code}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="size-6 shrink-0">
                          <AvatarFallback className="text-[10px]">
                            {requestor?.initials ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col leading-tight min-w-0">
                          <span className="text-xs font-medium line-clamp-1">{requestor?.name ?? "—"}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {req.requestorEntity}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Badge variant="secondary" className="font-normal whitespace-nowrap">
                        {CATEGORY_LABELS[req.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={req.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <PriorityBadge priority={req.priority} />
                    </TableCell>
                    <TableCell>
                      <SlaIndicator request={req} compact />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                      {format(new Date(req.createdAt), "d MMM yy", { locale: localeID })}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/requests/${req.id}`}
                        className="inline-flex size-7 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      {requests.length > 100 && (
        <p className="text-xs text-muted-foreground text-center">
          Menampilkan 100 dari {requests.length} request. Persempit filter untuk melihat lainnya.
        </p>
      )}
    </div>
  );
}
