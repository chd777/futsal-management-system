import React, { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";

export default function AdminLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login");
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="brand">FutsalMS Admin</div>
        <div className="nav-links">
          <NavLink to="/admin" end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin/pitches" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Manage Pitches
          </NavLink>
          <NavLink to="/admin/bookings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Bookings
          </NavLink>
          <NavLink to="/admin/revenue" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
            Revenue
          </NavLink>
          <NavLink to="/admin/closures" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
  📅 Closures
</NavLink>
        </div>
        <div className="sidebar-footer">
          <div className="muted small mb-sm">{user?.email}</div>
          <button className="btn small danger" onClick={handleLogout} style={{ width: "100%" }}>
            Logout
          </button>
        </div>
      </aside>
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
}