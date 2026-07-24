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
  FileText,
  Folder,
  Tags,
  Upload,
  Download,
  Archive,
  Search,
  PlusCircle,
  RefreshCw,
  File,
  Image,
  Video,
  FileSpreadsheet,
  FileArchive,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  BarChart3,
  Link2,
  ExternalLink,
  Settings,
} from "lucide-react";

function StatCard({ title, value, subtitle, icon: Icon, color, onClick }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <Card className="border-[#e8eaed] shadow-sm bg-white cursor-pointer hover:shadow-md hover:border-[#dadce0] transition-all duration-200" onClick={onClick}>
      <CardContent className="p-3.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-[#5f6368]">{title}</p>
            <p className="text-xl font-semibold text-[#1a1a2e] tracking-tight">{value}</p>
            {subtitle && <p className="text-[10px] text-[#9aa0a6]">{subtitle}</p>}
          </div>
          <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4 text-white" /></div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentManagement() {
  const { navigate } = useAppNavigate();
  const dashboard = useQuery(api.documentEngine.getDocumentDashboard);
  const documents = useQuery(api.documentEngine.listDocuments, {});
  const folders = useQuery(api.documentEngine.listFolders, {});

  const isLoading = !dashboard;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48 mb-1" /><Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Document Management</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">
            Centralized document repository — shared across all modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
            <Upload className="h-3.5 w-3.5 mr-1" /> Upload
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]">
            <Folder className="h-3.5 w-3.5 mr-1" /> New Folder
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Documents" value={dashboard.totalDocuments} subtitle={`${dashboard.totalArchived} archived`} icon={FileText} color="bg-[#1a73e8]" />
        <StatCard title="Total Folders" value={dashboard.totalFolders} icon={Folder} color="bg-[#34a853]" />
        <StatCard title="Total Size" value={dashboard.totalSize > 1048576 ? `${(dashboard.totalSize / 1048576).toFixed(1)} MB` : `${(dashboard.totalSize / 1024).toFixed(1)} KB`} icon={BarChart3} color="bg-[#a855f7]" />
        <StatCard title="Expired" value={dashboard.expiredCount} subtitle="Documents past expiry" icon={AlertCircle} color="bg-[#ea4335]" />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-[#f1f3f4] p-0.5">
          <TabsTrigger value="all" className="text-[12px] data-[state=active]:bg-white">All Documents</TabsTrigger>
          <TabsTrigger value="folders" className="text-[12px] data-[state=active]:bg-white">Folders</TabsTrigger>
          <TabsTrigger value="by_reference" className="text-[12px] data-[state=active]:bg-white">By Module</TabsTrigger>
          <TabsTrigger value="activity" className="text-[12px] data-[state=active]:bg-white">Activity</TabsTrigger>
        </TabsList>

        {/* All Documents */}
        <TabsContent value="all" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <StatCard title="PDFs" value={dashboard.byType.find((t: any) => t.type === "pdf")?.count || 0} icon={FileText} color="bg-[#ea4335]" />
            <StatCard title="Images" value={dashboard.byType.find((t: any) => t.type === "image")?.count || 0} icon={Image} color="bg-[#34a853]" />
            <StatCard title="Spreadsheets" value={dashboard.byType.find((t: any) => t.type === "spreadsheet")?.count || 0} icon={FileSpreadsheet} color="bg-[#1a73e8]" />
            <StatCard title="Other" value={dashboard.byType.filter((t: any) => !["pdf", "image", "spreadsheet"].includes(t.type)).reduce((s: number, t: any) => s + t.count, 0)} icon={File} color="bg-[#5f6368]" />
          </div>

          {/* Document list */}
          {documents && documents.length > 0 ? (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Recent Documents</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="grid grid-cols-12 gap-2 text-[10px] font-medium text-[#9aa0a6] pb-2 border-b border-[#e8eaed]">
                    <div className="col-span-4">Name</div>
                    <div className="col-span-2">Type</div>
                    <div className="col-span-2">Size</div>
                    <div className="col-span-2">Uploaded</div>
                    <div className="col-span-2">Downloads</div>
                  </div>
                  {documents.slice(0, 15).map((doc: any) => (
                    <div key={doc._id} className="grid grid-cols-12 gap-2 text-[11px] py-2 border-b border-[#f1f3f4] items-center hover:bg-[#f8f9fa] cursor-pointer">
                      <div className="col-span-4 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-[#5f6368] flex-shrink-0" />
                        <span className="truncate font-medium text-[#1a1a2e]">{doc.name}</span>
                      </div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] border-0">{doc.fileType || doc.mimeType?.split("/")[1] || "unknown"}</Badge>
                      </div>
                      <div className="col-span-2 text-[#5f6368]">
                        {doc.fileSize > 1048576 ? `${(doc.fileSize / 1048576).toFixed(1)} MB` : doc.fileSize > 1024 ? `${(doc.fileSize / 1024).toFixed(1)} KB` : `${doc.fileSize} B`}
                      </div>
                      <div className="col-span-2 text-[#5f6368]">{new Date(doc.createdAt).toLocaleDateString()}</div>
                      <div className="col-span-2 flex items-center gap-1">
                        <Download className="h-3 w-3 text-[#9aa0a6]" />
                        <span className="text-[#5f6368]">{doc.downloadCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-8 text-center">
                <FileText className="h-10 w-10 text-[#dadce0] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#1a1a2e]">No Documents Yet</h3>
                <p className="text-[12px] text-[#9aa0a6] mt-1 mb-4">
                  Upload your first document to the centralized repository
                </p>
                <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]">
                  <Upload className="h-3.5 w-3.5 mr-1" /> Upload Document
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Folders */}
        <TabsContent value="folders" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StatCard title="Total Folders" value={dashboard.totalFolders} icon={Folder} color="bg-[#34a853]" />
            <StatCard title="Unique Uploaders" value={dashboard.uniqueUploaders} icon={Users} color="bg-[#1a73e8]" />
            <StatCard title="Total Versions" value={dashboard.totalVersions} icon={Clock} color="bg-[#a855f7]" />
          </div>

          {folders && folders.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {folders.map((folder: any) => (
                <Card key={folder._id} className="border-[#e8eaed] shadow-sm bg-white hover:shadow-md cursor-pointer transition-all duration-200">
                  <CardContent className="p-4 text-center">
                    <Folder className="h-8 w-8 text-[#1a73e8] mx-auto mb-2" />
                    <p className="text-[12px] font-medium text-[#1a1a2e] truncate">{folder.name}</p>
                    {folder.description && <p className="text-[9px] text-[#9aa0a6] mt-0.5 truncate">{folder.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-[#e8eaed] shadow-sm bg-white">
              <CardContent className="p-6 text-center">
                <Folder className="h-8 w-8 text-[#dadce0] mx-auto mb-2" />
                <p className="text-[12px] text-[#5f6368]">No folders created yet</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* By Module */}
        <TabsContent value="by_reference" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {dashboard.byReference.map((ref: any) => (
              <StatCard
                key={ref.referenceType}
                title={ref.referenceType.charAt(0).toUpperCase() + ref.referenceType.slice(1)}
                value={ref.count}
                icon={Link2}
                color="bg-[#4285f4]"
              />
            ))}
          </div>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card className="border-[#e8eaed] shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-[#1a1a2e]">Recent Activity</CardTitle>
              <CardDescription className="text-[10px] text-[#9aa0a6]">Document timeline events</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.recentActivity && dashboard.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {dashboard.recentActivity.map((event: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2 text-[11px] py-1.5 border-b border-[#f1f3f4] last:border-0">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        event.eventType === "uploaded" ? "bg-[#34a853]" :
                        event.eventType === "downloaded" ? "bg-[#1a73e8]" :
                        event.eventType === "deleted" ? "bg-[#ea4335]" :
                        event.eventType === "version_created" ? "bg-[#a855f7]" : "bg-[#fbbc04]"
                      }`} />
                      <div className="flex-1">
                        <p className="text-[#1a1a2e]">{event.description}</p>
                        <p className="text-[9px] text-[#9aa0a6]">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-[#f1f3f4] border-0 capitalize">{event.eventType.replace(/_/g, " ")}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-[#9aa0a6] text-center py-6">No recent activity</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
