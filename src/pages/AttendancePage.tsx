import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Calendar, CheckCircle, XCircle, Clock, QrCode, Users, Camera, MapPin } from "lucide-react";

type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export default function AttendancePage() {
  const [tab, setTab] = useState("mark");
  const [entityType, setEntityType] = useState<string>("student");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  // Get today's stats from the attendanceSdk
  const todayStats = useQuery(api.platform.sdk.attendanceSdk.getTodayStats, {
    branchId: undefined,
  }) as { total: number; present: number; absent: number; late: number } | undefined;

  const attRecords = useQuery(api.platform.sdk.attendanceSdk.getRecords, {
    entityType: entityType as "student" | "employee" | "faculty",
    startDate: new Date(selectedDate).getTime(),
    endDate: new Date(selectedDate).getTime() + 86400000,
  }) as { records: any[]; total: number } | undefined;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance</h1>
          <p className="text-sm text-muted-foreground">Mark and manage attendance for students, faculty, and staff</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="employee">Employees</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-green-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{todayStats?.present || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{todayStats?.absent || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Late Today</p>
              <p className="text-2xl font-bold text-amber-600">{todayStats?.late || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2"><Calendar className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Today</p>
              <p className="text-2xl font-bold text-blue-600">{todayStats?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-[600px] grid-cols-5">
          <TabsTrigger value="mark"><Users className="mr-1 h-4 w-4" /> Mark</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="mr-1 h-4 w-4" /> QR Scan</TabsTrigger>
          <TabsTrigger value="face"><Camera className="mr-1 h-4 w-4" /> Face</TabsTrigger>
          <TabsTrigger value="gps"><MapPin className="mr-1 h-4 w-4" /> GPS</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="mr-1 h-4 w-4" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="mark" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Attendance Marking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
                <Input placeholder="Search by name or ID..." className="flex-1" />
                <Button>Mark All Present</Button>
                <Button variant="outline">Mark All Absent</Button>
              </div>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Name / ID</th>
                      <th className="p-2 text-left font-medium">Batch / Dept</th>
                      <th className="p-2 text-center font-medium">Present</th>
                      <th className="p-2 text-center font-medium">Absent</th>
                      <th className="p-2 text-center font-medium">Late</th>
                      <th className="p-2 text-center font-medium">Half Day</th>
                      <th className="p-2 text-center font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!attRecords || attRecords.records.length === 0) ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p>No records for {selectedDate}. Select a batch to mark attendance.</p>
                        </td>
                      </tr>
                    ) : (
                      attRecords.records.map((record: any, idx: number) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{record.entityId || "—"}</td>
                          <td className="p-2">{record.batchId || "—"}</td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant={record.status === "present" ? "default" : "outline"} className="h-7 w-7 p-0">
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                          </td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant={record.status === "absent" ? "destructive" : "outline"} className="h-7 w-7 p-0">
                              <XCircle className="h-3 w-3" />
                            </Button>
                          </td>
                          <td className="p-2 text-center">
                            <Button size="sm" variant={record.status === "late" ? "secondary" : "outline"} className="h-7 w-7 p-0">
                              <Clock className="h-3 w-3" />
                            </Button>
                          </td>
                          <td className="p-2 text-center">{record.status === "half_day" && <Badge variant="outline">HD</Badge>}</td>
                          <td className="p-2 text-center"><Badge variant="secondary">—</Badge></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="mt-4">
          <Card>
            <CardHeader><CardTitle>QR Code Attendance</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-12">
              <QrCode className="h-24 w-24 text-muted-foreground" />
              <p className="text-muted-foreground">Camera access required. Position QR code in viewfinder.</p>
              <Button disabled>Start Scanner</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="face" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Face Recognition Attendance</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-12">
              <Camera className="h-24 w-24 text-muted-foreground" />
              <p className="text-muted-foreground">Face recognition coming soon. Requires AI connector configuration.</p>
              <Button disabled>Initialize</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gps" className="mt-4">
          <Card>
            <CardHeader><CardTitle>GPS Attendance</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4 p-12">
              <MapPin className="h-24 w-24 text-muted-foreground" />
              <p className="text-muted-foreground">Geo-fencing attendance requires location services.</p>
              <Button variant="outline">Mark Current Location</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Attendance History</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-4">
                <Input type="date" className="w-[200px]" />
                <Input type="date" className="w-[200px]" />
                <Select>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">Export</Button>
              </div>
              <div className="rounded-md border p-8 text-center text-muted-foreground">
                Select a date range to view history.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
