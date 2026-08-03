import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { WorkspaceShell } from "@/components/workspace";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Wrench, Package, Users, TrendingDown, ArrowRightLeft,
  Plus, Loader2, CircleDollarSign, Boxes,
} from "lucide-react";

const STATUS_BADGE: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  active: "default",
  transferred: "secondary",
  written_off: "outline",
  disposed: "destructive",
};

const CONDITION_LABEL: Record<string, string> = {
  new: "New", good: "Good", fair: "Fair", damaged: "Damaged",
};

const DEPRECIATION_METHOD_LABEL: Record<string, string> = {
  straight_line: "Straight Line",
  declining: "Declining Balance",
  sum_of_years: "Sum of Years",
  units_of_production: "Units of Production",
  none: "None",
};

export default function AssetWorkspace() {
  const [tab, setTab] = useState("register");

  const assets = useQuery(api.fixedAssetEngine.listFixedAssets, {});
  const categories = useQuery(api.fixedAssetEngine.listAssetCategories, {});
  const allocations = useQuery(api.assetEngine.listAssetAllocations, {});
  const dashboard = useQuery(api.assetEngine.getAssetDashboard);
  const users = useQuery(api.users.listActiveUsers, {});
  const inventoryItems = useQuery(api.inventoryEngine.listInventoryItems, {});

  const createAsset = useMutation(api.fixedAssetEngine.createFixedAsset);
  const createCategory = useMutation(api.fixedAssetEngine.createAssetCategory);
  const runDepreciation = useMutation(api.fixedAssetEngine.calculateDepreciation);
  const transferAsset = useMutation(api.fixedAssetEngine.transferAsset);
  const disposeAsset = useMutation(api.fixedAssetEngine.disposeAsset);
  const writeOffAsset = useMutation(api.fixedAssetEngine.writeOffAsset);
  const allocateAsset = useMutation(api.assetEngine.allocateAsset);
  const returnAsset = useMutation(api.assetEngine.returnAsset);

  const [busy, setBusy] = useState<string | null>(null);

  // ── Create asset dialog state ──
  const [assetOpen, setAssetOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "", assetCode: "", categoryId: "", purchaseDate: "", purchaseCost: "",
    location: "", serialNumber: "", vendorName: "", usefulLifeYears: "", description: "",
  });

  // ── Create category dialog state ──
  const [catOpen, setCatOpen] = useState(false);
  const [newCat, setNewCat] = useState({
    name: "", code: "", depreciationMethod: "straight_line", usefulLifeYears: "5",
    depreciationRate: "", description: "",
  });

  // ── Transfer / dispose / write-off dialog state ──
  const [transferTarget, setTransferTarget] = useState<any>(null);
  const [transfer, setTransfer] = useState({ newBranchId: "", newLocation: "", remarks: "" });
  const [disposeTarget, setDisposeTarget] = useState<any>(null);
  const [dispose, setDispose] = useState({ disposalType: "sold", reason: "", saleAmount: "" });
  const [writeOffTarget, setWriteOffTarget] = useState<any>(null);
  const [writeOff, setWriteOff] = useState({ reason: "", approvedBy: "" });

  // ── Allocate dialog state ──
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [newAlloc, setNewAlloc] = useState({
    itemId: "", assetName: "", assetTag: "", allocatedTo: "", condition: "good", notes: "",
  });

  const catMap = new Map((categories ?? []).map((c: any) => [c._id, c]));

  const totalValue = (assets ?? []).reduce((s: number, a: any) => s + (a.currentValue ?? 0), 0);
  const purchaseValue = (assets ?? []).reduce((s: number, a: any) => s + (a.purchaseCost ?? 0), 0);

  const handleCreateAsset = async () => {
    if (!newAsset.name || !newAsset.assetCode || !newAsset.categoryId || !newAsset.purchaseDate || !newAsset.purchaseCost) {
      toast.error("Name, code, category, purchase date and cost are required");
      return;
    }
    setBusy("create-asset");
    try {
      await createAsset({
        name: newAsset.name,
        assetCode: newAsset.assetCode,
        categoryId: newAsset.categoryId as Id<"assetCategories">,
        purchaseDate: new Date(newAsset.purchaseDate).getTime(),
        purchaseCost: Number(newAsset.purchaseCost),
        location: newAsset.location || undefined,
        serialNumber: newAsset.serialNumber || undefined,
        vendorName: newAsset.vendorName || undefined,
        usefulLifeYears: newAsset.usefulLifeYears ? Number(newAsset.usefulLifeYears) : undefined,
        description: newAsset.description || undefined,
      });
      toast.success("Asset created");
      setAssetOpen(false);
      setNewAsset({ name: "", assetCode: "", categoryId: "", purchaseDate: "", purchaseCost: "", location: "", serialNumber: "", vendorName: "", usefulLifeYears: "", description: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create asset");
    } finally {
      setBusy(null);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCat.name || !newCat.code) {
      toast.error("Name and code are required");
      return;
    }
    setBusy("create-category");
    try {
      await createCategory({
        name: newCat.name,
        code: newCat.code,
        depreciationMethod: newCat.depreciationMethod as any,
        usefulLifeYears: Number(newCat.usefulLifeYears) || 5,
        depreciationRate: newCat.depreciationRate ? Number(newCat.depreciationRate) : undefined,
        description: newCat.description || undefined,
      });
      toast.success("Category created");
      setCatOpen(false);
      setNewCat({ name: "", code: "", depreciationMethod: "straight_line", usefulLifeYears: "5", depreciationRate: "", description: "" });
    } catch (e: any) {
      toast.error(e?.message || "Failed to create category");
    } finally {
      setBusy(null);
    }
  };

  const handleRunDepreciation = async (asset: any) => {
    setBusy(`dep-${asset._id}`);
    try {
      const r = await runDepreciation({ assetId: asset._id });
      toast.success(`Depreciation booked: $${r.depreciationAmount.toLocaleString()}`);
    } catch (e: any) {
      toast.error(e?.message || "Depreciation failed (asset may not be active)");
    } finally {
      setBusy(null);
    }
  };

  const handleTransfer = async () => {
    if (!transferTarget) return;
    setBusy("transfer");
    try {
      await transferAsset({
        assetId: transferTarget._id,
        newBranchId: transfer.newBranchId ? (transfer.newBranchId as Id<"orgBranches">) : undefined,
        newLocation: transfer.newLocation || undefined,
        remarks: transfer.remarks || undefined,
      });
      toast.success("Asset transferred");
      setTransferTarget(null);
      setTransfer({ newBranchId: "", newLocation: "", remarks: "" });
    } catch (e: any) {
      toast.error(e?.message || "Transfer failed");
    } finally {
      setBusy(null);
    }
  };

  const handleDispose = async () => {
    if (!disposeTarget || !dispose.reason) {
      toast.error("Disposal type and reason are required");
      return;
    }
    setBusy("dispose");
    try {
      await disposeAsset({
        assetId: disposeTarget._id,
        disposalDate: Date.now(),
        disposalType: dispose.disposalType as any,
        saleAmount: dispose.saleAmount ? Number(dispose.saleAmount) : undefined,
        reason: dispose.reason,
      });
      toast.success("Asset disposed");
      setDisposeTarget(null);
      setDispose({ disposalType: "sold", reason: "", saleAmount: "" });
    } catch (e: any) {
      toast.error(e?.message || "Disposal failed");
    } finally {
      setBusy(null);
    }
  };

  const handleWriteOff = async () => {
    if (!writeOffTarget || !writeOff.reason || !writeOff.approvedBy) {
      toast.error("Reason and approving user are required");
      return;
    }
    setBusy("writeoff");
    try {
      await writeOffAsset({
        assetId: writeOffTarget._id,
        writeOffDate: Date.now(),
        reason: writeOff.reason,
        approvedBy: writeOff.approvedBy as Id<"users">,
      });
      toast.success("Asset written off");
      setWriteOffTarget(null);
      setWriteOff({ reason: "", approvedBy: "" });
    } catch (e: any) {
      toast.error(e?.message || "Write-off failed");
    } finally {
      setBusy(null);
    }
  };

  const handleAllocate = async () => {
    if (!newAlloc.itemId || !newAlloc.assetName || !newAlloc.assetTag || !newAlloc.allocatedTo) {
      toast.error("Item, asset name, tag and assignee are required");
      return;
    }
    setBusy("allocate");
    try {
      await allocateAsset({
        itemId: newAlloc.itemId as Id<"inventoryItems">,
        assetName: newAlloc.assetName,
        assetTag: newAlloc.assetTag,
        allocatedTo: newAlloc.allocatedTo as Id<"users">,
        condition: newAlloc.condition as any,
        notes: newAlloc.notes || undefined,
      });
      toast.success("Asset allocated");
      setAllocateOpen(false);
      setNewAlloc({ itemId: "", assetName: "", assetTag: "", allocatedTo: "", condition: "good", notes: "" });
    } catch (e: any) {
      toast.error(e?.message || "Allocation failed");
    } finally {
      setBusy(null);
    }
  };

  const handleReturn = async (allocation: any) => {
    setBusy(`return-${allocation._id}`);
    try {
      await returnAsset({ assetId: allocation._id, notes: "Returned from workspace" });
      toast.success("Asset returned");
    } catch (e: any) {
      toast.error(e?.message || "Return failed");
    } finally {
      setBusy(null);
    }
  };

  const kpis = [
    { label: "Total Assets", value: assets?.length ?? "—", icon: Boxes, color: "text-sky-600", bg: "bg-sky-50", border: "border-l-sky-500" },
    { label: "Purchase Value", value: purchaseValue ? `$${purchaseValue.toLocaleString()}` : "—", icon: CircleDollarSign, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-l-indigo-500" },
    { label: "Current Value", value: totalValue ? `$${totalValue.toLocaleString()}` : "—", icon: TrendingDown, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-l-emerald-500" },
    { label: "Allocated", value: dashboard?.totalAllocated ?? "—", icon: Users, color: "text-amber-600", bg: "bg-amber-50", border: "border-l-amber-500" },
    { label: "Active Allocations", value: dashboard?.totalAllocations ?? "—", icon: Package, color: "text-blue-600", bg: "bg-blue-50", border: "border-l-blue-500" },
    { label: "Issued Items", value: dashboard?.totalIssues ?? "—", icon: Wrench, color: "text-purple-600", bg: "bg-purple-50", border: "border-l-purple-500" },
  ];

  return (
    <WorkspaceShell title="Asset Management" subtitle="Fixed asset register, allocations, depreciation and lifecycle">
      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        {kpis.map((k) => (
          <Card key={k.label} className={`border-l-4 ${k.border}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <span className={`p-1 rounded-md ${k.bg}`}><k.icon className={`h-3.5 w-3.5 ${k.color}`} /></span>
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent><span className="text-2xl font-bold">{k.value}</span></CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="register">Asset Register ({assets?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="allocations">Allocations ({allocations?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* ── ASSET REGISTER ── */}
        <TabsContent value="register" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={assetOpen} onOpenChange={setAssetOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Asset</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Fixed Asset</DialogTitle>
                  <DialogDescription>Capitalize a new asset into the register.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Name *</Label><Input value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} placeholder="e.g. HP EliteBook Laptop" /></div>
                  <div><Label>Asset Code *</Label><Input value={newAsset.assetCode} onChange={(e) => setNewAsset({ ...newAsset, assetCode: e.target.value })} placeholder="AST-0001" /></div>
                  <div><Label>Category *</Label>
                    <Select value={newAsset.categoryId} onValueChange={(v) => setNewAsset({ ...newAsset, categoryId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {(categories ?? []).map((c: any) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Purchase Date *</Label><Input type="date" value={newAsset.purchaseDate} onChange={(e) => setNewAsset({ ...newAsset, purchaseDate: e.target.value })} /></div>
                  <div><Label>Purchase Cost ($) *</Label><Input type="number" value={newAsset.purchaseCost} onChange={(e) => setNewAsset({ ...newAsset, purchaseCost: e.target.value })} placeholder="0.00" /></div>
                  <div><Label>Location</Label><Input value={newAsset.location} onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })} placeholder="Campus / room" /></div>
                  <div><Label>Serial Number</Label><Input value={newAsset.serialNumber} onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })} /></div>
                  <div><Label>Vendor</Label><Input value={newAsset.vendorName} onChange={(e) => setNewAsset({ ...newAsset, vendorName: e.target.value })} /></div>
                  <div><Label>Useful Life (years)</Label><Input type="number" value={newAsset.usefulLifeYears} onChange={(e) => setNewAsset({ ...newAsset, usefulLifeYears: e.target.value })} placeholder="5" /></div>
                  <div className="col-span-2"><Label>Description</Label><Textarea value={newAsset.description} onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAssetOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateAsset} disabled={busy === "create-asset"}>
                    {busy === "create-asset" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Create Asset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!assets ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : assets.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
              No fixed assets yet. Create a category first, then add your first asset.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Purchase</th>
                    <th className="px-3 py-2">Current Value</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a: any) => (
                    <tr key={a._id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium">{a.name}</td>
                      <td className="px-3 py-2 font-mono text-xs">{a.assetCode}</td>
                      <td className="px-3 py-2">{(catMap.get(a.categoryId) as any)?.name ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">{new Date(a.purchaseDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">${(a.currentValue ?? 0).toLocaleString()}</td>
                      <td className="px-3 py-2"><Badge variant={STATUS_BADGE[a.status] ?? "outline"} className="text-[10px]">{a.status}</Badge></td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1.5">
                          {a.status === "active" && (
                            <>
                              <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy === `dep-${a._id}`} onClick={() => handleRunDepreciation(a)}>
                                {busy === `dep-${a._id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <TrendingDown className="h-3 w-3 mr-1" />}Depreciate
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setTransferTarget(a)}><ArrowRightLeft className="h-3 w-3 mr-1" />Transfer</Button>
                              <Button variant="outline" size="sm" className="h-7 text-xs text-destructive" onClick={() => setDisposeTarget(a)}>Dispose</Button>
                            </>
                          )}
                          {a.status === "active" && (
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setWriteOffTarget(a)}>Write-off</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── CATEGORIES ── */}
        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={catOpen} onOpenChange={setCatOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> New Category</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Asset Category</DialogTitle>
                  <DialogDescription>Define depreciation rules for a class of assets.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Name *</Label><Input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} placeholder="IT Equipment" /></div>
                  <div><Label>Code *</Label><Input value={newCat.code} onChange={(e) => setNewCat({ ...newCat, code: e.target.value })} placeholder="IT" /></div>
                  <div className="col-span-2"><Label>Depreciation Method</Label>
                    <Select value={newCat.depreciationMethod} onValueChange={(v) => setNewCat({ ...newCat, depreciationMethod: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(DEPRECIATION_METHOD_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Useful Life (years)</Label><Input type="number" value={newCat.usefulLifeYears} onChange={(e) => setNewCat({ ...newCat, usefulLifeYears: e.target.value })} /></div>
                  <div><Label>Rate (%)</Label><Input type="number" value={newCat.depreciationRate} onChange={(e) => setNewCat({ ...newCat, depreciationRate: e.target.value })} placeholder="20" /></div>
                  <div className="col-span-2"><Label>Description</Label><Textarea value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCatOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateCategory} disabled={busy === "create-category"}>
                    {busy === "create-category" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Create Category
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!categories ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : categories.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">No categories yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((c: any) => (
                <Card key={c._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm">{c.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px]">{c.code}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 text-xs text-muted-foreground">
                    <p>Method: <span className="font-medium text-foreground">{DEPRECIATION_METHOD_LABEL[c.depreciationMethod] ?? c.depreciationMethod}</span></p>
                    <p>Useful life: <span className="font-medium text-foreground">{c.usefulLifeYears} years</span></p>
                    {c.depreciationRate != null && <p>Rate: <span className="font-medium text-foreground">{c.depreciationRate}%</span></p>}
                    {c.description && <p className="pt-1">{c.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── ALLOCATIONS ── */}
        <TabsContent value="allocations" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={allocateOpen} onOpenChange={setAllocateOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Allocate Asset</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Allocate Asset</DialogTitle>
                  <DialogDescription>Assign an inventory item as an asset to a user.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><Label>Inventory Item *</Label>
                    <Select value={newAlloc.itemId} onValueChange={(v) => setNewAlloc({ ...newAlloc, itemId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                      <SelectContent>
                        {(inventoryItems ?? []).map((i: any) => <SelectItem key={i._id} value={i._id}>{i.name} ({i.sku})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Asset Name *</Label><Input value={newAlloc.assetName} onChange={(e) => setNewAlloc({ ...newAlloc, assetName: e.target.value })} /></div>
                  <div><Label>Asset Tag *</Label><Input value={newAlloc.assetTag} onChange={(e) => setNewAlloc({ ...newAlloc, assetTag: e.target.value })} placeholder="TAG-001" /></div>
                  <div className="col-span-2"><Label>Assign To *</Label>
                    <Select value={newAlloc.allocatedTo} onValueChange={(v) => setNewAlloc({ ...newAlloc, allocatedTo: v })}>
                      <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                      <SelectContent>
                        {(users ?? []).map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Condition</Label>
                    <Select value={newAlloc.condition} onValueChange={(v) => setNewAlloc({ ...newAlloc, condition: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONDITION_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2"><Label>Notes</Label><Textarea value={newAlloc.notes} onChange={(e) => setNewAlloc({ ...newAlloc, notes: e.target.value })} rows={2} /></div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAllocateOpen(false)}>Cancel</Button>
                  <Button onClick={handleAllocate} disabled={busy === "allocate"}>
                    {busy === "allocate" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Allocate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {!allocations ? (
            <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : allocations.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
              No asset allocations yet.
            </div>
          ) : (
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Asset</th>
                    <th className="px-3 py-2">Tag</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Condition</th>
                    <th className="px-3 py-2">Allocated</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((al: any) => (
                    <tr key={al._id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 font-medium">{al.assetName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{al.assetTag}</td>
                      <td className="px-3 py-2"><Badge variant={al.status === "allocated" ? "default" : "secondary"} className="text-[10px]">{al.status}</Badge></td>
                      <td className="px-3 py-2 text-xs">{CONDITION_LABEL[al.condition] ?? al.condition}</td>
                      <td className="px-3 py-2 text-xs">{new Date(al.allocatedDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2 text-right">
                        {al.status === "allocated" && (
                          <Button variant="outline" size="sm" className="h-7 text-xs" disabled={busy === `return-${al._id}`} onClick={() => handleReturn(al)}>
                            {busy === `return-${al._id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : null} Return
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Transfer dialog ── */}
      <Dialog open={!!transferTarget} onOpenChange={(o) => { if (!o) setTransferTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>{transferTarget?.name} — move to a new branch or location.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div><Label>New Location</Label><Input value={transfer.newLocation} onChange={(e) => setTransfer({ ...transfer, newLocation: e.target.value })} placeholder="Floor / room" /></div>
            <div><Label>Remarks</Label><Textarea value={transfer.remarks} onChange={(e) => setTransfer({ ...transfer, remarks: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferTarget(null)}>Cancel</Button>
            <Button onClick={handleTransfer} disabled={busy === "transfer"}>
              {busy === "transfer" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dispose dialog ── */}
      <Dialog open={!!disposeTarget} onOpenChange={(o) => { if (!o) setDisposeTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dispose Asset</DialogTitle>
            <DialogDescription>{disposeTarget?.name} — sold, scrapped, donated or lost.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div><Label>Disposal Type</Label>
              <Select value={dispose.disposalType} onValueChange={(v) => setDispose({ ...dispose, disposalType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="scrapped">Scrapped</SelectItem>
                  <SelectItem value="donated">Donated</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dispose.disposalType === "sold" && (
              <div><Label>Sale Amount ($)</Label><Input type="number" value={dispose.saleAmount} onChange={(e) => setDispose({ ...dispose, saleAmount: e.target.value })} /></div>
            )}
            <div><Label>Reason *</Label><Textarea value={dispose.reason} onChange={(e) => setDispose({ ...dispose, reason: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDispose} disabled={busy === "dispose"}>
              {busy === "dispose" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Dispose
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Write-off dialog ── */}
      <Dialog open={!!writeOffTarget} onOpenChange={(o) => { if (!o) setWriteOffTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write Off Asset</DialogTitle>
            <DialogDescription>{writeOffTarget?.name} — remove from the active register (value → 0).</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <div><Label>Approving User *</Label>
              <Select value={writeOff.approvedBy} onValueChange={(v) => setWriteOff({ ...writeOff, approvedBy: v })}>
                <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                <SelectContent>
                  {(users ?? []).map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Reason *</Label><Textarea value={writeOff.reason} onChange={(e) => setWriteOff({ ...writeOff, reason: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWriteOffTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleWriteOff} disabled={busy === "writeoff"}>
              {busy === "writeoff" ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null} Write Off
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </WorkspaceShell>
  );
}
