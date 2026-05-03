import { PageHeader } from "@/components/shared/page-header";
import { SourceGrid } from "@/features/data-source/components/source-grid";

export default function DataSourcesPage() {
  return (
    <div>
      <PageHeader
        title="Data Source Catalog"
        description="Inventory sumber data tim HCIS — SAP HCM, Power BI, shared folder, API, dan lainnya."
      />
      <SourceGrid />
    </div>
  );
}
