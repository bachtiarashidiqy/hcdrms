import { SourceDetail } from "@/features/data-source/components/source-detail";

export default async function DataSourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SourceDetail id={id} />;
}
