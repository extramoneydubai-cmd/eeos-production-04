/**
 * PersonWorkspace — Full person detail workspace using the WorkspaceShell
 *
 * PATCH-UI-002: Integrates with personEngine, contactEngine, relationshipEngine,
 * emergencyContactEngine, personQRCode, and the WorkspaceShell framework.
 */

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useNavigate, useParams } from "react-router";
import { useState, useCallback } from "react";
import {
  User,
  Phone,
  Mail,
  Globe,
  MapPin,
  Heart,
  CalendarDays,
  VenetianMask,
  Droplets,
  BookOpen,
  MessageSquare,
  FileText,
  Activity,
  Link2,
  Users,
  QrCode,
  Shield,
  Edit3,
  Archive,
  RotateCcw,
  Camera,
  BadgeCheck,
  AlertTriangle,
  Clock,
  Hash,
  Star,
  Loader2,
  Building2,
  Network,
  Stethoscope,
  CircleUser,
  Sparkles,
  Plus,
  Trash2,
  Check,
  X,
  Award,
  ExternalLink,
  ChevronLeft,
} from "lucide-react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceOverviewTab } from "@/components/workspace/WorkspaceOverviewTab";
import { WorkspaceTimelineTab } from "@/components/workspace/WorkspaceTimelineTab";
import { WorkspaceTasksTab } from "@/components/workspace/WorkspaceTasksTab";
import { WorkspaceDocumentsTab } from "@/components/workspace/WorkspaceDocumentsTab";
import { WorkspaceActivityTab } from "@/components/workspace/WorkspaceActivityTab";
import { WorkspaceNotesTab } from "@/components/workspace/WorkspaceNotesTab";
import { WorkspaceQR } from "@/components/workspace/WorkspaceQR";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { WorkspaceTabDefinition, WorkspaceTabProps, WorkspaceAction, WorkspaceBodySection } from "@/components/workspace/types";

// ─── Helpers ───────────────────────────────────────────────────────────

function getInitials(person?: Record<string, any>): string {
  const f = person?.firstName?.charAt(0) || "";
  const l = person?.lastName?.charAt(0) || "";
  return `${f}${l}`.toUpperCase() || "?";
}

