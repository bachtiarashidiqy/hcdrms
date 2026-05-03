import { PageHeader } from "@/components/shared/page-header";
import { Worklist } from "@/features/fulfillment/components/worklist";

export default function WorklistPage() {
  return (
    <div>
      <PageHeader
        title="Worklist"
        description="Daftar pekerjaan engineer — diurutkan berdasarkan SLA tersisa."
      />
      <Worklist />
    </div>
  );
}
