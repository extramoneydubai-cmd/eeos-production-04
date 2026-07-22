import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StudioLayout } from "@/components/layout/StudioLayout";
import { DataTable, type Column } from "@/components/data/DataTable";
import { SearchBar } from "@/components/data/SearchBar";
import { CrudDialog, type CrudField } from "@/components/shared/CrudDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Plus, ArrowLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

// ─── Manual entity types (avoiding dependency on generated Doc<>) ───
interface Org {
  _id: string;
  _creationTime: number;
  name: string;
  code: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

interface Branch {
  _id: string;
  _creationTime: number;
  organizationId: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  isActive: boolean;
}

interface Dept {
  _id: string;
  _creationTime: number;
  branchId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

interface Team {
  _id: string;
  _creationTime: number;
  departmentId: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

// ─── Drill-down state ───
interface DrillState {
  level: "orgs" | "branches" | "departments" | "teams";
  orgId?: string;
  orgName?: string;
  branchId?: string;
  branchName?: string;
  deptId?: string;
  deptName?: string;
}

// ─── Shared field definitions ───
const orgFields: CrudField[] = [
  { name: "name", label: "Name", required: true, placeholder: "Acme Corp" },
  { name: "code", label: "Code", required: true, placeholder: "ACME" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
  { name: "website", label: "Website", placeholder: "https://example.com" },
  { name: "email", label: "Email", type: "email", placeholder: "info@example.com" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 555-1234" },
  { name: "address", label: "Address", placeholder: "123 Main St" },
];

const branchFields: CrudField[] = [
  { name: "name", label: "Name", required: true, placeholder: "North America HQ" },
  { name: "code", label: "Code", required: true, placeholder: "NA-HQ" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
  { name: "address", label: "Address", placeholder: "456 Oak Ave" },
  { name: "phone", label: "Phone", type: "tel", placeholder: "+1 555-5678" },
];

const deptFields: CrudField[] = [
  { name: "name", label: "Name", required: true, placeholder: "Engineering" },
  { name: "code", label: "Code", required: true, placeholder: "ENG" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
];

const teamFields: CrudField[] = [
  { name: "name", label: "Name", required: true, placeholder: "Frontend Team" },
  { name: "code", label: "Code", required: true, placeholder: "FE" },
  { name: "description", label: "Description", type: "textarea", placeholder: "Optional description" },
];

// ─── Column builder ───
function entityColumns<T extends { _id: string; name: string; code: string; isActive: boolean }>(
  onEdit?: (item: T) => void,
  onDelete?: (item: T) => void,
): Column<T>[] {
  return [
    { key: "code", label: "Code", sortable: true, className: "w-24 font-mono text-xs" },
    { key: "name", label: "Name", sortable: true },
    {
      key: "isActive",
      label: "Status",
      render: (item) => (
        <Badge
          variant={item.isActive ? "outline" : "secondary"}
          className="rounded-sm text-[10px] px-2 py-0.5 font-normal"
        >
          {item.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "_actions",
      label: "",
      className: "w-16 text-right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item); }}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];
}

export default function OrganizationStudio() {
  const [drill, setDrill] = useState<DrillState>({ level: "orgs" });
  const [search, setSearch] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editingItem, setEditingItem] = useState<Record<string, string> | undefined>(undefined);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogFields, setDialogFields] = useState<CrudField[]>([]);
  const [dialogSubmit, setDialogSubmit] = useState<((values: Record<string, string>) => Promise<void>) | null>(null);
  const [isPending, setIsPending] = useState(false);

  // ─── Queries ───
  const orgs = useQuery(api.organization.organizations.list, { search: search || undefined });
  const branches = drill.level === "branches" && drill.orgId
    ? useQuery(api.organization.branches.listByOrganization, { organizationId: drill.orgId as any, search: search || undefined })
    : undefined;
  const departments = drill.level === "departments" && drill.branchId
    ? useQuery(api.organization.departments.listByBranch, { branchId: drill.branchId as any, search: search || undefined })
    : undefined;
  const teams = drill.level === "teams" && drill.deptId
    ? useQuery(api.organization.teams.listByDepartment, { departmentId: drill.deptId as any, search: search || undefined })
    : undefined;

  // ─── Mutations ───
  const createOrg = useMutation(api.organization.organizations.create);
  const updateOrg = useMutation(api.organization.organizations.update);
  const deleteOrg = useMutation(api.organization.organizations.remove);
  const createBranch = useMutation(api.organization.branches.create);
  const updateBranch = useMutation(api.organization.branches.update);
  const deleteBranch = useMutation(api.organization.branches.remove);
  const createDept = useMutation(api.organization.departments.create);
  const updateDept = useMutation(api.organization.departments.update);
  const deleteDept = useMutation(api.organization.departments.remove);
  const createTeam = useMutation(api.organization.teams.create);
  const updateTeam = useMutation(api.organization.teams.update);
  const deleteTeam = useMutation(api.organization.teams.remove);

  // ─── Dialog helpers ───
  const openCreateDialog = useCallback(
    (fields: CrudField[], title: string, submit: (vals: Record<string, string>) => Promise<void>) => {
      setDialogMode("create");
      setDialogFields(fields);
      setDialogTitle(title);
      setEditingItem(undefined);
      setDialogSubmit(() => submit);
      setDialogOpen(true);
    },
    [],
  );

  const openEditDialog = useCallback(
    (item: Record<string, string>, fields: CrudField[], title: string, submit: (vals: Record<string, string>) => Promise<void>) => {
      setDialogMode("edit");
      setDialogFields(fields);
      setDialogTitle(title);
      setEditingItem(item);
      setDialogSubmit(() => submit);
      setDialogOpen(true);
    },
    [],
  );

  const handleDialogSubmit = useCallback(
    async (values: Record<string, string>) => {
      if (!dialogSubmit) return;
      setIsPending(true);
      try {
        await dialogSubmit(values);
        toast.success(dialogMode === "create" ? "Created successfully" : "Updated successfully");
        setDialogOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Operation failed");
      } finally {
        setIsPending(false);
      }
    },
    [dialogSubmit, dialogMode],
  );

  const confirmDelete = useCallback(async (msg: string, action: () => Promise<unknown>) => {
    if (!window.confirm(msg)) return;
    try {
      await action();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  // ─── Navigation ───
  const drillInto = useCallback((level: DrillState["level"], params: Partial<DrillState>) => {
    setDrill((prev) => ({ ...prev, level, ...params }));
    setSearch("");
  }, []);

  const goBack = useCallback(() => {
    setDrill((prev) => {
      if (prev.level === "branches") return { level: "orgs" };
      if (prev.level === "departments")
        return { level: "branches", orgId: prev.orgId, orgName: prev.orgName };
      if (prev.level === "teams")
        return { level: "departments", orgId: prev.orgId, orgName: prev.orgName, branchId: prev.branchId, branchName: prev.branchName };
      return prev;
    });
  }, []);

  // ─── Breadcrumb ───
  const breadcrumbItems = (() => {
    const items = [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Organization" },
    ];
    if (drill.level !== "orgs") {
      items.splice(2, 0, { label: drill.orgName || "Org" });
    }
    if (drill.level === "departments" || drill.level === "teams") {
      items.splice(3, 0, { label: drill.branchName || "Branch" });
    }
    if (drill.level === "teams") {
      items.splice(4, 0, { label: drill.deptName || "Dept" });
    }
    return items;
  })();

  // ─── Render functions ───
  const renderOrgs = () => {
    const columns: Column<Org>[] = [
      ...entityColumns<Org>(
        (item) =>
          openEditDialog(
            { name: item.name, code: item.code, description: item.description || "", website: item.website || "", email: item.email || "", phone: item.phone || "", address: item.address || "" },
            orgFields,
            `Edit ${item.name}`,
            async (vals) => { await updateOrg({ id: item._id as any, ...(vals as any) }); },
          ),
        (item) =>
          confirmDelete(`Delete "${item.name}"? This cannot be undone.`, () => deleteOrg({ id: item._id as any })),
      ),
      {
        key: "_drill",
        label: "",
        className: "w-10",
        render: () => <ChevronRight className="h-4 w-4 text-muted-foreground/50" />,
      },
    ];

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <SearchBar value={search} onChange={setSearch} placeholder="Search organizations..." className="w-64" />
          <Button
            size="sm"
            onClick={() => openCreateDialog(orgFields, "Create Organization", async (vals) => { await createOrg(vals as any); })}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs h-8 px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Organization
          </Button>
        </div>
        <DataTable
          columns={columns}
          data={(orgs ?? []) as Org[]}
          keyExtractor={(o) => o._id}
          isLoading={orgs === undefined}
          emptyTitle="No organizations"
          emptyDescription="Create your first organization to get started."
          emptyIcon={<Building2 className="h-5 w-5" />}
          onRowClick={(item) => drillInto("branches", { orgId: item._id, orgName: item.name })}
        />
      </>
    );
  };

  const renderBranches = () => {
    const columns: Column<Branch>[] = [
      ...entityColumns<Branch>(
        (item) =>
          openEditDialog(
            { name: item.name, code: item.code, description: item.description || "", address: item.address || "", phone: item.phone || "" },
            branchFields,
            `Edit ${item.name}`,
            async (vals) => { await updateBranch({ id: item._id as any, ...(vals as any) }); },
          ),
        (item) => confirmDelete(`Delete branch "${item.name}"?`, () => deleteBranch({ id: item._id as any })),
      ),
      {
        key: "_drill",
        label: "",
        className: "w-10",
        render: () => <ChevronRight className="h-4 w-4 text-muted-foreground/50" />,
      },
    ];

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="text-xs text-muted-foreground/50">|</span>
            <p className="text-xs text-muted-foreground">
              Branches of <span className="font-medium text-foreground">{drill.orgName}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openCreateDialog(branchFields, `Create Branch in ${drill.orgName}`, async (vals) => { await createBranch({ organizationId: drill.orgId as any, ...(vals as any) }); })}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs h-8 px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Branch
          </Button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search branches..." className="w-64 mb-4" />
        <DataTable
          columns={columns}
          data={(branches ?? []) as Branch[]}
          keyExtractor={(b) => b._id}
          isLoading={branches === undefined}
          emptyTitle="No branches"
          emptyDescription={`No branches found for ${drill.orgName}.`}
          emptyIcon={<Building2 className="h-5 w-5" />}
          onRowClick={(item) => drillInto("departments", { branchId: item._id, branchName: item.name })}
        />
      </>
    );
  };

  const renderDepartments = () => {
    const columns: Column<Dept>[] = [
      ...entityColumns<Dept>(
        (item) =>
          openEditDialog(
            { name: item.name, code: item.code, description: item.description || "" },
            deptFields,
            `Edit ${item.name}`,
            async (vals) => { await updateDept({ id: item._id as any, ...(vals as any) }); },
          ),
        (item) => confirmDelete(`Delete department "${item.name}"?`, () => deleteDept({ id: item._id as any })),
      ),
      {
        key: "_drill",
        label: "",
        className: "w-10",
        render: () => <ChevronRight className="h-4 w-4 text-muted-foreground/50" />,
      },
    ];

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="text-xs text-muted-foreground/50">|</span>
            <p className="text-xs text-muted-foreground">
              Departments in <span className="font-medium text-foreground">{drill.branchName}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openCreateDialog(deptFields, `Create Department in ${drill.branchName}`, async (vals) => { await createDept({ branchId: drill.branchId as any, ...(vals as any) }); })}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs h-8 px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Department
          </Button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search departments..." className="w-64 mb-4" />
        <DataTable
          columns={columns}
          data={(departments ?? []) as Dept[]}
          keyExtractor={(d) => d._id}
          isLoading={departments === undefined}
          emptyTitle="No departments"
          emptyDescription={`No departments found in ${drill.branchName}.`}
          emptyIcon={<Building2 className="h-5 w-5" />}
          onRowClick={(item) => drillInto("teams", { deptId: item._id, deptName: item.name })}
        />
      </>
    );
  };

  const renderTeams = () => {
    const columns: Column<Team>[] = entityColumns<Team>(
      (item) =>
        openEditDialog(
          { name: item.name, code: item.code, description: item.description || "" },
          teamFields,
          `Edit ${item.name}`,
          async (vals) => { await updateTeam({ id: item._id as any, ...(vals as any) }); },
        ),
      (item) => confirmDelete(`Delete team "${item.name}"?`, () => deleteTeam({ id: item._id as any })),
    );

    return (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="text-xs text-muted-foreground/50">|</span>
            <p className="text-xs text-muted-foreground">
              Teams in <span className="font-medium text-foreground">{drill.deptName}</span>
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => openCreateDialog(teamFields, `Create Team in ${drill.deptName}`, async (vals) => { await createTeam({ departmentId: drill.deptId as any, ...(vals as any) }); })}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-sm text-xs h-8 px-3"
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Team
          </Button>
        </div>
        <SearchBar value={search} onChange={setSearch} placeholder="Search teams..." className="w-64 mb-4" />
        <DataTable
          columns={columns}
          data={(teams ?? []) as Team[]}
          keyExtractor={(t) => t._id}
          isLoading={teams === undefined}
          emptyTitle="No teams"
          emptyDescription={`No teams found in ${drill.deptName}.`}
          emptyIcon={<Building2 className="h-5 w-5" />}
        />
      </>
    );
  };

  return (
    <StudioLayout title="Organization" description="Manage organizations, branches, departments, and teams." breadcrumbItems={breadcrumbItems}>
      {drill.level === "orgs" && renderOrgs()}
      {drill.level === "branches" && renderBranches()}
      {drill.level === "departments" && renderDepartments()}
      {drill.level === "teams" && renderTeams()}

      <CrudDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        fields={dialogFields}
        defaultValues={editingItem}
        onSubmit={handleDialogSubmit}
        isPending={isPending}
        submitLabel={dialogMode === "create" ? "Create" : "Save"}
      />
    </StudioLayout>
  );
}
