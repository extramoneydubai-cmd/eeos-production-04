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
  Building2, Users, Mail, Phone, MapPin, Star, BadgeCheck,
  FileText, Clock, Package, DollarSign
} from "lucide-react";

export default function VendorWorkspace() {
  const { vendorId } = useParams();
  const vendor = useQuery(
    api.procurementEngine.getVendor,
    vendorId ? { id: vendorId as Id<"vendorMaster"> } : "skip",
  );

  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading vendor...</p>
      </div>
    );
  }

  const tabs: WorkspaceTabConfig[] = [
    {
      id: "overview", label: "Overview", icon: Building2,
      component: () => (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Vendor Information</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><dt className="text-muted-foreground text-xs">Name</dt><dd className="font-medium">{vendor.vendorName}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Code</dt><dd className="font-medium">{vendor.vendorCode}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Status</dt><dd><Badge className={vendor.status === "active" ? "bg-emerald-500" : vendor.status === "blacklisted" ? "bg-red-500" : ""}>{vendor.status}</Badge></dd></div>
                {vendor.rating && <div><dt className="text-muted-foreground text-xs">Rating</dt><dd className="font-medium">{vendor.rating} / 5</dd></div>}
                {vendor.contactPerson && <div><dt className="text-muted-foreground text-xs">Contact Person</dt><dd className="font-medium">{vendor.contactPerson}</dd></div>}
                {vendor.email && <div><dt className="text-muted-foreground text-xs">Email</dt><dd className="font-medium">{vendor.email}</dd></div>}
                {vendor.phone && <div><dt className="text-muted-foreground text-xs">Phone</dt><dd className="font-medium">{vendor.phone}</dd></div>}
                {vendor.gstNumber && <div><dt className="text-muted-foreground text-xs">GST Number</dt><dd className="font-medium">{vendor.gstNumber}</dd></div>}
                {vendor.paymentTerms && <div><dt className="text-muted-foreground text-xs">Payment Terms</dt><dd className="font-medium">{vendor.paymentTerms}</dd></div>}
                {vendor.leadTime && <div><dt className="text-muted-foreground text-xs">Lead Time</dt><dd className="font-medium">{vendor.leadTime} days</dd></div>}
              </dl>
              {vendor.notes && <p className="text-sm text-muted-foreground mt-4">{vendor.notes}</p>}
            </CardContent>
          </Card>
        </div>
      ),
    },
    {
      id: "contacts", label: "Contacts", icon: Users,
      component: () => (
        <div className="border border-dashed border-border rounded-lg p-8 text-center text-sm text-muted-foreground">
          Contact management will be available in the next release
        </div>
      ),
    },
    {
      id: "purchase-orders", label: "Purchase Orders", icon: Package,
      component: () => (
        <div className="text-sm text-muted-foreground p-4">
          Purchase orders for this vendor will appear here
        </div>
      ),
    },
    {
      id: "payments", label: "Payments", icon: DollarSign,
      component: () => (
        <div className="text-sm text-muted-foreground p-4">
          Payment history for this vendor will appear here
        </div>
      ),
    },
    {
      id: "documents", label: "Documents", icon: FileText,
      component: () => <div className="text-sm text-muted-foreground p-4">Documents</div>,
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
          title={vendor.vendorName}
          subtitle={`Vendor • ${vendor.vendorCode}`}
          color="#6366f1"
        />
      }
    />
  );
}
