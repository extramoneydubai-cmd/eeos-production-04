import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Target, DollarSign, User, Calendar, TrendingUp, Loader2, ArrowRight,
  BarChart3, History, X,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface OpportunityBoardProps {
  leadId?: Id<"leadMaster">;
  userId?: Id<"users">;
}

export default function OpportunityBoard({ leadId, userId }: OpportunityBoardProps) {
  const stages = useQuery(api.salesOpportunityStages.list, {});
  const opportunities = useQuery(api.opportunities.list, {
    ...(leadId ? { leadId } : {}),
    ...(userId ? { ownerId: userId } : {}),
    isActive: true,
  });
  const users = useQuery(api.users.listUsers);
  const updateOpportunity = useMutation(api.opportunities.update);
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [dragOppId, setDragOppId] = useState<string | null>(null);

  const userMap = new Map<any, any>(users?.map((u: any) => [u._id, u]) || []);
  const stageOrder = stages?.sort((a: any, b: any) => a.stageOrder - b.stageOrder) || [];

  const getOppsByStage = (stageId: string) => {
    return (opportunities || []).filter((o: any) => o.stageId === stageId)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  };

  const handleDrop = useCallback(async (oppId: string, toStageId: string) => {
    const opp = (opportunities || []).find((o: any) => o._id === oppId);
    if (!opp || opp.stageId === toStageId) return;
    const stage = stageOrder.find((s: any) => s._id === toStageId);
    await updateOpportunity({
      id: oppId as any,
      stageId: toStageId as any,
      probability: stage?.probability || opp.probability,
      userId: userId as any || opp.ownerId,
    });
    setDragOppId(null);
  }, [opportunities, stageOrder, updateOpportunity, userId]);

  const totalPipeline = (opportunities || []).reduce((s: number, o: any) => s + (o.expectedRevenue || 0), 0);
  const weightedPipeline = (opportunities || []).reduce((s: number, o: any) => s + ((o.expectedRevenue || 0) * o.probability / 100), 0);

  const stageHistoryData = useQuery(
    api.opportunities.getStageHistory,
    selectedOpp ? { opportunityId: selectedOpp._id } : "skip"
  );

  return (
    <div className="space-y-4">
      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Total Opportunities</p>
            <p className="text-lg font-bold text-[#1a1a2e]">{(opportunities || []).length}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Pipeline Value</p>
            <p className="text-lg font-bold text-[#1a1a2e]">₹{totalPipeline.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Weighted Pipeline</p>
            <p className="text-lg font-bold text-[#1a73e8]">₹{weightedPipeline.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3">
            <p className="text-[10px] text-[#9aa0a6] font-medium">Avg. Deal Size</p>
            <p className="text-lg font-bold text-[#34a853]">
              ₹{opportunities?.length ? Math.round(totalPipeline / opportunities.length).toLocaleString() : "0"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
        {stageOrder.map((stage: any) => {
          const opps = getOppsByStage(stage._id);
          const stageTotal = opps.reduce((s: number, o: any) => s + (o.expectedRevenue || 0), 0);
          return (
            <div
              key={stage._id}
              className="flex-shrink-0 w-[260px] bg-[#f8f9fa] rounded-lg border border-[#e8eaed]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragOppId) handleDrop(dragOppId, stage._id);
              }}
            >
              {/* Stage Header */}
              <div className="p-2.5 border-b border-[#e8eaed]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color || "#9aa0a6" }} />
                    <span className="text-[11px] font-semibold text-[#1a1a2e]">{stage.name}</span>
                    <span className="text-[10px] text-[#9aa0a6] bg-[#f1f3f4] px-1.5 rounded">{opps.length}</span>
                  </div>
                  <span className="text-[10px] text-[#5f6368] font-medium">₹{stageTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2" style={{ minHeight: 100 }}>
                {opps.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-[10px] text-[#9aa0a6]">No opportunities</p>
                  </div>
                )}
                {opps.map((opp: any) => {
                  const owner = userMap.get(opp.ownerId);
                  return (
                    <div
                      key={opp._id}
                      draggable
                      onDragStart={() => setDragOppId(opp._id)}
                      onClick={() => setSelectedOpp(opp)}
                      className="bg-white rounded-md border border-[#e8eaed] p-2.5 cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all active:opacity-60"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[11px] font-medium text-[#1a1a2e] leading-tight">{opp.title}</p>
                        <Badge className={`shrink-0 text-[9px] px-1 py-0 h-3.5 ${
                          opp.probability >= 70 ? "bg-[#e6f4ea] text-[#34a853]" :
                          opp.probability >= 40 ? "bg-[#fef7e0] text-[#e8710a]" :
                          "bg-[#fce8e6] text-[#ea4335]"
                        }`}>{opp.probability}%</Badge>
                      </div>

                      {opp.expectedRevenue ? (
                        <div className="flex items-center gap-1 mt-1.5">
                          <DollarSign className="h-2.5 w-2.5 text-[#34a853]" />
                          <span className="text-[10px] font-medium text-[#34a853]">₹{opp.expectedRevenue.toLocaleString()}</span>
                        </div>
                      ) : null}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-4 h-4 rounded-full bg-[#f1f3f4] flex items-center justify-center">
                            <User className="h-2 w-2 text-[#9aa0a6]" />
                          </div>
                          <span className="text-[9px] text-[#9aa0a6]">{owner?.name || "Unassigned"}</span>
                        </div>
                        {opp.expectedCloseDate && (
                          <div className="flex items-center gap-0.5">
                            <Calendar className="h-2 w-2 text-[#9aa0a6]" />
                            <span className="text-[9px] text-[#9aa0a6]">
                              {new Date(opp.expectedCloseDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOpp} onOpenChange={() => setSelectedOpp(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {selectedOpp && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-sm font-semibold">{selectedOpp.title}</DialogTitle>
                  <button onClick={() => setSelectedOpp(null)} className="text-[#9aa0a6] hover:text-[#5f6368]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <DialogDescription className="text-[11px]">
                  Created {new Date(selectedOpp.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-md bg-[#f8f9fa]">
                    <p className="text-[18px] font-bold text-[#1a73e8]">{selectedOpp.probability}%</p>
                    <p className="text-[9px] text-[#5f6368]">Probability</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-[#f8f9fa]">
                    <p className="text-[18px] font-bold text-[#34a853]">₹{(selectedOpp.expectedRevenue || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-[#5f6368]">Expected Revenue</p>
                  </div>
                  <div className="text-center p-2 rounded-md bg-[#f8f9fa]">
                    <p className="text-[18px] font-bold text-[#e8710a]">₹{(selectedOpp.expectedCloseDate ? Math.round((selectedOpp.expectedRevenue || 0) * selectedOpp.probability / 100) : 0).toLocaleString()}</p>
                    <p className="text-[9px] text-[#5f6368]">Weighted Value</p>
                  </div>
                </div>

                {/* Stage History */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <History className="h-3 w-3 text-[#5f6368]" />
                    <h4 className="text-[11px] font-semibold text-[#1a1a2e]">Stage History</h4>
                  </div>
                  <div className="space-y-1.5">
                    {(!stageHistoryData || stageHistoryData.length === 0) ? (
                      <p className="text-[10px] text-[#9aa0a6] text-center py-2">No stage history</p>
                    ) : (
                      stageHistoryData.map((h: any) => {
                        const fromStage = stageOrder.find((s: any) => s._id === h.fromStageId);
                        const toStage = stageOrder.find((s: any) => s._id === h.toStageId);
                        const changer = userMap.get(h.changedBy);
                        return (
                          <div key={h._id} className="flex items-center gap-1.5 text-[10px] text-[#5f6368]">
                            <ArrowRight className="h-2.5 w-2.5 text-[#9aa0a6]" />
                            <span>{fromStage?.name || "New"}</span>
                            <ArrowRight className="h-2.5 w-2.5 text-[#1a73e8]" />
                            <span className="font-medium text-[#1a1a2e]">{toStage?.name}</span>
                            <span className="text-[#9aa0a6]">by {changer?.name || "Unknown"}</span>
                            <span className="text-[#9aa0a6]">
                              {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {selectedOpp.notes && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-[#1a1a2e] mb-1">Notes</h4>
                    <p className="text-[11px] text-[#5f6368] bg-[#f8f9fa] p-2 rounded-md">{selectedOpp.notes}</p>
                  </div>
                )}

                {selectedOpp.tags && selectedOpp.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedOpp.tags.map((tag: string, i: number) => (
                      <Badge key={i} className="text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] text-[#5f6368]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
