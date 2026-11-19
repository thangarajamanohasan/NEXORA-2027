import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  MapPin,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    age: "",
    institution: "",
    participant_type: "",
    interest: "",
    password: "",
    confirm_password: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("Password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const email = form.email.trim().toLowerCase();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!data.user) throw new Error("Account creation failed.");

      // Email confirmation must be disabled for immediate registration
      // and database insertion using the new authenticated session.
      if (!data.session) {
        throw new Error(
          "Account created, but email confirmation is required. Please confirm your email, then log in. If you want immediate registration, disable email confirmations in Supabase Authentication settings.",
        );
      }

      const { error: registrationError } = await supabase
        .from("registrations")
        .insert({
          user_id: data.user.id,
          full_name: form.full_name.trim(),
          email,
          phone: form.phone.trim(),
          age: Number(form.age),
          institution: form.institution.trim() || null,
          participant_type: form.participant_type,
          interest: form.interest,
          event_name: "NEXORA 2027",
          registration_status: "Pending",
        });

      if (registrationError) throw registrationError;

      await supabase.auth.signOut();
      navigate("/login", {
        replace: true,
        state: { registered: true, email },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reg-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #07091a; font-family: 'DM Sans',sans-serif; }
        .reg-page { min-height: 100vh; padding: 30px 18px 55px; color: white; background: radial-gradient(ellipse at 15% 15%,#4c37d233,transparent 45%),radial-gradient(ellipse at 90% 80%,#009bff22,transparent 40%),#07091a; }
        .reg-container { max-width: 850px; margin: auto; }
        .reg-top { display:flex;justify-content:space-between;align-items:center;margin-bottom:32px; }
        .reg-logo { font:700 25px 'Space Grotesk';letter-spacing:1px; }
        .reg-logo span { color:#9c89ff; }
        .reg-back { color:#c5c8df;text-decoration:none;display:flex;align-items:center;gap:8px;font-size:14px; }
        .reg-heading { text-align:center;margin-bottom:28px; }
        .reg-tag { display:inline-block;padding:8px 15px;border:1px solid #8b78ff66;border-radius:30px;color:#b8aaff;font-size:11px;font-weight:700;letter-spacing:1.5px; }
        .reg-heading h1 { font:700 clamp(32px,6vw,46px) 'Space Grotesk';margin:17px 0 10px; }
        .reg-heading h1 span { background:linear-gradient(90deg,#a18cff,#49baff);background-clip:text;color:transparent; }
        .reg-heading p { color:#a4a8c1;font-size:14px;line-height:1.7; }
        .reg-info { display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px; }
        .reg-info div { display:flex;align-items:center;gap:12px;padding:15px;background:#ffffff0b;border:1px solid #ffffff17;border-radius:12px;color:#c5c8df;font-size:13px; }
        .reg-info svg { color:#9d8aff;flex-shrink:0; }
        .reg-card { padding:34px;background:#11142de8;border:1px solid #968cff33;border-radius:20px;box-shadow:0 25px 80px #0005; }
        .reg-card h2 { font:600 21px 'Space Grotesk';margin:0 0 8px; }
        .reg-description { color:#9298b5;font-size:13px;margin:0 0 25px; }
        .reg-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:18px; }
        .reg-field { display:flex;flex-direction:column;gap:8px; }
        .reg-field.full { grid-column:1/-1; }
        .reg-field label { color:#dfe1f1;font-size:13px;font-weight:600; }
        .reg-input { position:relative; }
        .reg-input svg { position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#858ba9;pointer-events:none; }
        .reg-field input,.reg-field select { width:100%;padding:14px;border:1px solid #ffffff20;border-radius:10px;outline:none;background:#0d1028;color:white;font:14px 'DM Sans'; }
        .reg-input input { padding-left:43px; }
        .reg-field select option { background:#0d1028; }
        .reg-field input:focus,.reg-field select:focus { border-color:#8b78ff;box-shadow:0 0 0 3px #8b78ff20; }
        .reg-field input::placeholder { color:#656b89; }
        .reg-submit { width:100%;display:flex;justify-content:center;align-items:center;gap:10px;padding:16px;margin-top:25px;border:0;border-radius:10px;background:linear-gradient(100deg,#7357f5,#268ce9);color:white;font-weight:700;font-size:15px;cursor:pointer; }
        .reg-submit:disabled { opacity:.6;cursor:not-allowed; }
        .reg-error { margin-top:18px;padding:13px;border-radius:9px;background:#ff465a18;border:1px solid #ff465a55;color:#ff9ba8;font-size:13px;line-height:1.6; }
        .reg-footer { text-align:center;color:#727895;font-size:12px;margin-top:25px; }
        .reg-login { text-align:center;color:#9298b5;font-size:13px;margin-top:20px; }
        .reg-login a { color:#a99aff;text-decoration:none;font-weight:700; }
        @media(max-width:600px) { .reg-page{padding:22px 14px 40px}.reg-card{padding:23px 18px}.reg-grid,.reg-info{grid-template-columns:1fr}.reg-field.full{grid-column:auto}.reg-heading h1{font-size:33px} }
      `}</style>

      <div className="reg-container">
        <div className="reg-top">
          <div className="reg-logo">
            NEXORA<span> 2027</span>
          </div>
          <Link to="/" className="reg-back">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <header className="reg-heading">
          <div className="reg-tag">PARTICIPANT REGISTRATION</div>
          <h1>
            Be Part of <span>NEXORA 2027</span>
          </h1>
          <p>
            Register and take your first step towards discovering opportunities
            in Information Technology.
          </p>
        </header>

        <div className="reg-info">
          <div>
            <CalendarDays size={19} />
            19 January 2027
          </div>
          <div>
            <MapPin size={19} />
            Thondaman Vocational Training Centre
          </div>
        </div>

        <section className="reg-card">
          <h2>Participant Information</h2>
          <p className="reg-description">
            Complete your details and create your participant login account.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="reg-grid">
              <div className="reg-field full">
                <label>Full Name *</label>
                <div className="reg-input">
                  <User size={17} />
                  <input
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div className="reg-field">
                <label>Email Address *</label>
                <div className="reg-input">
                  <Mail size={17} />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              <div className="reg-field">
                <label>Contact Number *</label>
                <div className="reg-input">
                  <Phone size={17} />
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="07XXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="reg-field">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  min="10"
                  max="100"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  required
                />
              </div>

              <div className="reg-field">
                <label>Participant Category *</label>
                <select
                  name="participant_type"
                  value={form.participant_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category</option>
                  <option>School Leaver</option>
                  <option>University Student</option>
                  <option>Vocational Student</option>
                  <option>Job Seeker</option>
                  <option>Working Professional</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="reg-field full">
                <label>Institution / Organization</label>
                <div className="reg-input">
                  <Building2 size={17} />
                  <input
                    name="institution"
                    value={form.institution}
                    onChange={handleChange}
                    placeholder="School, university or organization"
                  />
                </div>
              </div>

              <div className="reg-field full">
                <label>Area of Interest *</label>
                <select
                  name="interest"
                  value={form.interest}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select your area of interest</option>
                  <option>Software Development</option>
                  <option>Web Development</option>
                  <option>Cyber Security</option>
                  <option>Networking</option>
                  <option>Artificial Intelligence</option>
                  <option>Data Science</option>
                  <option>UI/UX Design</option>
                  <option>IT Career Guidance</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="reg-field">
                <label>Create Password *</label>
                <div className="reg-input">
                  <LockKeyhole size={17} />
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              <div className="reg-field">
                <label>Confirm Password *</label>
                <div className="reg-input">
                  <LockKeyhole size={17} />
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && <div className="reg-error">{error}</div>}

            <button className="reg-submit" type="submit" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account & Register"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="reg-login">
            Already registered? <Link to="/login">Login here</Link>
          </div>
        </section>

        <div className="reg-footer">
          NEXORA 2027 · Empowering Tomorrow's Innovators.
        </div>
      </div>
    </main>
  );
}
