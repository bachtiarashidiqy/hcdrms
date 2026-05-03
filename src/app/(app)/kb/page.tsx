import { PageHeader } from "@/components/shared/page-header";
import { ArticleBrowse } from "@/features/kb/components/article-browse";

export default function KBPage() {
  return (
    <div>
      <PageHeader
        title="Knowledge Base"
        description="Aset jangka panjang tim — formula, template, definisi, dan standard answer."
      />
      <ArticleBrowse />
    </div>
  );
}
