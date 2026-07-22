import { StudioLayout } from "@/components/layout/StudioLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Database } from "lucide-react";

export default function MasterDataStudio() {
  return (
    <StudioLayout
      title="Master Data"
      description="Central data repository for the entire organization."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Master Data" },
      ]}
    >
      <EmptyState
        title="Master Data Studio"
        description="Master data management will be restored here."
        icon={<Database className="h-5 w-5" />}
      />
    </StudioLayout>
  );
}
