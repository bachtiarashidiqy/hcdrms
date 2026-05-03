import { ArticleDetail } from "@/features/kb/components/article-detail";

export default async function KBArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ArticleDetail id={id} />;
}
