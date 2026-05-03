"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ArrowUpRight, Hand, Inbox, ListChecks } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useApp } from "@/components/shared/app-context";
import { listRequests, getUser, computeSlaStatus } from "@/features/request/lib/queries";
import { pickupRequest } from "@/features/fulfillment/lib/queries";
import { StatusBadge } from "@/features/request/components/status-badge";
import { PriorityBadge } from "@/features/request/components/priority-badge";
import { SlaIndicator } from "@/features/request/components/sla-indicator";
import { CATEGORY_LABELS } from "@/lib/constants";
import { isTerminal } from "@/features/workflow/lib/state-machine";
import type { Request } from "@/types/domain";

type Tab = "mine" | "queue";

export function Worklist() {
  const { currentUser, hydrated, version } = useApp();
  const [tab, setTab] = useState<Tab>("mine");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const data = useMemo(() => {
    if (!hydrated || !currentUser) return { mine: [], queue: [] };
    const all = listRequests();
    const mine = all
      .filter((r) => r.assignedEngineerId === currentUser.id && !isTerminal(r.status))
      .sort(slaSort);
    const queue = all
      .filter(
        (r) =>
          !r.assignedEngineerId &&
          (r.status === "submitted" ||
            r.status === "assigned" ||
            r.status === "pending_approval"),
      )
      .sort(slaSort);
    return { mine, queue };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, currentUser, version]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkPickup = () => {
    if (!currentUser || selected.size === 0) return;
    const count = selected.size;
    selected.forEach((id) => pickupRequest(id, currentUser.id));
    toast.success(`${count} request berhasil di-pickup`);
    setSelected(new Set());
    setTab("mine");
  };

  if (!hydrated || !currentUser) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setSelected(new Set()); }}>
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="mine" className="gap-1.5">
            <ListChecks className="size-3.5" />
            Saya ({data.mine.length})
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-1.5">
            <Inbox className="size-3.5" />
            Group Queue ({data.queue.length})
          </TabsTrigger>
        </TabsList>
        {tab === "queue" && selected.size > 0 && (
          <Button onClick={bulkPickup}>
            <Hand className="size-4" />
            Pickup {selected.size} request
          </Button>
        )}
      </div>

      <TabsContent value="mine" className="mt-4">
        <WorklistTable rows={data.mine} mode="mine" />
      </TabsContent>
      <TabsContent value="queue" className="mt-4">
        <WorklistTable
          rows={data.queue}
          mode="queue"
          selected={selected}
          onToggleSelect={toggleSelect}
        />
      </TabsContent>
    </Tabs>
  );
}

function slaSort(a: Request, b: Request) {
  const aSla = computeSlaStatus(a).remainingHours;
  const bSla = computeSlaStatus(b).remainingHours;
  return aSla - bSla;
}

interface WorklistTableProps {
  rows: Request[];
  mode: "mine" | "queue";
  selected?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function WorklistTable({ rows, mode, selected, onToggleSelect }: WorklistTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
        {mode === "mine"
          ? "Tidak ada request aktif untuk Anda. Cek group queue untuk pickup."
          : "Group queue kosong. Semua request sudah ditangani."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-x-auto">
      <Table className="min-w-[700px]">
        <TableHeader>
          <TableRow>
            {mode === "queue" && <TableHead className="w-10"></TableHead>}
            <TableHead className="w-24">SLA</TableHead>
            <TableHead className="w-24 hidden sm:table-cell">Kode</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead className="w-36 hidden lg:table-cell">Requestor</TableHead>
            <TableHead className="w-32 hidden xl:table-cell">Kategori</TableHead>
            <TableHead className="w-24 hidden md:table-cell">Prioritas</TableHead>
            <TableHead className="w-32">Status</TableHead>
            <TableHead className="w-24 hidden lg:table-cell">Diajukan</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((req) => {
            const requestor = getUser(req.requestorId);
            const isChecked = selected?.has(req.id) ?? false;
            return (
              <TableRow key={req.id} className="group">
                {mode === "queue" && (
                  <TableCell>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => onToggleSelect?.(req.id)}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <SlaIndicator request={req} compact />
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground hidden sm:table-cell">
                  {req.code}
                </TableCell>
                <TableCell className="max-w-[260px]">
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
                <TableCell className="hidden md:table-cell">
                  <PriorityBadge priority={req.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                  {req.submittedAt
                    ? format(new Date(req.submittedAt), "d MMM yy", { locale: localeID })
                    : "—"}
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
          })}
        </TableBody>
      </Table>
    </div>
  );
}
