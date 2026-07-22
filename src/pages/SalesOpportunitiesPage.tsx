import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Target } from "lucide-react";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { Id } from "@/convex/_generated/dataModel";
import OpportunityBoard from "@/components/crm/OpportunityBoard";
import { useState } from "react";

export default function SalesOpportunitiesPage() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [filter, setFilter] = useState<"all" | "mine">("all");

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/crm/sales")}
            className="flex items-center gap-1 text-[12px] text-[#5f6368] hover:text-[#1a1a2e] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          <div>
            <h1 className="text-xl font-semibold text-[#1a1a2e] flex items-center gap-2">
              <Target className="h-5 w-5 text-[#e8710a]" />
              Opportunities
            </h1>
            <p className="text-[13px] text-[#5f6368] mt-0.5">Pipeline management with stage tracking & probability</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f1f3f4] rounded-lg p-0.5">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                filter === "all" ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-all ${
                filter === "mine" ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#5f6368]"
              }`}
            >
              Mine
            </button>
          </div>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]"
            onClick={() => navigate("/crm/sales")}>
            <TrendingUp className="h-3.5 w-3.5 mr-1" /> Sales Center
          </Button>
        </div>
      </div>

      {/* Opportunity Board */}
      <OpportunityBoard
        userId={filter === "mine" && user ? (user._id as Id<"users">) : undefined}
      />
    </div>
  );
}
