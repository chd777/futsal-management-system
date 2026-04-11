import React, { useEffect, useState, useContext } from "react";
import { api } from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

/* ─── icons ─── */
const Icon = ({ d, size = 18, color = "currentColor" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);
const Icons = {
  user: (p) => <Icon {...p} d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM4 20c0-4 3.6-7 8-7s8 3 8 7" />,
  mail: (p) => <Icon {...p} d="M3 7l9 6 9-6M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2Z" />,
  school: (p) => <Icon {...p} d="M12 3L1 9l11 6 9-4.91V17M5 13.18v4L12 21l7-3.82v-4" />,
  shield: (p) => <Icon {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />,
  calendar: (p) => <Icon {...p} d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />,
  edit: (p) => <Icon {...p} d="M17 3l4 4L7 21H3v-4L17 3Z" />,
  check: (p) => <Icon {...p} d="M5 13l4 4L19 7" />,
  x: (p) => <Icon {...p} d="M18 6L6 18M6 6l12 12" />,
  camera: (p) => <Icon {...p} d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2ZM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />,
  game: (p) => <Icon {...p} d="M6 11h4M8 9v4M15 12h.01M18 10h.01M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1.4 0 2.1-1 2.5-2l.96-2h7.08l.96 2c.4 1 1.1 2 2.5 2a3 3 0 0 0 3-3c0-1.544-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.152A4 4 0 0 0 17.32 5Z" />,
  money: (p) => <Icon {...p} d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  trash: (p) => <Icon {...p} d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />,
};

/* ─── styles ─── */
const S = {
  page: { position: "relative", minHeight: "100%", padding: "0 0 48px" },
  headerGradient: {
    position: "absolute", top: 0, left: 0, right: 0, height: 180,
    background: "linear-gradient(135deg, rgba(0,210,150,0.08) 0%, rgba(99,102,241,0.06) 50%, rgba(14,165,233,0.04) 100%)",
    borderRadius: "0 0 24px 24px", pointerEvents: "none", zIndex: 0,
  },
  content: { position: "relative", zIndex: 1 },
  title: { fontSize: 26, fontWeight: 700, letterSpacing: "-0.4px", marginBottom: 4 },
  accent: { background: "linear-gradient(135deg, #00d296, #0ea5e9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" },
  heroCard: {
    background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 20, padding: "28px 32px", marginTop: 24, marginBottom: 20,
    display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
    position: "relative", overflow: "hidden",
  },
  heroGlow: {
    position: "absolute", top: -40, right: -40, width: 160, height: 160,
    background: "radial-gradient(circle, rgba(0,210,150,0.1), transparent 70%)", pointerEvents: "none",
  },
  avatar: { width: 84, height: 84, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(0,210,150,0.4)", boxShadow: "0 0 24px rgba(0,210,150,0.15)" },
  avatarFallback: {
    width: 84, height: 84, borderRadius: "50%",
    background: "linear-gradient(135deg, rgba(0,210,150,0.15), rgba(14,165,233,0.15))",
    border: "3px solid rgba(0,210,150,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 34, fontWeight: 800, color: "#00d296", flexShrink: 0,
    boxShadow: "0 0 24px rgba(0,210,150,0.12)",
  },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
    borderRadius: "50%", background: "linear-gradient(135deg, #00d296, #0ea5e9)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2.5px solid var(--bg, #0a0e17)", cursor: "pointer",
  },
  heroName: { fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px", marginBottom: 2 },
  heroEmail: { color: "rgba(255,255,255,0.4)", fontSize: 13.5, marginBottom: 4 },
  googleBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "linear-gradient(135deg, rgba(0,210,150,0.12), rgba(14,165,233,0.12))",
    border: "1px solid rgba(0,210,150,0.25)", color: "#00d296",
    fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20,
    textTransform: "uppercase", letterSpacing: "0.8px",
  },
  removeBadge: {
    display: "inline-flex", alignItems: "center", gap: 5,
    background: "rgba(255,91,110,0.08)", border: "1px solid rgba(255,91,110,0.2)",
    color: "var(--danger, #ff5b6e)", fontSize: 11, fontWeight: 600,
    padding: "3px 12px", borderRadius: 20, cursor: "pointer",
  },
  statsRow: { display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: 120, background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16,
    padding: "22px 18px", textAlign: "center", position: "relative",
    overflow: "hidden", transition: "border-color 0.3s, transform 0.25s", cursor: "default",
  },
  statTopLine: (accent) => ({
    position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
    width: 60, height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.5,
  }),
  statValue: (accent) => ({
    fontSize: 26, fontWeight: 700, color: accent, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, marginTop: 8,
  }),
  statLabel: {
    fontSize: 10.5, textTransform: "uppercase", letterSpacing: "1.8px",
    color: "rgba(255,255,255,0.3)", marginTop: 8, fontWeight: 600,
  },
  twoCol: { display: "flex", gap: 20, flexWrap: "wrap" },
  leftPanel: {
    flex: "1.3", minWidth: 300, background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: "28px",
  },
  rightCol: { flex: "0.7", minWidth: 240, display: "flex", flexDirection: "column", gap: 16 },
  sidePanel: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 18, padding: "22px 24px",
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 },
  dot: (color) => ({ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }),
  fieldRow: { display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 14 },
  fieldGroup: { flex: 1, minWidth: 200 },
  fieldLabel: {
    fontSize: 10.5, textTransform: "uppercase", letterSpacing: "1.4px",
    color: "rgba(255,255,255,0.3)", marginBottom: 6, fontWeight: 600,
    display: "flex", alignItems: "center", gap: 6,
  },
  fieldValue: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: "12px 16px", fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500,
  },
  bookingRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  bookingLabel: { color: "rgba(255,255,255,0.45)", fontSize: 13.5 },
  bookingValue: (color) => ({ color: color || "#fff", fontSize: 17, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }),
  editBtn: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "9px 20px", color: "rgba(255,255,255,0.7)",
    fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s",
    display: "inline-flex", alignItems: "center", gap: 6,
  },
  saveBtn: {
    width: "100%", padding: "13px 24px", borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #00d296, #0ea5e9)", color: "#0a0e17",
    fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.3px",
    transition: "all 0.3s", boxShadow: "0 4px 20px rgba(0,210,150,0.18)",
  },
  input: {
    width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "12px 16px", fontSize: 14, color: "#fff",
    outline: "none", transition: "border-color 0.3s", fontFamily: "inherit", boxSizing: "border-box",
  },
  inputLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 600, display: "block" },
  alertOk: {
    background: "rgba(0,210,150,0.08)", border: "1px solid rgba(0,210,150,0.2)",
    color: "#00d296", borderRadius: 12, padding: "12px 18px", fontSize: 13,
    fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
  },
  alertErr: {
    background: "rgba(255,91,110,0.08)", border: "1px solid rgba(255,91,110,0.2)",
    color: "#ff5b6e", borderRadius: 12, padding: "12px 18px", fontSize: 13,
    fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
  },
  btnRow: { display: "flex", gap: 10, marginTop: 18 },
  ghostBtn: {
    background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "9px 20px", color: "rgba(255,255,255,0.5)",
    fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
  },
  passwordToggle: {
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "6px 14px", color: "rgba(255,255,255,0.5)",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
  },
};

