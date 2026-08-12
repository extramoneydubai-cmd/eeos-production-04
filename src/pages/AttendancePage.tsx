import React, { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Users,
  Camera,
  MapPin,
  ScanLine,
  ShieldCheck,
  ShieldX,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Crosshair,
} from "lucide-react";
import { toDataURL as qrToDataURL } from "qrcode";
import jsQR from "jsqr";

type EntityType = "student" | "employee" | "faculty" | "visitor" | "vendor" | "support";
type AttendanceStatus = "present" | "absent" | "late" | "half_day";

const MODE_BADGES: Record<string, { label: string; className: string }> = {
  qr: { label: "QR", className: "bg-violet-100 text-violet-700 border-violet-200" },
  face_recognition: { label: "Face", className: "bg-sky-100 text-sky-700 border-sky-200" },
  gps: { label: "GPS", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  biometric: { label: "Biometric", className: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  nfc: { label: "NFC", className: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  rfid: { label: "RFID", className: "bg-teal-100 text-teal-700 border-teal-200" },
  otp: { label: "OTP", className: "bg-amber-100 text-amber-700 border-amber-200" },
  selfie: { label: "Selfie", className: "bg-pink-100 text-pink-700 border-pink-200" },
  manual: { label: "Manual", className: "bg-slate-100 text-slate-600 border-slate-200" },
};

function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// ─── Camera capture (face registration / selfie) ────────────────

function FaceCapture({ onCapture, busy, actionLabel }: {
  onCapture: (blob: Blob) => void;
  busy?: boolean;
  actionLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setReady(false);
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch (e: any) {
      setError(e?.message || "Camera access denied. Allow camera permissions and retry.");
    }
  }, []);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg", 0.85);
    stop();
  }, [onCapture, stop]);

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border">
          <img src={preview} alt="captured" className="h-48 w-full object-cover" />
          <Button size="sm" variant="outline" className="absolute right-2 top-2 bg-white/90" onClick={() => { setPreview(null); start(); }}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retake
          </Button>
        </div>
      ) : (
        <>
          {!ready ? (
            <Button onClick={start} variant="outline" className="w-full py-8">
              <Camera className="mr-2 h-4 w-4" /> Start Camera
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border bg-black">
                <video ref={videoRef} playsInline muted className="h-48 w-full object-cover" />
              </div>
              <Button onClick={capture} disabled={busy} className="w-full">
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
                {actionLabel || "Capture Photo"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── QR scanner (continuous decode) ─────────────────────────────

function QrScanner({ onToken }: { onToken: (token: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => () => stop(), [stop]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });
    if (code && code.data.startsWith("eeos-")) {
      setScanning(false);
      onToken(code.data);
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onToken, stop]);

  useEffect(() => {
    if (!scanning) return;
    (async () => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        rafRef.current = requestAnimationFrame(tick);
      } catch (e: any) {
        setError(e?.message || "Camera access denied. Allow camera permissions and retry.");
      }
    })();
    return () => stop();
  }, [scanning, tick, stop]);

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {scanning && !error && (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border bg-black">
            <video ref={videoRef} playsInline muted className="h-56 w-full object-cover" />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-36 w-36 rounded-lg border-2 border-white/70" />
            </div>
          </div>
          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ScanLine className="h-3.5 w-3.5 animate-pulse" /> Scanning for attendance QR…
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function AttendancePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("mark");
  const [entityType, setEntityType] = useState<EntityType>("employee");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [branchId, setBranchId] = useState<string>("");
  const [radiusM, setRadiusM] = useState("200");

  // Manual marking state
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markFormStatus, setMarkFormStatus] = useState<AttendanceStatus>("present");
  const [markFormPerson, setMarkFormPerson] = useState<string>("");
  const [markFormTime, setMarkFormTime] = useState("09:00");
  const [markFormNotes, setMarkFormNotes] = useState("");
  const [markResult, setMarkResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const markAttendance = useMutation(api.attendanceEngine.markAttendance);

  // Verification flows
  const issueQrToken = useMutation(api.attendanceVerificationEngine.issueQrToken);
  const verifyQrMark = useMutation(api.attendanceVerificationEngine.verifyQrMark);
  const saveGeofence = useMutation(api.attendanceVerificationEngine.saveGeofence);
  const markWithGps = useMutation(api.attendanceVerificationEngine.markWithGps);
  const generateUploadUrl = useMutation(api.attendanceVerificationEngine.generateUploadUrl);
  const registerFace = useMutation(api.attendanceVerificationEngine.registerFace);
  const markWithFace = useMutation(api.attendanceVerificationEngine.markWithFace);

  // State for flows
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrResult, setQrResult] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [scanningMode, setScanningMode] = useState(false);

  const [geoStatus, setGeoStatus] = useState<string>("idle");
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number; acc: number } | null>(null);
  const [gpsResult, setGpsResult] = useState<any>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [faceBusy, setFaceBusy] = useState(false);
  const [faceMessage, setFaceMessage] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);

  const [historyEntity, setHistoryEntity] = useState<EntityType>("employee");

  const dayStart = new Date(selectedDate).getTime();
  const dayEnd = dayStart + 86_400_000;

  const todayStats = useQuery(api.attendanceVerificationEngine.getTodayStats, {
    branchId: branchId ? (branchId as any) : undefined,
  });
  const records = useQuery(api.attendanceVerificationEngine.getRecords, {
    entityType: historyEntity,
    startDate: dayStart,
    endDate: dayEnd,
  });
  const branches = useQuery(api.organization.listBranches);
  const departments = useQuery(api.organizationDepartments.listDepartments);
  const users = useQuery(api.users.listUsers);

  const myEntityId = user?._id ? (user._id as string) : "";
  const myFaceRegistration = useQuery(
    api.attendanceVerificationEngine.getFaceRegistration,
    myEntityId ? { entityType: "employee", entityId: myEntityId } : "skip",
  );

  // ── QR flow ────────────────────────────────────────────────────
  const generateMyQr = useCallback(async () => {
    if (!myEntityId) return;
    setQrBusy(true);
    setQrError(null);
    setQrResult(null);
    try {
      const res = await issueQrToken({ entityType: "employee", entityId: myEntityId, date: startOfToday() });
      setQrToken(res.token);
      const url = await qrToDataURL(res.token, { width: 260, margin: 1, color: { dark: "#0f172a" } });
      setQrDataUrl(url);
    } catch (e: any) {
      setQrError(e?.message || "Failed to generate QR token");
    } finally {
      setQrBusy(false);
    }
  }, [issueQrToken, myEntityId]);

  const onScannedToken = useCallback(async (token: string) => {
    setQrBusy(true);
    setQrError(null);
    setQrResult(null);
    try {
      const res = await verifyQrMark({
        token,
        branchId: branchId ? (branchId as any) : undefined,
      });
      setQrResult(`Attendance marked (${res.action}) — ${res.entityType} · ${res.entityId}`);
      setScanningMode(false);
    } catch (e: any) {
      setQrError(e?.message || "QR verification failed");
    } finally {
      setQrBusy(false);
    }
  }, [verifyQrMark, branchId]);

  // ── GPS flow ───────────────────────────────────────────────────
  const captureLocation = useCallback(() => {
    setGeoError(null);
    setGpsResult(null);
    setGeoStatus("locating");
    if (!("geolocation" in navigator)) {
      setGeoError("Geolocation is not supported in this browser.");
      setGeoStatus("idle");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy });
        setGeoStatus("ready");
      },
      (err) => {
        setGeoError(err.message || "Location access denied.");
        setGeoStatus("idle");
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  const verifyAndMarkGps = useCallback(async () => {
    if (!geoCoords || !myEntityId) return;
    setGeoStatus("marking");
    try {
      const res = await markWithGps({
        entityType: "employee",
        entityId: myEntityId,
        date: startOfToday(),
        latitude: geoCoords.lat,
        longitude: geoCoords.lng,
        branchId: branchId ? (branchId as any) : undefined,
      });
      setGpsResult(res);
      setGeoStatus("done");
    } catch (e: any) {
      setGeoError(e?.message || "GPS mark failed");
      setGeoStatus("ready");
    }
  }, [geoCoords, markWithGps, myEntityId, branchId]);

  const saveCurrentGeofence = useCallback(async () => {
    if (!geoCoords || !branchId) return;
    try {
      const branch = branches?.find((b: any) => b._id === branchId);
      await saveGeofence({
        branchId: branchId as any,
        name: branch?.name || "Branch",
        latitude: geoCoords.lat,
        longitude: geoCoords.lng,
        radiusM: Math.max(50, Number(radiusM) || 200),
      });
      setGeoStatus("geofence-saved");
    } catch (e: any) {
      setGeoError(e?.message || "Failed to save geofence");
    }
  }, [geoCoords, branchId, branches, saveGeofence, radiusM]);

  // ── Face flow ──────────────────────────────────────────────────
  const uploadBlob = useCallback(async (blob: Blob): Promise<string> => {
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": blob.type },
      body: blob,
    });
    if (!res.ok) throw new Error("Upload failed");
    const json: any = await res.json();
    return json.storageId as string;
  }, [generateUploadUrl]);

  const onFaceRegisterCapture = useCallback(async (blob: Blob) => {
    if (!myEntityId) return;
    setFaceBusy(true);
    setFaceError(null);
    setFaceMessage(null);
    try {
      const storageId = await uploadBlob(blob);
      await registerFace({ entityType: "employee", entityId: myEntityId, photoStorageId: storageId });
      setFaceMessage("Face photo registered. You can now verify attendance by face.");
    } catch (e: any) {
      setFaceError(e?.message || "Face registration failed");
    } finally {
      setFaceBusy(false);
    }
  }, [uploadBlob, registerFace, myEntityId]);

  const onFaceVerifyCapture = useCallback(async (blob: Blob) => {
    if (!myEntityId) return;
    setFaceBusy(true);
    setFaceError(null);
    setFaceMessage(null);
    try {
      const storageId = await uploadBlob(blob);
      const res = await markWithFace({
        entityType: "employee",
        entityId: myEntityId,
        date: startOfToday(),
        selfieStorageId: storageId,
        branchId: branchId ? (branchId as any) : undefined,
      });
      setFaceMessage(`Attendance marked via face (${res.action}). Selfie stored.`);
    } catch (e: any) {
      setFaceError(e?.message || "Face verification failed");
    } finally {
      setFaceBusy(false);
    }
  }, [uploadBlob, markWithFace, myEntityId, branchId]);

  // ── Manual marking ─────────────────────────────────────────────
  const claimedMarkedBy = (id?: string) =>
    id && !id.startsWith("local_") ? (id as any) : undefined;

  const markUser = useCallback(async (userId: string, status: AttendanceStatus) => {
    setMarkingId(userId);
    setMarkResult(null);
    try {
      await markAttendance({
        entityType: "employee",
        entityId: userId as any,
        date: dayStart,
        status,
        checkIn: status === "present" || status === "late" ? Date.now() : undefined,
        markedBy: claimedMarkedBy(user?._id),
      });
      setMarkResult({ type: "success", message: `Marked ${status.replace("_", " ")} for ${selectedDate}` });
    } catch (e: any) {
      setMarkResult({ type: "error", message: e?.message || "Failed to mark attendance" });
    } finally {
      setMarkingId(null);
    }
  }, [markAttendance, dayStart, user, selectedDate]);

  const submitManualForm = useCallback(async () => {
    if (!markFormPerson) {
      setMarkResult({ type: "error", message: "Select a person to mark attendance for." });
      return;
    }
    setMarkingId(markFormPerson);
    setMarkResult(null);
    try {
      const [h = 9, m = 0] = markFormTime.split(":").map(Number);
      const checkIn = dayStart + (h * 3600 + m * 60) * 1000;
      await markAttendance({
        entityType: "employee",
        entityId: markFormPerson as any,
        date: dayStart,
        status: markFormStatus,
        checkIn,
        notes: markFormNotes.trim() || undefined,
        markedBy: claimedMarkedBy(user?._id),
      });
      setMarkResult({ type: "success", message: `Marked as ${markFormStatus.replace("_", " ")} at ${markFormTime}` });
    } catch (e: any) {
      setMarkResult({ type: "error", message: e?.message || "Failed to mark attendance" });
    } finally {
      setMarkingId(null);
    }
  }, [markFormPerson, markFormStatus, markFormTime, markFormNotes, markAttendance, dayStart, user]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Mark and verify attendance — manual, QR, GPS geofence, or face
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Entity Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="faculty">Faculty</SelectItem>
              <SelectItem value="employee">Employees</SelectItem>
              <SelectItem value="visitor">Visitors</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
            </SelectContent>
          </Select>
          {branches && branches.length > 0 && (
            <Select
              value={branchId === "" ? "all" : branchId}
              onValueChange={(v) => setBranchId(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Branch (all)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>
                {branches.map((b: any) => (
                  <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border-green-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-green-100 p-2"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Present Today</p>
              <p className="text-2xl font-bold text-green-600">{todayStats?.present || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-red-100 p-2"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Absent Today</p>
              <p className="text-2xl font-bold text-red-600">{todayStats?.absent || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-amber-100 p-2"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Late Today</p>
              <p className="text-2xl font-bold text-amber-600">{todayStats?.late || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="flex items-center gap-3 p-4">
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
        <TabsList className="grid w-full max-w-3xl grid-cols-5">
          <TabsTrigger value="mark"><Users className="mr-1 h-4 w-4" /> Mark</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="mr-1 h-4 w-4" /> QR</TabsTrigger>
          <TabsTrigger value="face"><Camera className="mr-1 h-4 w-4" /> Face</TabsTrigger>
          <TabsTrigger value="gps"><MapPin className="mr-1 h-4 w-4" /> GPS</TabsTrigger>
          <TabsTrigger value="history"><Calendar className="mr-1 h-4 w-4" /> History</TabsTrigger>
        </TabsList>

        {/* ── Manual Mark ─────────────────────────────────────── */}
        <TabsContent value="mark" className="mt-4 space-y-4">
          {/* Mark Attendance form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Mark Attendance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a person, status and time to record their attendance for the chosen date.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Date</label>
                  <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Person</label>
                  <Select value={markFormPerson} onValueChange={setMarkFormPerson}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users || []).map((u: any) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name || u.username || u._id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <Select value={markFormStatus} onValueChange={(v) => setMarkFormStatus(v as AttendanceStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Check-in Time</label>
                  <Input type="time" value={markFormTime} onChange={(e) => setMarkFormTime(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                  <Textarea
                    value={markFormNotes}
                    onChange={(e) => setMarkFormNotes(e.target.value)}
                    placeholder="e.g., Approved leave request, came late due to transport…"
                    rows={2}
                  />
                </div>
                <div className="flex items-end justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMarkFormPerson("");
                      setMarkFormNotes("");
                      setMarkResult(null);
                    }}
                  >
                    Clear
                  </Button>
                  <Button onClick={submitManualForm} disabled={markingId !== null}>
                    {markingId !== null ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                    Mark Attendance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {markResult && (
            <div
              className={`flex items-start gap-2 rounded-md border p-3 text-sm ${
                markResult.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {markResult.type === "success" ? (
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span className="flex-1">{markResult.message}</span>
              <button className="text-muted-foreground hover:text-foreground" onClick={() => setMarkResult(null)}>✕</button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Mark — All Employees</CardTitle>
              <p className="text-sm text-muted-foreground">Tap a status to mark an employee for the selected date.</p>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Name</th>
                      <th className="p-2 text-left font-medium">Department</th>
                      <th className="p-2 text-center font-medium">Present</th>
                      <th className="p-2 text-center font-medium">Absent</th>
                      <th className="p-2 text-center font-medium">Late</th>
                      <th className="p-2 text-center font-medium">Half Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!users || users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p>No users found. Add users in User Management first.</p>
                        </td>
                      </tr>
                    ) : (
                      users.map((u: any) => {
                        const dept = departments?.find((d: any) => d._id === u.departmentId);
                        return (
                          <tr key={u._id} className="border-b">
                            <td className="p-2 font-medium">{u.name || u.username || u._id}</td>
                            <td className="p-2 text-muted-foreground">{dept?.name || "—"}</td>
                            {(["present", "absent", "late", "half_day"] as AttendanceStatus[]).map((s) => (
                              <td key={s} className="p-2 text-center">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0"
                                  disabled={markingId === u._id}
                                  onClick={() => markUser(u._id, s)}
                                  title={`Mark ${s}`}
                                >
                                  {markingId === u._id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : s === "present" ? (
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  ) : s === "absent" ? (
                                    <XCircle className="h-3 w-3 text-red-500" />
                                  ) : s === "late" ? (
                                    <Clock className="h-3 w-3 text-amber-500" />
                                  ) : (
                                    <span className="text-[9px] font-semibold text-slate-500">HD</span>
                                  )}
                                </Button>
                              </td>
                            ))}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── QR ──────────────────────────────────────────────── */}
        <TabsContent value="qr" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><QrCode className="h-4 w-4" /> My Attendance QR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                {!qrDataUrl ? (
                  <>
                    <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-dashed bg-muted/40">
                      <QrCode className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                    <p className="max-w-xs text-center text-sm text-muted-foreground">
                      Generate a one-time QR token valid for today. Scan it at a reader to mark attendance.
                    </p>
                    <Button onClick={generateMyQr} disabled={qrBusy || !myEntityId}>
                      {qrBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4" />}
                      Generate My QR
                    </Button>
                  </>
                ) : (
                  <>
                    <img src={qrDataUrl} alt="Attendance QR" className="rounded-xl border p-2" />
                    <Badge variant="secondary">Valid today · one-time use</Badge>
                    <Button variant="outline" size="sm" onClick={() => { setQrDataUrl(null); setQrToken(null); }}>
                      <RefreshCw className="mr-1 h-3 w-3" /> Regenerate
                    </Button>
                  </>
                )}
                {qrError && <p className="text-sm text-red-600">{qrError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ScanLine className="h-4 w-4" /> Scan QR Reader</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 p-6">
                {scanningMode ? (
                  <>
                    <QrScanner onToken={onScannedToken} />
                    <Button variant="outline" size="sm" onClick={() => setScanningMode(false)} disabled={qrBusy}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed bg-muted/40">
                      <ScanLine className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                    <p className="max-w-xs text-center text-sm text-muted-foreground">
                      Point the camera at an attendance QR. The token is verified server-side before marking.
                    </p>
                    <Button onClick={() => setScanningMode(true)} disabled={qrBusy}>
                      {qrBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ScanLine className="mr-2 h-4 w-4" />}
                      Start Scanner
                    </Button>
                  </>
                )}
                {qrResult && (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    <ShieldCheck className="h-4 w-4" /> {qrResult}
                  </div>
                )}
                {qrError && (
                  <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    <ShieldX className="mt-0.5 h-4 w-4" /> {qrError}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Face ────────────────────────────────────────────── */}
        <TabsContent value="face" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Camera className="h-4 w-4" /> Face Registration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Register a reference photo. Face-marking requires a registration on file.
                </p>
                {myFaceRegistration?.photoUrl ? (
                  <div className="flex items-center gap-3 rounded-md border p-3">
                    <img src={myFaceRegistration.photoUrl} alt="Registered face" className="h-16 w-16 rounded-lg object-cover" />
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4 text-green-600" /> Registered
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(myFaceRegistration.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> No face registration yet.
                  </p>
                )}
                <FaceCapture onCapture={onFaceRegisterCapture} busy={faceBusy} actionLabel="Register Face Photo" />
                {faceMessage && <p className="text-sm text-green-700">{faceMessage}</p>}
                {faceError && <p className="text-sm text-red-600">{faceError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verify by Face</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Capture a fresh selfie to mark today's attendance. The selfie is stored for audit; mode is recorded as Face.
                </p>
                {myFaceRegistration?.photoUrl ? (
                  <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-2 text-xs text-green-700">
                    <ShieldCheck className="h-4 w-4" /> Registration on file — verification enabled.
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                    <AlertTriangle className="h-4 w-4" /> Register a face photo first.
                  </div>
                )}
                <FaceCapture onCapture={onFaceVerifyCapture} busy={faceBusy} actionLabel="Verify & Mark Attendance" />
                {faceMessage && <p className="text-sm text-green-700">{faceMessage}</p>}
                {faceError && <p className="text-sm text-red-600">{faceError}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── GPS ─────────────────────────────────────────────── */}
        <TabsContent value="gps" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Verify My Location</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Capture your current location, then mark attendance. If the selected branch has a geofence, the mark is
                  verified against it (distance recorded).
                </p>
                <div className="flex items-center gap-2">
                  <Button onClick={captureLocation} variant="outline">
                    <Crosshair className="mr-2 h-4 w-4" /> Capture Location
                  </Button>
                  {geoStatus === "locating" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                {geoCoords && (
                  <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs">
                    <p>Latitude: {geoCoords.lat.toFixed(6)}</p>
                    <p>Longitude: {geoCoords.lng.toFixed(6)}</p>
                    <p>Accuracy: ±{Math.round(geoCoords.acc)} m</p>
                  </div>
                )}
                <Button onClick={verifyAndMarkGps} disabled={!geoCoords || geoStatus === "marking" || !myEntityId}>
                  {geoStatus === "marking" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                  Verify & Mark Attendance
                </Button>
                {gpsResult && (
                  <div className="rounded-md border p-3 text-sm">
                    <p className="flex items-center gap-2 font-medium">
                      {gpsResult.geofenceVerified ? (
                        <><ShieldCheck className="h-4 w-4 text-green-600" /> Geofence verified</>
                      ) : (
                        <><ShieldX className="h-4 w-4 text-amber-600" /> Not verified</>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gpsResult.geofenceConfigured
                        ? `Distance from geofence center: ${gpsResult.geofenceDistanceM} m`
                        : "No geofence configured for this branch — location recorded only."}
                    </p>
                  </div>
                )}
                {geoError && <p className="text-sm text-red-600">{geoError}</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Branch Geofence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Set a geofence center (defaults to your captured location) and radius for the selected branch.
                </p>
                <div className="grid gap-2">
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((b: any) => (
                        <SelectItem key={b._id} value={b._id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={50}
                      value={radiusM}
                      onChange={(e) => setRadiusM(e.target.value)}
                      placeholder="Radius (m)"
                      className="w-32"
                    />
                    <span className="text-xs text-muted-foreground">meters</span>
                  </div>
                  <Button variant="outline" onClick={saveCurrentGeofence} disabled={!geoCoords || !branchId}>
                    <MapPin className="mr-2 h-4 w-4" /> Save Geofence at Current Location
                  </Button>
                  {geoStatus === "geofence-saved" && (
                    <p className="text-sm text-green-700">Geofence saved for branch.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── History ─────────────────────────────────────────── */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-[200px]" />
                <Select value={historyEntity} onValueChange={(v) => setHistoryEntity(v as EntityType)}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="Entity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="faculty">Faculty</SelectItem>
                    <SelectItem value="employee">Employees</SelectItem>
                    <SelectItem value="visitor">Visitors</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left font-medium">Entity</th>
                      <th className="p-2 text-center font-medium">Status</th>
                      <th className="p-2 text-center font-medium">Mode</th>
                      <th className="p-2 text-center font-medium">Verification</th>
                      <th className="p-2 text-right font-medium">Check-in</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!records || records.records.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
                          <p>No records for {selectedDate}.</p>
                        </td>
                      </tr>
                    ) : (
                      records.records.map((r: any) => {
                        const modeBadge = MODE_BADGES[r.mode] || MODE_BADGES.manual;
                        const verified =
                          r.geofenceVerified === true ||
                          r.otpVerified === true ||
                          r.mode === "face_recognition";
                        return (
                          <tr key={r._id} className="border-b">
                            <td className="p-2 font-medium">{r.entityId ? String(r.entityId).slice(0, 12) : "—"}</td>
                            <td className="p-2 text-center">
                              <Badge variant={r.status === "present" ? "default" : r.status === "late" ? "secondary" : "destructive"}>
                                {r.status}
                              </Badge>
                            </td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className={modeBadge.className}>{modeBadge.label}</Badge>
                            </td>
                            <td className="p-2 text-center">
                              {verified ? (
                                <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                  <ShieldX className="h-3.5 w-3.5" /> Manual
                                </span>
                              )}
                              {r.geofenceDistanceM !== undefined && (
                                <span className="ml-1 text-[10px] text-muted-foreground">({r.geofenceDistanceM}m)</span>
                              )}
                            </td>
                            <td className="p-2 text-right text-muted-foreground">
                              {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
