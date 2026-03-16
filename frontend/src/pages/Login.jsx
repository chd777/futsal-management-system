import React, { useContext, useState, useEffect } from "react";
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

  // Initialize Google Sign-In
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-login-btn"),
          {
            theme: "filled_black",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "pill"
          }
        );
      }
    };
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  async function handleGoogleResponse(response) {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/google", {
        credential: response.credential
      });
      const tk = res.data.token;
      const user = res.data.user;

      // Save token
      localStorage.setItem("futsal_token", tk);
      api.defaults.headers.common.Authorization = `Bearer ${tk}`;

      // Redirect based on role
      if (user.role === "admin") nav("/admin");
      else nav("/home");

      // Force reload to update AuthContext
      window.location.reload();
    } catch (err) {
      setError(err?.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  }

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
            <p className="auth-image-sub">Book your perfect futsal pitch in seconds.</p>
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

          {/* Google Login Button */}
          <div style={{ marginTop: 20 }}>
            <div id="google-login-btn" style={{ display: "flex", justifyContent: "center" }}></div>
          </div>

          {/* Divider */}
          <div className="auth-divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={onSubmit} className="form" style={{ marginTop: 0 }}>
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