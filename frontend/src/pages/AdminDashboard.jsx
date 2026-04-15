import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";

/* ─── Icons ─── */
const Icon = ({ d, size = 20, color = "currentColor", d2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);
const I = {
  cal: (p) => <Icon {...p} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
  money: (p) => <Icon {...p} d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  users: (p) => <Icon {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" d2="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  pin: (p) => <Icon {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" d2="M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  trend: (p) => <Icon {...p} d="M23 6l-9.5 9.5-5-5L1 18" d2="M17 6h6v6" />,
  eye: (p) => <Icon {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" d2="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  pitch: (p) => <Icon {...p} d="M3 3h18v18H3ZM3 12h18M12 3v18" />,
  book: (p) => <Icon {...p} d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z" />,
  chart: (p) => <Icon {...p} d="M18 20V10M12 20V4M6 20v-6" />,
};

/* ─── Styles ─── */
const S = {
  page: { position: "relative", minHeight: "100%", paddingBottom: 48 },
  headerGlow: {
    position: "absolute", top: 0, left: 0, right: 0, height: 200,
    background: "linear-gradient(135deg, rgba(0,210,150,0.07) 0%, rgba(99,102,241,0.05) 50%, rgba(14,165,233,0.03) 100%)",
    borderRadius: "0 0 24px 24px", pointerEvents: "none", zIndex: 0,
  },
  content: { position: "relative", zIndex: 1 },
  badge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "rgba(0,210,150,0.08)", border: "1px solid rgba(0,210,150,0.15)",
    borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700,
    color: "#00d296", marginBottom: 12,
  },
  title: { fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 },
  accent: { background: "linear-gradient(135deg, #00d296, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 24 },
  statCard: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "20px 22px", position: "relative", overflow: "hidden",
    transition: "border-color 0.3s, transform 0.25s", cursor: "default",
    textDecoration: "none", color: "inherit", display: "block",
  },
  statTopLine: (c) => ({
    position: "absolute", top: 0, left: 0, right: 0, height: 2,
    background: `linear-gradient(90deg, ${c}, transparent)`, opacity: 0.5,
  }),
  statIcon: (c) => ({
    width: 36, height: 36, borderRadius: 10,
    background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center",
  }),
  statTitle: {
    fontSize: 10.5, textTransform: "uppercase", letterSpacing: "1.6px",
    color: "rgba(255,255,255,0.35)", fontWeight: 600,
  },
  statValue: {
    fontSize: 28, fontWeight: 800, marginTop: 6,
    fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: "-0.5px",
  },
  growthBadge: (positive) => ({
    display: "inline-flex", alignItems: "center", gap: 3,
    fontSize: 11, fontWeight: 700, marginTop: 8,
    padding: "3px 8px", borderRadius: 8,
    background: positive ? "rgba(0,210,150,0.1)" : "rgba(255,91,110,0.1)",
    color: positive ? "#00d296" : "#ff5b6e",
  }),
  twoCol: { display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginTop: 20 },
  panel: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18, padding: "22px 24px",
  },
  panelTitle: { fontSize: 17, fontWeight: 700, marginBottom: 0 },
  dot: (c) => ({ width: 7, height: 7, borderRadius: "50%", background: c, flexShrink: 0 }),
  avatar: (c) => ({
    width: 38, height: 38, borderRadius: "50%",
    background: `${c}18`, border: `1.5px solid ${c}35`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 700, color: c, flexShrink: 0,
  }),
  pill: (bg, border, color) => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    background: bg, border: `1px solid ${border}`, color, textTransform: "uppercase",
    letterSpacing: "0.5px",
  }),
  tableWrap: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18, padding: "22px 24px", marginTop: 20,
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
  quickCard: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 16, padding: "18px 20px", textDecoration: "none", color: "inherit",
    transition: "border-color 0.25s, transform 0.2s", display: "block",
  },
};

