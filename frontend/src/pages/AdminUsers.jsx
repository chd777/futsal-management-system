import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";

const Icon = ({ d, size = 20, color = "currentColor", d2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const S = {
  page: { position: "relative", minHeight: "100%", paddingBottom: 48 },
  headerGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 200,
    background: "linear-gradient(135deg, rgba(14,165,233,0.07) 0%, rgba(99,102,241,0.05) 50%, rgba(0,210,150,0.03) 100%)",
    borderRadius: "0 0 24px 24px", pointerEvents: "none", zIndex: 0,
  },
  content: { position: "relative", zIndex: 1 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "rgba(14,165,233,0.08)", border: "1px solid rgba(14,165,233,0.15)",
    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700,
    color: "#0ea5e9", marginBottom: 12,
  },
  title: { fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 },
  accent: { background: "linear-gradient(135deg, #0ea5e9, #6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  back: { color: "rgba(255,255,255,0.5)", fontSize: 13, textDecoration: "none", marginBottom: 12, display: "inline-block" },
  searchBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "10px 14px", color: "#eef2f7", fontSize: 14,
    width: "100%", maxWidth: 360, marginTop: 16, marginBottom: 18,
  },
  statRow: { display: "flex", gap: 14, marginTop: 16, marginBottom: 22, flexWrap: "wrap" },
  statCard: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 14, padding: "14px 22px", minWidth: 160,
  },
  statLabel: { fontSize: 10.5, textTransform: "uppercase", letterSpacing: "1.4px", color: "rgba(255,255,255,0.4)", fontWeight: 600 },
  statValue: { fontSize: 22, fontWeight: 800, marginTop: 4, fontFamily: "'JetBrains Mono', monospace" },
  tableWrap: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18, padding: "22px 24px",
  },
  th: {
    textAlign: "left", padding: "10px 14px", fontSize: 10.5, fontWeight: 600,
    textTransform: "uppercase", letterSpacing: "1px", color: "rgba(255,255,255,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "14px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.75)",
  },
  avatar: (c) => ({
    width: 36, height: 36, borderRadius: "50%",
    background: `${c}18`, border: `1.5px solid ${c}35`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: c, flexShrink: 0,
  }),
  pill: (bg, border, color) => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    background: bg, border: `1px solid ${border}`, color, textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
};

const COLORS = ["#00d296", "#6366f1", "#0ea5e9", "#f59e0b", "#ff5b6e", "#a78bfa", "#f472b6"];
function getColor(name) { return COLORS[(name || "").charCodeAt(0) % COLORS.length]; }

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/users");
        setUsers(res.data.users || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load users. Make sure the backend endpoint /api/admin/users exists.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.fullName || "").toLowerCase().includes(q)
      || (u.email || "").toLowerCase().includes(q)
      || (u.college || "").toLowerCase().includes(q);
  });

  const adminCount = users.filter(u => u.role === "admin").length;
  const regularCount = users.length - adminCount;

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)" }}>Loading users...</div>;

  return (
    <div style={S.page}>
      <div style={S.headerGlow} />
      <div style={S.content}>

        <Link to="/admin" style={S.back}>← Back to Dashboard</Link>
        <div style={S.badge}>👥 User Management</div>
        <h1 style={S.title}>Active <span style={S.accent}>Users</span></h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>All registered users on the platform</p>

        {error && (
          <div style={{ background: "rgba(255,91,110,0.1)", border: "1px solid rgba(255,91,110,0.25)", color: "#ff5b6e", padding: 14, borderRadius: 10, marginTop: 16 }}>
            {error}
          </div>
        )}

        {/* Stats */}
        <div style={S.statRow}>
          <div style={S.statCard}>
            <div style={S.statLabel}>Total Users</div>
            <div style={S.statValue}>{users.length}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Regular Users</div>
            <div style={{ ...S.statValue, color: "#00d296" }}>{regularCount}</div>
          </div>
          <div style={S.statCard}>
            <div style={S.statLabel}>Admins</div>
            <div style={{ ...S.statValue, color: "#f59e0b" }}>{adminCount}</div>
          </div>
        </div>

        {/* Search */}
        <input
          style={S.searchBox}
          placeholder="🔍 Search by name, email, or college..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Users Table */}
        <div style={S.tableWrap}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>User</th>
                  <th style={S.th}>Email</th>
                  <th style={S.th}>College</th>
                  <th style={S.th}>Role</th>
                  <th style={S.th}>Sign-up Method</th>
                  <th style={S.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 30 }}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => {
                    const name = u.fullName || "User";
                    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                    const c = getColor(name);
                    const isGoogle = !!u.googleId;
                    return (
                      <tr key={u._id || i} style={{ transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <td style={S.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={S.avatar(c)}>{initials}</div>
                            <span style={{ fontWeight: 600 }}>{name}</span>
                          </div>
                        </td>
                        <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{u.email}</td>
                        <td style={S.td}>{u.college || "—"}</td>
                        <td style={S.td}>
                          {u.role === "admin"
                            ? <span style={S.pill("rgba(245,158,11,0.1)", "rgba(245,158,11,0.25)", "#f59e0b")}>ADMIN</span>
                            : <span style={S.pill("rgba(0,210,150,0.1)", "rgba(0,210,150,0.25)", "#00d296")}>USER</span>
                          }
                        </td>
                        <td style={S.td}>
                          {isGoogle
                            ? <span style={S.pill("rgba(99,102,241,0.1)", "rgba(99,102,241,0.25)", "#6366f1")}>GOOGLE</span>
                            : <span style={S.pill("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0.5)")}>EMAIL</span>
                          }
                        </td>
                        <td style={{ ...S.td, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{formatDate(u.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}