/* ─── stat card ─── */
function StatCard({ icon, value, label, accent }) {
  const [h, setH] = useState(false);
  return (
    <div style={{ ...S.statCard, borderColor: h ? accent + "40" : "rgba(255,255,255,0.06)", transform: h ? "translateY(-3px)" : "none" }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>
      <div style={S.statTopLine(accent)} />
      <div style={{ opacity: 0.55, marginBottom: 2 }}>{icon}</div>
      <div style={S.statValue(accent)}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

/* ─── field display ─── */
function InfoField({ label, icon, value }) {
  return (
    <div style={S.fieldGroup}>
      <div style={S.fieldLabel}>{icon}{label}</div>
      <div style={S.fieldValue}>{value || "Not specified"}</div>
    </div>
  );
}

/* ─── group bookings ─── */
function groupBookings(bookings) {
  const map = new Map();
  for (const b of bookings) { const key = b.bookingGroup || b._id; if (!map.has(key)) map.set(key, []); map.get(key).push(b); }
  return Array.from(map.values()).map((items) => {
    const first = items[0];
    const totalPrice = items.reduce((sum, b) => sum + Number(b.priceAtBooking || 0), 0);
    return { status: first.status, date: first.date, isLoyaltyReward: first.isLoyaltyReward, priceAtBooking: totalPrice };
  });
}

/* ─── main ─── */
export default function Profile() {
  const { user: authUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: "", college: "" });
  const [editMsg, setEditMsg] = useState("");
  const [editErr, setEditErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
  const [passMsg, setPassMsg] = useState("");
  const [passErr, setPassErr] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [stats, setStats] = useState({ total: 0, paid: 0, upcoming: 0, totalSpent: 0 });

  async function loadProfile() {
    setLoading(true);
    try {
      const [profRes, bookRes] = await Promise.all([api.get("/api/profile"), api.get("/api/bookings/my")]);
      const user = profRes.data.user;
      setProfile(user);
      setEditForm({ fullName: user.fullName, college: user.college || "" });
      const rawBookings = bookRes.data.bookings || [];
      const today = new Date().toISOString().slice(0, 10);
      const grouped = groupBookings(rawBookings);
      const paidGroups = grouped.filter(g => g.status === "PAID" || g.status === "CONFIRMED_PAY_LATER");
      const totalSpent = rawBookings.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER").reduce((sum, b) => sum + (b.priceAtBooking || 0), 0);
      setStats({ total: grouped.length, paid: paidGroups.length, upcoming: grouped.filter(g => g.date >= today && g.status !== "CANCELLED").length, totalSpent });
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }
  useEffect(() => { loadProfile(); }, []);

  async function saveProfile(e) {
    e.preventDefault(); setEditErr(""); setEditMsg(""); setSaving(true);
    try { const res = await api.put("/api/profile", editForm); setProfile(res.data.user); setEditMsg("Profile updated successfully!"); setEditing(false); setTimeout(() => setEditMsg(""), 3000); }
    catch (err) { setEditErr(err?.response?.data?.message || "Update failed"); } finally { setSaving(false); }
  }
  async function handlePhotoUpload(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Photo must be under 5MB"); return; }
    setPhotoUploading(true);
    try { const fd = new FormData(); fd.append("photo", file); const res = await api.put("/api/profile/photo", fd, { headers: { "Content-Type": "multipart/form-data" } }); setProfile(prev => ({ ...prev, profilePicture: res.data.profilePicture })); }
    catch (err) { alert(err?.response?.data?.message || "Photo upload failed"); } finally { setPhotoUploading(false); e.target.value = ""; }
  }
  async function removePhoto() {
    if (!confirm("Remove uploaded photo and use default?")) return;
    try { await api.delete("/api/profile/photo"); const res = await api.get("/api/profile"); setProfile(res.data.user); } catch { alert("Failed to remove photo"); }
  }
  async function changePassword(e) {
    e.preventDefault(); setPassErr(""); setPassMsg(""); setPassLoading(true);
    try { const res = await api.put("/api/profile/password", passForm); setPassMsg(res.data.message || "Password changed!"); setPassForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" }); setShowPassword(false); setTimeout(() => setPassMsg(""), 3000); }
    catch (err) { setPassErr(err?.response?.data?.message || "Password change failed"); } finally { setPassLoading(false); }
  }

  if (loading) return <div className="loading-spinner">Loading profile...</div>;
  if (!profile) return <div className="empty-state">Profile not found.</div>;

  const isGoogleUser = !!profile.googleId;
  const initial = (profile.fullName || "U")[0].toUpperCase();
  function formatSpent(a) { if (a >= 1000) { const k = a / 1000; return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`; } return a.toLocaleString(); }

  return (
    <div style={S.page}>
      <div style={S.headerGradient} />
      <div style={S.content}>
        <h1 style={S.title}>My <span style={S.accent}>Profile</span></h1>
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>View and manage your account settings</p>

        {editMsg && <div style={{ ...S.alertOk, marginTop: 16 }}><Icons.check size={16} color="#00d296" />{editMsg}</div>}
        {passMsg && <div style={{ ...S.alertOk, marginTop: 16 }}><Icons.check size={16} color="#00d296" />{passMsg}</div>}

        {/* Hero Card */}
        <div style={S.heroCard}>
          <div style={S.heroGlow} />
          <div style={{ position: "relative", flexShrink: 0 }}>
            {(profile.profilePicture || profile.googleProfilePicture) ? (
              <img src={profile.profilePicture || profile.googleProfilePicture} alt="Profile" style={S.avatar} />
            ) : (
              <div style={S.avatarFallback}>{initial}</div>
            )}
            <label style={S.cameraBadge}>
              {photoUploading ? <span style={{ fontSize: 10, color: "#0a0e17" }}>...</span> : <Icons.camera size={13} color="#0a0e17" />}
              <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: "none" }} disabled={photoUploading} />
            </label>
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <h2 style={S.heroName}>{profile.fullName}</h2>
            <p style={S.heroEmail}>{profile.email}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {isGoogleUser && <span style={S.googleBadge}>G Google Account</span>}
              {profile.profilePicture && profile.cloudinaryId && (
                <button onClick={removePhoto} style={S.removeBadge}><Icons.trash size={12} /> Remove Photo</button>
              )}
            </div>
          </div>
          {!editing && (
            <button style={S.editBtn} onClick={() => setEditing(true)}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,210,150,0.08)"; e.currentTarget.style.borderColor = "rgba(0,210,150,0.25)"; e.currentTarget.style.color = "#00d296"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}>
              <Icons.edit size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* Stats */}
        <div style={S.statsRow}>
          <StatCard icon={<Icons.game size={20} color="#00d296" />} value={stats.total} label="Total Bookings" accent="#00d296" />
          <StatCard icon={<Icons.check size={20} color="#6366f1" />} value={stats.paid} label="Completed" accent="#6366f1" />
          <StatCard icon={<Icons.calendar size={20} color="#0ea5e9" />} value={stats.upcoming} label="Upcoming" accent="#0ea5e9" />
          <StatCard icon={<Icons.money size={20} color="#f59e0b" />} value={`Rs. ${formatSpent(stats.totalSpent)}`} label="Total Spent" accent="#f59e0b" />
        </div>

        {/* Two Columns */}
        <div style={S.twoCol}>
          <div style={S.leftPanel}>
            <div style={S.sectionTitle}><span style={S.dot("#00d296")} />Personal Information</div>
            {!editing ? (
              <>
                <div style={S.fieldRow}>
                  <InfoField label="Full Name" icon={<Icons.user size={12} color="rgba(255,255,255,0.3)" />} value={profile.fullName} />
                  <InfoField label="Email" icon={<Icons.mail size={12} color="rgba(255,255,255,0.3)" />} value={profile.email} />
                </div>
                <div style={S.fieldRow}>
                  <InfoField label="College / University" icon={<Icons.school size={12} color="rgba(255,255,255,0.3)" />} value={profile.college} />
                  <InfoField label="Role" icon={<Icons.shield size={12} color="rgba(255,255,255,0.3)" />} value={profile.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "User"} />
                </div>
                <div style={S.fieldRow}>
                  <InfoField label="Member Since" icon={<Icons.calendar size={12} color="rgba(255,255,255,0.3)" />} value={new Date(profile.createdAt).toLocaleDateString()} />
                </div>
              </>
            ) : (
              <div>
                {editErr && <div style={S.alertErr}><Icons.x size={14} color="#ff5b6e" />{editErr}</div>}
                <div style={S.fieldRow}>
                  <div style={S.fieldGroup}><label style={S.inputLabel}>Full Name</label><input style={S.input} value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} required onFocus={e => e.target.style.borderColor = "rgba(0,210,150,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /></div>
                  <div style={S.fieldGroup}><label style={S.inputLabel}>Email</label><input style={{ ...S.input, opacity: 0.4, cursor: "not-allowed" }} value={profile.email} disabled /><span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 4, display: "block" }}>Email cannot be changed</span></div>
                </div>
                <div style={S.fieldRow}><div style={S.fieldGroup}><label style={S.inputLabel}>College / University</label><input style={S.input} value={editForm.college} onChange={e => setEditForm(p => ({ ...p, college: e.target.value }))} onFocus={e => e.target.style.borderColor = "rgba(0,210,150,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /></div></div>
                <div style={S.btnRow}>
                  <button style={S.saveBtn} onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                  <button style={S.ghostBtn} onClick={() => { setEditing(false); setEditErr(""); }}><Icons.x size={14} /> Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div style={S.rightCol}>
            <div style={S.sidePanel}>
              <div style={S.sectionTitle}><span style={S.dot("#6366f1")} />Booking Stats</div>
              <div style={S.bookingRow}><span style={S.bookingLabel}>Total Bookings</span><span style={S.bookingValue("#6366f1")}>{stats.total}</span></div>
              <div style={S.bookingRow}><span style={S.bookingLabel}>Completed / Paid</span><span style={S.bookingValue("#00d296")}>{stats.paid}</span></div>
              <div style={S.bookingRow}><span style={S.bookingLabel}>Upcoming</span><span style={S.bookingValue("#0ea5e9")}>{stats.upcoming}</span></div>
              <div style={{ ...S.bookingRow, borderBottom: "none" }}><span style={S.bookingLabel}>Total Spent</span><span style={S.bookingValue("#f59e0b")}>NPR {stats.totalSpent.toLocaleString()}</span></div>
            </div>

            <div style={S.sidePanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showPassword ? 16 : 8 }}>
                <div style={S.sectionTitle}><span style={S.dot("#0ea5e9")} />Security</div>
                {!isGoogleUser && <button style={S.passwordToggle} onClick={() => setShowPassword(!showPassword)} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(0,210,150,0.3)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}>{showPassword ? "Hide" : "Change"}</button>}
              </div>
              {isGoogleUser ? <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, lineHeight: 1.6 }}>Your account uses Google login. Password is managed by Google.</p>
              : showPassword ? (
                <div>
                  {passErr && <div style={S.alertErr}><Icons.x size={14} color="#ff5b6e" />{passErr}</div>}
                  <div style={{ marginBottom: 12 }}><label style={S.inputLabel}>Current Password</label><input type="password" style={S.input} value={passForm.currentPassword} onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))} required onFocus={e => e.target.style.borderColor = "rgba(0,210,150,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /></div>
                  <div style={{ marginBottom: 12 }}><label style={S.inputLabel}>New Password</label><input type="password" style={S.input} value={passForm.newPassword} onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 8 characters" required onFocus={e => e.target.style.borderColor = "rgba(0,210,150,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /></div>
                  <div style={{ marginBottom: 16 }}><label style={S.inputLabel}>Confirm New Password</label><input type="password" style={S.input} value={passForm.confirmNewPassword} onChange={e => setPassForm(p => ({ ...p, confirmNewPassword: e.target.value }))} required onFocus={e => e.target.style.borderColor = "rgba(0,210,150,0.4)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} /></div>
                  <button style={{ ...S.saveBtn, fontSize: 13 }} onClick={changePassword} disabled={passLoading}>{passLoading ? "Changing..." : "Update Password"}</button>
                </div>
              ) : <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13 }}>Click "Change" to update your password.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}