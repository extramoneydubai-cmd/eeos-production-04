import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useAppNavigate } from "@/hooks/use-app-navigate";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import {
  FileText,
  Plus,
  Search,
  Layout,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Archive,
  Copy,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowUpDown,
  GripVertical,
  Settings,
  Code2,
  QrCode,
  ExternalLink,
  Upload,
  Image,
  FileUp,
  ListChecks,
  ChevronRight,
  ChevronDown,
  Database,
  Layers,
  Send,
  BarChart3,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

type FieldType =
  | "text" | "textarea" | "number" | "currency" | "date" | "time" | "datetime"
  | "email" | "phone" | "whatsapp" | "url" | "password"
  | "dropdown" | "multi_select" | "radio" | "checkbox" | "toggle"
  | "file_upload" | "image_upload" | "signature"
  | "lookup" | "employee_lookup" | "user_lookup"
  | "section" | "divider" | "heading" | "html" | "label" | "hidden"
  | "formula" | "auto_number" | "system_field";

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string; icon: string }[] = [
  { value: "text", label: "Text", icon: "Aa" },
  { value: "textarea", label: "Textarea", icon: "¶" },
  { value: "number", label: "Number", icon: "#" },
  { value: "currency", label: "Currency", icon: "$" },
  { value: "date", label: "Date", icon: "📅" },
  { value: "time", label: "Time", icon: "⏰" },
  { value: "datetime", label: "Date & Time", icon: "📆" },
  { value: "email", label: "Email", icon: "@" },
  { value: "phone", label: "Phone", icon: "📞" },
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "url", label: "URL", icon: "🔗" },
  { value: "password", label: "Password", icon: "🔑" },
  { value: "dropdown", label: "Dropdown", icon: "▼" },
  { value: "multi_select", label: "Multi Select", icon: "☰" },
  { value: "radio", label: "Radio", icon: "◉" },
  { value: "checkbox", label: "Checkbox", icon: "☑" },
  { value: "toggle", label: "Toggle", icon: "⚡" },
  { value: "file_upload", label: "File Upload", icon: "📎" },
  { value: "image_upload", label: "Image Upload", icon: "🖼" },
  { value: "signature", label: "Signature", icon: "✍" },
  { value: "section", label: "Section", icon: "▬" },
  { value: "divider", label: "Divider", icon: "―" },
  { value: "heading", label: "Heading", icon: "H" },
  { value: "label", label: "Label", icon: "ℹ" },
  { value: "hidden", label: "Hidden", icon: "👻" },
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-[#f1f3f4] text-[#5f6368]",
  published: "bg-[#e6f4ea] text-[#137333]",
  archived: "bg-[#fce8e6] text-[#c5221f]",
  deactivated: "bg-[#fef7e0] text-[#e37400]",
};

const SUBMISSION_COLORS: Record<string, string> = {
  draft: "bg-[#f1f3f4] text-[#5f6368]",
  submitted: "bg-[#e8f0fe] text-[#1a73e8]",
  validated: "bg-[#e6f4ea] text-[#137333]",
  duplicate: "bg-[#fef7e0] text-[#e37400]",
  completed: "bg-[#e6f4ea] text-[#137333]",
  rejected: "bg-[#fce8e6] text-[#c5221f]",
};

// ─── Status Badge ───────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge className={`text-[10px] font-medium ${STATUS_COLORS[status] || "bg-[#f1f3f4] text-[#5f6368]"}`}>
      {status}
    </Badge>
  );
}

// ─── Form List View ─────────────────────────────────────────────

