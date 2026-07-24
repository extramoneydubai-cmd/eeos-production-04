import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import {
  Package,
  ShoppingCart,
  Users,
  Warehouse,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  BarChart3,
  PlusCircle,
  RefreshCw,
  FileText,
  ClipboardList,
  Boxes,
  Tags,
  Truck,
  ArrowRight,
  Database,
} from "lucide-react";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: { label: string; positive: boolean };
  onClick?: () => void;
}) {
  return (
    <Card
      className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
            {trend && (
              <p className={`text-[10px] flex items-center gap-0.5 ${trend.positive ? "text-[#34a853]" : "text-[#ea4335]"}`}>
                {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {trend.label}
              </p>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProcurementDashboard() {
  const { navigate } = useAppNavigate();

  const procurementDashboard = useQuery(api.procurementEngine.getProcurementDashboard);
  const inventoryDashboard = useQuery(api.inventoryEngine.getInventoryDashboard);
  const lowStockAlerts = useQuery(api.inventoryEngine.getLowStockAlerts);
  const assetDashboard = useQuery(api.assetEngine.getAssetDashboard);

  const isLoading = !procurementDashboard || !inventoryDashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Procurement & Inventory</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Organization-wide procurement, inventory & asset management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[11px] border-[#e8eaed]"
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" /> New Purchase Order
          </Button>
          <Button
            size="sm"
            className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="procurement">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="procurement" className="text-[12px] data-[state=active]:bg-white">Procurement</TabsTrigger>
          <TabsTrigger value="inventory" className="text-[12px] data-[state=active]:bg-white">Inventory</TabsTrigger>
          <TabsTrigger value="assets" className="text-[12px] data-[state=active]:bg-white">Assets</TabsTrigger>
          <TabsTrigger value="alerts" className="text-[12px] data-[state=active]:bg-white">Alerts</TabsTrigger>
        </TabsList>

        {/* ════════════════════════════════════════
           PROCUREMENT TAB
           ════════════════════════════════════════ */}
        <TabsContent value="procurement" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Total PO Value"
              value={`₹${procurementDashboard.totalPOValue.toLocaleString()}`}
              subtitle={`${procurementDashboard.totalPOs} purchase orders`}
              icon={ShoppingCart}
              color="bg-[#1a73e8]"
            />
            <StatCard
              title="Pending POs"
              value={procurementDashboard.pendingPOs}
              subtitle="Awaiting fulfillment"
              icon={Clock}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Received POs"
              value={procurementDashboard.receivedPOs}
              subtitle="Completed deliveries"
              icon={CheckCircle2}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Active Vendors"
              value={procurementDashboard.activeVendors}
              subtitle={`${procurementDashboard.totalVendors} total vendors`}
              icon={Users}
              color="bg-[#a855f7]"
            />
          </div>

          {/* Procurement quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <ClipboardList className="h-4 w-4 text-[#1a73e8]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">New Requisition</span>
              <span className="text-[9px] text-[#9aa0a6]">Create purchase request</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <ShoppingCart className="h-4 w-4 text-[#34a853]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Create PO</span>
              <span className="text-[9px] text-[#9aa0a6]">Convert requisition to PO</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Truck className="h-4 w-4 text-[#fbbc04]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Goods Receipt</span>
              <span className="text-[9px] text-[#9aa0a6]">Record received items</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Users className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Vendors</span>
              <span className="text-[9px] text-[#9aa0a6]">Manage vendor directory</span>
            </Button>
          </div>

          {/* Requisition summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Pending Approval Requisitions"
              value={procurementDashboard.pendingApprovalReqs}
              subtitle={`${procurementDashboard.approvedReqs} approved`}
              icon={FileText}
              color="bg-[#e8710a]"
            />
            <StatCard
              title="Approved Requisitions"
              value={procurementDashboard.approvedReqs}
              subtitle={`${procurementDashboard.totalReqs} total`}
              icon={CheckCircle2}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Total Requisitions"
              value={procurementDashboard.totalReqs}
              icon={ClipboardList}
              color="bg-[#4285f4]"
            />
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           INVENTORY TAB
           ════════════════════════════════════════ */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Inventory Value"
              value={`₹${inventoryDashboard.totalValue.toLocaleString()}`}
              subtitle={`${inventoryDashboard.totalItems} active items`}
              icon={DollarSign}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Total Stock"
              value={inventoryDashboard.totalStock}
              subtitle="Units in stock"
              icon={Package}
              color="bg-[#1a73e8]"
            />
            <StatCard
              title="Warehouses"
              value={inventoryDashboard.warehouseCount}
              subtitle="Active locations"
              icon={Warehouse}
              color="bg-[#a855f7]"
            />
            <StatCard
              title="Categories"
              value={inventoryDashboard.categoryCount}
              icon={Tags}
              color="bg-[#4285f4]"
            />
          </div>

          {/* Stock status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard
              title="Low Stock Items"
              value={inventoryDashboard.lowStockCount}
              subtitle={`${lowStockAlerts ? lowStockAlerts.length : 0} need reorder`}
              icon={AlertCircle}
              color="bg-[#ea4335]"
              trend={{ label: "Requires immediate attention", positive: false }}
            />
            <StatCard
              title="Out of Stock"
              value={inventoryDashboard.outOfStockCount}
              icon={AlertCircle}
              color="bg-[#ea4335]"
              trend={{ label: "Items unavailable", positive: false }}
            />
            <StatCard
              title="Stock Health"
              value={
                inventoryDashboard.totalItems > 0
                  ? `${Math.round(((inventoryDashboard.totalItems - inventoryDashboard.lowStockCount - inventoryDashboard.outOfStockCount) / inventoryDashboard.totalItems) * 100)}%`
                  : "—"
              }
              subtitle="Items above reorder level"
              icon={BarChart3}
              color="bg-[#34a853]"
            />
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Package className="h-4 w-4 text-[#1a73e8]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Add Item</span>
              <span className="text-[9px] text-[#9aa0a6]">New inventory item</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Warehouse className="h-4 w-4 text-[#34a853]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Manage Stock</span>
              <span className="text-[9px] text-[#9aa0a6]">Adjust quantities</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <Boxes className="h-4 w-4 text-[#a855f7]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Stock Movement</span>
              <span className="text-[9px] text-[#9aa0a6]">View history</span>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col items-start gap-1 text-left border-[#e8eaed] hover:bg-[#f8f9fa]">
              <ClipboardList className="h-4 w-4 text-[#fbbc04]" />
              <span className="text-[11px] font-medium text-[#1a1a2e]">Low Stock Report</span>
              <span className="text-[9px] text-[#9aa0a6]">{lowStockAlerts ? lowStockAlerts.length : 0} items to reorder</span>
            </Button>
          </div>
        </TabsContent>

        {/* ════════════════════════════════════════
           ASSETS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="assets" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              title="Allocated Assets"
              value={assetDashboard?.totalAllocated || 0}
              subtitle="Currently in use"
              icon={CheckCircle2}
              color="bg-[#34a853]"
            />
            <StatCard
              title="Returned"
              value={assetDashboard?.totalReturned || 0}
              icon={RefreshCw}
              color="bg-[#4285f4]"
            />
            <StatCard
              title="Issued Items"
              value={assetDashboard?.totalIssued || 0}
              subtitle="Pending return"
              icon={Package}
              color="bg-[#fbbc04]"
            />
            <StatCard
              title="Lost/Damaged"
              value={assetDashboard?.totalLost || 0}
              icon={AlertCircle}
              color="bg-[#ea4335]"
            />
          </div>

          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardContent className="p-6 text-center">
              <Boxes className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-[#1a1a2e]">Asset Management</h3>
              <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                Track asset allocations, item issuance, and returns across departments
              </p>
              <div className="flex items-center justify-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <PlusCircle className="h-3.5 w-3.5 mr-1" /> Allocate Asset
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
                  <ClipboardList className="h-3.5 w-3.5 mr-1" /> Issue Item
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ════════════════════════════════════════
           ALERTS TAB
           ════════════════════════════════════════ */}
        <TabsContent value="alerts" className="space-y-4 mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Low Stock Alerts</CardTitle>
                  <CardDescription className="text-[10px] text-[#9aa0a6]">
                    Items at or below reorder level — {lowStockAlerts ? lowStockAlerts.length : 0} items
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {lowStockAlerts && lowStockAlerts.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-[#9aa0a6] pb-2 border-b border-[#e8eaed]">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-2">SKU</div>
                    <div className="col-span-2">In Stock</div>
                    <div className="col-span-2">Reorder At</div>
                    <div className="col-span-2">Status</div>
                  </div>
                  {lowStockAlerts.slice(0, 20).map((item: any) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 text-[11px] py-1.5 border-b border-[#f1f3f4] items-center">
                      <div className="col-span-4 font-medium text-[#1a1a2e] truncate">{item.name}</div>
                      <div className="col-span-2 text-[#5f6368]">{item.sku}</div>
                      <div className="col-span-2">
                        <span className={`font-semibold ${item.currentStock <= 0 ? "text-[#ea4335]" : "text-[#e8710a]"}`}>
                          {item.currentStock}
                        </span>
                      </div>
                      <div className="col-span-2 text-[#5f6368]">{item.reorderLevel}</div>
                      <div className="col-span-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            item.currentStock <= 0
                              ? "bg-[#fce8e6] text-[#ea4335] border-[#f5c6c2]"
                              : "bg-[#fef7e0] text-[#e8710a] border-[#fdecc8]"
                          }`}
                        >
                          {item.currentStock <= 0 ? "Out of Stock" : "Low Stock"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-8 w-8 text-[#34a853] mx-auto mb-2" />
                  <p className="text-[13px] font-medium text-[#1a1a2e]">All Stock Levels Healthy</p>
                  <p className="text-[11px] text-[#9aa0a6] mt-1">No items below reorder level</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
