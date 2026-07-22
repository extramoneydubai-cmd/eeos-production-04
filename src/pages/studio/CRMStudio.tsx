import { StudioLayout } from "@/components/layout/StudioLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Users } from "lucide-react";

export default function CRMStudio() {
  return (
    <StudioLayout
      title="CRM"
      description="Manage customer relationships and interactions."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "CRM" },
      ]}
    >
      <EmptyState
        title="CRM Studio"
        description="CRM functionality will be restored here."
        icon={<Users className="h-5 w-5" />}
      />
    </StudioLayout>
  );
}
