import React, { useState } from "react";
import { api } from "../api/axios";
import { Link, useNavigate } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    college: "",
    acceptTerms: false
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  function update(k, v) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register", form);
      setOk(res.data.message || "Registered successfully");
      setTimeout(() => nav("/login"), 700);
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      {/* Left Side - Image */}
      <div className="auth-image" style={{ backgroundImage: "url('/register-bg.jpeg')" }}>
        <div className="auth-image-overlay">
          <div className="auth-image-content">
            <h1 className="auth-image-title">Sometimes<br />You Win &<br />Sometimes<br />You Learn</h1>
            <p className="auth-image-sub">Join the community. Start booking today.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="auth-form-side">
        <div className="auth-form-container">
          <div className="auth-logo">
  <img src="/logo.png" alt="FutsalMS" style={{ height: 40, borderRadius: 6 }} />
  <span className="auth-logo-text">FutsalMS</span>
</div>

          <h1 className="auth-title">Create Account</h1>
          <p className="muted">Register to book futsal pitches and manage your games.</p>

          {error && <div className="alert error">{error}</div>}
          {ok && <div className="alert ok">{ok}</div>}

          <form onSubmit={onSubmit} className="form" style={{ marginTop: 20 }}>
            <label>
              Full Name
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  value={form.fullName}
                  onChange={(e) => update("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="input-with-icon"
                />
              </div>
            </label>

            <label>
              Email
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Enter your email"
                  className="input-with-icon"
                />
              </div>
            </label>

            <label>
              College/University
              <div className="input-wrapper">
                <span className="input-icon">🎓</span>
                <input
                  value={form.college}
                  onChange={(e) => update("college", e.target.value)}
                  placeholder="Enter your college"
                  className="input-with-icon"
                />
              </div>
            </label>

            <div className="grid2">
              <label>
                Password
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Min 8 characters"
                    className="input-with-icon"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </label>

              <label>
                Confirm Password
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => update("confirmPassword", e.target.value)}
                    placeholder="Re-enter password"
                    className="input-with-icon"
                  />
                  <button
                    type="button"
                    className="input-toggle"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            </div>

            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => update("acceptTerms", e.target.checked)}
              />
              I agree to the Terms & Conditions
            </label>

            <button className="btn auth-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Create Account"}
            </button>

            <p className="muted" style={{ textAlign: "center" }}>
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}