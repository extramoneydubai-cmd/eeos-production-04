/**
 * RoleDashboard — Generic role-specific executive dashboard
 *
 * A thin wrapper around ExecutiveDashboard for specific roles.
 * Each role gets its own route and config-driven layout.
 */

import React from "react";
import ExecutiveDashboard from "./ExecutiveDashboard";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { ChevronLeft } from "lucide-react";

interface RoleDashboardProps {
  roleId: string;
}

export default function RoleDashboard({ roleId }: RoleDashboardProps) {
  const { navigate } = useAppNavigate();

  return (
    <div className="space-y-4">
      {/* Back to overview */}
      <button
        onClick={() => navigate("/executive")}
        className="flex items-center gap-1 text-[11px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        All Executive Dashboards
      </button>

      <ExecutiveDashboard dashboardId={roleId} />
    </div>
  );
}
