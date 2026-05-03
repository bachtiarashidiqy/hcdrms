import { PageHeader } from "@/components/shared/page-header";
import { AuditLogTable } from "@/features/audit/components/audit-log-table";

export default function AuditPage() {
  return (
    <div>
      <PageHeader
        title="Audit Log"
        description="Immutable log seluruh akses & perubahan data — sesuai BRD §6.8 & UU PDP."
      />
      <AuditLogTable />
    </div>
  );
}
