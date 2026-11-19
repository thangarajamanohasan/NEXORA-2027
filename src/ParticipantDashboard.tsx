import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  QrCode,
  RefreshCw,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import QRCode from "qrcode";
import { supabase } from "./lib/supabase";

type Registration = {
  id: number;
  user_id?: string;
  full_name: string;
  email: string;
  phone: string;
  age: number | null;
  institution: string;
  participant_type: string;
  interest: string;
  registration_status: string;
  created_at?: string;
};

const EVENT_NAME = "NEXORA 2027";

const EVENT_DATE = "19 January 2027";
const EVENT_VENUE =
  "Main Hall, New Building, Thondaman Vocational Training Centre";

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="pd-detail-item">
      <div className="pd-detail-icon">{icon}</div>
      <div>
        <span className="pd-detail-label">{label}</span>
        <strong className="pd-detail-value">{value || "Not provided"}</strong>
      </div>
    </div>
  );
}

export default function ParticipantDashboard() {
  const navigate = useNavigate();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [qrLoading, setQrLoading] = useState(false);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const seatNumber = registration
    ? `Nexora${String(registration.id).padStart(3, "0")}`
    : "";

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        navigate("/login", { replace: true });
        return;
      }

      setUserEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profile) {
        throw new Error("Your participant profile was not found.");
      }

      if (profile.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      if (profile.role !== "participant") {
        throw new Error("You do not have permission to access this dashboard.");
      }

      const { data: registrationData, error: registrationError } =
        await supabase
          .from("registrations")
          .select(
            "id, user_id, full_name, email, phone, age, institution, participant_type, interest, registration_status, created_at",
          )
          .eq("user_id", user.id)
          .maybeSingle();

      if (registrationError) {
        throw new Error(registrationError.message);
      }

      if (!registrationData) {
        setRegistration(null);
        setQrCodeUrl("");
        setError("No registration was found for your account.");
        return;
      }

      setRegistration(registrationData as Registration);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load dashboard.";
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Generate an individual QR code for this participant.
  useEffect(() => {
    let active = true;

    const generateQR = async () => {
      if (!registration) {
        setQrCodeUrl("");
        return;
      }

      setQrLoading(true);

      try {
        const qrData = {
          event: EVENT_NAME,
          participant_id: registration.id,
          participant_name: registration.full_name,
          seat_number: `Nexora${String(registration.id).padStart(3, "0")}`,
          participant_category: registration.participant_type,
          registration_status: registration.registration_status,
        };

        const dataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 1000,
          margin: 3,
          errorCorrectionLevel: "H",
          color: {
            dark: "#11142D",
            light: "#FFFFFF",
          },
        });

        if (active) {
          setQrCodeUrl(dataUrl);
        }
      } catch {
        if (active) {
          setQrCodeUrl("");
        }
      } finally {
        if (active) {
          setQrLoading(false);
        }
      }
    };

    generateQR();

    return () => {
      active = false;
    };
  }, [registration]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const downloadQR = () => {
    if (!qrCodeUrl || !registration) return;

    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${seatNumber}_NEXORA_2027_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="pd-loading-screen">
        <div className="pd-loader" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="pd-app">
      {sidebarOpen && (
        <div
          className="pd-mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`pd-sidebar ${sidebarOpen ? "pd-sidebar-open" : ""}`}>
        <div className="pd-brand">
          <div className="pd-brand-icon">
            <Activity size={25} />
          </div>

          <div>
            <h2>NEXORA</h2>
            <span>2027 PARTICIPANT PORTAL</span>
          </div>

          <button
            className="pd-close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="pd-sidebar-label">MAIN MENU</div>

        <nav className="pd-navigation">
          <button
            className="pd-nav-item pd-nav-active"
            onClick={() => scrollToSection("dashboard")}
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </button>

          <button
            className="pd-nav-item"
            onClick={() => scrollToSection("my-registration")}
          >
            <User size={19} />
            <span>My Registration</span>
          </button>

          <button
            className="pd-nav-item"
            onClick={() => scrollToSection("my-qr")}
          >
            <QrCode size={19} />
            <span>My QR</span>
          </button>

          <button
            className="pd-nav-item"
            onClick={() => scrollToSection("event-information")}
          >
            <CalendarDays size={19} />
            <span>Event Information</span>
          </button>
        </nav>

        <div className="pd-sidebar-bottom">
          <div className="pd-sidebar-help">
            <div className="pd-help-icon">
              <ShieldCheck size={20} />
            </div>
            <strong>You're Registered!</strong>
            <p>Your NEXORA 2027 participant portal is ready.</p>
          </div>

          <button className="pd-logout" onClick={handleLogout}>
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="pd-main" id="dashboard">
        <header className="pd-topbar">
          <div className="pd-topbar-left">
            <button
              className="pd-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1>Participant Dashboard</h1>
              <p>Welcome to your NEXORA 2027 portal</p>
            </div>
          </div>

          <div className="pd-topbar-right">
            <button
              className="pd-refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh dashboard"
            >
              <RefreshCw size={17} className={refreshing ? "pd-spin" : ""} />
            </button>

            <div className="pd-user-profile">
              <div className="pd-avatar">
                {(registration?.full_name || "P").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong>{registration?.full_name || "Participant"}</strong>
                <span>Participant</span>
              </div>
            </div>
          </div>
        </header>

        <div className="pd-content">
          {error && (
            <div className="pd-error">
              <XCircleIcon />
              <span>{error}</span>
            </div>
          )}

          {/* HERO */}
          <section className="pd-hero">
            <div className="pd-hero-content">
              <span className="pd-hero-tag">
                <Activity size={14} />
                EMPOWERING TOMORROW'S INNOVATORS
              </span>

              <h2>
                Welcome to <span>NEXORA 2027</span>
              </h2>

              <p>
                Your journey into technology, innovation and career
                opportunities starts here. Access your registration information
                and participant QR code from this dashboard.
              </p>

              <div className="pd-hero-details">
                <div>
                  <CalendarDays size={17} />
                  <span>{EVENT_DATE}</span>
                </div>

                <div>
                  <MapPin size={17} />
                  <span>Thondaman Vocational Training Centre</span>
                </div>
              </div>
            </div>

            <div className="pd-hero-decoration">
              <div className="pd-hero-circle pd-circle-one" />
              <div className="pd-hero-circle pd-circle-two" />
              <div className="pd-hero-symbol">
                <GraduationCap size={90} />
              </div>
            </div>
          </section>

          {/* STAT CARDS */}
          <section className="pd-stats">
            <div className="pd-stat-card">
              <div className="pd-stat-icon purple">
                <User size={22} />
              </div>
              <div>
                <span>Participant ID</span>
                <h3>{registration?.id ?? "—"}</h3>
                <p>Your registration number</p>
              </div>
            </div>

            <div className="pd-stat-card">
              <div className="pd-stat-icon blue">
                <QrCode size={22} />
              </div>
              <div>
                <span>Seat Number</span>
                <h3>{seatNumber || "—"}</h3>
                <p>Your assigned seat reference</p>
              </div>
            </div>

            <div className="pd-stat-card">
              <div className="pd-stat-icon green">
                <CheckCircle2 size={22} />
              </div>
              <div>
                <span>Registration Status</span>
                <h3 className="pd-status-heading">
                  {registration?.registration_status || "Pending"}
                </h3>
                <p>Current registration status</p>
              </div>
            </div>
          </section>

          {/* REGISTRATION + EVENT INFORMATION */}
          <section className="pd-grid">
            <div className="pd-panel" id="my-registration">
              <div className="pd-panel-header">
                <div>
                  <h3>My Registration</h3>
                  <p>Your personal registration details</p>
                </div>

                <div className="pd-panel-header-icon">
                  <User size={20} />
                </div>
              </div>

              {registration ? (
                <div className="pd-details-grid">
                  <DetailItem
                    icon={<User size={18} />}
                    label="Full Name"
                    value={registration.full_name}
                  />

                  <DetailItem
                    icon={<Activity size={18} />}
                    label="Email Address"
                    value={registration.email || userEmail}
                  />

                  <DetailItem
                    icon={<Users size={18} />}
                    label="Phone Number"
                    value={registration.phone}
                  />

                  <DetailItem
                    icon={<GraduationCap size={18} />}
                    label="Institution"
                    value={registration.institution}
                  />

                  <DetailItem
                    icon={<User size={18} />}
                    label="Participant Category"
                    value={registration.participant_type}
                  />

                  <DetailItem
                    icon={<Activity size={18} />}
                    label="Area of Interest"
                    value={registration.interest}
                  />

                  <DetailItem
                    icon={<CalendarDays size={18} />}
                    label="Participant ID"
                    value={registration.id}
                  />

                  <DetailItem
                    icon={<QrCode size={18} />}
                    label="Seat Number"
                    value={seatNumber}
                  />
                </div>
              ) : (
                <div className="pd-empty">
                  <User size={35} />
                  <h4>No Registration Found</h4>
                  <p>Your registration details are not currently available.</p>
                </div>
              )}
            </div>

            <div className="pd-panel" id="event-information">
              <div className="pd-panel-header">
                <div>
                  <h3>Event Information</h3>
                  <p>Important details about the event</p>
                </div>

                <div className="pd-panel-header-icon">
                  <CalendarDays size={20} />
                </div>
              </div>

              <div className="pd-event-name">
                <span>OFFICIAL EVENT</span>
                <h2>NEXORA 2027</h2>
                <p>Empowering Tomorrow's Innovators.</p>
              </div>

              <div className="pd-event-list">
                <DetailItem
                  icon={<CalendarDays size={18} />}
                  label="Date"
                  value={EVENT_DATE}
                />

                <DetailItem
                  icon={<Clock3 size={18} />}
                  label="Time"
                  value="9:00 AM – 4:00 PM"
                />

                <DetailItem
                  icon={<MapPin size={18} />}
                  label="Venue"
                  value={EVENT_VENUE}
                />
              </div>

              <div className="pd-event-schedule">
                <div>
                  <span>09:00 AM – 11:30 AM</span>
                  <strong>IT Exhibition</strong>
                </div>
                <div>
                  <span>12:00 PM – 04:00 PM</span>
                  <strong>Career Development Programme</strong>
                </div>
              </div>
            </div>
          </section>

          {/* MY QR CODE */}
          <section className="pd-qr-panel" id="my-qr">
            <div className="pd-qr-heading">
              <div>
                <span className="pd-section-eyebrow">
                  YOUR DIGITAL ENTRY PASS
                </span>
                <h2>My Participant QR Code</h2>
                <p>
                  Your personal NEXORA 2027 QR code and seat identification.
                </p>
              </div>

              <div className="pd-qr-heading-icon">
                <QrCode size={25} />
              </div>
            </div>

            {registration ? (
              <div className="pd-qr-layout">
                <div className="pd-qr-image-container">
                  {qrLoading ? (
                    <div className="pd-qr-placeholder">
                      <div className="pd-loader" />
                      <span>Generating QR code...</span>
                    </div>
                  ) : qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt="NEXORA participant QR code"
                      className="pd-qr-image"
                    />
                  ) : (
                    <div className="pd-qr-placeholder">
                      <QrCode size={55} />
                      <span>QR code unavailable</span>
                    </div>
                  )}

                  <span className="pd-qr-caption">NEXORA 2027 PARTICIPANT</span>
                </div>

                <div className="pd-qr-information">
                  <span className="pd-qr-tag">
                    <CheckCircle2 size={15} />
                    PERSONAL QR CODE
                  </span>

                  <h3>{registration.full_name}</h3>
                  <p className="pd-qr-email">
                    {registration.email || userEmail}
                  </p>

                  <div className="pd-seat-card">
                    <span>YOUR SEAT NUMBER</span>
                    <strong>{seatNumber}</strong>
                    <small>Participant ID: {registration.id}</small>
                  </div>

                  <div className="pd-qr-details">
                    <div>
                      <span>Event</span>
                      <strong>NEXORA 2027</strong>
                    </div>

                    <div>
                      <span>Category</span>
                      <strong>
                        {registration.participant_type || "Participant"}
                      </strong>
                    </div>

                    <div>
                      <span>Status</span>
                      <strong>
                        {registration.registration_status || "Pending"}
                      </strong>
                    </div>
                  </div>

                  <button
                    className="pd-download-qr"
                    onClick={downloadQR}
                    disabled={!qrCodeUrl || qrLoading}
                  >
                    <Download size={19} />
                    Download QR Code (PNG)
                  </button>

                  <p className="pd-qr-note">
                    Download and save this QR code on your mobile phone. Present
                    it at the NEXORA 2027 registration desk on the event day.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pd-empty">
                <QrCode size={38} />
                <h4>QR Code Not Available</h4>
                <p>
                  Your participant QR code will be available after your
                  registration is recorded.
                </p>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="pd-footer">
            <div>
              <strong>NEXORA 2027</strong>
              <span>Empowering Tomorrow's Innovators.</span>
            </div>

            <p>© 2027 NEXORA. Participant Portal.</p>
          </footer>
        </div>
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        .pd-app {
          min-height: 100vh;
          display: flex;
          background: #f5f6fc;
          color: #20213b;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
        }

        .pd-sidebar {
          width: 265px;
          min-width: 265px;
          height: 100vh;
          position: sticky;
          top: 0;
          background: #fff;
          border-right: 1px solid #e9e9f2;
          display: flex;
          flex-direction: column;
          padding: 25px 18px;
          z-index: 50;
        }

        .pd-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 5px 30px;
          border-bottom: 1px solid #eeeef5;
        }

        .pd-brand-icon {
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          color: white;
          border-radius: 13px;
          background: linear-gradient(135deg, #6445d9, #3288f5);
        }

        .pd-brand h2 {
          font-size: 20px;
          letter-spacing: 1.5px;
          margin: 0;
          font-weight: 900;
        }

        .pd-brand span {
          font-size: 9px;
          color: #9695aa;
          letter-spacing: 1px;
          font-weight: 800;
        }

        .pd-close-sidebar {
          display: none;
          margin-left: auto;
          background: transparent;
          border: none;
          color: #666;
          cursor: pointer;
        }

        .pd-sidebar-label {
          font-size: 10px;
          color: #a4a2b5;
          letter-spacing: 1.5px;
          font-weight: 800;
          margin: 28px 10px 13px;
        }

        .pd-navigation {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .pd-nav-item {
          width: 100%;
          border: 0;
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 14px;
          border-radius: 10px;
          background: transparent;
          color: #77778e;
          cursor: pointer;
          text-align: left;
          font-size: 13px;
          font-weight: 650;
          transition: .2s;
        }

        .pd-nav-item:hover {
          background: #f3f1ff;
          color: #6849d9;
        }

        .pd-nav-active {
          background: #f0edff;
          color: #6849d9;
        }

        .pd-sidebar-bottom {
          margin-top: auto;
        }

        .pd-sidebar-help {
          background: linear-gradient(140deg, #f1efff, #edf5ff);
          border-radius: 13px;
          padding: 16px;
          margin-bottom: 20px;
        }

        .pd-help-icon {
          color: #6d52d9;
          margin-bottom: 10px;
        }

        .pd-sidebar-help strong {
          display: block;
          font-size: 12px;
        }

        .pd-sidebar-help p {
          color: #85839b;
          font-size: 11px;
          line-height: 1.6;
          margin: 7px 0 0;
        }

        .pd-logout {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 13px;
          border: 1px solid #f0e9ee;
          background: white;
          border-radius: 10px;
          color: #d14e6b;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .pd-logout:hover {
          background: #fff4f6;
        }

        .pd-main {
          flex: 1;
          min-width: 0;
        }

        .pd-topbar {
          height: 83px;
          padding: 0 36px;
          background: #fff;
          border-bottom: 1px solid #eaeaf2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .pd-topbar-left,
        .pd-topbar-right {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .pd-topbar h1 {
          font-size: 17px;
          margin: 0 0 5px;
          font-weight: 800;
        }

        .pd-topbar p {
          font-size: 11px;
          color: #9998aa;
          margin: 0;
        }

        .pd-menu-button {
          display: none;
          background: transparent;
          border: 0;
          cursor: pointer;
        }

        .pd-refresh-button {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border: 1px solid #ececf3;
          background: white;
          border-radius: 10px;
          color: #77738d;
          cursor: pointer;
        }

        .pd-user-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          border-left: 1px solid #eeeef4;
          padding-left: 18px;
        }

        .pd-avatar {
          width: 39px;
          height: 39px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: white;
          font-size: 16px;
          font-weight: 800;
          background: linear-gradient(135deg, #7253dc, #3686ed);
        }

        .pd-user-profile strong,
        .pd-user-profile span {
          display: block;
        }

        .pd-user-profile strong {
          font-size: 12px;
        }

        .pd-user-profile span {
          font-size: 10px;
          color: #9998aa;
          margin-top: 4px;
        }

        .pd-content {
          max-width: 1500px;
          padding: 30px 36px;
          margin: auto;
        }

        .pd-hero {
          min-height: 245px;
          padding: 35px 38px;
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          color: white;
          background: linear-gradient(110deg, #29205f, #5141b9 58%, #397bdc);
        }

        .pd-hero-content {
          max-width: 680px;
          position: relative;
          z-index: 2;
        }

        .pd-hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.3px;
          color: #d9d3ff;
        }

        .pd-hero h2 {
          font-size: clamp(25px, 3vw, 36px);
          margin: 15px 0 10px;
          font-weight: 850;
        }

        .pd-hero h2 span {
          color: #9fd4ff;
        }

        .pd-hero-content > p {
          font-size: 12px;
          line-height: 1.8;
          color: #e1ddff;
          max-width: 590px;
          margin: 0;
        }

        .pd-hero-details {
          display: flex;
          gap: 22px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .pd-hero-details div {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #eeeaff;
          font-size: 11px;
        }

        .pd-hero-decoration {
          position: absolute;
          width: 360px;
          height: 360px;
          right: 5%;
          top: -55px;
          pointer-events: none;
        }

        .pd-hero-circle {
          position: absolute;
          border: 1px solid rgba(255,255,255,.15);
          border-radius: 50%;
        }

        .pd-circle-one {
          width: 310px;
          height: 310px;
          top: 0;
          left: 0;
        }

        .pd-circle-two {
          width: 220px;
          height: 220px;
          top: 45px;
          left: 45px;
        }

        .pd-hero-symbol {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,.28);
        }

        .pd-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 17px;
          margin: 23px 0;
        }

        .pd-stat-card {
          background: white;
          border: 1px solid #eeeef5;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          min-width: 0;
        }

        .pd-stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          flex-shrink: 0;
        }

        .pd-stat-icon.purple {
          background: #f0edff;
          color: #7054da;
        }

        .pd-stat-icon.blue {
          background: #eaf3ff;
          color: #4388e8;
        }

        .pd-stat-icon.green {
          background: #eaf9f1;
          color: #26a46d;
        }

        .pd-stat-card span {
          display: block;
          font-size: 10px;
          color: #9695a8;
          font-weight: 700;
        }

        .pd-stat-card h3 {
          font-size: 20px;
          margin: 6px 0 3px;
          font-weight: 850;
          word-break: break-word;
        }

        .pd-stat-card p {
          margin: 0;
          color: #aaa9b8;
          font-size: 10px;
        }

        .pd-status-heading {
          font-size: 16px !important;
          text-transform: capitalize;
        }

        .pd-grid {
          display: grid;
          grid-template-columns: 1.15fr .85fr;
          gap: 18px;
          align-items: start;
        }

        .pd-panel {
          background: white;
          border: 1px solid #eeeef5;
          border-radius: 14px;
          padding: 23px;
          min-width: 0;
          scroll-margin-top: 100px;
        }

        .pd-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .pd-panel-header h3 {
          font-size: 15px;
          margin: 0 0 5px;
          font-weight: 800;
        }

        .pd-panel-header p {
          font-size: 10px;
          color: #a09fb0;
          margin: 0;
        }

        .pd-panel-header-icon {
          width: 38px;
          height: 38px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: #f0edff;
          color: #7054da;
        }

        .pd-details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 23px 14px;
        }

        .pd-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 11px;
          min-width: 0;
        }

        .pd-detail-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #f4f2ff;
          color: #7156d9;
        }

        .pd-detail-label,
        .pd-detail-value {
          display: block;
        }

        .pd-detail-label {
          font-size: 10px;
          color: #a09fb0;
          margin-bottom: 6px;
        }

        .pd-detail-value {
          font-size: 11px;
          font-weight: 750;
          color: #33334b;
          overflow-wrap: anywhere;
        }

        .pd-event-name {
          padding: 17px;
          border-radius: 12px;
          background: linear-gradient(120deg, #30246f, #6552ca);
          color: white;
          margin-bottom: 19px;
        }

        .pd-event-name span {
          color: #d6d0ff;
          font-size: 9px;
          letter-spacing: 1.3px;
          font-weight: 800;
        }

        .pd-event-name h2 {
          margin: 8px 0 3px;
          font-size: 23px;
          letter-spacing: 2px;
        }

        .pd-event-name p {
          color: #ded9ff;
          font-size: 10px;
          margin: 0;
        }

        .pd-event-list {
          display: grid;
          gap: 16px;
        }

        .pd-event-schedule {
          margin-top: 20px;
          border-top: 1px solid #eeeef5;
          padding-top: 16px;
          display: grid;
          gap: 13px;
        }

        .pd-event-schedule div {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .pd-event-schedule span {
          font-size: 9px;
          color: #8f7bda;
          font-weight: 800;
        }

        .pd-event-schedule strong {
          font-size: 11px;
        }

        /* QR CODE SECTION */

        .pd-qr-panel {
          margin-top: 20px;
          padding: 25px;
          border: 1px solid #eae9f3;
          background: white;
          border-radius: 15px;
          scroll-margin-top: 100px;
        }

        .pd-qr-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding-bottom: 21px;
          border-bottom: 1px solid #eeeef5;
          margin-bottom: 25px;
        }

        .pd-section-eyebrow {
          font-size: 9px;
          letter-spacing: 1.4px;
          font-weight: 850;
          color: #765bdc;
        }

        .pd-qr-heading h2 {
          font-size: 19px;
          margin: 7px 0;
        }

        .pd-qr-heading p {
          font-size: 11px;
          color: #9998aa;
          margin: 0;
        }

        .pd-qr-heading-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 12px;
          color: #7054da;
          background: #f0edff;
          flex-shrink: 0;
        }

        .pd-qr-layout {
          display: grid;
          grid-template-columns: 270px 1fr;
          gap: 35px;
          align-items: center;
        }

        .pd-qr-image-container {
          min-height: 300px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fafaff;
          border: 1px solid #eeeef5;
          border-radius: 14px;
        }

        .pd-qr-image {
          width: 215px;
          max-width: 100%;
          height: auto;
          display: block;
          background: white;
          border: 8px solid white;
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(35, 29, 80, .07);
        }

        .pd-qr-caption {
          font-size: 9px;
          font-weight: 850;
          letter-spacing: 1.5px;
          color: #77728f;
          margin-top: 15px;
        }

        .pd-qr-placeholder {
          min-height: 215px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #8883a5;
          font-size: 11px;
        }

        .pd-qr-information {
          min-width: 0;
        }

        .pd-qr-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 10px;
          border-radius: 20px;
          color: #239a6b;
          background: #eaf8f1;
          font-size: 9px;
          font-weight: 850;
          letter-spacing: .6px;
        }

        .pd-qr-information h3 {
          font-size: 23px;
          margin: 14px 0 5px;
          color: #292842;
        }

        .pd-qr-email {
          color: #9695a8;
          font-size: 11px;
          margin: 0 0 17px;
          overflow-wrap: anywhere;
        }

        .pd-seat-card {
          padding: 17px 19px;
          border-radius: 12px;
          background: linear-gradient(110deg, #30236f, #6552ca);
          color: white;
          margin-bottom: 18px;
        }

        .pd-seat-card span,
        .pd-seat-card strong,
        .pd-seat-card small {
          display: block;
        }

        .pd-seat-card span {
          font-size: 9px;
          color: #d8d1ff;
          letter-spacing: 1.5px;
          font-weight: 800;
        }

        .pd-seat-card strong {
          font-size: 30px;
          letter-spacing: 2px;
          margin: 7px 0;
        }

        .pd-seat-card small {
          font-size: 10px;
          color: #e1dcff;
        }

        .pd-qr-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }

        .pd-qr-details div {
          padding: 12px;
          background: #fafaff;
          border: 1px solid #f0eff7;
          border-radius: 9px;
          min-width: 0;
        }

        .pd-qr-details span,
        .pd-qr-details strong {
          display: block;
        }

        .pd-qr-details span {
          font-size: 9px;
          color: #9b99ad;
          margin-bottom: 6px;
        }

        .pd-qr-details strong {
          font-size: 11px;
          color: #39364f;
          text-transform: capitalize;
          overflow-wrap: anywhere;
        }

        .pd-download-qr {
          width: 100%;
          min-height: 47px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          background: linear-gradient(100deg, #674bd5, #4385e8);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          transition: .2s;
        }

        .pd-download-qr:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(95, 75, 200, .2);
        }

        .pd-download-qr:disabled {
          opacity: .5;
          cursor: not-allowed;
        }

        .pd-qr-note {
          color: #9695a8;
          font-size: 10px;
          line-height: 1.7;
          margin: 13px 0 0;
        }

        .pd-footer {
          padding: 25px 2px 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
        }

        .pd-footer strong,
        .pd-footer span {
          display: block;
        }

        .pd-footer strong {
          font-size: 12px;
          letter-spacing: 1px;
        }

        .pd-footer span,
        .pd-footer p {
          color: #a09fb0;
          font-size: 9px;
          margin-top: 5px;
        }

        .pd-empty {
          text-align: center;
          padding: 35px 15px;
          color: #9998aa;
        }

        .pd-empty h4 {
          color: #33334b;
          margin: 12px 0 5px;
        }

        .pd-empty p {
          font-size: 11px;
          line-height: 1.6;
        }

        .pd-error {
          padding: 13px 16px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-radius: 10px;
          background: #fff0f1;
          color: #c43f57;
          font-size: 12px;
        }

        .pd-loading-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 15px;
          background: #f5f6fc;
          color: #77738d;
          font-size: 13px;
        }

        .pd-loader {
          width: 35px;
          height: 35px;
          border: 3px solid #e7e2ff;
          border-top-color: #7054da;
          border-radius: 50%;
          animation: pd-rotate .8s linear infinite;
        }

        .pd-spin {
          animation: pd-rotate .8s linear infinite;
        }

        @keyframes pd-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        .pd-mobile-overlay {
          display: none;
        }

        @media (max-width: 1100px) {
          .pd-grid {
            grid-template-columns: 1fr;
          }

          .pd-hero-decoration {
            right: -5%;
          }
        }

        @media (max-width: 800px) {
          .pd-sidebar {
            position: fixed;
            left: -280px;
            top: 0;
            transition: left .25s ease;
          }

          .pd-sidebar-open {
            left: 0;
          }

          .pd-close-sidebar {
            display: block;
          }

          .pd-mobile-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(20, 18, 45, .4);
            z-index: 40;
          }

          .pd-menu-button {
            display: block;
          }

          .pd-content {
            padding: 23px 20px;
          }

          .pd-topbar {
            padding: 0 20px;
          }

          .pd-qr-layout {
            grid-template-columns: 220px 1fr;
            gap: 20px;
          }

          .pd-qr-details {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .pd-topbar {
            height: 72px;
          }

          .pd-topbar h1 {
            font-size: 14px;
          }

          .pd-topbar p {
            font-size: 9px;
          }

          .pd-user-profile {
            display: none;
          }

          .pd-content {
            padding: 17px 13px;
          }

          .pd-hero {
            padding: 25px 20px;
            min-height: 260px;
          }

          .pd-hero-decoration {
            opacity: .35;
            right: -180px;
          }

          .pd-hero h2 {
            font-size: 26px;
          }

          .pd-hero-content > p {
            font-size: 11px;
          }

          .pd-hero-details {
            flex-direction: column;
            gap: 11px;
          }

          .pd-stats {
            grid-template-columns: 1fr;
            gap: 10px;
          }

          .pd-stat-card {
            padding: 15px;
          }

          .pd-panel {
            padding: 17px;
          }

          .pd-details-grid {
            grid-template-columns: 1fr;
            gap: 17px;
          }

          .pd-qr-panel {
            padding: 17px;
          }

          .pd-qr-heading h2 {
            font-size: 16px;
          }

          .pd-qr-layout {
            grid-template-columns: 1fr;
          }

          .pd-qr-image-container {
            min-height: 270px;
          }

          .pd-qr-image {
            width: 210px;
          }

          .pd-qr-details {
            grid-template-columns: repeat(3, 1fr);
          }

          .pd-qr-details div {
            padding: 9px 7px;
          }

          .pd-qr-details strong {
            font-size: 9px;
          }

          .pd-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}

function XCircleIcon() {
  return <X size={18} />;
}
