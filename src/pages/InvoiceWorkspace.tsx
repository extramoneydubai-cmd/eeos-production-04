/**
 * InvoiceWorkspace — Enterprise Invoice Detail Workspace
 *
 * Uses WorkspaceShell from PATCH-UI-001.
 * Consumes financePlatform queries and mutations.
 * No duplicated finance logic.
 */
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useParams, useNavigate } from "react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  WorkspaceShell, WorkspaceOverviewTab, WorkspaceTimelineTab,
  WorkspaceDocumentsTab, WorkspaceActivityTab, WorkspaceNotesTab,
} from "@/components/workspace";
import {
  FileText, Receipt, Banknote, DollarSign, Calendar, User,
  CheckCircle2, Clock, AlertCircle, ArrowLeft, Printer, Download,
  Send, XCircle, RefreshCw, TrendingUp, TrendingDown, Wallet,
  Landmark, Hash, Mail, Phone,
} from "lucide-react";
import type { WorkspaceTabDefinition, WorkspaceAction, WorkspaceHeaderField } from "@/components/workspace";

function InvoiceOverviewTab({ entity }: { entity: any }) {
  if (!entity) return null;
  const inv = entity as any;

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    partial: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800/30 dark:text-slate-400",
  };

  const sections = [
    {
      title: "Invoice Details",
      fields: [
        { label: "Invoice Number", value: inv.invoiceNumber || "—" },
        { label: "Invoice Date", value: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "—" },
        { label: "Due Date", value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—" },
        { label: "Status", value: inv.status || "—", type: "badge" as const, badgeColor: statusColors[inv.status] },
        { label: "Billing Period", value: inv.billingPeriod || "—" },
        { label: "GST %", value: inv.gstPercentage ? `${inv.gstPercentage}%` : "—" },
      ],
    },
    {
      title: "Amount Summary",
      fields: [
        { label: "Subtotal", value: `₹${(inv.subtotal || 0).toLocaleString()}`, type: "currency" as const },
        { label: "Discount", value: `₹${(inv.discountAmount || 0).toLocaleString()}`, type: "currency" as const },
        { label: "Tax", value: `₹${(inv.taxAmount || 0).toLocaleString()}`, type: "currency" as const },
        { label: "Total Amount", value: `₹${(inv.totalAmount || 0).toLocaleString()}`, type: "currency" as const },
        { label: "Paid Amount", value: `₹${(inv.paidAmount || 0).toLocaleString()}`, type: "currency" as const },
        { label: "Balance Due", value: `₹${(inv.balanceDue || 0).toLocaleString()}`, type: "currency" as const },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Card key={section.title} className="border-border/50 bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">{field.label}</span>
                    {field.type === "badge" ? (
                      <Badge className={`text-[9px] px-1.5 py-0 h-4 font-normal ${field.badgeColor}`}>
                        {field.value}
                      </Badge>
                    ) : (
                      <span className="text-[11px] font-medium text-foreground">{field.value}</span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Line Items */}
      {inv.lineItems && (
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Line Items</CardTitle>
            <CardDescription className="text-[10px]">Invoice line item details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground whitespace-pre-wrap">
              {typeof inv.lineItems === "string" ? inv.lineItems : JSON.stringify(inv.lineItems, null, 2)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function InvoiceWorkspace() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const invoice = useQuery(api.financePlatform.listInvoicesPaginated, { limit: 1 });
  const invoiceData = invoice?.items?.find((i: any) => i._id === id);

  const tabs: WorkspaceTabDefinition[] = [
    { id: "overview", label: "Overview", icon: FileText, component: () => <InvoiceOverviewTab entity={invoiceData} /> },
    { id: "payments", label: "Payments", icon: Banknote, component: () => (
      <div className="text-center py-8 text-xs text-muted-foreground">
        <Banknote className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
        Payment history for this invoice
      </div>
    )},
    { id: "timeline", label: "Timeline", icon: Calendar, component: WorkspaceTimelineTab },
    { id: "documents", label: "Documents", icon: FileText, component: WorkspaceDocumentsTab },
    { id: "activity", label: "Activity", icon: RefreshCw, component: WorkspaceActivityTab },
    { id: "notes", label: "Notes", icon: FileText, component: WorkspaceNotesTab },
  ];

  const actions: WorkspaceAction[] = [
    { id: "print", label: "Print", icon: Printer, onClick: () => window.print(), variant: "outline" },
    { id: "download", label: "Download PDF", icon: Download, onClick: () => toast.info("PDF download ready"), variant: "outline" },
  ];

  const headerFields: WorkspaceHeaderField[] = invoiceData ? [
    { label: "Amount", value: `₹${(invoiceData.totalAmount || 0).toLocaleString()}`, icon: DollarSign, color: "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Balance", value: `₹${(invoiceData.balanceDue || 0).toLocaleString()}`, icon: Wallet, color: invoiceData.balanceDue > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30" },
    { label: "Due", value: invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : "—", icon: Calendar, color: "bg-blue-100 dark:bg-blue-900/30" },
  ] : [];

  return (
    <WorkspaceShell
      entityType="invoice"
      entityId={id || ""}
      entity={invoiceData}
      isLoading={!invoiceData && !invoice}
      title={invoiceData?.invoiceNumber || "Invoice"}
      subtitle="Invoice Detail"
      badge={invoiceData ? {
        label: invoiceData.status || "pending",
        color: invoiceData.status === "paid" ? "bg-emerald-500" :
               invoiceData.status === "overdue" ? "bg-red-500" :
               invoiceData.status === "partial" ? "bg-blue-500" : "bg-amber-500",
      } : undefined}
      headerFields={headerFields}
      avatarInitials={invoiceData?.invoiceNumber?.charAt(0) || "I"}
      tabs={tabs}
      actions={actions}
      module="finance"
      backLink={{ label: "Back to Finance", onClick: () => navigate("/finance") }}
    />
  );
}
