// ============================================================================
// NEXORA 2027 – Admin Dashboard
// Requires:  npm install html5-qrcode
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  Activity,
  Armchair,
  Calendar,
  CalendarDays,
  Camera,
  CameraOff,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Download,
  GraduationCap,
  Hash,
  Info,
  LayoutDashboard,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Phone,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "./lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

type Registration = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  participant_type: string;
  interest: string;
  registration_status: string;
  created_at: string;
};

type StatusFilter = "All" | "Pending" | "Confirmed" | "Rejected";

type Seat = {
  number: number;
  registration: Registration | null;
};

type AttendanceRecord = {
  id: number;
  registration_id: number;
  event_name: string;
  scanned_at: string;
  registrations: {
    full_name: string;
    email: string;
    phone: string;
    participant_type: string;
  } | null;
};

type ScanResult = {
  scan_status: string;
  participant_id: number | null;
  participant_name: string | null;
  participant_email: string | null;
  participant_phone: string | null;
  participant_category: string | null;
  seat_number: string | null;
  scanned_time: string | null;
};

type ScanMessageType = "success" | "error" | "warning" | "";

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const EVENT_NAME = "NEXORA 2027";
const EVENT_CAPACITY = 250;
const SEATS_PER_PAGE = 50;
const TOTAL_SEAT_PAGES = Math.ceil(EVENT_CAPACITY / SEATS_PER_PAGE);
const SCANNER_ELEMENT_ID = "nexora-qr-reader";
const SCAN_COOLDOWN_MS = 3000;

const getSeatNumber = (id: number) => `Nexora${String(id).padStart(3, "0")}`;