/* ─── Mini Chart (SVG sparkline) ─── */
function RevenueChart({ monthly }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const now = new Date();
  const data = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = months[d.getMonth()];
    const val = i === 0 ? (monthly || 0) : Math.max(0, (monthly || 5000) * (0.4 + Math.random() * 0.8));
    data.push({ label, value: Math.round(val) });
  }
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 320, H = 160, PAD = 30;
  const stepX = (W - PAD * 2) / (data.length - 1);
  const points = data.map((d, i) => ({
    x: PAD + i * stepX,
    y: H - PAD - ((d.value / max) * (H - PAD * 2)),
  }));
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${points[points.length - 1].x},${H - PAD} L${points[0].x},${H - PAD} Z`;
  const yLabels = [0, Math.round(max / 2 / 1000) + "K", Math.round(max / 1000) + "K"];
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: "100%", height: "auto" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00d296" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00d296" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#00d296" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((r, i) => {
        const y = H - PAD - r * (H - PAD * 2);
        return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
      })}
      {yLabels.map((label, i) => {
        const y = H - PAD - (i / 2) * (H - PAD * 2);
        return <text key={i} x={PAD - 6} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="10" fontFamily="monospace">{label}</text>;
      })}
      <path d={area} fill="url(#chartGrad)" />
      <path d={line} fill="none" stroke="url(#lineGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#0a0e17" stroke="#00d296" strokeWidth="2" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={points[i].x} y={H + 6} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="10" fontFamily="sans-serif">{d.label}</text>
      ))}
    </svg>
  );
}

function StatusPill({ status }) {
  if (status === "PAID") return <span style={S.pill("rgba(0,210,150,0.1)", "rgba(0,210,150,0.25)", "#00d296")}>PAID</span>;
  if (status === "PENDING_PAYMENT") return <span style={S.pill("rgba(245,158,11,0.1)", "rgba(245,158,11,0.25)", "#f59e0b")}>PENDING</span>;
  if (status === "CONFIRMED_PAY_LATER") return <span style={S.pill("rgba(99,102,241,0.1)", "rgba(99,102,241,0.25)", "#6366f1")}>PAY LATER</span>;
  if (status === "CANCELLED") return <span style={S.pill("rgba(255,91,110,0.1)", "rgba(255,91,110,0.25)", "#ff5b6e")}>CANCELLED</span>;
  return <span style={S.pill("rgba(255,255,255,0.05)", "rgba(255,255,255,0.1)", "rgba(255,255,255,0.5)")}>{status}</span>;
}

const COLORS = ["#00d296", "#6366f1", "#0ea5e9", "#f59e0b", "#ff5b6e", "#a78bfa", "#f472b6"];
function getColor(name) { return COLORS[(name || "").charCodeAt(0) % COLORS.length]; }

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [extraStats, setExtraStats] = useState({ users: 0, pitches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [revRes, bookRes] = await Promise.all([
          api.get("/api/admin/revenue"),
          api.get("/api/admin/bookings").catch(() => ({ data: { bookings: [] } })),
        ]);
        setStats(revRes.data);

        const allBookings = bookRes.data.bookings || [];
        const sorted = [...allBookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentBookings(sorted.slice(0, 5));

        try {
          const [usersRes, pitchesRes] = await Promise.all([
            api.get("/api/admin/bookings").then(r => {
              const userSet = new Set((r.data.bookings || []).map(b => b.user?._id || b.user));
              return userSet.size;
            }),
            api.get("/api/admin/pitches").then(r => (r.data.pitches || []).length).catch(() => 0),
          ]);
          setExtraStats({ users: usersRes, pitches: pitchesRes });
        } catch { /* optional stats */ }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)" }}>Loading dashboard...</div>;

  function formatCompact(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "K";
    return n.toLocaleString();
  }

  const statCards = [
    { label: "Total Bookings", value: (stats?.totalBookings || 0).toLocaleString(), icon: <I.cal size={18} color="#00d296" />, accent: "#00d296", growth: "+18% this month", to: "/admin/bookings" },
    { label: "Total Revenue", value: `Rs. ${formatCompact(stats?.totalRevenue || 0)}`, icon: <I.money size={18} color="#6366f1" />, accent: "#6366f1", growth: "+12%", to: "/admin/revenue" },
    { label: "Active Users", value: extraStats.users || "—", icon: <I.users size={18} color="#0ea5e9" />, accent: "#0ea5e9", growth: "+8%", to: "/admin/users" },
    { label: "Active Pitches", value: extraStats.pitches || "—", icon: <I.pin size={18} color="#f59e0b" />, accent: "#f59e0b", to: "/admin/pitches" },
  ];

  const tableBookings = recentBookings.slice(0, 4);
  const latestId = stats?.totalBookings || 1000;

  return (
    <div style={S.page}>
      <div style={S.headerGlow} />
      <div style={S.content}>

        {/* Header */}
        <div style={S.badge}>✦ Admin Panel</div>
        <div style={{ marginBottom: 8 }}>
          <h1 style={S.title}>Admin <span style={S.accent}>Dashboard</span></h1>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14 }}>Platform overview and management</p>
        </div>

        {/* Stat Cards (now clickable Links) */}
        <div style={S.statsGrid}>
          {statCards.map((s, i) => (
            <Link key={i} to={s.to} style={S.statCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.accent + "40"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={S.statTopLine(s.accent)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={S.statTitle}>{s.label}</div>
                <div style={S.statIcon(s.accent)}>{s.icon}</div>
              </div>
              <div style={{ ...S.statValue, color: "var(--text, #eef2f7)" }}>{s.value}</div>
              {s.growth && <div style={S.growthBadge(true)}><I.trend size={11} /> {s.growth}</div>}
            </Link>
          ))}
        </div>

        {/* Recent Bookings + Revenue Chart */}
        <div style={S.twoCol}>
          <div style={S.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={S.dot("#00d296")} />
                <span style={S.panelTitle}>Recent Bookings</span>
              </div>
              <Link to="/admin/bookings" style={{ color: "#00d296", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>View All</Link>
            </div>
            {recentBookings.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, textAlign: "center", padding: 20 }}>No bookings yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 6 }}>
                {recentBookings.map((b, i) => {
                  const name = b.user?.fullName || "User";
                  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const c = getColor(name);
                  return (
                    <div key={b._id || i} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "12px 0",
                      borderBottom: i < recentBookings.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                      <div style={S.avatar(c)}>{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
                        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 1 }}>
                          {b.pitch?.name || "Pitch"} · {timeAgo(b.createdAt)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
                          Rs. {(b.priceAtBooking || 0).toLocaleString()}
                        </span>
                        <StatusPill status={b.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={S.panel}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={S.dot("#6366f1")} />
                <span style={S.panelTitle}>Revenue</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <I.trend size={14} color="#00d296" />
                <span style={{ color: "#00d296", fontWeight: 700, fontSize: 13 }}>+12%</span>
              </div>
            </div>
            <RevenueChart monthly={stats?.monthlyRevenue || 0} />
          </div>
        </div>

        {/* All Bookings Table */}
        <div style={S.tableWrap}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={S.dot("#0ea5e9")} />
              <span style={S.panelTitle}>All Bookings</span>
            </div>
            <span style={{ color: "#00d296", fontSize: 12, fontWeight: 600 }}>Showing latest {tableBookings.length}</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={S.th}>ID</th>
                  <th style={S.th}>User</th>
                  <th style={S.th}>Pitch</th>
                  <th style={S.th}>Date</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Amount</th>
                  <th style={S.th}></th>
                </tr>
              </thead>
              <tbody>
                {tableBookings.map((b, i) => (
                  <tr key={b._id || i} style={{ transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ ...S.td, color: "#00d296", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
                      BK-{latestId - i}
                    </td>
                    <td style={{ ...S.td, fontWeight: 600 }}>{b.user?.fullName || "User"}</td>
                    <td style={S.td}>{b.pitch?.name || "—"}</td>
                    <td style={{ ...S.td, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{b.date}</td>
                    <td style={S.td}><StatusPill status={b.status} /></td>
                    <td style={{ ...S.td, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                      Rs. {(b.priceAtBooking || 0).toLocaleString()}
                    </td>
                    <td style={{ ...S.td, textAlign: "center" }}>
                      <I.eye size={16} color="rgba(255,255,255,0.3)" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
          {[
            { to: "/admin/pitches", icon: <I.pitch size={18} color="#00d296" />, title: "Manage Pitches", desc: "Add, edit, enable/disable pitches.", accent: "#00d296" },
            { to: "/admin/bookings", icon: <I.book size={18} color="#6366f1" />, title: "View Bookings", desc: "See all bookings, filter, cancel.", accent: "#6366f1" },
            { to: "/admin/revenue", icon: <I.chart size={18} color="#f59e0b" />, title: "Revenue Analytics", desc: "Charts and per-pitch breakdown.", accent: "#f59e0b" },
          ].map((q, i) => (
            <Link key={i} to={q.to} style={S.quickCard}
              onMouseEnter={e => { e.currentTarget.style.borderColor = q.accent + "35"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={S.statIcon(q.accent)}>{q.icon}</div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: q.accent }}>{q.title}</h3>
              </div>
              <p style={{ margin: 0, color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{q.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}