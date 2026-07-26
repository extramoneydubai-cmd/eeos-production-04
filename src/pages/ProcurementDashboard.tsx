import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart, Package, Users, Building2, Warehouse,
  FileText, DollarSign, TrendingUp, AlertTriangle, Plus,
  ClipboardList, ArrowRight, Truck, CreditCard, BarChart3,
  Boxes, Wrench, Download
} from "lucide-react";

export default function ProcurementDashboard() {
  const navigate = useNavigate();

  const dashboard = useQuery(api.procurementPlatform.getProcurementDashboard);
  const inventory = useQuery(api.inventoryEngine.getInventoryDashboard);
  const lowStockAlerts = useQuery(api.inventoryEngine.getLowStockAlerts);
  const pos = useQuery(api.procurementEngine.listPurchaseOrders, {});
  const receipts = useQuery(api.procurementEngine.listGoodsReceipts, {});
  const vendors = useQuery(api.procurementEngine.listVendors, {});

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement & Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendors, purchases, inventory, assets and warehouses
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/procurement/reports")}>
            <BarChart3 className="h-4 w-4 mr-2" /> Reports
          </Button>
        </div>
      </div>

      {/* Executive KPIs — Procurement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{dashboard?.totalPOs ?? "—"}</span>
              <ClipboardList className="h-8 w-8 text-blue-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(dashboard?.totalPOValue ?? 0).toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending POs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{dashboard?.pendingPOs ?? "—"}</span>
              <Clock className="h-8 w-8 text-amber-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.receivedPOs ?? 0} received
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{dashboard?.activeVendors ?? "—"}</span>
              <Users className="h-8 w-8 text-emerald-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.totalVendors ?? 0} total registered
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{dashboard?.pendingApprovalReqs ?? "—"}</span>
              <AlertTriangle className="h-8 w-8 text-purple-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboard?.approvedReqs ?? 0} approved requisitions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{inventory?.totalItems ?? "—"}</span>
              <Package className="h-8 w-8 text-sky-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventory?.totalStock ?? 0} total units in stock
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">${(inventory?.totalValue ?? 0).toLocaleString()}</span>
              <DollarSign className="h-8 w-8 text-emerald-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {inventory?.categoryCount ?? 0} categories
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-red-500">{inventory?.lowStockCount ?? "—"}</span>
              <AlertTriangle className="h-8 w-8 text-red-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventory?.outOfStockCount ?? 0} out of stock
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Warehouses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold">{inventory?.warehouseCount ?? "—"}</span>
              <Warehouse className="h-8 w-8 text-indigo-500/30" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Storage facilities
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" /> Overview</TabsTrigger>
          <TabsTrigger value="lowstock" className="gap-2"><AlertTriangle className="h-4 w-4" /> Low Stock Alerts</TabsTrigger>
          <TabsTrigger value="recent" className="gap-2"><Clock className="h-4 w-4" /> Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Action Tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/vendors")}>
              <Users className="h-6 w-6" /> <span className="text-xs">Vendors</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/inventory")}>
              <Package className="h-6 w-6" /> <span className="text-xs">Inventory</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/pos")}>
              <ClipboardList className="h-6 w-6" /> <span className="text-xs">Purchase Orders</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/assets")}>
              <Wrench className="h-6 w-6" /> <span className="text-xs">Assets</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/receipts")}>
              <Truck className="h-6 w-6" /> <span className="text-xs">Goods Receipts</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/payments")}>
              <CreditCard className="h-6 w-6" /> <span className="text-xs">Payments</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/warehouses")}>
              <Warehouse className="h-6 w-6" /> <span className="text-xs">Warehouses</span>
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2" onClick={() => navigate("/procurement/reports")}>
              <BarChart3 className="h-6 w-6" /> <span className="text-xs">Reports</span>
            </Button>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Procurement Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Purchase Orders</span>
                    <span className="font-bold">{dashboard?.totalPOs ?? 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((dashboard?.receivedPOs ?? 0) / Math.max((dashboard?.totalPOs ?? 1), 1)) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{dashboard?.receivedPOs ?? 0} received</span>
                    <span>{dashboard?.pendingPOs ?? 0} pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Vendor Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vendors</span>
                    <span className="font-bold">{dashboard?.totalVendors ?? 0}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((dashboard?.activeVendors ?? 0) / Math.max((dashboard?.totalVendors ?? 1), 1)) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{dashboard?.activeVendors ?? 0} active</span>
                    <span>{(dashboard?.totalVendors ?? 0) - (dashboard?.activeVendors ?? 0)} inactive</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="lowstock">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
              <CardDescription>Items that need reordering</CardDescription>
            </CardHeader>
            <CardContent>
              {!lowStockAlerts || lowStockAlerts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No low stock alerts
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStockAlerts.slice(0, 10).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${item.currentStock <= 0 ? "text-red-500" : "text-amber-500"}`}>
                          {item.currentStock} {item.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">Reorder at {item.reorderLevel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {pos && pos.length > 0 ? pos.slice(0, 5).map((po: any) => (
                  <div key={po._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{po.poNumber}</p>
                      <p className="text-xs text-muted-foreground">${po.totalAmount?.toFixed(2)}</p>
                    </div>
                    <Badge variant={po.status === "approved" ? "default" : po.status === "draft" ? "secondary" : "outline"} className="text-[10px]">
                      {po.status}
                    </Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No purchase orders</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Goods Receipts</CardTitle>
              </CardHeader>
              <CardContent>
                {receipts && receipts.length > 0 ? receipts.slice(0, 5).map((r: any) => (
                  <div key={r._id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{r.receiptNumber}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.receiptDate).toLocaleDateString()}</p>
                    </div>
                    <Badge variant={r.status === "complete" ? "default" : "outline"} className="text-[10px]">{r.status}</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No goods receipts</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper: Clock icon (used above but imported inline)
function Clock(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
