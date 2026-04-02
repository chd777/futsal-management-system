import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function PublicLayout({ children }) {
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  function isActive(path) {
    return location.pathname === path;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)" }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(10px)",
          background: "rgba(11, 15, 23, 0.78)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16
          }}
        >
          <Link
            to="/"
            style={{
              textDecoration: "none",
              color: "var(--text-primary)",
              fontWeight: 800,
              fontSize: 20
            }}
          >
            ⚽ FutsalMS
          </Link>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap"
            }}
          >
            <Link
              to="/about"
              className={`btn small ${isActive("/about") || isActive("/") ? "" : "ghost"}`}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className={`btn small ${isActive("/contact") ? "" : "ghost"}`}
            >
              Contact Us
            </Link>
            <Link
              to="/login"
              className={`btn small ${isActive("/login") ? "" : "ghost"}`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className={`btn small ${isActive("/register") ? "" : "ghost"}`}
            >
              Register
            </Link>
          </nav>
        </div>
      </header>

      <main
        style={{
          maxWidth: isAuthPage ? "100%" : 1200,
          margin: "0 auto",
          padding: isAuthPage ? "0" : "20px",
          minHeight: isAuthPage ? "calc(100vh - 73px)" : "auto",
          overflow: isAuthPage ? "hidden" : "visible"
        }}
      >
        {children}
      </main>
    </div>
  );
}