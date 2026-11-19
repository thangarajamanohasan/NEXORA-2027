import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase, configured } from "./lib/supabase";

type Profile = {
  id: string;
  role: "student" | "admin";
  full_name: string;
  student_id: string;
};
type Reg = {
  id: string;
  user_id: string;
  student_id: string;
  full_name: string;
  dob: string;
  nic: string;
  address: string;
  whatsapp_number: string;
  mobile_number: string;
  seat_number: string;
  status: string;
  qr_token: string;
  created_at: string;
};
type Summary = { total: number; booked: number; available: number };
const appUrl = (import.meta.env.VITE_APP_URL || window.location.origin).replace(
  /\/$/,
  "",
);
const target = new Date("2027-01-19T09:00:00+05:30").getTime();

export default function App() {
  const [user, setUser] = useState<any>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [reg, setReg] = useState<Reg | null>(null),
    [rows, setRows] = useState<Reg[]>([]),
    [summary, setSummary] = useState<Summary | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  const [f, setF] = useState({
    name: "",
    dob: "",
    nic: "",
    address: "",
    whatsapp: "",
    mobile: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [tick, setTick] = useState(Date.now()),
    [search, setSearch] = useState("");
  const token = location.pathname.match(/^\/verify\/([0-9a-f-]{36})$/i)?.[1];
  const [verified, setVerified] = useState<any>(null);
  useEffect(() => {
    const t = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!configured) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user || null));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (user) void load(user.id);
    else {
      setProfile(null);
      setReg(null);
    }
  }, [user?.id]);
  useEffect(() => {
    void summaryLoad();
  }, []);
  useEffect(() => {
    if (token && configured)
      supabase
        .rpc("verify_qr_token", { p_token: token })
        .then(({ data, error }) =>
          error ? setError(error.message) : setVerified(data),
        );
  }, [token]);
  async function summaryLoad() {
    if (!configured) return;
    const { data } = await supabase.rpc("get_seat_summary");
    if (data) setSummary(data);
  }
  async function load(uid: string) {
    const { data: p, error: e } = await supabase
      .from("profiles")
      .select("id,role,full_name,student_id")
      .eq("id", uid)
      .single();
    if (e) {
      setError(e.message);
      return;
    }
    setProfile(p);
    if (p.role === "student") {
      const { data } = await supabase
        .from("registrations")
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      setReg(data);
    } else {
      const { data } = await supabase
        .from("registrations")
        .select("*")
        .order("created_at", { ascending: false });
      setRows(data || []);
    }
    await summaryLoad();
  }
  async function login(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setBusy(false);
  }
  async function register(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    if (f.password !== f.confirm) {
      setError("Passwords do not match.");
      setBusy(false);
      return;
    }
    if (f.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      setBusy(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim().toLowerCase(),
      password: f.password,
      options: { data: { full_name: f.name.trim() } },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    if (!data.session) {
      setNotice(
        "Account created. Confirm your email, then sign in to finish registration and reserve a seat.",
      );
      setMode("login");
      setBusy(false);
      return;
    }
    const { data: booking, error: be } = await supabase.rpc(
      "complete_student_registration",
      {
        p_dob: f.dob,
        p_nic: f.nic.trim(),
        p_address: f.address.trim(),
        p_whatsapp: f.whatsapp.trim(),
        p_mobile: f.mobile.trim(),
      },
    );
    if (be) setError(be.message);
    else
      setNotice(
        `Registered: ${booking.student_id} · Seat ${booking.seat_number}`,
      );
    setF({
      name: "",
      dob: "",
      nic: "",
      address: "",
      whatsapp: "",
      mobile: "",
      email: "",
      password: "",
      confirm: "",
    });
    await load(data.user.id);
    setBusy(false);
  }
  async function completeAfterLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const { data, error } = await supabase.rpc(
      "complete_student_registration",
      {
        p_dob: f.dob,
        p_nic: f.nic.trim(),
        p_address: f.address.trim(),
        p_whatsapp: f.whatsapp.trim(),
        p_mobile: f.mobile.trim(),
      },
    );
    if (error) setError(error.message);
    else
      setNotice(
        `Registration confirmed: ${data.student_id} · Seat ${data.seat_number}`,
      );
    if (user) await load(user.id);
    setBusy(false);
  }
  async function cancel(r: Reg) {
    if (!confirm(`Cancel ${r.student_id} and release ${r.seat_number}?`))
      return;
    const { error } = await supabase.rpc("admin_cancel_registration", {
      p_registration_id: r.id,
    });
    if (error) setError(error.message);
    else {
      setNotice("Registration cancelled and seat released.");
      if (user) await load(user.id);
    }
  }
  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }
  if (!configured)
    return (
      <main className="center">
        <section className="card">
          <Logo />
          <h1>Connect Supabase</h1>
          <p>
            Copy .env.example to .env.local and add your Supabase URL and
            publishable key, then restart npm run dev.
          </p>
        </section>
      </main>
    );
  if (token)
    return (
      <main className="center">
        <section className="card verify">
          <Logo />
          {verified ? (
            <>
              <h1>Ticket verified</h1>
              <p>
                <b>Name:</b> {verified.full_name}
              </p>
              <p>
                <b>Student ID:</b> {verified.student_id}
              </p>
              <p>
                <b>Seat:</b> {verified.seat_number}
              </p>
              <p>
                <b>Status:</b> {verified.status}
              </p>
              <small>Personal contact and NIC details are not displayed.</small>
            </>
          ) : error ? (
            <p className="error">{error}</p>
          ) : (
            <p>Verifying QR…</p>
          )}
        </section>
      </main>
    );
  if (!user)
    return (
      <main className="page">
        <header>
          <Logo />
          <a href="#event">Event details</a>
        </header>
        <section className="hero">
          <small>NEXORA 2027 · IT EXHIBITION & CAREER DEVELOPMENT</small>
          <h1>
            Empowering Tomorrow's <em>Innovators.</em>
          </h1>
          <p>
            19 January 2027 · Main Hall, New Building · Thondaman Vocational
            Training Centre
          </p>
          <b>{summary?.available ?? 250} / 250 seats available</b>
        </section>
        <section className="auth">
          <div className="card">
            <h2>Account login</h2>
            <p>Student and authorised admin use the same login.</p>
            <form onSubmit={login}>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Password">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              <button disabled={busy}>
                {busy ? "Please wait…" : "Sign in"}
              </button>
            </form>
            <p className="muted">
              Admin role is assigned by the database owner, not selected here.
            </p>
          </div>
          <div className="card">
            <h2>Student registration</h2>
            <p>Create an account and reserve one of 250 seats.</p>
            <form onSubmit={register}>
              <Field label="Full name">
                <input
                  required
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </Field>
              <div className="two">
                <Field label="Date of birth">
                  <input
                    type="date"
                    required
                    value={f.dob}
                    onChange={(e) => setF({ ...f, dob: e.target.value })}
                  />
                </Field>
                <Field label="NIC">
                  <input
                    required
                    value={f.nic}
                    onChange={(e) => setF({ ...f, nic: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Address">
                <textarea
                  required
                  value={f.address}
                  onChange={(e) => setF({ ...f, address: e.target.value })}
                />
              </Field>
              <div className="two">
                <Field label="WhatsApp number">
                  <input
                    required
                    value={f.whatsapp}
                    onChange={(e) => setF({ ...f, whatsapp: e.target.value })}
                  />
                </Field>
                <Field label="Mobile number">
                  <input
                    required
                    value={f.mobile}
                    onChange={(e) => setF({ ...f, mobile: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                />
              </Field>
              <div className="two">
                <Field label="Password">
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                  />
                </Field>
                <Field label="Confirm password">
                  <input
                    type="password"
                    minLength={8}
                    required
                    value={f.confirm}
                    onChange={(e) => setF({ ...f, confirm: e.target.value })}
                  />
                </Field>
              </div>
              <button disabled={busy || summary?.available === 0}>
                {busy ? "Registering…" : "Register & reserve seat"}
              </button>
            </form>
          </div>
        </section>
        {(error || notice) && (
          <p className={error ? "alert error" : "alert"}>{error || notice}</p>
        )}
        <footer id="event">
          NEXORA 2027 · Empowering Tomorrow's Innovators.
        </footer>
      </main>
    );
  if (!profile)
    return (
      <main className="center">
        <section className="card">Loading account… {error}</section>
      </main>
    );
  const remain = Math.max(0, target - tick),
    days = Math.floor(remain / 86400000),
    hours = Math.floor((remain % 86400000) / 3600000),
    mins = Math.floor((remain % 3600000) / 60000),
    secs = Math.floor((remain % 60000) / 1000);
  if (profile.role === "admin") {
    const list = rows.filter((r) =>
      [r.full_name, r.student_id, r.nic, r.mobile_number].some((v) =>
        v.toLowerCase().includes(search.toLowerCase()),
      ),
    );
    return (
      <main className="page">
        <header>
          <Logo />
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </header>
        <h1>Admin dashboard</h1>
        <div className="stats">
          <Stat label="Total seats" n={summary?.total ?? 250} />
          <Stat label="Booked" n={summary?.booked ?? 0} />
          <Stat label="Available" n={summary?.available ?? 250} />
        </div>
        <section className="card">
          <h2>Student registrations</h2>
          <input
            placeholder="Search name / ID / NIC / mobile"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Student ID</th>
                  <th>Seat</th>
                  <th>NIC</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id}>
                    <td>{r.full_name}</td>
                    <td>{r.student_id}</td>
                    <td>{r.seat_number}</td>
                    <td>{r.nic}</td>
                    <td>{r.mobile_number}</td>
                    <td>{r.status}</td>
                    <td>
                      {r.status === "confirmed" && (
                        <button className="danger" onClick={() => cancel(r)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        {(error || notice) && <p className="alert">{error || notice}</p>}
      </main>
    );
  }
  if (!reg)
    return (
      <main className="page">
        <header>
          <Logo />
          <button className="secondary" onClick={logout}>
            Sign out
          </button>
        </header>
        <section
          className="card"
          style={{ maxWidth: 720, margin: "30px auto" }}
        >
          <h2>Complete your student registration</h2>
          <p>
            Your account is verified. Enter the remaining details to reserve one
            of the 250 seats.
          </p>
          <form onSubmit={completeAfterLogin}>
            <Field label="Date of birth">
              <input
                type="date"
                required
                value={f.dob}
                onChange={(e) => setF({ ...f, dob: e.target.value })}
              />
            </Field>
            <Field label="NIC number">
              <input
                required
                value={f.nic}
                onChange={(e) => setF({ ...f, nic: e.target.value })}
              />
            </Field>
            <Field label="Address">
              <textarea
                required
                value={f.address}
                onChange={(e) => setF({ ...f, address: e.target.value })}
              />
            </Field>
            <div className="two">
              <Field label="WhatsApp number">
                <input
                  required
                  value={f.whatsapp}
                  onChange={(e) => setF({ ...f, whatsapp: e.target.value })}
                />
              </Field>
              <Field label="Mobile number">
                <input
                  required
                  value={f.mobile}
                  onChange={(e) => setF({ ...f, mobile: e.target.value })}
                />
              </Field>
            </div>
            <button disabled={busy}>
              {busy ? "Booking seat…" : "Complete registration & reserve seat"}
            </button>
          </form>
          {(error || notice) && <p className="alert">{error || notice}</p>}
        </section>
      </main>
    );
  const qr = reg ? `${appUrl}/verify/${reg.qr_token}` : "";
  return (
    <main className="page">
      <header>
        <Logo />
        <button className="secondary" onClick={logout}>
          Sign out
        </button>
      </header>
      <h1>Welcome, {profile.full_name}</h1>
      <p className="muted">Your NEXORA 2027 student dashboard.</p>
      {reg ? (
        <section className="dashboard">
          <div className="card ticket">
            <small>OFFICIAL EVENT PASS</small>
            <h2>{reg.student_id}</h2>
            <p>Student: {reg.full_name}</p>
            <h3>Seat: {reg.seat_number}</h3>
            <QRCodeSVG value={qr} size={180} level="H" />
            <p>Show this QR at the event entrance.</p>
            <a href={qr} target="_blank">
              Open QR verification page
            </a>
          </div>
          <div className="card">
            <small>COUNTDOWN TO 19 JANUARY 2027 · 9:00 AM (SRI LANKA)</small>
            <div className="countdown">
              <Stat label="Days" n={days} />
              <Stat label="Hours" n={hours} />
              <Stat label="Minutes" n={mins} />
              <Stat label="Seconds" n={secs} />
            </div>
            <p>IT Exhibition: 9:00 AM – 11:30 AM</p>
            <p>Career Development: 12:00 PM – 4:00 PM</p>
            <p>Venue: Main Hall, New Building, TVTC</p>
          </div>
        </section>
      ) : (
        <section className="card">
          <h2>Registration incomplete</h2>
          <p>
            Your account exists, but a seat has not been allocated. Sign out and
            contact the organiser.
          </p>
        </section>
      )}
    </main>
  );
}
function Logo() {
  return (
    <div className="logo">
      <b>N</b>
      <span>
        NEXORA <i>2027</i>
        <small>EMPOWERING TOMORROW'S INNOVATORS</small>
      </span>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Stat({ label, n }: { label: string; n: number }) {
  return (
    <div className="stat">
      <small>{label}</small>
      <strong>{n}</strong>
    </div>
  );
}
