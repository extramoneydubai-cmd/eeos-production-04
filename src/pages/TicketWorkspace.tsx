/**
 * TicketWorkspace — Enterprise Ticket Detail Workspace
 *
 * WorkspaceShell with 12 tabs:
 * Overview, Conversation, Timeline, Approvals, SLA, Assets,
 * Knowledge, Tasks, Notes, Documents, Activity, History
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, MessageSquare, Clock, CheckCircle, XCircle,
  AlertCircle, Activity, FileText, BookOpen, ListChecks,
  StickyNote, FolderOpen, History, Shield, Gauge,
  User, Calendar, Tag, Send, Paperclip, MoreHorizontal,
  RefreshCw, Plus, Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { TICKET_TYPES, TICKET_STATUSES, TICKET_PRIORITIES } from "@/platform/support/SupportEngine";

type Tab = "overview" | "conversation" | "timeline" | "approvals" | "sla" | "assets" | "knowledge" | "tasks" | "notes" | "documents" | "activity" | "history";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "conversation", label: "Conversation", icon: MessageSquare },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "approvals", label: "Approvals", icon: Shield },
  { id: "sla", label: "SLA", icon: Gauge },
  { id: "assets", label: "Assets", icon: FolderOpen },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "tasks", label: "Tasks", icon: ListChecks },
  { id: "notes", label: "Notes", icon: StickyNote },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "history", label: "History", icon: History },
];

function getTypeColor(type: string): string {
  return TICKET_TYPES.find((t) => t.id === type)?.color || "#9aa0a6";
}

function getStatusColor(status: string): string {
  return TICKET_STATUSES.find((s) => s.id === status)?.color || "#9aa0a6";
}

export default function TicketWorkspace() {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [commentText, setCommentText] = useState("");

  const detail = useQuery(api.supportEngine.getTicket, ticketId ? { ticketId } : "skip") as any;
  const updateTicketMut = useMutation(api.supportEngine.updateTicket);
  const addCommentMut = useMutation(api.supportEngine.addComment);

  const ticket = detail?.ticket;
  const comments = detail?.comments ?? [];
  const timeline = detail?.timeline ?? [];
  const slaStatus = detail?.sla;
  const relatedArticles = detail?.relatedArticles ?? [];

  if (!ticketId || !detail) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-[#9aa0a6] mx-auto mb-3 animate-spin" />
          <p className="text-[14px] font-medium text-[#1a1a2e]">Loading ticket…</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-[#9aa0a6] mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[#1a1a2e]">Ticket not found</p>
          <Button size="sm" className="mt-3 h-8 text-[11px]" onClick={() => navigate("/tickets")}>
            Back to Tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate("/tickets")} className="p-1.5 rounded-lg hover:bg-[#f1f3f4] transition-colors">
            <ArrowLeft className="h-4 w-4 text-[#5f6368]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#9aa0a6]">{ticket.ticketNumber}</span>
            <h1 className="text-[16px] font-semibold text-[#1a1a2e]">{ticket.title}</h1>
            <Badge variant="outline" className="text-[9px] h-4 capitalize" style={{ color: getStatusColor(ticket.status), borderColor: `${getStatusColor(ticket.status)}30` }}>
              {ticket.status.replace("_", " ")}
            </Badge>
            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize", {
              "bg-red-100 text-red-700": ticket.priority === "critical",
              "bg-orange-100 text-orange-700": ticket.priority === "high",
              "bg-yellow-100 text-yellow-700": ticket.priority === "medium",
              "bg-green-100 text-green-700": ticket.priority === "low",
            })}>{ticket.priority}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-4">
          <select
            value={ticket.status}
            onChange={(e) => { updateTicketMut({ ticketId: ticket._id, status: e.target.value }); }}
            className="h-7 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white"
          >
            {TICKET_STATUSES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
          </select>
          <select
            value={ticket.priority}
            onChange={(e) => { updateTicketMut({ ticketId: ticket._id, priority: e.target.value }); }}
            className="h-7 text-[11px] px-2 border border-[#e8eaed] rounded-md bg-white"
          >
            {TICKET_PRIORITIES.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
          </select>
          <Button size="sm" variant="outline" className="h-7 text-[10px]">
            <Send className="h-3 w-3 mr-1" /> Assign
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-[10px]">
            <RefreshCw className="h-3 w-3 mr-1" /> Escalate
          </Button>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-7 text-[10px]">
            <Paperclip className="h-3 w-3 mr-1" /> Attach
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-4 border-b border-[#e8eaed] overflow-x-auto">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn("flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id ? "border-[#1a73e8] text-[#1a73e8]" : "border-transparent text-[#5f6368] hover:text-[#1a1a2e]"
              )}>
              <tab.icon className="h-3 w-3" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ─── Tab Contents ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <Card className="border-[#e8eaed] p-4">
                <h3 className="text-[13px] font-semibold text-[#1a1a2e] mb-3">Ticket Details</h3>
                <div className="grid grid-cols-2 gap-4 text-[12px]">
                  <div><span className="text-[#9aa0a6]">Type</span><p className="font-medium flex items-center gap-1.5 mt-0.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor(ticket.type) }} />
                    {TICKET_TYPES.find((t) => t.id === ticket.type)?.label || ticket.type}</p></div>
                  <div><span className="text-[#9aa0a6]">Status</span><p className="font-medium mt-0.5 capitalize">{ticket.status.replace("_", " ")}</p></div>
                  <div><span className="text-[#9aa0a6]">Priority</span><p className="font-medium mt-0.5 capitalize">{ticket.priority}</p></div>
                  <div><span className="text-[#9aa0a6]">Source</span><p className="font-medium mt-0.5 capitalize">{ticket.source || "Portal"}</p></div>
                  <div><span className="text-[#9aa0a6]">Requester</span><p className="font-medium mt-0.5">{ticket.requesterName || "—"}</p></div>
                  <div><span className="text-[#9aa0a6]">Assigned To</span><p className="font-medium mt-0.5">{ticket.assignedTo ? ticket.assignedTo.slice(0, 12) : "Unassigned"}</p></div>
                  <div><span className="text-[#9aa0a6]">Created</span><p className="font-medium mt-0.5">{new Date(ticket.createdAt).toLocaleString()}</p></div>
                  <div><span className="text-[#9aa0a6]">Updated</span><p className="font-medium mt-0.5">{new Date(ticket.updatedAt).toLocaleString()}</p></div>
                </div>
                {ticket.description && (
                  <div className="mt-4 pt-3 border-t border-[#e8eaed]">
                    <span className="text-[11px] text-[#9aa0a6] font-medium">Description</span>
                    <p className="text-[12px] text-[#1a1a2e] mt-1 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                )}
                {ticket.tags?.length ? (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <Tag className="h-3 w-3 text-[#9aa0a6]" />
                    {ticket.tags.map((tag) => (<Badge key={tag} variant="outline" className="text-[9px] h-4">{tag}</Badge>))}
                  </div>
                ) : null}
              </Card>
            )}

            {/* Conversation Tab */}
            {activeTab === "conversation" && (
              <Card className="border-[#e8eaed]">
                <div className="px-4 py-2.5 border-b border-[#e8eaed] flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-[#1a1a2e]">Conversation ({comments.length})</span>
                </div>
                <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                  {comments.length > 0 ? comments.map((c) => (
                    <div key={c.id} className={cn("p-3 rounded-lg", c.isInternal ? "bg-amber-50 border border-amber-200" : "bg-white border border-[#e8eaed]")}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#e8f0fe] flex items-center justify-center">
                            <span className="text-[8px] font-bold text-[#1a73e8]">{c.authorName?.charAt(0) || "S"}</span>
                          </div>
                          <span className="text-[11px] font-medium text-[#1a1a2e]">{c.authorName || "System"}</span>
                          {c.isInternal && <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-amber-100 text-amber-700 border-amber-200">Internal</Badge>}
                        </div>
                        <span className="text-[9px] text-[#9aa0a6]">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-[12px] text-[#1a1a2e] whitespace-pre-wrap">{c.body}</p>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-[12px] text-[#9aa0a6]">No comments yet</div>
                  )}
                </div>
                <div className="p-4 border-t border-[#e8eaed]">
                  <div className="flex gap-2">
                    <textarea value={commentText} onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..." rows={2}
                      className="flex-1 text-[12px] px-3 py-2 border border-[#e8eaed] rounded-lg resize-none outline-none focus:border-[#1a73e8]"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <label className="flex items-center gap-1 text-[10px] text-[#9aa0a6] cursor-pointer">
                      <input type="checkbox" className="rounded" /> Internal note
                    </label>
                    <Button size="sm" className="h-7 text-[11px]" disabled={!commentText.trim()}
                      onClick={() => { addCommentMut({ ticketId: ticket._id, body: commentText, authorName: user?.name || "Agent" }); setCommentText(""); }}>
                      <Send className="h-3 w-3 mr-1" /> Send
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Timeline Tab */}
            {activeTab === "timeline" && (
              <Card className="border-[#e8eaed] p-4">
                <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Timeline</h3>
                <div className="space-y-2">
                  {timeline.map((e) => (
                    <div key={e.id} className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-[#4285f4] mt-1.5 shrink-0" />
                      <div>
                        <p className="text-[11px] text-[#1a1a2e]">{e.description}</p>
                        <p className="text-[9px] text-[#9aa0a6]">{e.actorName ? `${e.actorName} · ` : ""}{new Date(e.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {timeline.length === 0 && <p className="text-[11px] text-[#9aa0a6] text-center py-4">No timeline events</p>}
                </div>
              </Card>
            )}

            {/* SLA Tab */}
            {activeTab === "sla" && (
              <Card className="border-[#e8eaed] p-4">
                <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">SLA Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed]">
                    <div>
                      <p className="text-[11px] font-medium text-[#1a1a2e]">Response SLA</p>
                      <p className="text-[10px] text-[#5f6368]">Due: {slaStatus?.responseDueAt ? new Date(slaStatus.responseDueAt).toLocaleString() : "—"}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] h-4", slaStatus?.responseSlaMet ? "bg-green-50 text-green-600 border-green-200" : slaStatus ? "bg-red-50 text-red-600 border-red-200" : "")}>
                      {slaStatus?.responseSlaMet === undefined ? "Pending" : slaStatus.responseSlaMet ? "Met" : "Breached"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border border-[#e8eaed]">
                    <div>
                      <p className="text-[11px] font-medium text-[#1a1a2e]">Resolution SLA</p>
                      <p className="text-[10px] text-[#5f6368]">Due: {slaStatus?.resolutionDueAt ? new Date(slaStatus.resolutionDueAt).toLocaleString() : "—"}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] h-4", slaStatus?.resolutionSlaMet ? "bg-green-50 text-green-600 border-green-200" : slaStatus ? "bg-red-50 text-red-600 border-red-200" : "")}>
                      {slaStatus?.resolutionSlaMet === undefined ? "Pending" : slaStatus.resolutionSlaMet ? "Met" : "Breached"}
                    </Badge>
                  </div>
                  <div className="text-[10px] text-[#5f6368]">
                    Breach count: {slaStatus?.breachCount || 0} · Escalation level: {slaStatus?.escalationLevel || 0}
                  </div>
                </div>
              </Card>
            )}

            {/* Knowledge Tab */}
            {activeTab === "knowledge" && (
              <Card className="border-[#e8eaed] p-4">
                <h3 className="text-[12px] font-semibold text-[#1a1a2e] mb-3">Related Knowledge Articles</h3>
                <div className="space-y-2">
                  {relatedArticles.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#fafafa] cursor-pointer transition-colors">
                      <BookOpen className="h-3.5 w-3.5 text-[#1a73e8] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[11px] font-medium text-[#1a1a2e]">{a.title}</p>
                        <p className="text-[9px] text-[#9aa0a6]">{a.views} views · {a.helpfulCount} helpful</p>
                      </div>
                    </div>
                  ))}
                  {relatedArticles.length === 0 && <p className="text-[11px] text-[#9aa0a6] text-center py-4">No related articles</p>}
                </div>
              </Card>
            )}

            {/* Placeholder tabs */}
            {["approvals", "assets", "tasks", "notes", "documents", "activity", "history"].includes(activeTab) && (
              <Card className="border-[#e8eaed] p-4">
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 text-[#9aa0a6] mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-[#1a1a2e] capitalize">{activeTab} tab</p>
                  <p className="text-[11px] text-[#5f6368] mt-1">This section is ready for content</p>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-3">
            <Card className="border-[#e8eaed] p-3">
              <p className="text-[10px] text-[#9aa0a6] font-medium mb-1.5">Requester Info</p>
              <p className="text-[12px] font-medium text-[#1a1a2e]">{ticket.requesterName || "—"}</p>
              <p className="text-[10px] text-[#5f6368]">{ticket.requesterEmail || ""}</p>
              <p className="text-[10px] text-[#5f6368]">{ticket.requesterType || ""} {ticket.requesterId ? `· ID: ${ticket.requesterId.slice(0, 8)}` : ""}</p>
            </Card>

            <Card className="border-[#e8eaed] p-3">
              <p className="text-[10px] text-[#9aa0a6] font-medium mb-1.5">Organization</p>
              <div className="space-y-1 text-[11px]">
                {ticket.branchId && <p>Branch: {ticket.branchId.slice(0, 8)}</p>}
                {ticket.departmentId && <p>Dept: {ticket.departmentId.slice(0, 8)}</p>}
                {!ticket.branchId && !ticket.departmentId && <p className="text-[#9aa0a6]">No org data</p>}
              </div>
            </Card>

            <Card className="border-[#e8eaed] p-3">
              <p className="text-[10px] text-[#9aa0a6] font-medium mb-1.5">Activity</p>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-[#5f6368]">Created</span>
                  <span className="text-[#1a1a2e]">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                {ticket.firstResponseAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f6368]">First response</span>
                    <span className="text-[#1a1a2e]">{new Date(ticket.firstResponseAt).toLocaleDateString()}</span>
                  </div>
                )}
                {ticket.resolvedAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#5f6368]">Resolved</span>
                    <span className="text-[#1a1a2e]">{new Date(ticket.resolvedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
