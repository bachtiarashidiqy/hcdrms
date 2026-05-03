"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { Search, ShieldCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/components/shared/app-context";
import { getDB } from "@/lib/store";
import { getUser } from "@/features/request/lib/queries";

const ACTION_COLORS: Record<string, string> = {
  request: "bg-blue-50 text-blue-700 border-blue-200",
  status: "bg-cyan-50 text-cyan-700 border-cyan-200",
  approval: "bg-emerald-50 text-emerald-700 border-emerald-200",
  clarification: "bg-violet-50 text-violet-700 border-violet-200",
  deliverable: "bg-amber-50 text-amber-700 border-amber-200",
  review: "bg-purple-50 text-purple-700 border-purple-200",
  requestor: "bg-pink-50 text-pink-700 border-pink-200",
};

function actionTone(action: string): string {
  const prefix = action.split(".")[0];
  return ACTION_COLORS[prefix] ?? "bg-slate-100 text-slate-700 border-slate-200";
}

export function AuditLogTable() {
  const { hydrated, version } = useApp();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const data = useMemo(() => {
    if (!hydrated) return { rows: [], actionTypes: [] as string[] };
    const all = getDB().audits;
    const actionTypes = Array.from(new Set(all.map((a) => a.action))).sort();

    let rows = [...all];
    if (actionFilter !== "all") rows = rows.filter((a) => a.action === actionFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((a) => {
        const user = getUser(a.userId);
        return (
          a.action.toLowerCase().includes(q) ||
          a.targetId.toLowerCase().includes(q) ||
          (user?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }
    return {
      rows: rows.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1)).slice(0, 200),
      actionTypes,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, search, actionFilter, version]);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari user, action, atau target..."
            className="pl-8"
          />
        </div>
        <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? "all")}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua action</SelectItem>
            {data.actionTypes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {data.rows.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <ShieldCheck className="size-8 mx-auto mb-2 opacity-40" />
          Tidak ada audit log yang sesuai filter.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Menampilkan {data.rows.length} entri terbaru (immutable, append-only)
          </p>
          <div className="rounded-lg border bg-card overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36 hidden sm:table-cell">Timestamp</TableHead>
                  <TableHead className="w-40">User</TableHead>
                  <TableHead className="w-40">Action</TableHead>
                  <TableHead className="w-28 hidden lg:table-cell">Target</TableHead>
                  <TableHead className="hidden md:table-cell">Detail</TableHead>
                  <TableHead className="w-28 hidden xl:table-cell">IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => {
                  const user = getUser(row.userId);
                  const detailObj = row.after ?? row.before;
                  const detailText = detailObj
                    ? Object.entries(detailObj as Record<string, unknown>)
                        .slice(0, 2)
                        .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                        .join(" · ")
                    : "—";
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground hidden sm:table-cell whitespace-nowrap">
                        {format(new Date(row.timestamp), "d MMM yy HH:mm", { locale: localeID })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-0">
                          <Avatar className="size-6 shrink-0">
                            <AvatarFallback className="text-[10px]">
                              {user?.initials ?? "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="text-xs line-clamp-1">{user?.name ?? "—"}</span>
                            <span className="text-[10px] text-muted-foreground sm:hidden font-mono">
                              {format(new Date(row.timestamp), "d MMM HH:mm", { locale: localeID })}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] font-normal whitespace-nowrap ${actionTone(row.action)}`}>
                          {row.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground hidden lg:table-cell">
                        {row.targetType}/{row.targetId.slice(0, 6)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden md:table-cell max-w-[280px]">
                        <span className="line-clamp-1">{detailText}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground hidden xl:table-cell">
                        {row.ip}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
