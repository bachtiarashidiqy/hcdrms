import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { BookOpen, Code2, FileCode, MessageSquare, Database, Eye } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function ArticleCard({ article }: { article: KBArticle }) {
  const meta = TYPE_META[article.type];
  const preview = article.content.split("\n").find((l) => l.trim()) ?? "";

  return (
    <Link href={`/kb/${article.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow h-full flex flex-col gap-3 cursor-pointer">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className={cn("font-normal gap-1.5", meta.color)}>
            <meta.Icon className="size-3" />
            {meta.label}
          </Badge>
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Eye className="size-3" />
            {article.views}
          </span>
        </div>
        <div className="flex-1 space-y-1.5">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug">{article.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{preview}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {article.category && (
            <Badge variant="secondary" className="text-[10px] font-normal">
              {CATEGORY_LABELS[article.category]}
            </Badge>
          )}
          {article.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
          <span>v{article.version} · {article.status}</span>
          <span>{format(new Date(article.updatedAt), "d MMM yy", { locale: localeID })}</span>
        </div>
      </Card>
    </Link>
  );
}
