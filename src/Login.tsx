
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
} from "lucide-react";
import { supabase } from "./lib/supabase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // STEP 1: Authenticate user
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        console.error("Authentication Error:", loginError);
        throw new Error(loginError.message);
      }

      if (!data.user) {
        throw new Error("Unable to identify your account.");
      }

      console.log("Login successful:", data.user.id);

      // STEP 2: Fetch user profile
      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", data.user.id)
          .maybeSingle();

      if (profileError) {
        console.error("Profile Fetch Error:", profileError);
        throw new Error(
          `Profile error: ${profileError.message}`
        );
      }

      // STEP 3: Check profile availability
      if (!profile) {
        throw new Error(
          "Your account exists, but your NEXORA profile was not found. Please contact the administrator."
        );
      }

      console.log("Profile:", profile);

      // STEP 4: Redirect based on role
      if (profile.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (profile.role === "participant") {
        navigate("/participant/dashboard", { replace: true });
      } else {
        throw new Error(
          "Invalid account role. Please contact the administrator."
        );
      }

    } catch (err: unknown) {
      console.error("Complete Login Error:", err);

      const message =
        err instanceof Error
          ? err.message
          : "An unexpected login error occurred.";

      setError(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: 'DM Sans', sans-serif;
          background: #07091a;
        }

        .auth-page {
          min-height: 100vh;
          padding: 30px 18px;
          display: grid;
          place-items: center;
          color: white;
          background:
            radial-gradient(ellipse at 15% 15%, #34277b66, transparent 45%),
            radial-gradient(ellipse at 90% 80%, #0066aa44, transparent 40%),
            #07091a;
        }

        .auth-wrap {
          width: 100%;
          max-width: 460px;
        }

        .auth-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 28px;
        }

        .auth-logo {
          font: 700 24px 'Space Grotesk';
          letter-spacing: 1px;
        }

        .auth-logo span {
          color: #9c89ff;
        }

        .auth-back {
          color: #c5c8df;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 13px;
        }

        .auth-back:hover {
          color: white;
        }

        .auth-card {
          padding: 36px;
          border-radius: 22px;
          background: #11142de8;
          border: 1px solid #968cff44;
          box-shadow: 0 25px 80px #0007;
        }

        .auth-tag {
          color: #b8aaff;
          font-size: 11px;
          letter-spacing: 1.5px;
          font-weight: 700;
        }

        .auth-card h1 {
          font: 700 35px 'Space Grotesk';
          margin: 12px 0 8px;
        }

        .auth-card h1 span {
          color: #9c89ff;
        }

        .auth-desc {
          color: #a4a8c1;
          font-size: 14px;
          line-height: 1.7;
          margin-bottom: 27px;
        }

        .auth-field {
          margin-bottom: 18px;
        }

        .auth-field label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 9px;
          color: #dfe1f1;
        }

        .auth-input {
          position: relative;
        }

        .auth-input svg {
          position: absolute;
          top: 50%;
          left: 14px;
          transform: translateY(-50%);
          color: #858ba9;
          pointer-events: none;
        }

        .auth-input input {
          width: 100%;
          padding: 14px 14px 14px 43px;
          border: 1px solid #ffffff20;
          border-radius: 10px;
          outline: none;
          background: #0d1028;
          color: white;
          font: inherit;
          transition: .2s;
        }

        .auth-input input:focus {
          border-color: #8b78ff;
          box-shadow: 0 0 0 3px #8b78ff20;
        }

        .auth-submit {
          width: 100%;
          border: 0;
          border-radius: 10px;
          padding: 15px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          background: linear-gradient(100deg, #7357f5, #268ce9);
          color: white;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: .2s;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px #7357f555;
        }

        .auth-submit:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .auth-error {
          background: #ff465a18;
          border: 1px solid #ff465a55;
          color: #ff9ba8;
          border-radius: 9px;
          padding: 12px;
          font-size: 13px;
          line-height: 1.6;
          margin: 16px 0;
          overflow-wrap: anywhere;
        }

        .auth-foot {
          color: #9298b5;
          text-align: center;
          font-size: 13px;
          margin-top: 23px;
        }

        .auth-foot a {
          color: #a99aff;
          text-decoration: none;
          font-weight: 700;
        }

        .auth-foot a:hover {
          color: white;
        }

        @media(max-width: 500px) {
          .auth-card {
            padding: 26px 20px;
          }

          .auth-card h1 {
            font-size: 30px;
          }
        }
      `}</style>

      <div className="auth-wrap">

        {/* Header */}
        <div className="auth-top">
          <div className="auth-logo">
            NEXORA<span> 2027</span>
          </div>

          <Link to="/" className="auth-back">
            <ArrowLeft size={15} />
            Home
          </Link>
        </div>

        {/* Login Card */}
        <section className="auth-card">

          <div className="auth-tag">
            ADMIN & PARTICIPANT ACCESS
          </div>

          <h1>
            Welcome <span>Back.</span>
          </h1>

          <p className="auth-desc">
            Sign in with your registered account to access
            your NEXORA 2027 dashboard.
          </p>

          <form onSubmit={handleLogin}>

            {/* Email */}
            <div className="auth-field">
              <label htmlFor="login-email">
                Email Address
              </label>

              <div className="auth-input">
                <Mail size={17} />

                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="login-password">
                Password
              </label>

              <div className="auth-input">
                <LockKeyhole size={17} />

                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Login to Dashboard"}

              {!loading && <ArrowRight size={18} />}
            </button>

          </form>

          {/* Register Link */}
          <div className="auth-foot">
            Don't have an account?{" "}
            <Link to="/register">
              Register here
            </Link>
          </div>

        </section>
      </div>
    </main>
  );
}
