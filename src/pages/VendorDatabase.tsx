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
  Users, Search, Building2, Mail, Phone, MapPin,
  Star, BadgeCheck, Ban, Plus
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  inactive: "bg-gray-100 text-gray-500 border-gray-200",
  blacklisted: "bg-red-50 text-red-600 border-red-200",
};

export default function VendorDatabase() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const vendors = useQuery(api.procurementEngine.listVendors, {});

  const filtered = (vendors || []).filter((v: any) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        v.vendorName?.toLowerCase().includes(s) ||
        v.vendorCode?.toLowerCase().includes(s) ||
        v.contactPerson?.toLowerCase().includes(s) ||
        v.email?.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const counts = {
    all: vendors?.length ?? 0,
    active: vendors?.filter((v: any) => v.status === "active").length ?? 0,
    inactive: vendors?.filter((v: any) => v.status === "inactive").length ?? 0,
    blacklisted: vendors?.filter((v: any) => v.status === "blacklisted").length ?? 0,
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage vendor master data, contacts, and performance
          </p>
        </div>
        <Button onClick={() => navigate("/procurement/vendors/new")}>
          <Plus className="h-4 w-4 mr-2" /> Add Vendor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("all")}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{counts.all}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-emerald-500" onClick={() => setStatusFilter("active")}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{counts.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-gray-400" onClick={() => setStatusFilter("inactive")}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{counts.inactive}</p>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-red-500" onClick={() => setStatusFilter("blacklisted")}>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-red-600">{counts.blacklisted}</p>
            <p className="text-xs text-muted-foreground">Blacklisted</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search vendors by name, code, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Vendor Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((v: any) => (
          <Card
            key={v._id}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(`/procurement/vendors/${v._id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm flex items-center gap-1">
                      {v.vendorName}
                      {v.rating && v.rating >= 4 && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{v.vendorCode}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] ${STATUS_COLORS[v.status] || ""}`}>
                  {v.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs text-muted-foreground">
                {v.contactPerson && <p className="flex items-center gap-1"><Users className="h-3 w-3" /> {v.contactPerson}</p>}
                {v.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {v.email}</p>}
                {v.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</p>}
                {v.gstNumber && <p className="flex items-center gap-1"><BadgeCheck className="h-3 w-3" /> GST: {v.gstNumber}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {vendors && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">No vendors found</p>
        )}
        {!vendors && (
          <p className="text-sm text-muted-foreground col-span-full text-center py-8">Loading vendors...</p>
        )}
      </div>
    </div>
  );
}