function formatDate(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getAge(dob?: number): string {
  if (!dob) return "";
  const age = Math.floor((Date.now() - dob) / (365.25 * 86400000));
  return `${age} years`;
}

// ─── Contacts Tab ──────────────────────────────────────────────────────

function ContactsTab({ entityId }: WorkspaceTabProps) {
  const addContact = useMutation(api.contactEngine.addContactMethod as any);
  const removeContact = useMutation(api.contactEngine.removeContactMethod as any);
  const entity = useQuery(api.personEngine.getPerson as any, { personId: entityId as any });
  const contacts = (entity as any)?.contacts || [];

  const [showAdd, setShowAdd] = useState(false);
  const [newContact, setNewContact] = useState({ type: "phone", value: "", label: "" });

  const handleAdd = async () => {
    if (!newContact.value) return;
    try {
      await addContact({
        personId: entityId,
        type: newContact.type,
        value: newContact.value,
        label: newContact.label || undefined,
      });
      toast.success("Contact added");
      setNewContact({ type: "phone", value: "", label: "" });
      setShowAdd(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    }
  };

  const handleRemove = async (contactId: string) => {
    try {
      await removeContact({ contactId: contactId as any });
      toast.success("Contact removed");
    } catch (err) {
      toast.error("Failed to remove contact");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#1a1a2e]">Contact Methods</h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowAdd(true)}>
          <Plus className="h-3 w-3 mr-1" /> Add Contact
        </Button>
      </div>

      {contacts.length === 0 && !showAdd && (
        <Card className="p-6 text-center border-dashed">
          <Phone className="h-6 w-6 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[12px] text-[#5f6368]">No contact methods yet</p>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {contacts.map((c: Record<string, any>) => (
          <Card key={c._id} className="p-3 flex items-center justify-between border-[#e8eaed]">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "p-1.5 rounded-full",
                c.type === "phone" ? "bg-blue-50" :
                c.type === "email" ? "bg-amber-50" :
                "bg-gray-50"
              )}>
                {c.type === "phone" ? <Phone className="h-3.5 w-3.5 text-blue-600" /> :
                 c.type === "email" ? <Mail className="h-3.5 w-3.5 text-amber-600" /> :
                 <Globe className="h-3.5 w-3.5 text-gray-600" />}
              </div>
              <div>
                <p className="text-[12px] font-medium text-[#1a1a2e]">{c.value}</p>
                {c.label && <p className="text-[10px] text-[#5f6368]">{c.label}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {c.isPreferred && (
                <Badge variant="outline" className="text-[8px] h-4 px-1 bg-emerald-50 text-emerald-600 border-emerald-200">
                  Primary
                </Badge>
              )}
              <button onClick={() => handleRemove(c._id)} className="p-1 hover:bg-red-50 rounded">
                <Trash2 className="h-3 w-3 text-[#9aa0a6] hover:text-red-500" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showAdd} onOpenChange={(v) => !v && setShowAdd(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Add Contact Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Type</label>
              <Select value={newContact.type} onValueChange={(v) => setNewContact((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone" className="text-[12px]">Phone</SelectItem>
                  <SelectItem value="email" className="text-[12px]">Email</SelectItem>
                  <SelectItem value="whatsapp" className="text-[12px]">WhatsApp</SelectItem>
                  <SelectItem value="website" className="text-[12px]">Website</SelectItem>
                  <SelectItem value="other" className="text-[12px]">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Value *</label>
              <Input
                value={newContact.value}
                onChange={(e) => setNewContact((f) => ({ ...f, value: e.target.value }))}
                className="h-8 text-[12px]"
                placeholder={newContact.type === "phone" ? "+91 98765 43210" : newContact.type === "email" ? "email@example.com" : "https://..."}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Label (optional)</label>
              <Input
                value={newContact.label}
                onChange={(e) => setNewContact((f) => ({ ...f, label: e.target.value }))}
                className="h-8 text-[12px]"
                placeholder="e.g. Personal, Work, Emergency"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)} className="text-[12px] h-8">Cancel</Button>
            <Button size="sm" onClick={handleAdd} className="text-[12px] h-8">Add Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Relationships Tab ─────────────────────────────────────────────────

function RelationshipsTab({ entityId, entity }: WorkspaceTabProps) {
  const navigate = useNavigate();
  const linkPersons = useMutation(api.relationshipEngine.linkPersons as any);
  const unlinkPersons = useMutation(api.relationshipEngine.unlinkPersons as any);
  const relationships = useQuery(api.relationshipEngine.getPersonRelationships as any, { personId: entityId as any });
  const persons = useQuery(api.personEngine.listPersons as any, { limit: 200 });
  const allPersons = ((persons as any)?.items || []) as Record<string, any>[];

  const [showLink, setShowLink] = useState(false);
  const [linkForm, setLinkForm] = useState({ relatedPersonId: "", relationshipType: "family" });

  const handleLink = async () => {
    if (!linkForm.relatedPersonId) return;
    try {
      await linkPersons({
        personA: entityId,
        personB: linkForm.relatedPersonId,
        relationshipType: linkForm.relationshipType,
      });
      toast.success("Relationship linked");
      setShowLink(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link");
    }
  };

  const handleUnlink = async (relId: string) => {
    try {
      await unlinkPersons({ relationshipId: relId as any });
      toast.success("Relationship removed");
    } catch (err) {
      toast.error("Failed to unlink");
    }
  };

  const relList = (relationships as any) || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#1a1a2e]">Relationships</h3>
        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowLink(true)}>
          <Link2 className="h-3 w-3 mr-1" /> Link Person
        </Button>
      </div>

      {relList.length === 0 && (
        <Card className="p-6 text-center border-dashed">
          <Network className="h-6 w-6 text-[#9aa0a6] mx-auto mb-2" />
          <p className="text-[12px] text-[#5f6368]">No relationships linked</p>
          <Button size="sm" variant="outline" className="mt-3 h-7 text-[11px]" onClick={() => setShowLink(true)}>
            <Link2 className="h-3 w-3 mr-1" /> Link Person
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-2">
        {relList.map((rel: Record<string, any>) => {
          const relatedPersonId = rel.personA === entityId ? rel.personB : rel.personA;
          const relatedName = "Related Person";
          return (
            <Card key={rel._id} className="p-3 flex items-center justify-between border-[#e8eaed]">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 border border-[#e8eaed]">
                  <AvatarFallback className="text-[9px] bg-[#1a1a2e] text-white">?</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-[12px] font-medium text-[#1a1a2e]">{relatedName}</p>
                  <Badge variant="outline" className="text-[9px] h-4 px-1 capitalize">{rel.relationshipType}</Badge>
                </div>
              </div>
              <button onClick={() => handleUnlink(rel._id)} className="p-1 hover:bg-red-50 rounded">
                <X className="h-3 w-3 text-[#9aa0a6] hover:text-red-500" />
              </button>
            </Card>
          );
        })}
      </div>

      <Dialog open={showLink} onOpenChange={(v) => !v && setShowLink(false)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Link Person</DialogTitle>
            <DialogDescription>Create a relationship between this person and another.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Related Person *</label>
              <Select value={linkForm.relatedPersonId} onValueChange={(v) => setLinkForm((f) => ({ ...f, relatedPersonId: v }))}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue placeholder="Select person..." />
                </SelectTrigger>
                <SelectContent>
                  {allPersons
                    .filter((p) => p._id !== entityId)
                    .map((p) => (
                      <SelectItem key={p._id} value={p._id} className="text-[12px]">
                        {p.displayName || `${p.firstName} ${p.lastName}`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-medium text-[#5f6368] mb-1 block">Relationship Type</label>
              <Select value={linkForm.relationshipType} onValueChange={(v) => setLinkForm((f) => ({ ...f, relationshipType: v }))}>
                <SelectTrigger className="h-8 text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["family", "guardian", "emergency_contact", "spouse", "child", "parent", "sibling", "colleague", "manager", "reportee", "other"].map((t) => (
                    <SelectItem key={t} value={t} className="text-[12px] capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowLink(false)} className="text-[12px] h-8">Cancel</Button>
            <Button size="sm" onClick={handleLink} className="text-[12px] h-8">Link</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── QR Tab ────────────────────────────────────────────────────────────

function QRTab({ entityId }: WorkspaceTabProps) {
  const generateQr = useMutation(api.personQRCode.generateQrCode as any);
  const regenerateQr = useMutation(api.personQRCode.regenerateQrCode as any);
  const qrData = useQuery(api.personQRCode.getPersonQrCode as any, { personId: entityId as any });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#1a1a2e]">QR Code</h3>
      <Card className="p-6 flex flex-col items-center border-[#e8eaed]">
        {qrData ? (
          <>
            <div className="w-40 h-40 bg-white border-2 border-[#e8eaed] rounded-lg flex items-center justify-center mb-3">
              <QrCode className="h-24 w-24 text-[#1a1a2e]" />
            </div>
            <p className="text-[11px] text-[#5f6368] font-mono break-all text-center max-w-[250px]">
              {qrData.qrToken}
            </p>
            {qrData.deepLink && (
              <p className="text-[11px] text-[#5f6368] mt-1">{qrData.deepLink}</p>
            )}
            <Badge className={cn("mt-2 text-[10px]", qrData.active ? "bg-emerald-500" : "bg-gray-400")}>
              {qrData.active ? "Active" : "Inactive"}
            </Badge>
            <div className="flex gap-2 mt-4">
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={async () => {
                try {
                  await regenerateQr({ personId: entityId as any });
                  toast.success("QR code regenerated");
                } catch { toast.error("Failed to regenerate"); }
              }}>
                <RotateCcw className="h-3 w-3 mr-1" /> Regenerate
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => {
                // Copy QR token to clipboard
                navigator.clipboard.writeText(qrData.qrToken).then(() => toast.success("Copied to clipboard"));
              }}>
                Copy Token
              </Button>
            </div>
          </>
        ) : (
          <>
            <QrCode className="h-10 w-10 text-[#9aa0a6] mb-3" />
            <p className="text-[12px] text-[#5f6368] mb-3">No QR code generated yet</p>
            <Button size="sm" className="h-7 text-[11px]" onClick={async () => {
              try {
                await generateQr({ personId: entityId as any });
                toast.success("QR code generated");
              } catch { toast.error("Failed to generate QR"); }
            }}>
              <Sparkles className="h-3 w-3 mr-1" /> Generate QR Code
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Person Workspace Page ─────────────────────────────────────────────

export default function PersonWorkspace() {
  const navigate = useNavigate();
  const { personId } = useParams();
  const archivePerson = useMutation(api.personEngine.archivePerson as any);

  const entity = useQuery(api.personEngine.getPerson as any, { personId: personId as any });
  const person = entity as Record<string, any> | null | undefined;

  const handleArchive = useCallback(async () => {
    if (!personId) return;
    try {
      await archivePerson({ personId: personId as any });
      toast.success("Person archived");
      navigate("/people");
    } catch (err) {
      toast.error("Failed to archive person");
    }
  }, [personId, archivePerson, navigate]);

  if (!personId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-[#5f6368]">No person selected</p>
      </div>
    );
  }

  const displayName = person?.displayName || (person ? `${person.firstName || ""} ${person.lastName || ""}` : "Loading...");
  const initials = getInitials(person);

  // ─── Actions ─────────────────────────────────────────────────────
  const actions: WorkspaceAction[] = [
    {
      id: "edit",
      label: "Edit",
      icon: Edit3,
      onClick: () => toast.info("Edit mode coming soon"),
      variant: "outline",
    },
    {
      id: "qr",
      label: "QR Code",
      icon: QrCode,
      onClick: () => toast.info("QR code available in the QR tab"),
      variant: "outline",
    },
    {
      id: "archive",
      label: "Archive",
      icon: Archive,
      onClick: handleArchive,
      variant: "ghost",
      iconColor: "text-red-500",
    },
  ];

  // ─── Tabs ─────────────────────────────────────────────────────────
  const tabs: WorkspaceTabDefinition[] = [
    {
      id: "overview",
      label: "Overview",
      icon: User,
      component: ({ entity, entityId }: WorkspaceTabProps) => {
        const e = entity as Record<string, any>;
        const sections: WorkspaceBodySection[] = [
          {
            id: "personal",
            title: "Personal Information",
            icon: User,
            columns: 2,
            fields: [
              { label: "First Name", value: e?.firstName, editable: true },
              { label: "Middle Name", value: e?.middleName || "—", editable: true },
              { label: "Last Name", value: e?.lastName, editable: true },
              { label: "Display Name", value: e?.displayName || `${e?.firstName || ""} ${e?.lastName || ""}` },
              { label: "Gender", value: e?.gender || "—", type: "badge" },
              { label: "Date of Birth", value: e?.dateOfBirth ? formatDate(e.dateOfBirth) : "—", type: "date" },
              { label: "Age", value: e?.dateOfBirth ? getAge(e.dateOfBirth) : "—" },
              { label: "Blood Group", value: e?.bloodGroup || "—", type: "badge", badgeColor: "bg-red-100 text-red-700" },
              { label: "Nationality", value: e?.nationality || "—" },
              { label: "Marital Status", value: e?.maritalStatus || "—" },
              { label: "Preferred Language", value: e?.preferredLanguage || "—" },
              { label: "Timezone", value: e?.timezone || "—" },
            ],
          },
          {
            id: "contacts",
            title: "Contact Methods",
            icon: Phone,
            columns: 1,
            fields: (e?.contacts || []).length > 0
              ? (e.contacts as any[]).map((c: any) => ({
                  label: c.type.charAt(0).toUpperCase() + c.type.slice(1),
                  value: c.value,
                  type: c.type === "email" ? "email" : c.type === "phone" ? "phone" : "text",
                }))
              : [{ label: "Contacts", value: "No contacts added yet" }],
          },
          {
            id: "addresses",
            title: "Addresses",
            icon: MapPin,
            columns: 1,
            fields: (e?.addresses || []).length > 0
              ? (e.addresses as any[]).map((a: any) => ({
                  label: a.type || "Address",
                  value: [a.street, a.city, a.state, a.country, a.postalCode].filter(Boolean).join(", "),
                }))
              : [{ label: "Address", value: "No addresses added yet" }],
          },
          {
            id: "social",
            title: "Social Links",
            icon: Globe,
            columns: 1,
            fields: (e?.socialLinks || []).length > 0
              ? (e.socialLinks as any[]).map((s: any) => ({
                  label: s.platform || "Link",
                  value: s.url,
                  type: "link" as const,
                  href: s.url,
                }))
              : [{ label: "Social", value: "No social links added yet" }],
          },
        ];

        return (
          <div className="space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="p-3 text-center border-[#e8eaed]">
                <Phone className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-[#1a1a2e]">{(e?.contacts || []).length}</p>
                <p className="text-[10px] text-[#5f6368]">Contacts</p>
              </Card>
              <Card className="p-3 text-center border-[#e8eaed]">
                <MapPin className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-[#1a1a2e]">{(e?.addresses || []).length}</p>
                <p className="text-[10px] text-[#5f6368]">Addresses</p>
              </Card>
              <Card className="p-3 text-center border-[#e8eaed]">
                <Link2 className="h-4 w-4 text-purple-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-[#1a1a2e]">{(e?.socialLinks || []).length}</p>
                <p className="text-[10px] text-[#5f6368]">Social Links</p>
              </Card>
              <Card className="p-3 text-center border-[#e8eaed]">
                <QrCode className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-lg font-semibold text-[#1a1a2e]">{e?.qrCode ? "✓" : "—"}</p>
                <p className="text-[10px] text-[#5f6368]">QR Code</p>
              </Card>
            </div>

            {/* Profile sections */}
            {sections.map((section) => (
              <Card key={section.id} className="border-[#e8eaed]">
                <div className="px-4 py-2.5 border-b border-[#e8eaed] bg-[#f8f9fa] rounded-t-lg">
                  <h4 className="text-[12px] font-semibold text-[#1a1a2e] flex items-center gap-1.5">
                    {section.icon && <section.icon className="h-3.5 w-3.5 text-[#5f6368]" />}
                    {section.title}
                  </h4>
                </div>
                <div className={cn(
                  "p-4 grid gap-x-6 gap-y-2.5",
                  section.columns === 2 ? "grid-cols-2" : "grid-cols-1",
                )}>
                  {section.fields.map((field) => (
                    <div key={field.label} className="space-y-0.5">
                      <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">
                        {field.label}
                      </p>
                      <p className="text-[12px] text-[#1a1a2e]">
                        {field.type === "badge" ? (
                          <Badge variant="outline" className={cn("text-[10px] font-normal", field.badgeColor)}>
                            {field.value as string}
                          </Badge>
                        ) : field.type === "email" ? (
                          <a href={`mailto:${field.value}`} className="text-blue-600 hover:underline">{field.value as string}</a>
                        ) : field.type === "phone" ? (
                          <a href={`tel:${field.value}`} className="text-blue-600 hover:underline">{field.value as string}</a>
                        ) : field.type === "link" ? (
                          <a href={field.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            {field.value as string} <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          (field.value as string) || "—"
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        );
      },
    },
    {
      id: "contacts",
      label: "Contacts",
      icon: Phone,
      component: ContactsTab,
    },
    {
      id: "relationships",
      label: "Relationships",
      icon: Network,
      component: RelationshipsTab,
    },
    {
      id: "qr",
      label: "QR Code",
      icon: QrCode,
      component: QRTab,
    },
    {
      id: "documents",
      label: "Documents",
      icon: FileText,
      component: WorkspaceDocumentsTab,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Activity,
      component: WorkspaceTimelineTab,
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: Award,
      component: WorkspaceTasksTab,
    },
    {
      id: "notes",
      label: "Notes",
      icon: MessageSquare,
      component: WorkspaceNotesTab,
    },
    {
      id: "activity",
      label: "Activity",
      icon: Activity,
      component: WorkspaceActivityTab,
    },
  ];

  return (
    <WorkspaceShell
      entityType="person"
      entityId={personId}
      entity={person}
      isLoading={!person && !entity}
      error={!person && entity !== undefined ? "Person not found" : null}
      title={displayName}
      subtitle={person?.nationality ? `${person.nationality}` : "Person"}
      badge={{
        label: person?.status || "active",
        color: person?.status === "active" ? "bg-emerald-500" :
               person?.status === "archived" ? "bg-red-500" : "bg-gray-400",
      }}
      badgeSecondary={person?.bloodGroup ? { label: person.bloodGroup, color: "text-red-600" } : undefined}
      avatar={
        <Avatar className="h-10 w-10 shrink-0 border border-[#e8eaed]">
          <AvatarImage src={person?.profilePhoto || ""} alt={displayName} />
          <AvatarFallback className="text-[11px] bg-[#1a1a2e] text-white font-medium">{initials}</AvatarFallback>
        </Avatar>
      }
      avatarInitials={initials}
      backLink={{
        label: "Back to People Registry",
        onClick: () => navigate("/people"),
      }}
      tabs={tabs}
      actions={actions}
      module="people"
      defaultTab="overview"
    />
  );
}