const statusClass = (status?: string) => {
  const s = status?.toLowerCase();
  if (s === "confirmed") return "confirmed";
  if (s === "rejected") return "rejected";
  return "pending";
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB") : "N/A";

const formatDateTime = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "N/A";

const escapeCSV = (value: unknown) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCSV = (
  filename: string,
  headers: string[],
  rows: unknown[][],
) => {
  const csv = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
};

const NAV_ITEMS = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Registrations", icon: Users },
  { name: "Participants", icon: GraduationCap },
  { name: "Seats", icon: Armchair },
  { name: "Scan QR", icon: QrCode },
  { name: "Reports", icon: ChartNoAxesCombined },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function AdminDashboard() {
  const navigate = useNavigate();

  // --------------------------------------------------------------------------
  // STATE
  // --------------------------------------------------------------------------

  // General
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adminName, setAdminName] = useState("Administrator");
  const [activePage, setActivePage] = useState("Dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Registrations
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Seats
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [seatSearch, setSeatSearch] = useState("");
  const [currentSeatPage, setCurrentSeatPage] = useState(0);

  // Attendance / QR
  const [attendanceRows, setAttendanceRows] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [scanMessageType, setScanMessageType] = useState<ScanMessageType>("");
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingScanRef = useRef(false);
  const lastScannedTextRef = useRef("");
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------------------------------------------------------------------
  // DATA LOADING
  // --------------------------------------------------------------------------

  // Load admin profile + registrations
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        navigate("/login", { replace: true });
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", authData.user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        navigate("/login", { replace: true });
        return;
      }

      setAdminName(profile.full_name || "Administrator");

      const { data, error: queryError } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (queryError) throw queryError;

      setRows((data || []) as Registration[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load registrations.",
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Load attendance records
  const loadAttendance = useCallback(async () => {
    setAttendanceLoading(true);

    try {
      const { data, error: attendanceError } = await supabase
        .from("attendance")
        .select(
          `
          id,
          registration_id,
          event_name,
          scanned_at,
          registrations (
            full_name,
            email,
            phone,
            participant_type
          )
        `,
        )
        .eq("event_name", EVENT_NAME)
        .order("scanned_at", { ascending: false });

      if (attendanceError) throw attendanceError;

      setAttendanceRows((data || []) as unknown as AttendanceRecord[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load attendance.",
      );
    } finally {
      setAttendanceLoading(false);
    }
  }, []);

  // --------------------------------------------------------------------------
  // QR SCANNER
  // --------------------------------------------------------------------------

  // Validate QR → call Supabase RPC → show result
  const processScannedQR = useCallback(
    async (decodedText: string) => {
      if (processingScanRef.current) return;

      processingScanRef.current = true;

      try {
        let qrData: { event?: string; participant_id?: number };

        try {
          qrData = JSON.parse(decodedText);
        } catch {
          setScanMessage(
            "Invalid QR Code. Please scan a NEXORA participant QR.",
          );
          setScanMessageType("error");
          setScanResult(null);
          return;
        }

        const participantId = Number(qrData.participant_id);

        if (
          qrData.event !== EVENT_NAME ||
          !Number.isInteger(participantId) ||
          participantId <= 0
        ) {
          setScanMessage("Invalid NEXORA participant QR code.");
          setScanMessageType("error");
          setScanResult(null);
          return;
        }

        const { data, error: rpcError } = await supabase.rpc(
          "scan_nexora_attendance",
          { p_registration_id: participantId },
        );

        if (rpcError) throw rpcError;

        const result = (Array.isArray(data) ? data[0] : data) as
          | ScanResult
          | undefined;

        if (!result) throw new Error("No attendance response received.");

        setScanResult(result);

        if (result.scan_status === "success") {
          setScanMessage("Attendance marked successfully!");
          setScanMessageType("success");
          await loadAttendance();
        } else if (result.scan_status === "already_scanned") {
          setScanMessage(
            "Already Scanned! This participant's attendance is recorded.",
          );
          setScanMessageType("warning");
        } else {
          setScanMessage(
            "Participant not found, or registration is not confirmed.",
          );
          setScanMessageType("error");
        }
      } catch (err) {
        setScanMessage(
          err instanceof Error ? err.message : "Unable to process QR code.",
        );
        setScanMessageType("error");
        setScanResult(null);
      } finally {
        processingScanRef.current = false;

        // Allow the same QR to be scanned again after a short cooldown
        if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);
        cooldownTimerRef.current = setTimeout(() => {
          lastScannedTextRef.current = "";
        }, SCAN_COOLDOWN_MS);
      }
    },
    [loadAttendance],
  );

  const stopQRScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (scanner) {
      try {
        if (scanner.isScanning) await scanner.stop();
        scanner.clear();
      } catch {
        // Scanner may already be stopped.
      }
      scannerRef.current = null;
    }

    if (cooldownTimerRef.current) clearTimeout(cooldownTimerRef.current);

    setScannerActive(false);
    setScannerReady(false);
    lastScannedTextRef.current = "";
  }, []);

  const startQRScanner = useCallback(async () => {
    try {
      setScanMessage("");
      setScanMessageType("");
      setScanResult(null);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(SCANNER_ELEMENT_ID);
      }

      const cameras = await Html5Qrcode.getCameras();

      if (!cameras.length) {
        throw new Error("No camera found. Please connect a camera.");
      }

      const preferredCamera =
        cameras.find((camera) => /back|rear|environment/i.test(camera.label)) ||
        cameras[0];

      await scannerRef.current.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          if (
            processingScanRef.current ||
            lastScannedTextRef.current === decodedText
          ) {
            return;
          }

          lastScannedTextRef.current = decodedText;
          await processScannedQR(decodedText);
        },
        () => {
          // Ignore frames without a QR code.
        },
      );

      setScannerActive(true);
      setScannerReady(true);
    } catch (err) {
      scannerRef.current = null;
      setScannerActive(false);
      setScannerReady(false);
      setScanMessage(
        err instanceof Error ? err.message : "Unable to start camera.",
      );
      setScanMessageType("error");
    }
  }, [processScannedQR]);

  // --------------------------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------------------------

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load attendance when entering Scan QR; stop camera when leaving
  useEffect(() => {
    if (activePage === "Scan QR") {
      void loadAttendance();
    } else {
      void stopQRScanner();
    }
  }, [activePage, loadAttendance, stopQRScanner]);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      void stopQRScanner();
    };
  }, [stopQRScanner]);

  // --------------------------------------------------------------------------
  // DERIVED DATA
  // --------------------------------------------------------------------------

  // Dashboard statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const count = (status: string) =>
      rows.filter((r) => r.registration_status === status).length;

    return {
      total,
      confirmed: count("Confirmed"),
      pending: count("Pending"),
      rejected: count("Rejected"),
      available: Math.max(EVENT_CAPACITY - total, 0),
      percentage: Math.min((total / EVENT_CAPACITY) * 100, 100),
    };
  }, [rows]);

  // Attendance statistics
  const attendanceStats = useMemo(() => {
    const checkedIn = new Set(attendanceRows.map((a) => a.registration_id))
      .size;
    const notArrived = Math.max(stats.confirmed - checkedIn, 0);
    const rate = stats.confirmed
      ? Math.min((checkedIn / stats.confirmed) * 100, 100)
      : 0;

    return { checkedIn, notArrived, rate };
  }, [attendanceRows, stats.confirmed]);

  // Participant categories
  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(rows.map((r) => r.participant_type).filter(Boolean)),
      ),
    ],
    [rows],
  );

  // Filtered registrations
  const filteredRows = useMemo(() => {
    const term = search.toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        row.full_name?.toLowerCase().includes(term) ||
        row.email?.toLowerCase().includes(term) ||
        row.phone?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" || row.registration_status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || row.participant_type === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [rows, search, statusFilter, categoryFilter]);

  // All 250 seats (seat number = registration ID)
  const seats = useMemo<Seat[]>(() => {
    const byId = new Map(rows.map((row) => [row.id, row]));

    return Array.from({ length: EVENT_CAPACITY }, (_, index) => ({
      number: index + 1,
      registration: byId.get(index + 1) ?? null,
    }));
  }, [rows]);

  // 50 seats per page
  const paginatedSeats = useMemo(() => {
    const start = currentSeatPage * SEATS_PER_PAGE;
    return seats.slice(start, start + SEATS_PER_PAGE);
  }, [seats, currentSeatPage]);

  const firstSeatNumber = currentSeatPage * SEATS_PER_PAGE + 1;
  const lastSeatNumber = Math.min(
    (currentSeatPage + 1) * SEATS_PER_PAGE,
    EVENT_CAPACITY,
  );

  // Seat counts
  const occupiedSeats = seats.filter((s) => s.registration !== null).length;
  const pendingSeats = seats.filter(
    (s) => s.registration?.registration_status === "Pending",
  ).length;
  const rejectedSeats = seats.filter(
    (s) => s.registration?.registration_status === "Rejected",
  ).length;
  const confirmedSeats = seats.filter(
    (s) => s.registration?.registration_status === "Confirmed",
  ).length;
  const availableSeats = EVENT_CAPACITY - occupiedSeats;

  // Active seat (hover wins over click)
  const activeSeatNumber = hoveredSeat ?? selectedSeat;
  const activeSeatData = activeSeatNumber
    ? (seats.find((s) => s.number === activeSeatNumber) ?? null)
    : null;
  const activeSeatDetails = activeSeatData?.registration ?? null;

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  const updateStatus = async (id: number, status: string) => {
    const previousRows = rows;

    setUpdatingId(id);
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, registration_status: status } : row,
      ),
    );

    const { error: updateError } = await supabase
      .from("registrations")
      .update({ registration_status: status })
      .eq("id", id);

    if (updateError) {
      setRows(previousRows);
      setError(updateError.message);
    }

    setUpdatingId(null);
  };

  const logout = async () => {
    await stopQRScanner();
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const goToPage = (name: string) => {
    setActivePage(name);
    setMobileMenu(false);
    setError("");

    if (name === "Seats") {
      setSelectedSeat(null);
      setHoveredSeat(null);
      setSeatSearch("");
      setCurrentSeatPage(0);
    }

    if (name === "Scan QR") {
      setScanMessage("");
      setScanMessageType("");
      setScanResult(null);
    }
  };

  const goToPreviousSeatPage = () => {
    setCurrentSeatPage((page) => Math.max(page - 1, 0));
    setSelectedSeat(null);
    setHoveredSeat(null);
  };

  const goToNextSeatPage = () => {
    setCurrentSeatPage((page) => Math.min(page + 1, TOTAL_SEAT_PAGES - 1));
    setSelectedSeat(null);
    setHoveredSeat(null);
  };

  // --------------------------------------------------------------------------
  // EXPORTS
  // --------------------------------------------------------------------------

  const exportCSV = () => {
    downloadCSV(
      "NEXORA_2027_Registrations.csv",
      [
        "ID",
        "Full Name",
        "Email",
        "Phone",
        "Category",
        "Interest",
        "Status",
        "Registered Date",
      ],
      filteredRows.map((r) => [
        r.id,
        r.full_name,
        r.email,
        r.phone,
        r.participant_type,
        r.interest,
        r.registration_status,
        new Date(r.created_at).toLocaleDateString(),
      ]),
    );
  };

  const exportSeatsCSV = () => {
    downloadCSV(
      "NEXORA_2027_Seat_Allocation.csv",
      [
        "Seat Number",
        "Participant ID",
        "Participant Name",
        "Email",
        "Phone",
        "Category",
        "Registration Status",
      ],
      seats.map((seat) => {
        const p = seat.registration;

        return [
          getSeatNumber(seat.number),
          p?.id ?? "",
          p?.full_name ?? "Available",
          p?.email ?? "",
          p?.phone ?? "",
          p?.participant_type ?? "",
          p?.registration_status ?? "Available",
        ];
      }),
    );
  };

  const exportAttendanceCSV = () => {
    downloadCSV(
      "NEXORA_2027_Attendance.csv",
      [
        "Seat Number",
        "Participant ID",
        "Participant Name",
        "Email",
        "Phone",
        "Category",
        "Scanned At",
      ],
      attendanceRows.map((a) => [
        getSeatNumber(a.registration_id),
        a.registration_id,
        a.registrations?.full_name ?? "",
        a.registrations?.email ?? "",
        a.registrations?.phone ?? "",
        a.registrations?.participant_type ?? "",
        new Date(a.scanned_at).toLocaleString(),
      ]),
    );
  };

  // --------------------------------------------------------------------------
  // SEAT HELPERS
  // --------------------------------------------------------------------------

  const getSeatClass = (seat: Seat) =>
    seat.registration
      ? `nx-seat ${statusClass(seat.registration.registration_status)}`
      : "nx-seat available";

  const seatMatchesSearch = (seat: Seat) => {
    const term = seatSearch.trim().toLowerCase();

    if (!term) return true;

    const participant = seat.registration;

    return (
      getSeatNumber(seat.number).toLowerCase().includes(term) ||
      String(seat.number).includes(term) ||
      String(participant?.id || "").includes(term) ||
      participant?.full_name?.toLowerCase().includes(term) ||
      false
    );
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="nx-app">
      {/* ------------------------------------------------------------------ */}
      {/* STYLES                                                             */}
      {/* ------------------------------------------------------------------ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        /* ---------- BASE ---------- */
        * { box-sizing:border-box; }
        body { margin:0; font-family:Inter,Arial,sans-serif; background:#f5f6fc; color:#17182d; }
        button,input,select { font:inherit; }
        button { cursor:pointer; }
        .nx-app { min-height:100vh; background:#f5f6fc; }
        .nx-menu-btn { display:none; }
        .nx-mobile-overlay { display:none; }
        .nx-spin { animation:nxRotate .8s linear infinite; }

        .purple { background:#eeeaff; color:#7656ef; }
        .blue { background:#e7f1ff; color:#3883ee; }
        .orange { background:#fff1e4; color:#ed9742; }
        .green { background:#e5f8ef; color:#27a56b; }
        .red { background:#ffeaed; color:#e55c70; }

        /* ---------- SIDEBAR ---------- */
        .nx-sidebar { width:260px; position:fixed; left:0; top:0; bottom:0; background:#10132c; color:#fff; padding:26px 17px; display:flex; flex-direction:column; z-index:20; overflow-y:auto; }
        .nx-brand { display:flex; align-items:center; gap:12px; padding:0 9px 32px; }
        .nx-brand-icon { width:42px; height:42px; border-radius:13px; background:linear-gradient(135deg,#7556ff,#3689ff); display:grid; place-items:center; box-shadow:0 7px 25px #654cff55; }
        .nx-brand h2 { font-size:19px; margin:0; font-weight:800; letter-spacing:.5px; }
        .nx-brand p { font-size:10px; color:#a4a8c9; margin:4px 0 0; letter-spacing:2px; }
        .nx-nav-label { font-size:10px; color:#777eaa; letter-spacing:1.5px; font-weight:700; padding:14px 12px 10px; }
        .nx-nav { display:flex; align-items:center; gap:12px; width:100%; padding:13px 14px; border:0; border-radius:10px; background:transparent; color:#aeb3d0; text-align:left; font-size:13px; font-weight:600; margin:3px 0; transition:.2s; }
        .nx-nav:hover { background:#ffffff0c; color:white; transform:translateX(3px); }
        .nx-nav.active { background:linear-gradient(100deg,#7357ed,#526dff); color:white; box-shadow:0 8px 20px #654cff30; }
        .nx-nav svg { width:18px; height:18px; }
        .nx-nav-badge { margin-left:auto; font-size:9px; background:#ffffff20; padding:4px 7px; border-radius:20px; }
        .nx-sidebar-bottom { margin-top:auto; }
        .nx-event-card { background:#ffffff0b; border:1px solid #ffffff14; padding:15px; border-radius:13px; margin:20px 3px; }
        .nx-event-card strong { display:block; font-size:12px; }
        .nx-event-card p { font-size:11px; line-height:1.7; color:#a9afd0; margin:9px 0 0; }
        .nx-logout { display:flex; align-items:center; gap:10px; width:100%; padding:13px; border:0; background:#ffffff0a; color:#c7c9dc; border-radius:10px; font-size:13px; }
        .nx-logout:hover { background:#ff52601a; color:#ff8992; }

        /* ---------- MAIN / TOPBAR ---------- */
        .nx-main { margin-left:260px; min-height:100vh; }
        .nx-topbar { height:78px; background:#fff; border-bottom:1px solid #eaebf3; display:flex; align-items:center; justify-content:space-between; padding:0 36px; position:sticky; top:0; z-index:10; }
        .nx-topbar-left { display:flex; align-items:center; gap:13px; }
        .nx-breadcrumb { font-size:13px; color:#8b8da5; }
        .nx-breadcrumb strong { color:#22243d; }
        .nx-top-actions { display:flex; align-items:center; gap:17px; }
        .nx-icon-btn { width:38px; height:38px; border:1px solid #ececf4; border-radius:10px; background:#fff; color:#686b88; display:grid; place-items:center; flex-shrink:0; }
        .nx-icon-btn:hover { background:#f7f6ff; color:#7255ed; }
        .nx-icon-btn:disabled { opacity:.5; cursor:not-allowed; }
        .nx-admin { display:flex; align-items:center; gap:11px; }
        .nx-avatar { width:38px; height:38px; border-radius:12px; background:linear-gradient(135deg,#7255f3,#3b83ff); color:white; display:grid; place-items:center; font-weight:800; font-size:14px; }
        .nx-admin strong { display:block; font-size:12px; }
        .nx-admin span { display:block; color:#999bb0; font-size:10px; margin-top:4px; }

        /* ---------- CONTENT / HEADINGS ---------- */
        .nx-content { max-width:1500px; margin:auto; padding:31px 36px 55px; }
        .nx-welcome { display:flex; justify-content:space-between; align-items:center; gap:15px; margin-bottom:27px; }
        .nx-welcome h1 { font-size:25px; margin:0; font-weight:800; letter-spacing:-.7px; }
        .nx-welcome p { color:#8c8ea5; font-size:12px; margin:8px 0 0; }
        .nx-date { display:flex; align-items:center; gap:8px; color:#777a95; background:#fff; border:1px solid #e9eaf2; padding:11px 14px; border-radius:10px; font-size:11px; }
        .nx-error { padding:12px 15px; background:#fff0f2; border:1px solid #ffd9df; color:#d64e62; border-radius:9px; font-size:11px; margin-bottom:15px; }
        .nx-empty { text-align:center; padding:45px 20px; color:#999bb0; font-size:12px; }
        .nx-footer { text-align:center; color:#a2a3b5; font-size:10px; padding:24px 0; line-height:1.8; }

        /* ---------- STAT CARDS ---------- */
        .nx-stat-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:17px; margin-bottom:19px; }
        .nx-stat { background:#fff; border:1px solid #ebecf4; border-radius:14px; padding:20px; min-width:0; }
        .nx-stat-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
        .nx-stat-icon { width:40px; height:40px; border-radius:12px; display:grid; place-items:center; }
        .nx-stat-icon svg { width:19px; height:19px; }
        .nx-stat-label { font-size:11px; color:#8b8da4; font-weight:600; }
        .nx-stat-value { font-size:28px; font-weight:800; letter-spacing:-1px; color:#22233d; }
        .nx-stat-note { font-size:10px; color:#a0a1b5; margin-top:7px; }

        /* ---------- PANELS ---------- */
        .nx-middle-grid { display:grid; grid-template-columns:1.4fr 1fr; gap:18px; margin-bottom:20px; }
        .nx-panel { background:#fff; border:1px solid #ebecf4; border-radius:14px; padding:21px; min-width:0; }
        .nx-panel-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:19px; }
        .nx-panel-head h3 { font-size:14px; margin:0; font-weight:750; }
        .nx-panel-sub { font-size:10px; color:#999bb0; margin-top:5px; }
        .nx-capacity-number { display:flex; justify-content:space-between; align-items:end; }
        .nx-capacity-number strong { font-size:30px; letter-spacing:-1px; }
        .nx-progress { height:10px; background:#f0eff8; border-radius:20px; margin:18px 0 12px; overflow:hidden; }
        .nx-progress-fill { height:100%; border-radius:20px; background:linear-gradient(90deg,#7956f2,#438bff); transition:width .4s; }
        .nx-capacity-foot { display:flex; justify-content:space-between; color:#8c8fa6; font-size:10px; }
        .nx-capacity-foot strong { color:#353751; }
        .nx-event-info { display:grid; gap:14px; }
        .nx-event-row { display:flex; align-items:center; gap:12px; }
        .nx-event-row-icon { width:35px; height:35px; border-radius:10px; background:#f0edff; color:#795cf0; display:grid; place-items:center; flex-shrink:0; }
        .nx-event-row-icon svg { width:16px; height:16px; }
        .nx-event-row strong { display:block; font-size:11px; }
        .nx-event-row span { display:block; color:#999bb0; font-size:10px; margin-top:4px; }

        /* ---------- BUTTONS / INPUTS ---------- */
        .nx-button { display:inline-flex; align-items:center; justify-content:center; gap:7px; padding:10px 13px; border-radius:9px; border:1px solid #e8e9f1; background:#fff; color:#555873; font-size:11px; font-weight:650; }
        .nx-button:hover { background:#f7f6ff; border-color:#d9d2ff; color:#7155e9; }
        .nx-button.primary { background:#7255ed; color:white; border-color:#7255ed; }
        .nx-button.primary:hover { background:#6245df; }
        .nx-button.danger { background:#ffeaed; color:#d64e62; border-color:#ffd0d7; }
        .nx-button.danger:hover { background:#ffdde2; }
        .nx-button:disabled { opacity:.5; cursor:not-allowed; }
        .nx-search { display:flex; align-items:center; gap:9px; flex:1; min-width:190px; border:1px solid #e9eaf1; background:#fafaff; padding:0 12px; border-radius:9px; }
        .nx-search svg { color:#a1a2b6; flex-shrink:0; }
        .nx-search input { border:0; outline:none; background:transparent; width:100%; height:39px; font-size:11px; color:#33354d; }
        .nx-select { height:39px; padding:0 12px; border:1px solid #e9eaf1; border-radius:9px; background:#fff; color:#686a85; font-size:11px; outline:none; min-width:125px; }

        /* ---------- TABLES ---------- */
        .nx-table-panel { background:#fff; border:1px solid #ebecf4; border-radius:14px; overflow:hidden; margin-bottom:20px; }
        .nx-table-header { padding:21px 22px; border-bottom:1px solid #eff0f5; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .nx-table-header h3 { margin:0; font-size:15px; }
        .nx-table-header p { margin:5px 0 0; color:#999bb0; font-size:10px; }
        .nx-table-actions { display:flex; gap:9px; align-items:center; }
        .nx-filters { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:16px 22px; border-bottom:1px solid #eff0f5; }
        .nx-table-scroll { overflow-x:auto; }
        .nx-table { width:100%; border-collapse:collapse; min-width:850px; }
        .nx-table th { text-align:left; padding:14px 16px; background:#fafaff; color:#9a9bb0; font-size:9px; letter-spacing:.8px; text-transform:uppercase; font-weight:750; }
        .nx-table td { padding:15px 16px; border-top:1px solid #f0f0f5; color:#555771; font-size:11px; vertical-align:middle; }
        .nx-table tr:hover td { background:#fcfcff; }
        .nx-table-footer { padding:14px 20px; border-top:1px solid #eff0f5; color:#999bb0; font-size:10px; display:flex; justify-content:space-between; gap:10px; }
        .nx-person { display:flex; align-items:center; gap:10px; min-width:150px; }
        .nx-person-avatar { width:33px; height:33px; border-radius:10px; background:#eeeaff; color:#7658ec; display:grid; place-items:center; font-weight:800; font-size:11px; flex-shrink:0; }
        .nx-person strong { display:block; color:#34354f; font-size:11px; }
        .nx-person span { display:block; color:#a0a1b4; font-size:9px; margin-top:4px; }
        .nx-status { display:inline-flex; align-items:center; gap:5px; padding:6px 9px; border-radius:20px; font-size:9px; font-weight:750; }
        .nx-status.confirmed { background:#e8f8ef; color:#249961; }
        .nx-status.pending { background:#fff4e5; color:#d28b32; }
        .nx-status.rejected { background:#ffedf0; color:#dc596c; }
        .nx-status-dot { width:5px; height:5px; border-radius:50%; background:currentColor; }
        .nx-status-select { border:1px solid #e9eaf1; border-radius:7px; padding:7px; background:white; color:#555771; font-size:10px; outline:none; }

        /* ---------- SEATS PAGE ---------- */
        .nx-seat-overview { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:22px; }
        .nx-seat-summary { background:#fff; border:1px solid #ebecf4; border-radius:13px; padding:17px; display:flex; align-items:center; gap:13px; min-width:0; transition:transform .2s,box-shadow .2s; }
        .nx-seat-summary:hover { transform:translateY(-3px); box-shadow:0 10px 25px #25244a0d; }
        .nx-seat-summary-icon { width:42px; height:42px; border-radius:12px; display:grid; place-items:center; flex-shrink:0; }
        .nx-seat-summary span { display:block; font-size:10px; color:#999bb0; font-weight:650; }
        .nx-seat-summary strong { display:block; font-size:22px; margin-top:5px; color:#272840; }
        .nx-seat-layout { background:#fff; border:1px solid #e9eaf2; border-radius:16px; overflow:hidden; }
        .nx-seat-layout-header { display:flex; align-items:center; justify-content:space-between; gap:15px; flex-wrap:wrap; padding:20px 23px; border-bottom:1px solid #eff0f5; }
        .nx-seat-layout-header h3 { font-size:15px; margin:0; }
        .nx-seat-layout-header p { color:#999bb0; font-size:10px; margin:5px 0 0; }
        .nx-seat-toolbar { display:flex; gap:9px; align-items:center; flex-wrap:wrap; }
        .nx-seat-search { height:38px; min-width:210px; border:1px solid #e9eaf1; background:#fafaff; display:flex; align-items:center; gap:8px; padding:0 11px; border-radius:9px; }
        .nx-seat-search svg { color:#999bb0; flex-shrink:0; }
        .nx-seat-search input { width:100%; border:0; outline:none; background:transparent; font-size:10px; color:#33354d; }
        .nx-seat-legend { display:flex; gap:17px; flex-wrap:wrap; padding:17px 23px; border-bottom:1px solid #f0f0f5; }
        .nx-legend-item { display:flex; align-items:center; gap:7px; font-size:10px; color:#777990; }
        .nx-legend-dot { width:10px; height:10px; border-radius:3px; }
        .nx-dot-available { background:#e9edf5; }
        .nx-dot-confirmed { background:#27b77b; }
        .nx-dot-pending { background:#f1aa45; }
        .nx-dot-rejected { background:#e56b7b; }
        .nx-stage-wrap { padding:28px 25px 18px; background:linear-gradient(180deg,#fbfbff,#fff); }
        .nx-stage { max-width:450px; margin:0 auto; padding:13px; border-radius:9px 9px 35px 35px; border:1px solid #d9d9e9; background:linear-gradient(180deg,#f0effa,#fafaff); text-align:center; color:#77758f; font-size:10px; letter-spacing:3px; font-weight:850; box-shadow:0 5px 15px #25244a0a; }
        .nx-seat-grid-wrap { padding:28px 18px 32px; overflow-x:auto; overflow-y:hidden; position:relative; }
        .nx-seat-grid { display:grid; grid-template-columns:repeat(10,minmax(43px,1fr)); gap:12px 9px; max-width:850px; min-width:500px; margin:0 auto; padding:12px 5px; }
        .nx-seat { height:54px; position:relative; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:3px; border:1px solid transparent; border-radius:9px 9px 12px 12px; transition:transform .2s ease,box-shadow .2s ease,background .2s ease; cursor:pointer; outline:none; }
        .nx-seat:hover,.nx-seat:focus-visible { transform:translateY(-5px) scale(1.04); z-index:5; box-shadow:0 10px 20px #28264a24; }
        .nx-seat.available { background:#edf0f6; border-color:#e3e6ef; color:#858ba0; }
        .nx-seat.available:hover { background:#dfe5f1; }
        .nx-seat.confirmed { background:#e3f8ed; border-color:#bcebd2; color:#219b68; }
        .nx-seat.confirmed:hover { background:#c9f1dc; }
        .nx-seat.pending { background:#fff2dd; border-color:#f7dfb8; color:#c8892c; }
        .nx-seat.pending:hover { background:#ffe7bd; }
        .nx-seat.rejected { background:#ffebee; border-color:#f5cbd2; color:#d65b70; }
        .nx-seat.rejected:hover { background:#ffdae0; }
        .nx-seat-number { font-size:10px; font-weight:850; line-height:1; }
        .nx-seat-participant { font-size:8px; font-weight:750; line-height:1; opacity:.85; }
        .nx-seat-selected { outline:3px solid #7558f1 !important; outline-offset:3px; z-index:4; }
        .nx-seat-selected.available { outline-color:#9ba3b6 !important; }
        .nx-seat-selected.confirmed { outline-color:#27b77b !important; }
        .nx-seat-selected.pending { outline-color:#f1aa45 !important; }
        .nx-seat-selected.rejected { outline-color:#e56b7b !important; }

        /* Pagination */
        .nx-seat-pagination { display:flex; justify-content:center; align-items:center; gap:25px; padding:18px 20px; border-top:1px solid #eff0f5; background:#fbfbff; }
        .nx-page-arrow { width:40px; height:40px; display:grid; place-items:center; border:1px solid #e6e4f1; border-radius:11px; background:#fff; color:#7155ed; transition:.2s; }
        .nx-page-arrow:hover:not(:disabled) { background:#7255ed; color:#fff; border-color:#7255ed; transform:translateY(-2px); }
        .nx-page-arrow:disabled { opacity:.35; cursor:not-allowed; }
        .nx-page-information { display:flex; flex-direction:column; align-items:center; gap:5px; }
        .nx-page-information strong { font-size:12px; color:#34354f; }
        .nx-page-information span { font-size:10px; color:#999bb0; }

        /* Seat details popup */
        .nx-seat-details-popup { margin:0 23px 23px; border:1px solid #e5e2f5; background:linear-gradient(135deg,#ffffff,#f7f7ff); border-radius:15px; overflow:hidden; box-shadow:0 12px 30px #29234a0c; animation:nxFadeUp .25s ease both; }
        .nx-popup-top { display:flex; justify-content:space-between; align-items:center; gap:15px; padding:17px 20px; border-bottom:1px solid #eceaf6; background:#fbfaff; }
        .nx-popup-title { display:flex; align-items:center; gap:12px; min-width:0; }
        .nx-popup-seat-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:12px; background:#eeeaff; color:#7356ec; flex-shrink:0; }
        .nx-popup-title h3 { margin:0; font-size:13px; color:#292943; }
        .nx-popup-title p { margin:5px 0 0; font-size:10px; color:#9698ad; }
        .nx-popup-actions { display:flex; align-items:center; gap:10px; }
        .nx-popup-status { display:inline-flex; align-items:center; gap:6px; padding:7px 11px; border-radius:30px; font-size:9px; font-weight:800; white-space:nowrap; }
        .nx-popup-status.confirmed { background:#e5f8ee; color:#229b65; }
        .nx-popup-status.pending { background:#fff3df; color:#c8892c; }
        .nx-popup-status.rejected { background:#ffebee; color:#d65b70; }
        .nx-popup-status.available { background:#edf0f6; color:#788197; }
        .nx-popup-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:20px; padding:22px; }
        .nx-popup-item { display:flex; align-items:center; gap:11px; min-width:0; }
        .nx-popup-item-icon { width:37px; height:37px; flex-shrink:0; display:grid; place-items:center; border-radius:11px; background:#efedff; color:#7358e6; }
        .nx-popup-item span { display:block; font-size:9px; color:#999bb0; margin-bottom:5px; }
        .nx-popup-item strong { display:block; font-size:10px; color:#34354f; overflow-wrap:anywhere; }
        .nx-popup-available { padding:25px; text-align:center; color:#8b90a5; font-size:11px; }
        .nx-popup-available svg { margin-bottom:9px; color:#8b90a5; }
        .nx-popup-bottom { padding:12px 20px; border-top:1px solid #eceaf6; display:flex; justify-content:space-between; align-items:center; gap:10px; font-size:9px; color:#999bb0; }
        .nx-popup-bottom strong { color:#44455f; }
        .nx-seat-footer { padding:15px 23px; border-top:1px solid #eff0f5; display:flex; justify-content:space-between; align-items:center; gap:12px; color:#999bb0; font-size:10px; }
        .nx-seat-footer strong { color:#44455f; }
        .nx-seats-note { display:flex; align-items:flex-start; gap:9px; margin-top:16px; padding:13px 15px; border:1px solid #e6e9f7; border-radius:10px; background:#f5f7ff; color:#777c9d; font-size:10px; line-height:1.7; }
        .nx-seats-note svg { flex-shrink:0; color:#7158dd; }

        /* ---------- SCAN QR PAGE ---------- */
        .nx-scan-grid { display:grid; grid-template-columns:1fr 1fr; gap:18px; margin-bottom:20px; }
        .nx-scanner-box { position:relative; width:100%; max-width:380px; margin:0 auto; border-radius:14px; overflow:hidden; background:#10132c; min-height:0; }
        #${SCANNER_ELEMENT_ID} { width:100%; }
        #${SCANNER_ELEMENT_ID} video { width:100% !important; border-radius:14px; }
        .nx-scanner-placeholder { max-width:380px; margin:0 auto; aspect-ratio:1/1; border:2px dashed #d9d4f5; border-radius:14px; background:#faf9ff; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; color:#9a9bb0; font-size:11px; text-align:center; padding:20px; }
        .nx-scanner-placeholder svg { color:#7a5ff0; }
        .nx-scanner-controls { display:flex; justify-content:center; gap:10px; margin-top:18px; flex-wrap:wrap; }
        .nx-scanner-badge { display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:20px; font-size:9px; font-weight:800; }
        .nx-scanner-badge.on { background:#e5f8ee; color:#229b65; }
        .nx-scanner-badge.off { background:#edf0f6; color:#788197; }
        .nx-scan-alert { display:flex; align-items:center; gap:10px; padding:13px 15px; border-radius:10px; font-size:11px; font-weight:650; margin-bottom:16px; }
        .nx-scan-alert.success { background:#e8f8ef; color:#249961; border:1px solid #c3ecd5; }
        .nx-scan-alert.warning { background:#fff4e5; color:#c8892c; border:1px solid #f7dfb8; }
        .nx-scan-alert.error { background:#ffedf0; color:#d64e62; border:1px solid #ffd0d7; }
        .nx-scan-alert svg { flex-shrink:0; }
        .nx-scan-result-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
        .nx-scan-idle { text-align:center; padding:40px 15px; color:#9a9bb0; font-size:11px; }
        .nx-scan-idle svg { margin-bottom:10px; color:#b9b4dc; }

        @keyframes nxRotate { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes nxFadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

        /* ---------- RESPONSIVE: TABLET ---------- */
        @media(max-width:1100px) {
          .nx-stat-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .nx-middle-grid { grid-template-columns:1fr; }
          .nx-seat-overview { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .nx-scan-grid { grid-template-columns:1fr; }
        }

        /* ---------- RESPONSIVE: MOBILE ---------- */
        @media(max-width:760px) {
          .nx-sidebar { transform:translateX(-100%); transition:.25s; }
          .nx-sidebar.open { transform:translateX(0); }
          .nx-main { margin-left:0; }
          .nx-mobile-overlay { display:block; position:fixed; inset:0; background:#090b1d88; z-index:15; }
          .nx-topbar { height:66px; padding:0 16px; }
          .nx-menu-btn { display:grid; }
          .nx-content { padding:24px 15px 40px; }
          .nx-welcome { align-items:flex-start; flex-direction:column; }
          .nx-welcome h1 { font-size:22px; }
          .nx-date { font-size:10px; }
          .nx-admin-details { display:none; }
          .nx-top-actions { gap:9px; }
          .nx-table-header { align-items:flex-start; flex-direction:column; }
          .nx-table-actions { width:100%; }
          .nx-table-actions .nx-button { flex:1; }
          .nx-seat-layout-header { align-items:flex-start; flex-direction:column; }
          .nx-seat-toolbar { width:100%; }
          .nx-seat-search { flex:1; min-width:0; }
          .nx-popup-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .nx-seat-details-popup { margin:0 14px 18px; }
          .nx-scan-result-grid { grid-template-columns:1fr; }
        }

        /* ---------- RESPONSIVE: SMALL PHONES ---------- */
        @media(max-width:430px) {
          .nx-stat-grid { gap:10px; }
          .nx-stat { padding:14px; }
          .nx-stat-value { font-size:23px; }
          .nx-stat-icon { width:34px; height:34px; }
          .nx-stat-top { margin-bottom:14px; }
          .nx-panel { padding:16px; }
          .nx-filters { padding:13px; }
          .nx-select { flex:1; }
          .nx-seat-overview { gap:9px; }
          .nx-seat-summary { padding:12px; gap:9px; }
          .nx-seat-summary-icon { width:34px; height:34px; }
          .nx-seat-summary strong { font-size:18px; }
          .nx-seat-summary span { font-size:9px; }
          .nx-seat-layout-header { padding:16px; }
          .nx-seat-legend { padding:14px 16px; gap:11px; }
          .nx-stage-wrap { padding:22px 15px 10px; }
          .nx-seat-grid-wrap { padding:22px 12px; }
          .nx-seat-grid { gap:10px 7px; }
          .nx-seat { height:48px; }
          .nx-seat-pagination { gap:18px; padding:14px; }
          .nx-page-arrow { width:36px; height:36px; }
          .nx-seat-details-popup { margin:0 12px 15px; }
          .nx-popup-top { padding:13px; align-items:flex-start; }
          .nx-popup-grid { grid-template-columns:1fr; padding:15px; gap:15px; }
          .nx-popup-bottom { padding:12px; flex-wrap:wrap; }
          .nx-seat-footer { padding:13px; flex-wrap:wrap; }
        }
      `}</style>

      {mobileMenu && (
        <div
          className="nx-mobile-overlay"
          onClick={() => setMobileMenu(false)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                            */}
      {/* ------------------------------------------------------------------ */}
      <aside className={`nx-sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="nx-brand">
          <div className="nx-brand-icon">
            <Sparkles size={23} />
          </div>

          <div>
            <h2>NEXORA 2027</h2>
            <p>ADMINISTRATION</p>
          </div>
        </div>

        <div className="nx-nav-label">WORKSPACE</div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              className={`nx-nav ${activePage === item.name ? "active" : ""}`}
              onClick={() => goToPage(item.name)}
            >
              <Icon />
              {item.name}

              {item.name === "Seats" && (
                <span className="nx-nav-badge">{EVENT_CAPACITY}</span>
              )}
            </button>
          );
        })}

        <div className="nx-nav-label">EVENT</div>

        <button
          className={`nx-nav ${
            activePage === "Event Information" ? "active" : ""
          }`}
          onClick={() => goToPage("Event Information")}
        >
          <CalendarDays />
          Event Information
        </button>

        <button
          className={`nx-nav ${activePage === "Settings" ? "active" : ""}`}
          onClick={() => goToPage("Settings")}
        >
          <Settings />
          Settings
        </button>

        <div className="nx-sidebar-bottom">
          <div className="nx-event-card">
            <strong>
              <Activity
                size={13}
                style={{ display: "inline", marginRight: 6 }}
              />
              NEXORA 2027
            </strong>

            <p>
              19 January 2027
              <br />
              Main Hall, TVTC
              <br />
              Capacity: {EVENT_CAPACITY} Participants
            </p>
          </div>

          <button className="nx-logout" onClick={logout}>
            <LogOut size={17} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN                                                               */}
      {/* ------------------------------------------------------------------ */}
      <main className="nx-main">
        {/* TOPBAR */}
        <header className="nx-topbar">
          <div className="nx-topbar-left">
            <button
              className="nx-icon-btn nx-menu-btn"
              onClick={() => setMobileMenu(true)}
            >
              <Menu size={18} />
            </button>

            <div className="nx-breadcrumb">
              Workspace / <strong>{activePage}</strong>
            </div>
          </div>

          <div className="nx-top-actions">
            <button
              className="nx-icon-btn"
              title="Refresh dashboard"
              onClick={() => void loadData()}
              disabled={loading}
            >
              <RefreshCw size={16} className={loading ? "nx-spin" : ""} />
            </button>

            <div className="nx-admin">
              <div className="nx-avatar">
                {adminName.charAt(0).toUpperCase()}
              </div>

              <div className="nx-admin-details">
                <strong>{adminName}</strong>
                <span>Administrator</span>
              </div>

              <ShieldCheck size={17} color="#7356ec" />
            </div>
          </div>
        </header>

        <div className="nx-content">
          {error && <div className="nx-error">{error}</div>}

          {/* ============================================================== */}
          {/* DASHBOARD                                                      */}
          {/* ============================================================== */}
          {activePage === "Dashboard" && (
            <>
              <div className="nx-welcome">
                <div>
                  <h1>Dashboard Overview</h1>
                  <p>
                    Welcome back, {adminName}. Here's what's happening with
                    NEXORA 2027.
                  </p>
                </div>

                <div className="nx-date">
                  <Calendar size={15} />
                  {new Date().toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </div>

              <section className="nx-stat-grid">
                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">TOTAL REGISTRATIONS</div>
                    <div className="nx-stat-icon purple">
                      <Users />
                    </div>
                  </div>
                  <div className="nx-stat-value">{stats.total}</div>
                  <div className="nx-stat-note">
                    All registered participants
                  </div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">CONFIRMED PARTICIPANTS</div>
                    <div className="nx-stat-icon green">
                      <CheckCircle2 />
                    </div>
                  </div>
                  <div className="nx-stat-value">{stats.confirmed}</div>
                  <div className="nx-stat-note">Approved registrations</div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">PENDING APPROVAL</div>
                    <div className="nx-stat-icon orange">
                      <Clock3 />
                    </div>
                  </div>
                  <div className="nx-stat-value">{stats.pending}</div>
                  <div className="nx-stat-note">Awaiting admin review</div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">REJECTED REGISTRATIONS</div>
                    <div className="nx-stat-icon red">
                      <XCircle />
                    </div>
                  </div>
                  <div className="nx-stat-value">{stats.rejected}</div>
                  <div className="nx-stat-note">Rejected applications</div>
                </div>
              </section>

              <section className="nx-middle-grid">
                <div className="nx-panel">
                  <div className="nx-panel-head">
                    <div>
                      <h3>Registration Capacity</h3>
                      <div className="nx-panel-sub">
                        NEXORA 2027 seat availability
                      </div>
                    </div>

                    <div className="nx-stat-icon purple">
                      <UserCheck />
                    </div>
                  </div>

                  <div className="nx-capacity-number">
                    <strong>
                      {stats.total}
                      <span style={{ fontSize: 14, fontWeight: 500 }}>
                        {" "}
                        / {EVENT_CAPACITY}
                      </span>
                    </strong>

                    <span style={{ fontSize: 11, color: "#989aaf" }}>
                      {stats.percentage.toFixed(0)}% registered
                    </span>
                  </div>

                  <div className="nx-progress">
                    <div
                      className="nx-progress-fill"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>

                  <div className="nx-capacity-foot">
                    <span>
                      Registered: <strong>{stats.total}</strong>
                    </span>
                    <span>
                      Available: <strong>{stats.available}</strong>
                    </span>
                  </div>
                </div>

                <div className="nx-panel">
                  <div className="nx-panel-head">
                    <div>
                      <h3>Event Information</h3>
                      <div className="nx-panel-sub">
                        Event details and schedule
                      </div>
                    </div>

                    <div className="nx-stat-icon blue">
                      <CalendarDays />
                    </div>
                  </div>

                  <div className="nx-event-info">
                    <div className="nx-event-row">
                      <div className="nx-event-row-icon">
                        <CalendarDays />
                      </div>
                      <div>
                        <strong>19 January 2027</strong>
                        <span>Event Date</span>
                      </div>
                    </div>

                    <div className="nx-event-row">
                      <div className="nx-event-row-icon">
                        <MapPin />
                      </div>
                      <div>
                        <strong>Main Hall, New Building</strong>
                        <span>Thondaman Vocational Training Centre</span>
                      </div>
                    </div>

                    <div className="nx-event-row">
                      <div className="nx-event-row-icon">
                        <Clock3 />
                      </div>
                      <div>
                        <strong>09:00 AM – 04:00 PM</strong>
                        <span>Exhibition and Career Development Programme</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ============================================================== */}
          {/* REGISTRATIONS                                                  */}
          {/* ============================================================== */}
          {activePage === "Registrations" && (
            <section className="nx-table-panel">
              <div className="nx-table-header">
                <div>
                  <h3>Participant Registrations</h3>
                  <p>Manage, review and update participant applications.</p>
                </div>

                <div className="nx-table-actions">
                  <button
                    className="nx-button"
                    onClick={() => void loadData()}
                    disabled={loading}
                  >
                    <RefreshCw size={14} />
                    Refresh
                  </button>

                  <button
                    className="nx-button primary"
                    onClick={exportCSV}
                    disabled={filteredRows.length === 0}
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                </div>
              </div>

              <div className="nx-filters">
                <div className="nx-search">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search name, email or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <select
                  className="nx-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as StatusFilter)
                  }
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <select
                  className="nx-select"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === "All" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="nx-empty">
                  <RefreshCw className="nx-spin" size={24} />
                  <div>Loading participant registrations...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="nx-empty">
                  <Users size={28} />
                  <div>No matching registrations found.</div>
                </div>
              ) : (
                <div className="nx-table-scroll">
                  <table className="nx-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Phone</th>
                        <th>Category</th>
                        <th>Interest</th>
                        <th>Registered</th>
                        <th>Status</th>
                        <th>Manage</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <div className="nx-person">
                              <div className="nx-person-avatar">
                                {row.full_name?.charAt(0).toUpperCase() || "P"}
                              </div>
                              <div>
                                <strong>{row.full_name}</strong>
                                <span>{row.email}</span>
                              </div>
                            </div>
                          </td>

                          <td>{row.phone}</td>
                          <td>{row.participant_type}</td>
                          <td>{row.interest}</td>
                          <td>{formatDate(row.created_at)}</td>

                          <td>
                            <span
                              className={`nx-status ${statusClass(row.registration_status)}`}
                            >
                              <span className="nx-status-dot" />
                              {row.registration_status}
                            </span>
                          </td>

                          <td>
                            <select
                              className="nx-status-select"
                              value={row.registration_status}
                              disabled={updatingId === row.id}
                              onChange={(e) =>
                                void updateStatus(row.id, e.target.value)
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="nx-table-footer">
                <span>
                  Showing {filteredRows.length} of {rows.length} registrations
                </span>
                <span>NEXORA 2027 Administration</span>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* PARTICIPANTS                                                   */}
          {/* ============================================================== */}
          {activePage === "Participants" && (
            <section className="nx-panel">
              <div className="nx-panel-head">
                <div>
                  <h3>Participants</h3>
                  <div className="nx-panel-sub">
                    Registered participant overview
                  </div>
                </div>

                <div className="nx-stat-icon blue">
                  <GraduationCap />
                </div>
              </div>

              <div className="nx-stat-value">{rows.length}</div>
              <p className="nx-panel-sub">Total participant records.</p>
            </section>
          )}

          {/* ============================================================== */}
          {/* SEATS                                                          */}
          {/* ============================================================== */}
          {activePage === "Seats" && (
            <>
              <div className="nx-welcome">
                <div>
                  <h1>Seat Management</h1>
                  <p>
                    View all {EVENT_CAPACITY} seats and check participant
                    allocations for NEXORA 2027.
                  </p>
                </div>

                <div className="nx-date">
                  <Armchair size={15} />
                  {EVENT_CAPACITY} Total Seats
                </div>
              </div>

              {/* Seat summary */}
              <section className="nx-seat-overview">
                <div className="nx-seat-summary">
                  <div className="nx-seat-summary-icon purple">
                    <Armchair size={20} />
                  </div>
                  <div>
                    <span>Total Seats</span>
                    <strong>{EVENT_CAPACITY}</strong>
                  </div>
                </div>

                <div className="nx-seat-summary">
                  <div className="nx-seat-summary-icon blue">
                    <Users size={20} />
                  </div>
                  <div>
                    <span>Occupied Seats</span>
                    <strong>{occupiedSeats}</strong>
                  </div>
                </div>

                <div className="nx-seat-summary">
                  <div className="nx-seat-summary-icon green">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span>Confirmed</span>
                    <strong>{confirmedSeats}</strong>
                  </div>
                </div>

                <div className="nx-seat-summary">
                  <div className="nx-seat-summary-icon orange">
                    <Clock3 size={20} />
                  </div>
                  <div>
                    <span>Available Seats</span>
                    <strong>{availableSeats}</strong>
                  </div>
                </div>
              </section>

              {/* Seat map */}
              <section className="nx-seat-layout">
                <div className="nx-seat-layout-header">
                  <div>
                    <h3>Interactive Seat Map</h3>
                    <p>
                      Hover over a seat to preview participant details. Click a
                      seat to keep its details selected.
                    </p>
                  </div>

                  <div className="nx-seat-toolbar">
                    <div className="nx-seat-search">
                      <Search size={15} />
                      <input
                        type="text"
                        placeholder="Search ID, name or seat..."
                        value={seatSearch}
                        onChange={(e) => {
                          setSeatSearch(e.target.value);
                          setSelectedSeat(null);
                          setHoveredSeat(null);
                          setCurrentSeatPage(0);
                        }}
                      />
                    </div>

                    <button className="nx-button" onClick={exportSeatsCSV}>
                      <Download size={14} />
                      Export Seats
                    </button>
                  </div>
                </div>

                {/* Legend */}
                <div className="nx-seat-legend">
                  <div className="nx-legend-item">
                    <span className="nx-legend-dot nx-dot-available" />
                    Available
                  </div>
                  <div className="nx-legend-item">
                    <span className="nx-legend-dot nx-dot-confirmed" />
                    Confirmed
                  </div>
                  <div className="nx-legend-item">
                    <span className="nx-legend-dot nx-dot-pending" />
                    Pending
                  </div>
                  <div className="nx-legend-item">
                    <span className="nx-legend-dot nx-dot-rejected" />
                    Rejected
                  </div>
                </div>

                {/* Stage */}
                <div className="nx-stage-wrap">
                  <div className="nx-stage">STAGE / SCREEN</div>
                </div>

                {/* Seat grid (50 per page) */}
                <div className="nx-seat-grid-wrap">
                  <div className="nx-seat-grid">
                    {paginatedSeats.map((seat) => {
                      const participant = seat.registration;
                      const matches = seatMatchesSearch(seat);

                      return (
                        <button
                          key={seat.number}
                          type="button"
                          className={`${getSeatClass(seat)} ${
                            selectedSeat === seat.number
                              ? "nx-seat-selected"
                              : ""
                          }`}
                          style={{ opacity: matches ? 1 : 0.13 }}
                          onMouseEnter={() => setHoveredSeat(seat.number)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          onFocus={() => setHoveredSeat(seat.number)}
                          onBlur={() => setHoveredSeat(null)}
                          onClick={() => setSelectedSeat(seat.number)}
                          aria-label={
                            participant
                              ? `${getSeatNumber(seat.number)}, participant ${participant.id}, ${participant.full_name}`
                              : `${getSeatNumber(seat.number)}, available`
                          }
                        >
                          <span className="nx-seat-number">
                            {String(seat.number).padStart(3, "0")}
                          </span>

                          <span className="nx-seat-participant">
                            {participant ? `ID: ${participant.id}` : "FREE"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pagination */}
                <div className="nx-seat-pagination">
                  <button
                    type="button"
                    className="nx-page-arrow"
                    onClick={goToPreviousSeatPage}
                    disabled={currentSeatPage === 0}
                    aria-label="Previous 50 seats"
                    title="Previous 50 seats"
                  >
                    <ChevronLeft size={19} />
                  </button>

                  <div className="nx-page-information">
                    <strong>
                      {String(firstSeatNumber).padStart(3, "0")}
                      {" – "}
                      {String(lastSeatNumber).padStart(3, "0")}
                    </strong>
                    <span>
                      Page {currentSeatPage + 1} of {TOTAL_SEAT_PAGES}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="nx-page-arrow"
                    onClick={goToNextSeatPage}
                    disabled={currentSeatPage === TOTAL_SEAT_PAGES - 1}
                    aria-label="Next 50 seats"
                    title="Next 50 seats"
                  >
                    <ChevronRight size={19} />
                  </button>
                </div>

                {/* Hover / selected details */}
                {activeSeatData && (
                  <div
                    className="nx-seat-details-popup"
                    key={activeSeatData.number}
                  >
                    <div className="nx-popup-top">
                      <div className="nx-popup-title">
                        <div className="nx-popup-seat-icon">
                          <Armchair size={21} />
                        </div>

                        <div>
                          <h3>{getSeatNumber(activeSeatData.number)}</h3>
                          <p>
                            {activeSeatDetails
                              ? `Participant ID: ${activeSeatDetails.id}`
                              : "No participant assigned to this seat"}
                          </p>
                        </div>
                      </div>

                      <div className="nx-popup-actions">
                        {activeSeatDetails ? (
                          <span
                            className={`nx-popup-status ${statusClass(activeSeatDetails.registration_status)}`}
                          >
                            <span className="nx-status-dot" />
                            {activeSeatDetails.registration_status}
                          </span>
                        ) : (
                          <span className="nx-popup-status available">
                            Available
                          </span>
                        )}

                        <button
                          type="button"
                          className="nx-icon-btn"
                          title="Close details"
                          onClick={() => {
                            setSelectedSeat(null);
                            setHoveredSeat(null);
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    {activeSeatDetails ? (
                      <>
                        <div className="nx-popup-grid">
                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <User size={17} />
                            </div>
                            <div>
                              <span>Participant Name</span>
                              <strong>
                                {activeSeatDetails.full_name || "N/A"}
                              </strong>
                            </div>
                          </div>

                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <Hash size={17} />
                            </div>
                            <div>
                              <span>Participant ID</span>
                              <strong>{activeSeatDetails.id}</strong>
                            </div>
                          </div>

                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <Mail size={17} />
                            </div>
                            <div>
                              <span>Email Address</span>
                              <strong>
                                {activeSeatDetails.email || "N/A"}
                              </strong>
                            </div>
                          </div>

                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <Phone size={17} />
                            </div>
                            <div>
                              <span>Phone Number</span>
                              <strong>
                                {activeSeatDetails.phone || "N/A"}
                              </strong>
                            </div>
                          </div>

                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <GraduationCap size={17} />
                            </div>
                            <div>
                              <span>Participant Category</span>
                              <strong>
                                {activeSeatDetails.participant_type || "N/A"}
                              </strong>
                            </div>
                          </div>

                          <div className="nx-popup-item">
                            <div className="nx-popup-item-icon">
                              <CalendarDays size={17} />
                            </div>
                            <div>
                              <span>Registration Date</span>
                              <strong>
                                {formatDate(activeSeatDetails.created_at)}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div className="nx-popup-bottom">
                          <span>
                            Seat:{" "}
                            <strong>
                              {getSeatNumber(activeSeatData.number)}
                            </strong>
                          </span>
                          <span>
                            Registration ID:{" "}
                            <strong>#{activeSeatDetails.id}</strong>
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="nx-popup-available">
                        <Armchair size={29} />
                        <div>
                          <strong>
                            {getSeatNumber(activeSeatData.number)}
                          </strong>
                        </div>
                        <p>
                          This seat is currently available. No participant has
                          been assigned.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Seat footer */}
                <div className="nx-seat-footer">
                  <span>
                    Showing{" "}
                    <strong>
                      {firstSeatNumber}–{lastSeatNumber}
                    </strong>{" "}
                    of <strong>{EVENT_CAPACITY} seats</strong>
                  </span>

                  <span>
                    Occupied: <strong>{occupiedSeats}</strong>
                    {" · "}
                    Available: <strong>{availableSeats}</strong>
                    {" · "}
                    Pending: <strong>{pendingSeats}</strong>
                    {" · "}
                    Rejected: <strong>{rejectedSeats}</strong>
                  </span>
                </div>
              </section>

              <div className="nx-seats-note">
                <Info size={16} />
                <span>
                  Seat numbers are currently generated from the registration ID.
                  Pending registrations also occupy a seat in this map. Rejected
                  registrations are displayed separately and are still counted
                  as occupied until their registration record is removed or the
                  allocation logic is changed.
                </span>
              </div>
            </>
          )}

          {/* ============================================================== */}
          {/* SCAN QR / ATTENDANCE                                           */}
          {/* ============================================================== */}
          {activePage === "Scan QR" && (
            <>
              <div className="nx-welcome">
                <div>
                  <h1>QR Attendance Scanner</h1>
                  <p>
                    Scan confirmed NEXORA 2027 participant QR codes and record
                    event attendance.
                  </p>
                </div>

                <button
                  className="nx-button"
                  onClick={() => void loadAttendance()}
                  disabled={attendanceLoading}
                >
                  <RefreshCw
                    size={14}
                    className={attendanceLoading ? "nx-spin" : ""}
                  />
                  Refresh Attendance
                </button>
              </div>

              {/* Attendance summary */}
              <section className="nx-stat-grid">
                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">CONFIRMED PARTICIPANTS</div>
                    <div className="nx-stat-icon purple">
                      <Users />
                    </div>
                  </div>
                  <div className="nx-stat-value">{stats.confirmed}</div>
                  <div className="nx-stat-note">
                    Eligible online participants
                  </div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">CHECKED IN</div>
                    <div className="nx-stat-icon green">
                      <ClipboardCheck />
                    </div>
                  </div>
                  <div className="nx-stat-value">
                    {attendanceStats.checkedIn}
                  </div>
                  <div className="nx-stat-note">Attendance recorded</div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">NOT YET ARRIVED</div>
                    <div className="nx-stat-icon orange">
                      <Clock3 />
                    </div>
                  </div>
                  <div className="nx-stat-value">
                    {attendanceStats.notArrived}
                  </div>
                  <div className="nx-stat-note">Confirmed but not scanned</div>
                </div>

                <div className="nx-stat">
                  <div className="nx-stat-top">
                    <div className="nx-stat-label">ATTENDANCE RATE</div>
                    <div className="nx-stat-icon blue">
                      <ChartNoAxesCombined />
                    </div>
                  </div>
                  <div className="nx-stat-value">
                    {attendanceStats.rate.toFixed(0)}%
                  </div>
                  <div className="nx-stat-note">Of confirmed participants</div>
                </div>
              </section>

              {/* Scanner + result */}
              <section className="nx-scan-grid">
                {/* Camera */}
                <div className="nx-panel">
                  <div className="nx-panel-head">
                    <div>
                      <h3>Camera Scanner</h3>
                      <div className="nx-panel-sub">
                        Point the camera at a participant QR code
                      </div>
                    </div>

                    <span
                      className={`nx-scanner-badge ${scannerReady ? "on" : "off"}`}
                    >
                      <span className="nx-status-dot" />
                      {scannerReady ? "Camera Live" : "Camera Off"}
                    </span>
                  </div>

                  <div className="nx-scanner-box">
                    <div id={SCANNER_ELEMENT_ID} />
                  </div>

                  {!scannerActive && (
                    <div className="nx-scanner-placeholder">
                      <ScanLine size={42} />
                      <strong>Scanner is not running</strong>
                      <span>Press "Start Camera" and allow camera access.</span>
                    </div>
                  )}

                  <div className="nx-scanner-controls">
                    {!scannerActive ? (
                      <button
                        className="nx-button primary"
                        onClick={() => void startQRScanner()}
                      >
                        <Camera size={14} />
                        Start Camera
                      </button>
                    ) : (
                      <button
                        className="nx-button danger"
                        onClick={() => void stopQRScanner()}
                      >
                        <CameraOff size={14} />
                        Stop Camera
                      </button>
                    )}
                  </div>
                </div>

                {/* Scan result */}
                <div className="nx-panel">
                  <div className="nx-panel-head">
                    <div>
                      <h3>Scan Result</h3>
                      <div className="nx-panel-sub">
                        Latest scanned participant
                      </div>
                    </div>

                    <div className="nx-stat-icon purple">
                      <QrCode />
                    </div>
                  </div>

                  {scanMessage && (
                    <div className={`nx-scan-alert ${scanMessageType}`}>
                      {scanMessageType === "success" ? (
                        <CheckCircle2 size={18} />
                      ) : scanMessageType === "warning" ? (
                        <Info size={18} />
                      ) : (
                        <XCircle size={18} />
                      )}
                      {scanMessage}
                    </div>
                  )}

                  {scanResult && scanResult.participant_id ? (
                    <div className="nx-scan-result-grid">
                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <User size={17} />
                        </div>
                        <div>
                          <span>Participant Name</span>
                          <strong>
                            {scanResult.participant_name || "N/A"}
                          </strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <Hash size={17} />
                        </div>
                        <div>
                          <span>Participant ID</span>
                          <strong>{scanResult.participant_id}</strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <Armchair size={17} />
                        </div>
                        <div>
                          <span>Seat Number</span>
                          <strong>
                            {scanResult.seat_number ||
                              getSeatNumber(scanResult.participant_id)}
                          </strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <GraduationCap size={17} />
                        </div>
                        <div>
                          <span>Category</span>
                          <strong>
                            {scanResult.participant_category || "N/A"}
                          </strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <Mail size={17} />
                        </div>
                        <div>
                          <span>Email Address</span>
                          <strong>
                            {scanResult.participant_email || "N/A"}
                          </strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <Phone size={17} />
                        </div>
                        <div>
                          <span>Phone Number</span>
                          <strong>
                            {scanResult.participant_phone || "N/A"}
                          </strong>
                        </div>
                      </div>

                      <div className="nx-popup-item">
                        <div className="nx-popup-item-icon">
                          <Clock3 size={17} />
                        </div>
                        <div>
                          <span>Scanned Time</span>
                          <strong>
                            {formatDateTime(scanResult.scanned_time)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    !scanMessage && (
                      <div className="nx-scan-idle">
                        <ScanLine size={34} />
                        <div>Waiting for a QR code to be scanned...</div>
                      </div>
                    )
                  )}
                </div>
              </section>

              {/* Attendance list */}
              <section className="nx-table-panel">
                <div className="nx-table-header">
                  <div>
                    <h3>Attendance Records</h3>
                    <p>Participants who have checked in to NEXORA 2027.</p>
                  </div>

                  <div className="nx-table-actions">
                    <button
                      className="nx-button primary"
                      onClick={exportAttendanceCSV}
                      disabled={attendanceRows.length === 0}
                    >
                      <Download size={14} />
                      Export Attendance
                    </button>
                  </div>
                </div>

                {attendanceLoading && attendanceRows.length === 0 ? (
                  <div className="nx-empty">
                    <RefreshCw className="nx-spin" size={24} />
                    <div>Loading attendance...</div>
                  </div>
                ) : attendanceRows.length === 0 ? (
                  <div className="nx-empty">
                    <ClipboardCheck size={28} />
                    <div>No attendance recorded yet.</div>
                  </div>
                ) : (
                  <div className="nx-table-scroll">
                    <table className="nx-table">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Seat</th>
                          <th>Phone</th>
                          <th>Category</th>
                          <th>Scanned At</th>
                        </tr>
                      </thead>

                      <tbody>
                        {attendanceRows.map((record) => (
                          <tr key={record.id}>
                            <td>
                              <div className="nx-person">
                                <div className="nx-person-avatar">
                                  {record.registrations?.full_name
                                    ?.charAt(0)
                                    .toUpperCase() || "P"}
                                </div>
                                <div>
                                  <strong>
                                    {record.registrations?.full_name || "N/A"}
                                  </strong>
                                  <span>{record.registrations?.email}</span>
                                </div>
                              </div>
                            </td>

                            <td>{getSeatNumber(record.registration_id)}</td>
                            <td>{record.registrations?.phone}</td>
                            <td>{record.registrations?.participant_type}</td>
                            <td>{formatDateTime(record.scanned_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="nx-table-footer">
                  <span>{attendanceRows.length} attendance records</span>
                  <span>NEXORA 2027 Administration</span>
                </div>
              </section>
            </>
          )}

          {/* ============================================================== */}
          {/* REPORTS                                                        */}
          {/* ============================================================== */}
          {activePage === "Reports" && (
            <section className="nx-panel">
              <div className="nx-panel-head">
                <div>
                  <h3>Registration Reports</h3>
                  <div className="nx-panel-sub">
                    Export the current registration list.
                  </div>
                </div>

                <div className="nx-stat-icon purple">
                  <ChartNoAxesCombined />
                </div>
              </div>

              <p className="nx-panel-sub">
                Total: {stats.total} · Confirmed: {stats.confirmed}
                {" · "}Pending: {stats.pending}
                {" · "}Rejected: {stats.rejected}
              </p>

              <button
                className="nx-button primary"
                onClick={exportCSV}
                disabled={rows.length === 0}
              >
                <Download size={15} />
                Download Registration Report
              </button>
            </section>
          )}

          {/* ============================================================== */}
          {/* EVENT INFORMATION                                              */}
          {/* ============================================================== */}
          {activePage === "Event Information" && (
            <section className="nx-panel">
              <div className="nx-panel-head">
                <div>
                  <h3>NEXORA 2027</h3>
                  <div className="nx-panel-sub">Event Information</div>
                </div>

                <div className="nx-stat-icon blue">
                  <CalendarDays />
                </div>
              </div>

              <div className="nx-event-info">
                <div className="nx-event-row">
                  <div className="nx-event-row-icon">
                    <CalendarDays />
                  </div>
                  <div>
                    <strong>19 January 2027</strong>
                    <span>Event Date</span>
                  </div>
                </div>

                <div className="nx-event-row">
                  <div className="nx-event-row-icon">
                    <MapPin />
                  </div>
                  <div>
                    <strong>Main Hall, New Building</strong>
                    <span>Thondaman Vocational Training Centre</span>
                  </div>
                </div>

                <div className="nx-event-row">
                  <div className="nx-event-row-icon">
                    <Clock3 />
                  </div>
                  <div>
                    <strong>09:00 AM – 04:00 PM</strong>
                    <span>IT Exhibition and Career Development Programme</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ============================================================== */}
          {/* SETTINGS                                                       */}
          {/* ============================================================== */}
          {activePage === "Settings" && (
            <section className="nx-panel">
              <div className="nx-panel-head">
                <div>
                  <h3>Settings</h3>
                  <div className="nx-panel-sub">Administration settings</div>
                </div>

                <div className="nx-stat-icon purple">
                  <Settings />
                </div>
              </div>

              <p className="nx-panel-sub">
                Settings module is not connected to the database yet.
              </p>
            </section>
          )}

          <footer className="nx-footer">
            NEXORA 2027 · Empowering Tomorrow's Innovators.
            <br />
            Event Administration Panel
          </footer>
        </div>
      </main>
    </div>
  );
}