function FormListView({
  forms,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  forms: any[];
  onSelect: (f: any) => void;
  onDelete: (id: any) => void;
  onDuplicate: (id: any) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = forms.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9aa0a6]" />
        <Input
          placeholder="Search forms..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-[12px]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[13px] text-[#9aa0a6]">
          <FileText className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
          No forms found
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((form) => (
            <div
              key={form._id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[#e8eaed] hover:bg-[#fafafa] transition-colors cursor-pointer"
              onClick={() => onSelect(form)}
            >
              <div className="w-8 h-8 rounded-lg bg-[#f1f3f4] flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-[#5f6368]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#1a1a2e] truncate">
                    {form.name}
                  </span>
                  <StatusBadge status={form.status} />
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#9aa0a6]">
                  <code className="text-[#1a73e8]">{form.code}</code>
                  {form.category && <span>• {form.category}</span>}
                  <span>• v{form.version}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#9aa0a6] hover:text-[#5f6368]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(form._id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(form._id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                <ChevronRight className="h-4 w-4 text-[#dadce0]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Form Builder ──────────────────────────────────────────────

function FormBuilder({
  form,
  fields,
  onAddField,
  onUpdateField,
  onDeleteField,
  onReorderFields,
}: {
  form: any;
  fields: any[];
  onAddField: (field: any) => void;
  onUpdateField: (id: any, data: any) => void;
  onDeleteField: (id: any) => void;
  onReorderFields: (orderedIds: any[]) => void;
}) {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [editingField, setEditingField] = useState<any>(null);
  const [showFieldEditor, setShowFieldEditor] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1a1a2e]">Form Builder</h3>
          <p className="text-[11px] text-[#9aa0a6]">{fields.length} fields</p>
        </div>
        <Button
          size="sm"
          className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
          onClick={() => setShowFieldPicker(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Field
        </Button>
      </div>

      {/* Field list */}
      <div className="space-y-1.5">
        {fields.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#e8eaed] rounded-lg">
            <Layout className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
            <p className="text-[12px] text-[#9aa0a6]">No fields yet. Click "Add Field" to start building your form.</p>
          </div>
        ) : (
          [...fields]
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((field, idx) => (
              <div
                key={field._id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#fafafa] group"
              >
                <GripVertical className="h-4 w-4 text-[#dadce0] cursor-grab shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] text-[#5f6368] font-mono shrink-0">
                      {field.fieldType}
                    </Badge>
                    <span className="text-[12px] font-medium text-[#1a1a2e] truncate">
                      {field.label || field.fieldCode}
                    </span>
                    {field.required && <span className="text-[#ea4335] text-[10px]">*</span>}
                  </div>
                  {field.fieldCode && (
                    <code className="text-[9px] text-[#9aa0a6]">{field.fieldCode}</code>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#9aa0a6] hover:text-[#1a73e8]"
                    onClick={() => {
                      setEditingField(field);
                      setShowFieldEditor(true);
                    }}
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-[#9aa0a6] hover:text-[#ea4335]"
                    onClick={() => onDeleteField(field._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
        )}
      </div>

      {/* Field Type Picker Dialog */}
      <Dialog open={showFieldPicker} onOpenChange={setShowFieldPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Add Field</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
            {FIELD_TYPE_OPTIONS.map((ft) => (
              <button
                key={ft.value}
                className="flex flex-col items-center gap-1 p-3 rounded-lg border border-[#e8eaed] hover:bg-[#f1f3f4] hover:border-[#1a73e8] transition-all text-center"
                onClick={() => {
                  const fieldCode = `field_${ft.value}_${Date.now()}`;
                  onAddField({
                    fieldCode,
                    fieldType: ft.value,
                    label: ft.label,
                  });
                  setShowFieldPicker(false);
                }}
              >
                <span className="text-lg">{ft.icon}</span>
                <span className="text-[10px] text-[#5f6368]">{ft.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Field Editor Dialog */}
      <Dialog open={showFieldEditor} onOpenChange={setShowFieldEditor}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Edit Field</DialogTitle>
          </DialogHeader>
          {editingField && (
            <FieldEditor
              field={editingField}
              onSave={(data) => {
                onUpdateField(editingField._id, data);
                setShowFieldEditor(false);
              }}
              onCancel={() => setShowFieldEditor(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Field Editor ──────────────────────────────────────────────

function FieldEditor({
  field,
  onSave,
  onCancel,
}: {
  field: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState(field.label || "");
  const [fieldCode, setFieldCode] = useState(field.fieldCode || "");
  const [placeholder, setPlaceholder] = useState(field.placeholder || "");
  const [description, setDescription] = useState(field.description || "");
  const [required, setRequired] = useState(field.required || false);
  const [readOnly, setReadOnly] = useState(field.readOnly || false);
  const [hidden, setHidden] = useState(field.hidden || false);
  const [defaultValue, setDefaultValue] = useState(field.defaultValue || "");
  const [optionsText, setOptionsText] = useState(
    (field.options || []).join("\n")
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px]">Label</Label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="h-8 text-[12px]"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px]">Field Code</Label>
          <Input
            value={fieldCode}
            onChange={(e) => setFieldCode(e.target.value)}
            className="h-8 text-[12px] font-mono"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Placeholder</Label>
        <Input
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          className="h-8 text-[12px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-[12px] min-h-[60px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Default Value</Label>
        <Input
          value={defaultValue}
          onChange={(e) => setDefaultValue(e.target.value)}
          className="h-8 text-[12px]"
        />
      </div>

      {(field.fieldType === "dropdown" ||
        field.fieldType === "multi_select" ||
        field.fieldType === "radio" ||
        field.fieldType === "checkbox") && (
        <div className="space-y-1.5">
          <Label className="text-[11px]">Options (one per line)</Label>
          <Textarea
            value={optionsText}
            onChange={(e) => setOptionsText(e.target.value)}
            className="text-[12px] min-h-[80px]"
            placeholder="Option 1&#10;Option 2&#10;Option 3"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-4 pt-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            checked={required}
            onCheckedChange={(v) => setRequired(v === true)}
          />
          <Label htmlFor="required" className="text-[11px] cursor-pointer">Required</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="readonly"
            checked={readOnly}
            onCheckedChange={(v) => setReadOnly(v === true)}
          />
          <Label htmlFor="readonly" className="text-[11px] cursor-pointer">Read Only</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="hidden"
            checked={hidden}
            onCheckedChange={(v) => setHidden(v === true)}
          />
          <Label htmlFor="hidden" className="text-[11px] cursor-pointer">Hidden</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" className="h-8 text-[11px]" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
          onClick={() =>
            onSave({
              label,
              fieldCode,
              placeholder,
              description,
              required,
              readOnly,
              hidden,
              defaultValue,
              options: optionsText
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        >
          Save Field
        </Button>
      </div>
    </div>
  );
}

// ─── Form Settings Panel ───────────────────────────────────────

function FormSettings({
  form,
  onUpdate,
}: {
  form: any;
  onUpdate: (data: any) => void;
}) {
  const [name, setName] = useState(form.name || "");
  const [description, setDescription] = useState(form.description || "");
  const [category, setCategory] = useState(form.category || "");
  const [isPublic, setIsPublic] = useState(form.isPublic || false);
  const [requiresAuth, setRequiresAuth] = useState(form.requiresAuth ?? true);
  const [allowAnonymous, setAllowAnonymous] = useState(form.allowAnonymous || false);
  const [enableQr, setEnableQr] = useState(form.enableQr || false);
  const [autoSaveDraft, setAutoSaveDraft] = useState(form.autoSaveDraft || false);
  const [successMessage, setSuccessMessage] = useState(form.successMessage || "");
  const [redirectUrl, setRedirectUrl] = useState(form.redirectUrl || "");

  const hasChanges =
    name !== form.name ||
    description !== (form.description || "") ||
    category !== (form.category || "") ||
    isPublic !== form.isPublic ||
    requiresAuth !== (form.requiresAuth ?? true) ||
    allowAnonymous !== form.allowAnonymous ||
    enableQr !== form.enableQr ||
    autoSaveDraft !== form.autoSaveDraft ||
    successMessage !== (form.successMessage || "") ||
    redirectUrl !== (form.redirectUrl || "");

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-[11px]">Form Name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-8 text-[12px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="text-[12px] min-h-[60px]"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Category</Label>
        <Input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 text-[12px]"
          placeholder="e.g. Admission, Feedback, Leave"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-[11px] font-medium">Access & Visibility</Label>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] text-[#1a1a2e]">Public Form</span>
            <p className="text-[10px] text-[#9aa0a6]">Allow anyone with the link to submit</p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] text-[#1a1a2e]">Require Authentication</span>
            <p className="text-[10px] text-[#9aa0a6]">Users must log in to submit</p>
          </div>
          <Switch checked={requiresAuth} onCheckedChange={setRequiresAuth} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] text-[#1a1a2e]">Allow Anonymous</span>
            <p className="text-[10px] text-[#9aa0a6]">Allow submissions without user identification</p>
          </div>
          <Switch checked={allowAnonymous} onCheckedChange={setAllowAnonymous} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[12px] text-[#1a1a2e]">QR Code Enabled</span>
            <p className="text-[10px] text-[#9aa0a6]">Generate QR code for this form</p>
          </div>
          <Switch checked={enableQr} onCheckedChange={setEnableQr} />
        </div>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <div>
          <span className="text-[12px] text-[#1a1a2e]">Auto-save Draft</span>
          <p className="text-[10px] text-[#9aa0a6]">Automatically save draft submissions</p>
        </div>
        <Switch checked={autoSaveDraft} onCheckedChange={setAutoSaveDraft} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Success Message</Label>
        <Input
          value={successMessage}
          onChange={(e) => setSuccessMessage(e.target.value)}
          className="h-8 text-[12px]"
          placeholder="Thank you for your submission!"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px]">Redirect URL (optional)</Label>
        <Input
          value={redirectUrl}
          onChange={(e) => setRedirectUrl(e.target.value)}
          className="h-8 text-[12px]"
          placeholder="https://..."
        />
      </div>

      {hasChanges && (
        <Button
          size="sm"
          className="w-full h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
          onClick={() =>
            onUpdate({
              name,
              description,
              category,
              isPublic,
              requiresAuth,
              allowAnonymous,
              enableQr,
              autoSaveDraft,
              successMessage,
              redirectUrl,
            })
          }
        >
          Save Settings
        </Button>
      )}
    </div>
  );
}

// ─── Submissions Viewer ────────────────────────────────────────

function SubmissionsViewer({
  submissions,
  form,
}: {
  submissions: any[];
  form: any;
}) {
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1a1a2e]">
          Submissions ({submissions.length})
        </h3>
        <Badge variant="outline" className="text-[10px] text-[#5f6368]">
          v{form.version}
        </Badge>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-[#e8eaed] rounded-lg">
          <Send className="h-8 w-8 mx-auto mb-2 text-[#dadce0]" />
          <p className="text-[12px] text-[#9aa0a6]">No submissions yet</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {submissions.slice(0, 20).map((s) => (
            <div
              key={s._id}
              className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e8eaed] hover:bg-[#fafafa] cursor-pointer"
              onClick={() =>
                setSelectedSubmission(
                  selectedSubmission?._id === s._id ? null : s
                )
              }
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#1a1a2e]">
                    #{s._id.slice(-6)}
                  </span>
                  <Badge
                    className={`text-[9px] ${
                      SUBMISSION_COLORS[s.status] || "bg-[#f1f3f4] text-[#5f6368]"
                    }`}
                  >
                    {s.status}
                  </Badge>
                </div>
                <p className="text-[10px] text-[#9aa0a6] mt-0.5">
                  {new Date(s.createdAt).toLocaleString()}
                  {s.source && ` • ${s.source}`}
                </p>
              </div>
              {selectedSubmission?._id === s._id ? (
                <ChevronDown className="h-4 w-4 text-[#9aa0a6]" />
              ) : (
                <ChevronRight className="h-4 w-4 text-[#dadce0]" />
              )}
            </div>
          ))}
        </div>
      )}

      {selectedSubmission && (
        <Card className="border-[#e8eaed] bg-[#fafafa]">
          <CardContent className="pt-4">
            <div className="text-[11px] font-mono whitespace-pre-wrap break-all text-[#5f6368]">
              {JSON.stringify(
                JSON.parse(selectedSubmission.payload || "{}"),
                null,
                2
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════════

export default function FormStudio() {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();

  // Queries
  const forms = useQuery(api.formEngine.listForms, {}) || [];
  const formStats = useQuery(api.formEngine.getFormStats, {});

  // Mutations
  const createForm = useMutation(api.formEngine.createForm);
  const updateForm = useMutation(api.formEngine.updateForm);
  const publishForm = useMutation(api.formEngine.publishForm);
  const archiveForm = useMutation(api.formEngine.archiveForm);
  const deactivateForm = useMutation(api.formEngine.deactivateForm);
  const deleteForm = useMutation(api.formEngine.deleteForm);
  const duplicateForm = useMutation(api.formEngine.duplicateForm);
  const createField = useMutation(api.formEngine.createFormField);
  const updateField = useMutation(api.formEngine.updateFormField);
  const deleteField = useMutation(api.formEngine.deleteFormField);
  const reorderFields = useMutation(api.formEngine.reorderFormFields);
  // State
  const [view, setView] = useState<"dashboard" | "edit">("dashboard");
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("builder");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFormCategory, setNewFormCategory] = useState("");

  // Selected form — always call useQuery unconditionally (React hooks rule)
  // Use "skip" when no form is selected to avoid sending invalid formId to Convex
  const selectedForm = forms.find((f: any) => f._id === selectedFormId) || null;
  const fieldsResult = useQuery(
    api.formEngine.listFormFields,
    selectedFormId ? { formId: selectedFormId as any } : "skip",
  );
  const submissionsResult = useQuery(
    api.formEngine.listSubmissions,
    selectedFormId ? { formId: selectedFormId as any } : "skip",
  );
  const fields = (fieldsResult as any[]) || [];
  const submissions = (submissionsResult as any[]) || [];

  // ─── Handlers ──────────────────────────────────────────────

  const handleCreateForm = async () => {
    if (!newFormName.trim()) return;
    try {
      const formId = await createForm({
        name: newFormName.trim(),
        category: newFormCategory.trim() || undefined,
        ownerId: user?._id as any,
      });
      toast.success("Form created");
      setShowCreateDialog(false);
      setNewFormName("");
      setNewFormCategory("");
      setSelectedFormId(formId);
      setView("edit");
    } catch (err) {
      toast.error("Failed to create form");
    }
  };

  const handlePublish = async () => {
    if (!selectedFormId) return;
    try {
      const result = await publishForm({
        formId: selectedFormId as any,
        publishedBy: user?._id as any,
      });
      toast.success(`Published as v${result.version}`);
    } catch (err) {
      toast.error("Failed to publish");
    }
  };

  const handleArchive = async () => {
    if (!selectedFormId) return;
    try {
      await archiveForm({ formId: selectedFormId as any });
      toast.success("Form archived");
    } catch (err) {
      toast.error("Failed to archive");
    }
  };

  const handleDelete = async (formId: any) => {
    try {
      await deleteForm({ formId });
      toast.success("Form deleted");
      if (selectedFormId === formId) {
        setSelectedFormId(null);
        setView("dashboard");
      }
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const handleDuplicate = async (formId: any) => {
    try {
      await duplicateForm({ formId, ownerId: user?._id as any });
      toast.success("Form duplicated");
    } catch (err) {
      toast.error("Failed to duplicate");
    }
  };

  const handleAddField = async (fieldData: any) => {
    if (!selectedFormId) return;
    try {
      await createField({
        formId: selectedFormId as any,
        ...fieldData,
      });
      toast.success("Field added");
    } catch (err) {
      toast.error("Failed to add field");
    }
  };

  const handleUpdateField = async (fieldId: any, data: any) => {
    try {
      await updateField({ fieldId, ...data });
      toast.success("Field updated");
    } catch (err) {
      toast.error("Failed to update field");
    }
  };

  const handleDeleteField = async (fieldId: any) => {
    try {
      await deleteField({ fieldId });
      toast.success("Field deleted");
    } catch (err) {
      toast.error("Failed to delete field");
    }
  };

  const handleUpdateForm = async (data: any) => {
    if (!selectedFormId) return;
    try {
      await updateForm({ formId: selectedFormId as any, ...data });
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    }
  };

  // ─── Dashboard View ────────────────────────────────────────

  if (view === "dashboard") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#1a1a2e]">Form Studio</h1>
            <p className="text-[12px] text-[#5f6368]">
              Universal Intake Engine — Build and manage forms
            </p>
          </div>
          <Button
            size="sm"
            className="h-9 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Form
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-[#1a1a2e] mt-0.5">
                {formStats?.total ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">Draft</p>
              <p className="text-xl font-bold text-[#5f6368] mt-0.5">
                {formStats?.draft ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">Published</p>
              <p className="text-xl font-bold text-[#137333] mt-0.5">
                {formStats?.published ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">Archived</p>
              <p className="text-xl font-bold text-[#c5221f] mt-0.5">
                {formStats?.archived ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <p className="text-[10px] text-[#9aa0a6] uppercase tracking-wider">Submissions</p>
              <p className="text-xl font-bold text-[#1a73e8] mt-0.5">
                {formStats?.totalSubmissions ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent submissions */}
        {formStats?.recentSubmissions && formStats.recentSubmissions.length > 0 && (
          <Card className="border-[#e8eaed]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Recent Submissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {formStats.recentSubmissions.map((s: any) => {
                  const form = forms.find((f: any) => f._id === s.formId);
                  return (
                    <div
                      key={s._id}
                      className="flex items-center gap-2 text-[11px] text-[#5f6368]"
                    >
                      <span className="font-mono text-[9px] text-[#9aa0a6]">
                        #{s._id.slice(-6)}
                      </span>
                      <span className="text-[#1a1a2e] font-medium">
                        {form?.name || "Unknown"}
                      </span>
                      <Badge
                        className={`text-[8px] ${
                          SUBMISSION_COLORS[s.status] || ""
                        }`}
                      >
                        {s.status}
                      </Badge>
                      <span className="ml-auto text-[9px] text-[#9aa0a6]">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form list */}
        <FormListView
          forms={forms}
          onSelect={(f) => {
            setSelectedFormId(f._id);
            setView("edit");
            setActiveTab("builder");
          }}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />

        {/* Create Form Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-base">Create New Form</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px]">Form Name</Label>
                <Input
                  value={newFormName}
                  onChange={(e) => setNewFormName(e.target.value)}
                  className="h-8 text-[12px]"
                  placeholder="e.g. Admission Form"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px]">Category (optional)</Label>
                <Input
                  value={newFormCategory}
                  onChange={(e) => setNewFormCategory(e.target.value)}
                  className="h-8 text-[12px]"
                  placeholder="e.g. Admission, Feedback, Leave"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d44] text-white"
                onClick={handleCreateForm}
                disabled={!newFormName.trim()}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── Form Editor View ──────────────────────────────────────

  if (!selectedForm) {
    return (
      <div className="text-center py-12">
        <p className="text-[13px] text-[#9aa0a6]">Form not found</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-2 h-8 text-[11px]"
          onClick={() => {
            setView("dashboard");
            setSelectedFormId(null);
          }}
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#9aa0a6]"
            onClick={() => {
              setView("dashboard");
              setSelectedFormId(null);
            }}
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-[#1a1a2e]">
                {selectedForm.name}
              </h1>
              <StatusBadge status={selectedForm.status} />
              <Badge variant="outline" className="text-[9px] text-[#5f6368]">
                v{selectedForm.version}
              </Badge>
            </div>
            <p className="text-[11px] text-[#9aa0a6]">
              <code>{selectedForm.code}</code>
              {selectedForm.category && <span> • {selectedForm.category}</span>}
              {selectedForm.isPublic && <span> • Public</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedForm.status !== "published" && (
            <Button
              size="sm"
              className="h-8 text-[11px] bg-[#137333] hover:bg-[#0d5e2a] text-white"
              onClick={handlePublish}
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              Publish
            </Button>
          )}
          {selectedForm.status !== "archived" && selectedForm.status !== "deactivated" && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-[11px] text-[#5f6368]"
              onClick={handleArchive}
            >
              <Archive className="h-3.5 w-3.5 mr-1" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f1f3f4] h-9">
          <TabsTrigger value="builder" className="text-[11px] h-7">
            <Layout className="h-3.5 w-3.5 mr-1" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-[11px] h-7">
            <Settings className="h-3.5 w-3.5 mr-1" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-[11px] h-7">
            <Send className="h-3.5 w-3.5 mr-1" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="share" className="text-[11px] h-7">
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder" className="mt-4">
          <FormBuilder
            form={selectedForm}
            fields={fields}
            onAddField={handleAddField}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
            onReorderFields={() => {}}
          />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Form Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormSettings form={selectedForm} onUpdate={handleUpdateForm} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardContent className="pt-4">
              <SubmissionsViewer submissions={submissions} form={selectedForm} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="mt-4">
          <Card className="border-[#e8eaed]">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">
                Share Form
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-[11px]">Public URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={selectedForm.publicUrl || ""}
                    readOnly
                    className="h-8 text-[12px] font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        window.location.origin + (selectedForm.publicUrl || "")
                      );
                      toast.success("URL copied");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>

              {selectedForm.enableQr && (
                <div className="p-4 border border-[#e8eaed] rounded-lg text-center">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-[#9aa0a6]" />
                  <p className="text-[11px] text-[#9aa0a6]">
                    QR code enabled for this form
                  </p>
                </div>
              )}

              <div>
                <Label className="text-[11px]">Embed Code</Label>
                <div className="mt-1 p-3 bg-[#fafafa] border border-[#e8eaed] rounded-lg">
                  <code className="text-[10px] text-[#5f6368] break-all">
                    {`<iframe src="${window.location.origin}${selectedForm.publicUrl}" width="100%" height="600" frameborder="0"></iframe>`}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8 text-[11px]"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `<iframe src="${window.location.origin}${selectedForm.publicUrl}" width="100%" height="600" frameborder="0"></iframe>`
                    );
                    toast.success("Embed code copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Embed Code
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
