import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Home,
  TrendingUp,
  BadgeCheck,
  Target,
  ArrowRight,
  ChevronDown,
  Sparkles,
  BarChart3,
  DollarSign,
  Handshake,
  PieChart,
  Flag,
  Award,
  Zap,
  Layers,
  ClipboardList,
  CheckCircle,
  Percent,
  Globe,
  FileEdit,
  Receipt,
} from "lucide-react";

/* ── Data ── */

const overviewCards = [
  {
    id: "opportunity-stages",
    title: "Opportunity Stages",
    description: "Sales pipeline stages from qualification to closed won/lost",
    icon: BadgeCheck,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/opportunity-stages",
    isPlaceholder: false,
  },
  {
    id: "opportunity-types",
    title: "Opportunity Types",
    description: "Classifications for deal registrations and sales opportunities",
    icon: Target,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/opportunity-types",
    isPlaceholder: false,
  },
  {
    id: "quotation-statuses",
    title: "Quotation Statuses",
    description: "Lifecycle statuses for quotations and proposals",
    icon: FileEdit,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/quotation-statuses",
    isPlaceholder: false,
  },
  {
    id: "payment-statuses",
    title: "Payment Statuses",
    description: "Lifecycle statuses for sales payments and collections",
    icon: DollarSign,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/payment-statuses",
    isPlaceholder: false,
  },
  {
    id: "invoice-types",
    title: "Invoice Types",
    description: "Classifications for sales invoice templates and categories",
    icon: Receipt,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/invoice-types",
    isPlaceholder: false,
  },
  {
    id: "tax-slabs",
    title: "Tax Slabs",
    description: "Tax bracket configurations and rate slabs for sales",
    icon: Percent,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#0d9488]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/tax-slabs",
    isPlaceholder: false,
  },
  {
    id: "territories",
    title: "Territories",
    description: "Sales territory assignments and regional coverage areas",
    icon: Globe,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    totalRecords: 0,
    activeRecords: 0,
    href: "/studios/master-data/sales/territories",
    isPlaceholder: false,
  },
];

const moduleCards = [
  {
    id: "opportunity-stages",
    title: "Opportunity Stages",
    description: "Define sales pipeline stages — from qualification through negotiation to closed won/lost stages with probability and stage order.",
    icon: BadgeCheck,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/sales/opportunity-stages",
    isPlaceholder: false,
  },
  {
    id: "opportunity-types",
    title: "Opportunity Types",
    description: "Define opportunity types — classify deal registrations by business line, product category, or deal structure.",
    icon: Target,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#34a853]",
    status: "active" as const,
    href: "/studios/master-data/sales/opportunity-types",
    isPlaceholder: false,
  },
  {
    id: "quotation-statuses",
    title: "Quotation Statuses",
    description: "Configure quotation statuses — manage the lifecycle of quotes from draft to accepted/rejected.",
    icon: FileEdit,
    color: "bg-[#fef7e0]",
    iconColor: "text-[#fbbc04]",
    status: "active" as const,
    href: "/studios/master-data/sales/quotation-statuses",
    isPlaceholder: false,
  },
  {
    id: "payment-statuses",
    title: "Payment Statuses",
    description: "Manage payment statuses — track invoice payments from pending through cleared to reconciled.",
    icon: DollarSign,
    color: "bg-[#f3e8ff]",
    iconColor: "text-[#a855f7]",
    status: "active" as const,
    href: "/studios/master-data/sales/payment-statuses",
    isPlaceholder: false,
  },
  {
    id: "invoice-types",
    title: "Invoice Types",
    description: "Define invoice types — categorize invoices by purpose, frequency, and billing structure.",
    icon: Receipt,
    color: "bg-[#fce8e6]",
    iconColor: "text-[#ea4335]",
    status: "active" as const,
    href: "/studios/master-data/sales/invoice-types",
    isPlaceholder: false,
  },
  {
    id: "tax-slabs",
    title: "Tax Slabs",
    description: "Configure tax slabs — define tax brackets, rates, and applicability for different product categories.",
    icon: Percent,
    color: "bg-[#e6f4ea]",
    iconColor: "text-[#0d9488]",
    status: "active" as const,
    href: "/studios/master-data/sales/tax-slabs",
    isPlaceholder: false,
  },
  {
    id: "territories",
    title: "Territories",
    description: "Manage sales territories — assign regions, branches, and verticals to sales teams and representatives.",
    icon: Globe,
    color: "bg-[#e8f0fe]",
    iconColor: "text-[#1a73e8]",
    status: "active" as const,
    href: "/studios/master-data/sales/territories",
    isPlaceholder: false,
  },
];

