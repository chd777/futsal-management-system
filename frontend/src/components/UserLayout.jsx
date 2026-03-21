import ChatBot from "./ChatBot";
import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function UserLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <div className="page">
      {/* Header / Navbar */}
      <nav className="user-nav">
        <div className="nav-left">
          <div className="brand-wrap" onClick={() => nav("/home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <img src="/logo.png" alt="FutsalMS" style={{ height: 34, borderRadius: 6 }} onError={(e) => { e.target.style.display = "none"; }} />
            <span className="brand">FutsalMS</span>
          </div>
          <NavLink to="/home" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Home
          </NavLink>
          <NavLink to="/pitches" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Browse Pitches
          </NavLink>
          <NavLink to="/my-bookings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            My Bookings
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
  Profile
</NavLink>
        </div>
        <div className="nav-right">
          <a href="/profile" className="pill user-pill" style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }} onClick={(e) => { e.preventDefault(); nav("/profile"); }}>
  {(user?.profilePicture || user?.googleProfilePicture) ? (
  <img src={user.profilePicture || user.googleProfilePicture} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
  ) : (
    <span className="user-avatar">{(user?.fullName || "U")[0].toUpperCase()}</span>
  )}
  {user?.fullName || user?.email}
</a>
          <button className="btn small" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container">
        {children}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-brand">
              <img src="/logo.png" alt="FutsalMS" style={{ height: 28, borderRadius: 4 }} onError={(e) => { e.target.style.display = "none"; }} />
              <span style={{ fontWeight: 800, fontSize: 16 }}>FutsalMS</span>
            </div>
            <p className="muted small" style={{ marginTop: 6 }}>Book your perfect futsal pitch in seconds.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <NavLink to="/home">Home</NavLink>
              <NavLink to="/pitches">Browse Pitches</NavLink>
              <NavLink to="/my-bookings">My Bookings</NavLink>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <span>Kathmandu, Nepal</span>
              <span>info@futsalms.com</span>
              <span>+977 9800000000</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} FutsalMS. All rights reserved.</span>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}