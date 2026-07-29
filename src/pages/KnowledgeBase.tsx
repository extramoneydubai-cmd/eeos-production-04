import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, HelpCircle, Shield, BookTemplate, Search, Plus, Eye, ThumbsUp } from "lucide-react";

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  wiki: { icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  sop: { icon: BookTemplate, color: "text-purple-600", bg: "bg-purple-50" },
  article: { icon: FileText, color: "text-green-600", bg: "bg-green-50" },
  faq: { icon: HelpCircle, color: "text-amber-600", bg: "bg-amber-50" },
  policy: { icon: Shield, color: "text-red-600", bg: "bg-red-50" },
  playbook: { icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
};

export default function KnowledgeBase() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const articles = useQuery(api.knowledgeEngine.listArticles, {});
  const categories = useQuery(api.knowledgeEngine.listCategories);

  const filtered = (articles || []).filter((a: any) => {
    if (typeFilter && a.articleType !== typeFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !(a as any).content?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <WorkspaceShell title="Knowledge Base" subtitle="Wiki, SOPs, articles, FAQ & policies"
      tabs={[{ id: "all", label: "All" }, { id: "wiki", label: "Wiki" }, { id: "sop", label: "SOPs" }, { id: "faq", label: "FAQ" }, { id: "policy", label: "Policies" }]}
      actions={<Button className="gap-2"><Plus className="h-4 w-4" /> New Article</Button>}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search knowledge base..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(typeConfig).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? null : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                typeFilter === type ? `${cfg.bg} ${cfg.color} ring-1 ring-offset-1` : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          );
        })}
        {typeFilter && <button onClick={() => setTypeFilter(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-2">Clear</button>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(filtered || []).map((article: any) => {
          const cfg = typeConfig[article.articleType] || typeConfig.article;
          const Icon = cfg.icon;
          return (
            <Card key={article._id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start gap-3 mb-2">
                <div className={`p-2 rounded-lg ${cfg.bg} shrink-0`}>
                  <Icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm truncate">{article.title}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{article.articleType} · v{article.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-3">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{article.viewCount || 0}</span>
                <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" />{(article as any).helpfulCount || 0}</span>
                {article.isPublished ? <Badge className="bg-green-100 text-green-700 text-[10px]">Published</Badge> : <Badge className="bg-gray-100 text-gray-500 text-[10px]">Draft</Badge>}
              </div>
            </Card>
          );
        })}
        {(!filtered || filtered.length === 0) && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400">
            <BookOpen className="h-12 w-12 mb-3" />
            <p className="text-sm font-medium">No articles found</p>
            <p className="text-xs mt-1">{search ? "Try a different search term" : "Create your first knowledge article"}</p>
          </div>
        )}
      </div>
    </WorkspaceShell>
  );
}
