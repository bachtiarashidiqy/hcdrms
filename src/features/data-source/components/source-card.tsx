import Link from "next/link";
import { Database, BarChart3, Folder, Webhook, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DataSource } from "@/types/domain";
import { cn } from "@/lib/utils";

const TYPE_META: Record<
  DataSource["type"],
  { label: string; Icon: typeof Database; color: string }
> = {
  database: { label: "Database", Icon: Database, color: "bg-blue-50 text-blue-700 border-blue-200" },
  dashboard: { label: "Dashboard", Icon: BarChart3, color: "bg-violet-50 text-violet-700 border-violet-200" },
  api: { label: "API", Icon: Webhook, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  shared_folder: { label: "Shared Folder", Icon: Folder, color: "bg-amber-50 text-amber-700 border-amber-200" },
  file: { label: "File", Icon: FileSpreadsheet, color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function SourceCard({ source }: { source: DataSource }) {
  const meta = TYPE_META[source.type];
  return (
    <Link href={`/data-sources/${source.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow h-full flex flex-col gap-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={cn("font-normal gap-1.5", meta.color)}>
            <meta.Icon className="size-3" />
            {meta.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-normal text-[10px]",
              source.status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {source.status === "active" ? "Active" : "Deprecated"}
          </Badge>
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold leading-snug">{source.name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">{source.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <div className="text-muted-foreground">Refresh</div>
            <div className="font-medium capitalize">{source.refreshFrequency}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Owner</div>
            <div className="font-medium line-clamp-1">{source.owner}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
