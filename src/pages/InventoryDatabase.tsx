import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package, Search, AlertTriangle, Warehouse, Tag,
  DollarSign, Plus, Barcode
} from "lucide-react";

export default function InventoryDatabase() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const items = useQuery(api.inventoryEngine.listInventoryItems, {});
  const dashboard = useQuery(api.inventoryEngine.getInventoryDashboard);

  const filtered = (items || []).filter((i: any) => {
    if (filter === "low" && i.currentStock > i.reorderLevel) return false;
    if (filter === "out" && i.currentStock > 0) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        i.name?.toLowerCase().includes(s) ||
        i.sku?.toLowerCase().includes(s) ||
        i.barcode?.includes(s)
      );
    }
    return true;
  });

  const getStockColor = (item: any) => {
    if (item.currentStock <= 0) return "text-red-500";
    if (item.currentStock <= item.reorderLevel) return "text-amber-500";
    return "text-emerald-500";
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage stock items, categories, warehouses and movements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/procurement/warehouses")}>
            <Warehouse className="h-4 w-4 mr-2" /> Warehouses
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-sky-500">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Items</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold">{dashboard?.totalItems ?? "—"}</span></CardContent>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Value</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold">${(dashboard?.totalValue ?? 0).toLocaleString()}</span></CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500 cursor-pointer" onClick={() => setFilter("low")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Low Stock</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-amber-500">{dashboard?.lowStockCount ?? "—"}</span></CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500 cursor-pointer" onClick={() => setFilter("out")}>
          <CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Out of Stock</CardTitle></CardHeader>
          <CardContent><span className="text-3xl font-bold text-red-500">{dashboard?.outOfStockCount ?? "—"}</span></CardContent>
        </Card>
      </div>

      {/* Search + Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search items by name, SKU, barcode..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Stock filter tabs */}
      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">All Items ({items?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="low" className="text-amber-500">Low Stock ({dashboard?.lowStockCount ?? 0})</TabsTrigger>
          <TabsTrigger value="out" className="text-red-500">Out of Stock ({dashboard?.outOfStockCount ?? 0})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item: any) => (
          <Card key={item._id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/procurement/inventory/${item._id}`)}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{item.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${getStockColor(item)}`}>
                    {item.currentStock}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {item.categoryName && (
                  <Badge variant="secondary" className="text-[9px]">{item.categoryName}</Badge>
                )}
                <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> ${item.unitPrice}</span>
                <span className="flex items-center gap-1">
                  {item.currentStock <= item.reorderLevel && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                  Min: {item.minStock} / Max: {item.maxStock}
                </span>
              </div>
              {item.barcode && <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><Barcode className="h-3 w-3" /> {item.barcode}</p>}
            </CardContent>
          </Card>
        ))}
        {items && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No items found</p>
        )}
      </div>
    </div>
  );
}
