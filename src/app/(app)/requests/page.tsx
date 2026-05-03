import { PageHeader } from "@/components/shared/page-header";
import { RequestList } from "@/features/request/components/request-list";
import { NewRequestAction } from "@/features/request/components/new-request-action";

export default function RequestsPage() {
  return (
    <div>
      <PageHeader
        title="Data Requests"
        description="Daftar permintaan data kepegawaian."
        actions={<NewRequestAction />}
      />
      <RequestList />
    </div>
  );
}
