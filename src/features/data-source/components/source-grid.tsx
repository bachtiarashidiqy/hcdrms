"use client";

import { useState, useMemo } from "react";
import { Search, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/components/shared/app-context";
import { listDataSources } from "@/features/data-source/lib/queries";
import { SourceCard } from "@/features/data-source/components/source-card";
import type { DataSource } from "@/types/domain";

const TYPES: { value: DataSource["type"] | "all"; label: string }[] = [
  { value: "all", label: "Semua tipe" },
  { value: "database", label: "Database" },
  { value: "dashboard", label: "Dashboard" },
  { value: "api", label: "API" },
  { value: "shared_folder", label: "Shared Folder" },
  { value: "file", label: "File" },
];

export function SourceGrid() {
  const { hydrated, version } = useApp();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<DataSource["type"] | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "deprecated">("active");

  const sources = useMemo(() => {
    if (!hydrated) return [];
    return listDataSources({
      search: search || undefined,
      type: type === "all" ? undefined : type,
      status: status === "all" ? undefined : status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, search, type, status, version]);

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
            placeholder="Cari sumber data..."
            className="pl-8"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as DataSource["type"] | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="deprecated">Deprecated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sources.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <Database className="size-8 mx-auto mb-2 opacity-40" />
          Tidak ada data source yang sesuai filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sources.map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}
    </div>
  );
}
