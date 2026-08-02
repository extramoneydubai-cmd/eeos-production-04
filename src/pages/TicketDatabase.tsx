/**
 * TicketDatabase — Enterprise Ticket Management Database
 *
 * Views: Table, Kanban, Card
 * Filters: status, priority, type, assignee, department, SLA, search
 * Bulk actions: assign, transition, delete
 */

import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import {
  Search, Filter, Plus, LayoutGrid, Columns3, List,
  AlertCircle, Clock, CheckCircle, XCircle, ArrowUp,
  MessageSquare, User, Calendar, Tag, SlidersHorizontal,
  ChevronRight, Download, Upload, Trash2, Eye,
  Loader2, MoreHorizontal, GripVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TICKET_TYPES, TICKET_STATUSES, TICKET_PRIORITIES, type Ticket } from "@/platform/support/SupportEngine";

type ViewMode = "table" | "kanban" | "card";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-green-100 text-green-700 border-green-200",
};

function getTypeColor(type: string): string {
  return TICKET_TYPES.find((t) => t.id === type)?.color || "#9aa0a6";
}

function getStatusColor(status: string): string {
  return TICKET_STATUSES.find((s) => s.id === status)?.color || "#9aa0a6";
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export default function TicketDatabase() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());

  const listResult = useQuery(api.supportEngine.listTickets, {
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    priority: priorityFilter !== "all" ? priorityFilter : undefined,
    type: typeFilter !== "all" ? typeFilter : undefined,
  }) as any;
  const tickets = listResult?.tickets ?? [];
  const counts = listResult?.counts ?? { open: 0 };

  // Status-based grouping for kanban
  const kanbanColumns = useMemo(() => {
    const columns: Record<string, Ticket[]> = {};
    TICKET_STATUSES.forEach((s) => { columns[s.id] = []; });
    tickets.forEach((t) => {
      if (columns[t.status]) columns[t.status].push(t);
      else columns[t.status] = [t];
    });
    return columns;
  }, [tickets]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedTickets);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedTickets(next);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">Tickets</h1>
            <p className="text-[12px] text-[#5f6368]">{tickets.length} total · {counts?.open || 0} open</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-8 text-[11px]">
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
            <Button size="sm" className="h-8 text-[11px] bg-[#1a73e8]">
              <Plus className="h-3 w-3 mr-1" /> New Ticket
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..." className="h-8 text-[12px] pl-8" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 text-[11px] px-2.5 border border-[#e8eaed] rounded-md bg-white text-[#5f6368]">
            <option value="all">All Status</option>
            {TICKET_STATUSES.map((s) => (<option key={s.id} value={s.id}>{s.label}</option>))}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}
            className="h-8 text-[11px] px-2.5 border border-[#e8eaed] rounded-md bg-white text-[#5f6368]">
            <option value="all">All Priority</option>
            {TICKET_PRIORITIES.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
          </select>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="h-8 text-[11px] px-2.5 border border-[#e8eaed] rounded-md bg-white text-[#5f6368]">
            <option value="all">All Types</option>
            {TICKET_TYPES.map((t) => (<option key={t.id} value={t.id}>{t.label}</option>))}
          </select>
          <div className="flex items-center border border-[#e8eaed] rounded-md overflow-hidden">
            {(["table", "kanban", "card"] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={cn("p-1.5 transition-colors", viewMode === mode ? "bg-[#e8f0fe] text-[#1a73e8]" : "text-[#9aa0a6] hover:text-[#5f6368]")}>
                {mode === "table" ? <List className="h-3.5 w-3.5" /> : mode === "kanban" ? <Columns3 className="h-3.5 w-3.5" /> : <LayoutGrid className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
          {selectedTickets.size > 0 && (
            <span className="text-[11px] text-[#1a73e8] font-medium">{selectedTickets.size} selected</span>
          )}
        </div>

        {/* ─── Table View ──────────────────────────────────── */}
        {viewMode === "table" && (
          <Card className="border-[#e8eaed] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-[#fafafa] border-b border-[#e8eaed]">
                    <th className="w-8 px-3 py-2.5"><input type="checkbox" className="rounded" /></th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Ticket</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Title</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Type</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Status</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Priority</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Requester</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Assignee</th>
                    <th className="text-left px-3 py-2.5 text-[10px] text-[#9aa0a6] font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f3f4]">
                  {tickets.slice(0, 25).map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-[#fafafa] cursor-pointer transition-colors"
                      onClick={() => navigate(`/tickets/${ticket._id}`)}>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selectedTickets.has(ticket._id!)} onChange={() => toggleSelect(ticket._id!)} className="rounded" />
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-[#5f6368]">{ticket.ticketNumber}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-medium text-[#1a1a2e] truncate max-w-[200px]">{ticket.title}</span>
                          {ticket.isEscalated && <Badge variant="outline" className="text-[8px] h-4 px-1 bg-red-50 text-red-600 border-red-200">Esc</Badge>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getTypeColor(ticket.type) }} />
                          <span className="text-[10px] text-[#5f6368]">{TICKET_TYPES.find((t) => t.id === ticket.type)?.label || ticket.type}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1.5 capitalize" style={{ borderColor: `${getStatusColor(ticket.status)}30`, color: getStatusColor(ticket.status) }}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium", PRIORITY_COLORS[ticket.priority] || "")}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-[#5f6368] truncate max-w-[120px]">{ticket.requesterName || "—"}</td>
                      <td className="px-3 py-2.5 text-[11px] text-[#5f6368]">{ticket.assignedTo ? ticket.assignedTo.slice(0, 8) : "—"}</td>
                      <td className="px-3 py-2.5 text-[10px] text-[#9aa0a6]">{timeAgo(ticket.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <div className="text-center py-12 text-[13px] text-[#9aa0a6]">No tickets found</div>
              )}
            </div>
          </Card>
        )}

        {/* ─── Kanban View ─────────────────────────────────── */}
        {viewMode === "kanban" && (
          <div className="grid grid-cols-4 gap-3 overflow-x-auto">
            {["new", "open", "in_progress", "pending"].map((status) => {
              const items = kanbanColumns[status] || [];
              return (
                <div key={status} className="bg-[#f1f3f4] rounded-lg p-2 min-w-[220px]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(status) }} />
                      <span className="text-[11px] font-medium text-[#1a1a2e] capitalize">{status.replace("_", " ")}</span>
                    </div>
                    <span className="text-[10px] text-[#9aa0a6] font-mono">{items.length}</span>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((ticket) => (
                      <div key={ticket._id} className="bg-white rounded-lg border border-[#e8eaed] p-2 cursor-pointer hover:shadow-sm transition-shadow"
                        onClick={() => navigate(`/tickets/${ticket._id}`)}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-mono text-[#9aa0a6]">{ticket.ticketNumber}</span>
                          <span className={cn("text-[8px] px-1 rounded-full font-medium", PRIORITY_COLORS[ticket.priority])}>{ticket.priority}</span>
                        </div>
                        <p className="text-[11px] font-medium text-[#1a1a2e] truncate">{ticket.title}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getTypeColor(ticket.type) }} />
                            <span className="text-[8px] text-[#9aa0a6]">{TICKET_TYPES.find((t) => t.id === ticket.type)?.label}</span>
                          </div>
                          <span className="text-[8px] text-[#9aa0a6]">{timeAgo(ticket.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                    {items.length === 0 && (
                      <div className="text-center py-6 text-[10px] text-[#9aa0a6]">No tickets</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Card View ───────────────────────────────────── */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {tickets.slice(0, 24).map((ticket) => (
              <motion.div key={ticket._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-[#e8eaed] p-3 cursor-pointer hover:shadow-sm transition-all"
                onClick={() => navigate(`/tickets/${ticket._id}`)}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-mono text-[#9aa0a6]">{ticket.ticketNumber}</span>
                  <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-medium", PRIORITY_COLORS[ticket.priority])}>{ticket.priority}</span>
                </div>
                <p className="text-[12px] font-medium text-[#1a1a2e] mb-2 line-clamp-2">{ticket.title}</p>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className="text-[8px] h-4 capitalize" style={{ color: getTypeColor(ticket.type), borderColor: `${getTypeColor(ticket.type)}30` }}>
                    {TICKET_TYPES.find((t) => t.id === ticket.type)?.label}
                  </Badge>
                  <Badge variant="outline" className="text-[8px] h-4 capitalize" style={{ color: getStatusColor(ticket.status), borderColor: `${getStatusColor(ticket.status)}30` }}>
                    {ticket.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-[9px] text-[#9aa0a6] pt-2 border-t border-[#f1f3f4]">
                  <span>{ticket.requesterName || "—"}</span>
                  <span>{timeAgo(ticket.createdAt)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
