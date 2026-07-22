import { StudioLayout } from "@/components/layout/StudioLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { Workflow } from "lucide-react";

export default function WorkflowStudio() {
  return (
    <StudioLayout
      title="Workflow Engine"
      description="Design and automate business processes."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Workflow" },
      ]}
    >
      <EmptyState
        title="Workflow Studio"
        description="Workflow engine will be restored here."
        icon={<Workflow className="h-5 w-5" />}
      />
    </StudioLayout>
  );
}
