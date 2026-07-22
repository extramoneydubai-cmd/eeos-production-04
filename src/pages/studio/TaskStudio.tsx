import { StudioLayout } from "@/components/layout/StudioLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListChecks } from "lucide-react";

export default function TaskStudio() {
  return (
    <StudioLayout
      title="Task Management"
      description="Track, assign, and manage tasks across the organization."
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Tasks" },
      ]}
    >
      <EmptyState
        title="Task Management Studio"
        description="Task management will be restored here."
        icon={<ListChecks className="h-5 w-5" />}
      />
    </StudioLayout>
  );
}
