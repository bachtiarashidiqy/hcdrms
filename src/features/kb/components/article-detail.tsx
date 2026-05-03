"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { ArrowLeft, BookOpen, Code2, Database, FileCode, MessageSquare, Eye, Tag, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useApp } from "@/components/shared/app-context";
import { getArticle, incrementViews, relatedArticles } from "@/features/kb/lib/queries";
import { getUser } from "@/features/request/lib/queries";
import { ArticleCard } from "@/features/kb/components/article-card";
import { getDB } from "@/lib/store";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { KBArticle } from "@/types/domain";
import { cn } from "@/lib/utils";

const TYPE_META: Record<KBArticle["type"], { label: string; Icon: typeof BookOpen; color: string }> = {
  article: { label: "Article", Icon: BookOpen, color: "bg-blue-50 text-blue-700 border-blue-200" },
  formula: { label: "Formula", Icon: Code2, color: "bg-violet-50 text-violet-700 border-violet-200" },
  template: { label: "Template", Icon: FileCode, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  standard_answer: {
    label: "Standard Answer",
    Icon: MessageSquare,
    color: "bg-amber-50 text-amber-700 border-amber-200",
  },
  data_dictionary: {
    label: "Data Dictionary",
    Icon: Database,
    color: "bg-slate-50 text-slate-700 border-slate-200",
  },
};

const STATUS_COLORS: Record<KBArticle["status"], string> = {
  published: "bg-emerald-50 text-emerald-700 border-emerald-200",
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  deprecated: "bg-red-50 text-red-700 border-red-200",
};

const LANG_LABEL: Record<NonNullable<KBArticle["formulaLanguage"]>, string> = {
  sql: "SQL",
  dax: "DAX",
  powerquery_m: "Power Query M",
  excel: "Excel",
  python: "Python",
};

export function ArticleDetail({ id }: { id: string }) {
  const { hydrated, version } = useApp();

  useEffect(() => {
    if (hydrated) incrementViews(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, hydrated]);

  const data = useMemo(() => {
    if (!hydrated) return null;
    const article = getArticle(id);
    if (!article) return null;
    const owner = getUser(article.ownerId);
    const related = relatedArticles(article);
    const sources = article.relatedSourceIds
      .map((sid) => getDB().dataSources.find((d) => d.id === sid))
      .filter(Boolean) as ReturnType<typeof getDB>["dataSources"];
    const requests = article.relatedRequestIds
      .map((rid) => getDB().requests.find((r) => r.id === rid))
      .filter(Boolean);
    return { article, owner, related, sources, requests };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, id, version]);

  if (!hydrated) return <div className="text-sm text-muted-foreground">Memuat...</div>;
  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground">Article tidak ditemukan.</p>
        <Button variant="link" nativeButton={false} render={<Link href="/kb" />}>Kembali ke KB</Button>
      </div>
    );
  }

  const { article, owner, related, sources, requests } = data;
  const meta = TYPE_META[article.type];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button variant="ghost" size="xs" nativeButton={false} render={<Link href="/kb" />}>
          <ArrowLeft className="size-3.5" />
          Knowledge Base
        </Button>
        <span>·</span>
        <span>{meta.label}</span>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={cn("font-normal gap-1.5", meta.color)}>
            <meta.Icon className="size-3" />
            {meta.label}
          </Badge>
          <Badge variant="outline" className={cn("font-normal", STATUS_COLORS[article.status])}>
            {article.status === "published" ? "Published" : article.status === "draft" ? "Draft" : "Deprecated"}
          </Badge>
          <Badge variant="secondary" className="font-normal">v{article.version}</Badge>
          {article.category && (
            <Badge variant="secondary" className="font-normal">
              {CATEGORY_LABELS[article.category]}
            </Badge>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground ml-auto">
            <Eye className="size-3" />
            {article.views} views
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{article.title}</h1>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Tag className="size-3 text-muted-foreground" />
            {article.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-[10px] font-normal">
                #{t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="prose prose-sm max-w-none whitespace-pre-wrap leading-relaxed text-sm py-6">
              {article.content}
            </CardContent>
          </Card>

          {article.formulaCode && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code2 className="size-4" />
                  Formula Code
                </CardTitle>
                {article.formulaLanguage && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    {LANG_LABEL[article.formulaLanguage]}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <pre className="rounded-md bg-zinc-950 text-zinc-100 p-4 text-xs overflow-x-auto font-mono leading-relaxed">
                  <code>{article.formulaCode}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {article.parameters && article.parameters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left pb-2">Parameter</th>
                      <th className="text-left pb-2">Description</th>
                      <th className="text-left pb-2 w-20">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {article.parameters.map((p) => (
                      <tr key={p.name} className="border-t">
                        <td className="py-2 font-mono text-xs">{p.name}</td>
                        <td className="py-2">{p.description}</td>
                        <td className="py-2">
                          {p.required ? (
                            <Badge variant="outline" className="text-[10px]">required</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">optional</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {related.length > 0 && (
            <div>
              <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Link2 className="size-4" />
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related.map((a) => (
                  <ArticleCard key={a.id} article={a} />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {owner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="text-xs">{owner.initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-medium">{owner.name}</span>
                    <span className="text-xs text-muted-foreground">{owner.entity}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lifecycle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Dibuat" value={format(new Date(article.createdAt), "d MMM yyyy", { locale: localeID })} />
              <Row label="Diupdate" value={format(new Date(article.updatedAt), "d MMM yyyy", { locale: localeID })} />
              {article.lastReviewedAt && (
                <Row
                  label="Review terakhir"
                  value={format(new Date(article.lastReviewedAt), "d MMM yyyy", { locale: localeID })}
                />
              )}
            </CardContent>
          </Card>

          {sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="size-4" />
                  Related Sources
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sources.map((s) => (
                  <Link
                    key={s.id}
                    href={`/data-sources/${s.id}`}
                    className="block rounded-md border p-2 text-sm hover:bg-muted transition-colors"
                  >
                    <div className="font-medium line-clamp-1">{s.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {s.refreshFrequency} · {s.owner}
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {requests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Requests yang pakai</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {requests.slice(0, 5).map((r) => (
                  <Link
                    key={r!.id}
                    href={`/requests/${r!.id}`}
                    className="block text-xs hover:underline"
                  >
                    <span className="font-mono text-muted-foreground">{r!.code}</span> · {r!.title}
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs">{value}</span>
    </div>
  );
}
