import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, User, GraduationCap, DollarSign, FileText, Calendar, Activity, MessageSquare, Download, ShieldCheck } from "lucide-react";

export default function Customer360() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const { user } = useAuth();

  // userId passed for scope enforcement — required by older deployed validators,
  // optional in the current backend, so this stays valid across both.
  const students = useQuery(api.studentEngine.listStudents, { userId: user?._id });
  const selectedData = selectedStudent ? {
    fees: useQuery(api.feeEngine.calculateOutstanding as any, { studentId: selectedStudent }),
    attendance: useQuery(api.attendanceEngine.getAttendanceSummary as any, {
      entityType: "student", entityId: selectedStudent,
      startDate: Date.now() - 90 * 86400000, endDate: Date.now(),
    }),
    consents: useQuery(api.consentEngine.getStudentConsents as any, { studentId: selectedStudent }),
    receipts: useQuery(api.receiptEngine.listReceipts as any, { studentId: selectedStudent }),
  } : null;

  const filteredStudents = (students || []).filter((s: any) =>
    !searchQuery || s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.admissionNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <WorkspaceShell title="Customer 360" subtitle="Unified student profile across all modules">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search student by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student selector - left sidebar */}
        <Card className="lg:col-span-1 p-0 overflow-hidden max-h-[70vh] overflow-y-auto">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700">Students</h3>
          </div>
          <div className="divide-y">
            {filteredStudents.slice(0, 50).map((student: any) => (
              <button
                key={student._id}
                onClick={() => setSelectedStudent(student._id)}
                className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                  selectedStudent === student._id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                }`}
              >
                <div className="font-medium text-gray-800">
                  {student.firstName} {student.lastName}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {student.admissionNumber || "N/A"}
                </div>
              </button>
            ))}
            {filteredStudents.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">No students found</div>
            )}
          </div>
        </Card>

        {/* Main profile area */}
        <div className="lg:col-span-3">
          {selectedStudent ? (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview" className="gap-1.5"><User className="h-3.5 w-3.5" /> Overview</TabsTrigger>
                <TabsTrigger value="fees" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Fees</TabsTrigger>
                <TabsTrigger value="attendance" className="gap-1.5"><Calendar className="h-3.5 w-3.5" /> Attendance</TabsTrigger>
                <TabsTrigger value="documents" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Documents</TabsTrigger>
                <TabsTrigger value="consents" className="gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Consents</TabsTrigger>
                <TabsTrigger value="activity" className="gap-1.5"><Activity className="h-3.5 w-3.5" /> Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <Card className="p-4"><div className="text-2xl font-bold text-blue-600">—</div><div className="text-xs text-gray-500">Total Fees</div></Card>
                  <Card className="p-4"><div className="text-2xl font-bold text-green-600">—</div><div className="text-xs text-gray-500">Paid</div></Card>
                  <Card className="p-4"><div className="text-2xl font-bold text-amber-600">—</div><div className="text-xs text-gray-500">Due</div></Card>
                  <Card className="p-4"><div className="text-2xl font-bold text-purple-600">{selectedData?.attendance?.attendancePercent || "—"}%</div><div className="text-xs text-gray-500">Attendance</div></Card>
                </div>

                <Card className="p-5">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-gray-500" /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["View Invoice", "Generate Receipt", "Mark Attendance", "Send Message", "View Schedule", "Download Cert", "Record Consent", "Support Ticket"].map((action) => (
                      <Button key={action} variant="outline" size="sm" className="text-xs justify-start">
                        {action}
                      </Button>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 mt-4">
                  <h3 className="font-semibold mb-3">Recent Receipts</h3>
                  <div className="space-y-2">
                    {(selectedData?.receipts || []).slice(0, 5).map((r: any) => (
                      <div key={r._id} className="flex justify-between text-sm py-1.5 border-b last:border-0">
                        <span className="text-gray-600">{r.receiptNumber}</span>
                        <span className="font-medium">₹{r.amount?.toLocaleString()}</span>
                        <Badge variant="outline" className="text-[10px]">{r.receiptType}</Badge>
                      </div>
                    ))}
                    {(!selectedData?.receipts || selectedData.receipts.length === 0) && (
                      <p className="text-sm text-gray-400 italic">No receipts found</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="fees">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Fee Summary</h3>
                  {selectedData?.fees ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Total Fee</span><span className="font-medium">₹{((selectedData.fees as any).totalFee || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Total Paid</span><span className="font-medium text-green-600">₹{((selectedData.fees as any).totalPaid || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Balance Due</span><span className="font-medium text-amber-600">₹{((selectedData.fees as any).balanceDue || 0).toLocaleString()}</span></div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Fee data loading...</p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="attendance">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Attendance (Last 90 Days)</h3>
                  {selectedData?.attendance ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div className="bg-green-500 h-3 rounded-full" style={{ width: `${selectedData.attendance.attendancePercent}%` }} />
                        </div>
                        <span className="text-lg font-bold">{selectedData.attendance.attendancePercent}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div><span className="block text-green-600 font-medium">{selectedData.attendance.present}</span><span className="text-gray-500 text-xs">Present</span></div>
                        <div><span className="block text-red-600 font-medium">{selectedData.attendance.absent}</span><span className="text-gray-500 text-xs">Absent</span></div>
                        <div><span className="block text-amber-600 font-medium">{selectedData.attendance.late || 0}</span><span className="text-gray-500 text-xs">Late</span></div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Attendance data loading...</p>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Documents & Certificates</h3>
                  <div className="space-y-2">
                    {["Admission Form", "Fee Receipt", "Bonafide Certificate", "No Dues Certificate"].map((doc) => (
                      <div key={doc} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{doc}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="h-7"><Download className="h-3.5 w-3.5" /></Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="consents">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Consent Records</h3>
                  <div className="space-y-2">
                    {(selectedData?.consents || []).map((c: any) => (
                      <div key={c._id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <span className="text-sm font-medium">{c.templateName}</span>
                          <p className="text-xs text-gray-400">{new Date(c.consentDate).toLocaleDateString()}</p>
                        </div>
                        <Badge className={c.consentGiven ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                          {c.consentGiven ? "Consented" : "Declined"}
                        </Badge>
                      </div>
                    ))}
                    {(!selectedData?.consents || selectedData.consents.length === 0) && (
                      <p className="text-sm text-gray-400 italic">No consent records found</p>
                    )}
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="activity">
                <Card className="p-5">
                  <h3 className="font-semibold mb-3">Activity Timeline</h3>
                  <div className="text-sm text-gray-400 italic text-center py-8">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    Activity feed available when timeline data is synced
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <User className="h-16 w-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium text-gray-500">Select a Student</h3>
              <p className="text-sm mt-1">Choose a student from the left panel to view their 360° profile</p>
            </div>
          )}
        </div>
      </div>
    </WorkspaceShell>
  );
}