const futureModules = [
  "Sales Stages",
  "Lead Conversion Rules",
  "Deal Registration",
  "Contract Templates",
  "Renewal Rules",
  "Upsell / Cross-sell",
  "Sales Forecasting",
  "Incentive Programs",
];

/* ── Page ── */

export default function MasterDataSales() {
  const [futureOpen, setFutureOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/studios/master-data">Master Data Studio</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Sales Masters</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-[#1a73e8] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-[#1a1a2e]">Sales Masters</h1>
          </div>
          <p className="text-[13px] text-[#5f6368] mt-1.5">
            Configure sales structure — opportunity stages, pipelines, targets, territories, and commissions.
          </p>
        </div>
      </div>

      {/* ── Section 1: Overview Cards ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Overview</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {overviewCards.map((card) => (
            <OverviewStatCard key={card.id} {...card} />
          ))}
        </div>
      </div>

      {/* ── Section 2: Sales Masters Grid ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[#5f6368]" />
          <h2 className="text-sm font-semibold text-[#1a1a2e]">Sales Masters</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleCards.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.status === "active";
            return (
              <Card
                key={mod.id}
                className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group"
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg ${mod.color} shrink-0`}>
                      <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[#1a1a2e]">{mod.title}</h3>
                        <Badge
                          variant={isActive ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] px-1.5 py-0 h-4 font-medium ${
                            isActive
                              ? "bg-[#e6f4ea] text-[#34a853] hover:bg-[#e6f4ea]"
                              : "bg-[#f1f3f4] text-[#9aa0a6] hover:bg-[#f1f3f4]"
                          }`}
                        >
                          {isActive ? "Active" : "Coming Soon"}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-[#5f6368] mt-1.5 leading-relaxed">
                        {mod.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`mt-3 h-7 text-[11px] font-medium px-0 ${
                          isActive
                            ? "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
                            : "text-[#9aa0a6] cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!mod.isPlaceholder) {
                            window.location.href = mod.href;
                          }
                        }}
                        disabled={mod.isPlaceholder}
                      >
                        Open
                        <ArrowRight className="h-3 w-3 ml-1 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Section 3: Future Modules ── */}
      <Collapsible open={futureOpen} onOpenChange={setFutureOpen}>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-3 cursor-pointer hover:bg-[#f8f9fa] transition-colors rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#9aa0a6]" />
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                    Upcoming Sales Masters
                  </CardTitle>
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 h-4 font-medium bg-[#f1f3f4] text-[#9aa0a6]"
                  >
                    {futureModules.length}
                  </Badge>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-[#9aa0a6] transition-transform duration-200 ${
                    futureOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
              <CardDescription className="text-[11px] text-[#9aa0a6]">
                Future Sales master data modules in development
              </CardDescription>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0 pb-5">
              <div className="flex flex-wrap gap-2">
                {futureModules.map((name) => (
                  <Badge
                    key={name}
                    variant="secondary"
                    className="text-[11px] px-3 py-1 font-normal text-[#5f6368] bg-[#f1f3f4] border border-[#e8eaed] opacity-60 cursor-not-allowed"
                  >
                    {name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}

/* ── Helpers ── */

function OverviewStatCard({
  title, description, icon: Icon, color, iconColor, totalRecords, activeRecords, href, isPlaceholder,
}: {
  title: string; description: string; icon: React.ElementType; color: string; iconColor: string;
  totalRecords: number; activeRecords: number; href: string; isPlaceholder: boolean;
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md hover:border-[#dadce0] transition-all duration-200 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-[12px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-[11px] text-[#9aa0a6] leading-snug">{description}</p>
            <div className="flex items-center gap-3 pt-1">
              <span className="text-[11px] text-[#5f6368]">
                Total: <span className="font-semibold text-[#1a1a2e]">{totalRecords}</span>
              </span>
              <span className="text-[11px] text-[#5f6368]">
                Active: <span className="font-semibold text-[#34a853]">{activeRecords}</span>
              </span>
            </div>
            <Button
              variant="ghost" size="sm"
              className={`mt-2 h-6 text-[10px] font-medium px-0 ${
                isPlaceholder
                  ? "text-[#9aa0a6] cursor-not-allowed"
                  : "text-[#1a73e8] hover:text-[#1557b0] hover:bg-[#e8f0fe]"
              }`}
              onClick={() => { if (!isPlaceholder) window.location.href = href; }}
              disabled={isPlaceholder}
            >
              Open
              <ArrowRight className="h-2.5 w-2.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <div className={`p-2 rounded-lg ${color} shrink-0 ml-3`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
