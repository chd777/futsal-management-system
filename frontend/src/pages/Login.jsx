import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { api } from "../api/axios";

export default function Login() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      const meRes = await api.get("/api/auth/me");
      const role = meRes?.data?.user?.role;
      if (role === "admin") nav("/admin");
      else nav("/home");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-split">
      {/* Left Side - Image */}
      <div className="auth-image" style={{ backgroundImage: "url('/login-bg.jpeg')" }}>
        <div className="auth-image-overlay">
          <div className="auth-image-content">
            <h1 className="auth-image-title">More Than<br />A Game</h1>
            <p className="auth-image-sub">Book your perfect futsal pitch in minutes.</p>
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

          <h1 className="auth-title">Welcome Back</h1>
          <p className="muted">Sign in to access your futsal dashboard.</p>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={onSubmit} className="form" style={{ marginTop: 20 }}>
            <label>
              Email
              <div className="input-wrapper">
                <span className="input-icon">✉</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="input-with-icon"
                />
              </div>
            </label>

            <label>
              Password
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
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

            <div className="row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <a className="link" href="#" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            <button className="btn auth-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="muted" style={{ textAlign: "center" }}>
              Don't have an account? <Link to="/register">Create Account</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}