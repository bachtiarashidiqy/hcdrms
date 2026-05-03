"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import {
  ArrowLeft,
  Database,
  BarChart3,
  Folder,
  Webhook,
  FileSpreadsheet,
  AlertCircle,
  Mail,
  Clock,
  KeyRound,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useApp } from "@/components/shared/app-context";
import {
  getDataSource,
  articlesUsingSource,
  recentRequestsUsingSource,
} from "@/features/data-source/lib/queries";
import { ArticleCard } from "@/features/kb/components/article-card";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { DataSource } from "@/types/domain";
import { cn } from "@/lib/utils";

const TYPE_META: Record<DataSource["type"], { label: string; Icon: typeof Database; color: string }> = {
  database: { label: "Database", Icon: Database, color: "bg-blue-50 text-blue-700 border-blue-200" },
  dashboard: { label: "Dashboard", Icon: BarChart3, color: "bg-violet-50 text-violet-700 border-violet-200" },
  api: { label: "API", Icon: Webhook, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  shared_folder: { label: "Shared Folder", Icon: Folder, color: "bg-amber-50 text-amber-700 border-amber-200" },
  file: { label: "File", Icon: FileSpreadsheet, color: "bg-slate-50 text-slate-700 border-slate-200" },
};

export function SourceDetail({ id }: { id: string }) {
  const { hydrated, version } = useApp();

  const data = useMemo(() => {
    if (!hydrated) return null;
    const source = getDataSource(id);
    if (!source) return null;
    return {
      source,
      articles: articlesUsingSource(id),
      recentRequests: recentRequestsUsingSource(id),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id, version]);

  if (!hydrated) return <div className="text-sm text-muted-foreground">Memuat...</div>;
  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Data source tidak ditemukan.</p>
        <Button variant="link" nativeButton={false} render={<Link href="/data-sources" />}>Kembali ke catalog</Button>
      </div>
    );
  }

  const { source, articles, recentRequests } = data;
  const meta = TYPE_META[source.type];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="xs" nativeButton={false} render={<Link href="/data-sources" />}>
          <ArrowLeft className="size-3.5" />
          Data Source Catalog
        </Button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("font-normal gap-1.5", meta.color)}>
            <meta.Icon className="size-3" />
            {meta.label}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "font-normal",
              source.status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200",
            )}
          >
            {source.status === "active" ? "Active" : "Deprecated"}
          </Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{source.name}</h1>
        <p className="text-sm text-muted-foreground max-w-3xl">{source.description}</p>
      </div>

      {source.knownIssues && (
        <Alert>
          <AlertCircle className="size-4 text-amber-600" />
          <AlertDescription>{source.knownIssues}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {source.fields && source.fields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fields tersedia ({source.fields.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {source.fields.map((f) => (
                    <Badge key={f} variant="secondary" className="font-mono text-[10px] font-normal">
                      {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {articles.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3">KB Articles yang reference sumber ini</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {articles.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}

          {recentRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent requests yang pakai sumber ini</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {recentRequests.map((r) => (
                  <Link
                    key={r.id}
                    href={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm hover:bg-muted transition-colors"
                  >
                    <div className="flex flex-col leading-tight min-w-0">
                      <span className="font-medium line-clamp-1">{r.title}</span>
                      <span className="text-xs text-muted-foreground">
                        <span className="font-mono">{r.code}</span> · {CATEGORY_LABELS[r.category]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(r.createdAt), "d MMM yy", { locale: localeID })}
                    </span>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Detail Akses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow icon={KeyRound} label="Owner" value={source.owner} />
              <DetailRow icon={Clock} label="Refresh" value={source.refreshFrequency} />
              {source.latency && <DetailRow icon={Clock} label="Latency" value={source.latency} />}
              <DetailRow icon={KeyRound} label="Akses" value={source.accessMethod} />
              <DetailRow icon={Mail} label="Kontak Admin" value={source.contactAdmin} />
              {source.lastSuccessfulAccess && (
                <DetailRow
                  icon={Clock}
                  label="Last access OK"
                  value={format(new Date(source.lastSuccessfulAccess), "d MMM yyyy", { locale: localeID })}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="size-3.5 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
