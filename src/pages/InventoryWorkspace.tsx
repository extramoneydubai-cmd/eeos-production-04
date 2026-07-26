import { useParams } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  WorkspaceShell, WorkspaceHeader, WorkspaceTabConfig,
} from "@/components/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, DollarSign, Warehouse, BarChart3, AlertTriangle,
  FileText, Clock, TrendingUp, ArrowUpDown
} from "lucide-react";

export default function InventoryWorkspace() {
  const { itemId } = useParams();
  const item = useQuery(
    api.inventoryEngine.getInventoryItem,
    itemId ? { id: itemId as Id<"inventoryItems"> } : "skip",
  );

  if (!item) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading inventory item...</p>
      </div>
    );
  }

  const stockLevel = item.currentStock <= 0 ? "Out of Stock" :
    item.currentStock <= item.reorderLevel ? "Low Stock" : "In Stock";
  const stockColor = item.currentStock <= 0 ? "text-red-500" :
    item.currentStock <= item.reorderLevel ? "text-amber-500" : "text-emerald-500";
  const stockBadge = item.currentStock <= 0 ? "destructive" :
    item.currentStock <= item.reorderLevel ? "secondary" as const : "default" as const;
  const stockValue = item.currentStock * item.unitPrice;

  const tabs: WorkspaceTabConfig[] = [
    {
      id: "overview", label: "Overview", icon: Package,
      component: () => (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-sky-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Current Stock</CardTitle></CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${stockColor}`}>{item.currentStock} <span className="text-sm text-muted-foreground">{item.unit}</span></p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Stock Value</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">${stockValue.toLocaleString()}</p></CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Min / Max</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{item.minStock} / {item.maxStock}</p></CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Reorder Level</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{item.reorderLevel}</p></CardContent>
            </Card>
          </div>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Item Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><dt className="text-muted-foreground text-xs">Name</dt><dd className="font-medium">{item.name}</dd></div>
                <div><dt className="text-muted-foreground text-xs">SKU</dt><dd className="font-medium">{item.sku}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Unit Price</dt><dd className="font-medium">${item.unitPrice}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Category</dt><dd className="font-medium">{item.categoryName || "—"}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Barcode</dt><dd className="font-medium">{item.barcode || "—"}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Status</dt><dd><Badge variant={stockBadge} className="text-[10px]">{stockLevel}</Badge></dd></div>
              </dl>
              {item.description && <p className="text-sm text-muted-foreground mt-4">{item.description}</p>}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "movements", label: "Movements", icon: ArrowUpDown,
      component: () => <div className="text-sm text-muted-foreground p-4">Stock movement history will appear here</div>,
    },
    {
      id: "warehouse", label: "Warehouse", icon: Warehouse,
      component: () => <div className="text-sm text-muted-foreground p-4">Warehouse details</div>,
    },
    {
      id: "documents", label: "Documents", icon: FileText,
      component: () => <div className="text-sm text-muted-foreground p-4">Item documents</div>,
    },
    {
      id: "timeline", label: "Timeline", icon: Clock,
      component: () => <div className="text-sm text-muted-foreground p-4">Activity timeline</div>,
    },
  ];

  return (
    <WorkspaceShell
      tabs={tabs}
      defaultTab="overview"
      header={
        <WorkspaceHeader
          title={item.name}
          subtitle={`Inventory • ${item.sku}`}
          color="#6366f1"
        />
      }
    />
  );
}
