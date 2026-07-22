import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Loader2, BookOpen, Edit3, Copy, Archive, Trash2, X,
  DollarSign, Eye, Layers,
} from "lucide-react";
import { useState, useMemo } from "react";

export default function CourseStudio() {
  const { user } = useAuth();
  const courses = useQuery(api.crm.listCourses, {});
  const verticals = useQuery(api.organization.listVerticals);
  const subVerticals = useQuery(api.organization.listSubVerticals, {});
  const boards = useQuery(api.organization.listBoards, {});

  const createCourse = useMutation(api.crm.createCourse);
  const updateCourse = useMutation(api.crm.updateCourse);
  const archiveCourse = useMutation(api.crm.archiveCourse);
  const duplicateCourse = useMutation(api.crm.duplicateCourse);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);

  // Form state
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formVerticalId, setFormVerticalId] = useState("");
  const [formSubVerticalId, setFormSubVerticalId] = useState("");
  const [formBoardId, setFormBoardId] = useState("");
  const [formBaseFee, setFormBaseFee] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "draft">("active");
  const [submitting, setSubmitting] = useState(false);

  const filteredCourses = useMemo(() => {
    if (!courses) return [];
    if (!search) return courses;
    const q = search.toLowerCase();
    return courses.filter((c) =>
      c.courseCode.toLowerCase().includes(q) ||
      c.courseName.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const handleOpenNew = () => {
    setEditCourse(null);
    setFormCode("");
    setFormName("");
    setFormVerticalId("");
    setFormSubVerticalId("");
    setFormBoardId("");
    setFormBaseFee("");
    setFormDescription("");
    setFormStatus("active");
    setShowForm(true);
  };

  const handleOpenEdit = (course: any) => {
    setEditCourse(course);
    setFormCode(course.courseCode);
    setFormName(course.courseName);
    setFormVerticalId(course.verticalId || "");
    setFormSubVerticalId(course.subVerticalId || "");
    setFormBoardId(course.boardId || "");
    setFormBaseFee(String(course.baseFee || ""));
    setFormDescription(course.description || "");
    setFormStatus(course.status === "active" ? "active" : "draft");
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formCode || !formName || !formBaseFee || !user) return;
    setSubmitting(true);
    try {
      if (editCourse) {
        await updateCourse({
          courseId: editCourse._id,
          courseCode: formCode,
          courseName: formName,
          verticalId: formVerticalId as any || undefined,
          subVerticalId: formSubVerticalId as any || undefined,
          boardId: formBoardId as any || undefined,
          baseFee: parseInt(formBaseFee) || 0,
          description: formDescription || undefined,
          status: formStatus,
          updatedBy: user._id,
        });
      } else {
        await createCourse({
          courseCode: formCode,
          courseName: formName,
          verticalId: formVerticalId as any || undefined,
          subVerticalId: formSubVerticalId as any || undefined,
          boardId: formBoardId as any || undefined,
          baseFee: parseInt(formBaseFee) || 0,
          description: formDescription || undefined,
          status: formStatus,
          createdBy: user._id,
        });
      }
      setShowForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDuplicate = async (courseId: string) => {
    if (!user) return;
    await duplicateCourse({ courseId: courseId as any, createdBy: user._id });
  };

  const handleArchive = async (courseId: string) => {
    if (!user) return;
    await archiveCourse({ courseId: courseId as any, updatedBy: user._id });
  };

  const getVerticalName = (id?: string) => verticals?.find((v) => v._id === id)?.name || "—";
  const getSubVerticalName = (id?: string) => subVerticals?.find((sv) => sv._id === id)?.name || "—";
  const getBoardName = (id?: string) => boards?.find((b) => b._id === id)?.name || "—";

  if (!courses) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-[#9aa0a6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#1a1a2e]">Course Studio</h1>
          <p className="text-[13px] text-[#5f6368] mt-0.5">Manage courses, fees, and curriculum</p>
        </div>
        <Button size="sm" className="h-8 text-[12px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleOpenNew}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1a73e8]/10"><BookOpen className="h-4 w-4 text-[#1a73e8]" /></div>
            <div>
              <p className="text-lg font-semibold text-[#1a1a2e]">{courses.filter((c) => c.status === "active").length}</p>
              <p className="text-[10px] text-[#5f6368]">Active Courses</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#34a853]/10"><DollarSign className="h-4 w-4 text-[#34a853]" /></div>
            <div>
              <p className="text-lg font-semibold text-[#1a1a2e]">
                ₹{courses.filter((c) => c.status === "active").reduce((s, c) => s + c.baseFee, 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#5f6368]">Total Fee Value</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#e8eaed] shadow-sm bg-white">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#e8710a]/10"><Layers className="h-4 w-4 text-[#e8710a]" /></div>
            <div>
              <p className="text-lg font-semibold text-[#1a1a2e]">{courses.length}</p>
              <p className="text-[10px] text-[#5f6368]">Total Courses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#9aa0a6]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses by code or name..." className="h-9 text-[12px] pl-8" />
        </div>
      </div>

      {/* Course Table */}
      <Card className="border-[#e8eaed] shadow-sm bg-white">
        <CardContent className="p-0">
          {filteredCourses.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="h-10 w-10 text-[#9aa0a6] mx-auto mb-2" />
              <p className="text-[13px] text-[#9aa0a6]">{search ? "No courses match your search" : "No courses yet. Click 'Add Course' to create one."}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left" style={{ minWidth: 650 }}>
                <thead>
                  <tr className="border-b border-[#e8eaed] bg-[#f8f9fa]">
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Course</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Vertical</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Sub Vertical</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Board</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Base Fee</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5">Status</th>
                    <th className="text-[10px] font-semibold text-[#5f6368] uppercase px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => (
                    <tr key={course._id} className="border-b border-[#f1f3f4] hover:bg-[#f8f9fa] transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-[#1a1a2e]/10 flex items-center justify-center shrink-0">
                            <BookOpen className="h-3.5 w-3.5 text-[#1a1a2e]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[12px] font-medium text-[#1a1a2e]">{course.courseName}</p>
                            <p className="text-[10px] text-[#9aa0a6]">{course.courseCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-[12px] text-[#5f6368]">{getVerticalName(course.verticalId)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-[#5f6368]">{getSubVerticalName(course.subVerticalId)}</td>
                      <td className="px-3 py-2.5 text-[12px] text-[#5f6368]">{getBoardName(course.boardId)}</td>
                      <td className="px-3 py-2.5 text-[12px] font-medium text-right text-[#1a1a2e]">₹{course.baseFee.toLocaleString()}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={`text-[8px] px-1 py-0 h-3.5 ${
                          course.status === "active" ? "bg-[#34a853] text-white" :
                          course.status === "draft" ? "bg-[#fbbc04] text-[#1a1a2e]" :
                          "bg-[#9aa0a6] text-white"
                        }`}>
                          {course.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#1a73e8]"
                            onClick={() => handleOpenEdit(course)}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#34a853]"
                            onClick={() => handleDuplicate(course._id)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          {course.status === "active" && (
                            <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-[#5f6368] hover:text-[#e8710a]"
                              onClick={() => handleArchive(course._id)}>
                              <Archive className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-xl border border-[#e8eaed] shadow-xl w-full max-w-[540px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[#e8eaed] px-5 py-3 flex items-center justify-between z-10">
              <h2 className="text-sm font-semibold text-[#1a1a2e]">{editCourse ? "Edit Course" : "Add Course"}</h2>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Course Code *</label>
                  <Input value={formCode} onChange={(e) => setFormCode(e.target.value)} placeholder="e.g. NEET-26" className="h-9 text-[13px]" />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Course Name *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. NEET 2026" className="h-9 text-[13px]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Vertical</label>
                  <Select value={formVerticalId} onValueChange={setFormVerticalId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(verticals || []).map((v) => <SelectItem key={v._id} value={v._id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Sub Vertical</label>
                  <Select value={formSubVerticalId} onValueChange={setFormSubVerticalId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(subVerticals || []).filter((sv) => !formVerticalId || sv.verticalId === formVerticalId).map((sv) => (
                        <SelectItem key={sv._id} value={sv._id}>{sv.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Board</label>
                  <Select value={formBoardId} onValueChange={setFormBoardId}>
                    <SelectTrigger className="h-9 text-[13px]"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {(boards || [])
                        .filter((b) => !formSubVerticalId || b.subVerticalId === formSubVerticalId)
                        .map((b) => <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Base Fee (₹) *</label>
                  <Input type="number" value={formBaseFee} onChange={(e) => setFormBaseFee(e.target.value)} placeholder="0" className="h-9 text-[13px]" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Description</label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Course description..." className="text-[13px] min-h-[60px]" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-[#5f6368] uppercase tracking-wider mb-1.5 block">Status</label>
                <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                  <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-[#e8eaed] px-5 py-3 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-[11px] border-[#e8eaed]" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[11px] bg-[#1a1a2e] hover:bg-[#2d2d4a]" onClick={handleSubmit}
                disabled={!formCode || !formName || !formBaseFee || submitting}>
                {submitting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                {editCourse ? "Update Course" : "Create Course"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
