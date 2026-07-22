import { StudioLayout } from "@/components/layout/StudioLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { LineChart } from "lucide-react";

export default function SalesStudio() {
  return (
    <StudioLayout
      title="Sales"
      description="Manage sales pipeline, deals, and forecasting."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Sales" },
      ]}
    >
      <EmptyState
        title="Sales Studio"
        description="Sales functionality will be restored here."
        icon={<LineChart className="h-5 w-5" />}
      />
    </StudioLayout>
  );
}
