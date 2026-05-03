"use client";

import { getDB, update } from "@/lib/store";
import type { KBArticle } from "@/types/domain";

export interface KBFilter {
  search?: string;
  type?: KBArticle["type"];
  status?: KBArticle["status"];
  tag?: string;
}

export function listArticles(filter: KBFilter = {}): KBArticle[] {
  const db = getDB();
  let result = [...db.articles];
  if (filter.type) result = result.filter((a) => a.type === filter.type);
  if (filter.status) result = result.filter((a) => a.status === filter.status);
  if (filter.tag) result = result.filter((a) => a.tags.includes(filter.tag!));
  if (filter.search) {
    const q = filter.search.toLowerCase();
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }
  return result.sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1));
}

export function getArticle(id: string): KBArticle | undefined {
  return getDB().articles.find((a) => a.id === id);
}

export function incrementViews(id: string) {
  update("articles", (list) =>
    list.map((a) => (a.id === id ? { ...a, views: a.views + 1 } : a)),
  );
}

export function relatedArticles(article: KBArticle, max = 4): KBArticle[] {
  const db = getDB();
  return db.articles
    .filter((a) => a.id !== article.id)
    .map((a) => {
      const overlap = a.tags.filter((t) => article.tags.includes(t)).length;
      const sameCategory = a.category === article.category ? 2 : 0;
      const sameType = a.type === article.type ? 1 : 0;
      return { article: a, score: overlap * 2 + sameCategory + sameType };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((x) => x.article);
}

export function allTags(): { tag: string; count: number }[] {
  const db = getDB();
  const map = new Map<string, number>();
  for (const a of db.articles) {
    for (const t of a.tags) map.set(t, (map.get(t) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));
}
