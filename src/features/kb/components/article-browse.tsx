"use client";

import { useState, useMemo } from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/components/shared/app-context";
import { listArticles, allTags } from "@/features/kb/lib/queries";
import { ArticleCard } from "@/features/kb/components/article-card";
import type { KBArticle } from "@/types/domain";

const TYPES: { value: KBArticle["type"] | "all"; label: string }[] = [
  { value: "all", label: "Semua tipe" },
  { value: "article", label: "Article" },
  { value: "formula", label: "Formula" },
  { value: "template", label: "Template" },
  { value: "standard_answer", label: "Standard Answer" },
  { value: "data_dictionary", label: "Data Dictionary" },
];

export function ArticleBrowse() {
  const { hydrated, version } = useApp();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<KBArticle["type"] | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const articles = useMemo(() => {
    if (!hydrated) return [];
    return listArticles({
      search: search || undefined,
      type: type === "all" ? undefined : type,
      tag: tagFilter ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, search, type, tagFilter, version]);

  const tags = useMemo(() => (hydrated ? allTags().slice(0, 12) : []), [hydrated, version]);

  if (!hydrated) {
    return <div className="text-sm text-muted-foreground">Memuat...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari article, formula, atau definisi..."
            className="pl-8"
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as KBArticle["type"] | "all")}>
          <SelectTrigger className="w-48">
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
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Tag populer:</span>
          {tags.map((t) => (
            <button
              key={t.tag}
              onClick={() => setTagFilter(tagFilter === t.tag ? null : t.tag)}
              className="cursor-pointer"
            >
              <Badge
                variant={tagFilter === t.tag ? "default" : "secondary"}
                className="text-[10px] font-normal"
              >
                #{t.tag} <span className="ml-1 opacity-70">{t.count}</span>
              </Badge>
            </button>
          ))}
          {tagFilter && (
            <button
              onClick={() => setTagFilter(null)}
              className="text-[10px] text-muted-foreground underline cursor-pointer"
            >
              clear
            </button>
          )}
        </div>
      )}

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          <BookOpen className="size-8 mx-auto mb-2 opacity-40" />
          Tidak ada article yang sesuai filter.
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{articles.length} artikel</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
