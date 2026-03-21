import React, { useEffect, useState, useContext } from "react";
import { api } from "../api/axios";
import { AuthContext } from "../auth/AuthContext";

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
  const [stats, setStats] = useState({ total: 0, paid: 0, upcoming: 0 });

  async function loadProfile() {
    setLoading(true);
    try {
      const [profRes, bookRes] = await Promise.all([
        api.get("/api/profile"),
        api.get("/api/bookings/my")
      ]);
      const user = profRes.data.user;
      setProfile(user);
      setEditForm({ fullName: user.fullName, college: user.college || "" });

      const bookings = bookRes.data.bookings || [];
      const today = new Date().toISOString().slice(0, 10);
      setStats({
        total: bookings.length,
        paid: bookings.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER").length,
        upcoming: bookings.filter(b => b.date >= today && b.status !== "CANCELLED").length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, []);

  async function saveProfile(e) {
    e.preventDefault();
    setEditErr("");
    setEditMsg("");
    setSaving(true);
    try {
      const res = await api.put("/api/profile", editForm);
      setProfile(res.data.user);
      setEditMsg("Profile updated successfully!");
      setEditing(false);
      setTimeout(() => setEditMsg(""), 3000);
    } catch (err) {
      setEditErr(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Photo must be under 5MB");
      return;
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      const res = await api.put("/api/profile/photo", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      setProfile(prev => ({ ...prev, profilePicture: res.data.profilePicture }));
    } catch (err) {
      alert(err?.response?.data?.message || "Photo upload failed");
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  }

  async function removePhoto() {
    if (!confirm("Remove uploaded photo and use default?")) return;
    try {
      await api.delete("/api/profile/photo");
      const res = await api.get("/api/profile");
      setProfile(res.data.user);
    } catch (err) {
      alert("Failed to remove photo");
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    setPassErr("");
    setPassMsg("");
    setPassLoading(true);
    try {
      const res = await api.put("/api/profile/password", passForm);
      setPassMsg(res.data.message || "Password changed!");
      setPassForm({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setShowPassword(false);
      setTimeout(() => setPassMsg(""), 3000);
    } catch (err) {
      setPassErr(err?.response?.data?.message || "Password change failed");
    } finally {
      setPassLoading(false);
    }
  }

  if (loading) return <div className="loading-spinner">Loading profile...</div>;
  if (!profile) return <div className="empty-state">Profile not found.</div>;

  const isGoogleUser = !!profile.googleId;
  const initial = (profile.fullName || "U")[0].toUpperCase();

  return (
    <div>
      <h1>My Profile</h1>
      <p className="muted mt-sm">View and manage your account settings.</p>

      {editMsg && <div className="alert ok">{editMsg}</div>}
      {passMsg && <div className="alert ok">{passMsg}</div>}

      <div className="two-col mt-md">
        {/* Profile Card */}
        <div className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            {/* Avatar with photo upload */}
            <div style={{ position: "relative" }}>
              {(profile.profilePicture || profile.googleProfilePicture) ? (
                <img
                  src={profile.profilePicture || profile.googleProfilePicture}
                  alt="Profile"
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "3px solid var(--accent)"
                  }}
                />
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #5b8cff 0%, #3d6ee0 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 32,
                  fontWeight: 800,
                  color: "#fff",
                  flexShrink: 0
                }}>
                  {initial}
                </div>
              )}

              {/* Camera button overlay */}
              <label style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: photoUploading ? "wait" : "pointer",
                fontSize: 14,
                border: "2px solid var(--bg)"
              }}>
                {photoUploading ? "..." : "📷"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                  disabled={photoUploading}
                />
              </label>
            </div>

            <div>
              <h2 style={{ marginBottom: 4 }}>{profile.fullName}</h2>
              <p className="muted small">{profile.email}</p>
              <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                {isGoogleUser && (
                  <span className="pill" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(61,220,151,0.1)", borderColor: "rgba(61,220,151,0.3)", color: "var(--ok)" }}>
                    G Google Account
                  </span>
                )}
                {profile.profilePicture && profile.cloudinaryId && (
                  <button
                    onClick={removePhoto}
                    className="pill"
                    style={{ cursor: "pointer", background: "rgba(255,91,110,0.1)", borderColor: "rgba(255,91,110,0.3)", color: "var(--danger)" }}
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {!editing ? (
            <>
              <div style={{ display: "grid", gap: 12 }}>
                <div>
                  <div className="muted small">Full Name</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.fullName}</div>
                </div>
                <div>
                  <div className="muted small">Email</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.email}</div>
                </div>
                <div>
                  <div className="muted small">College/University</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{profile.college || "Not specified"}</div>
                </div>
                <div>
                  <div className="muted small">Role</div>
                  <div style={{ fontWeight: 600, marginTop: 4, textTransform: "capitalize" }}>{profile.role}</div>
                </div>
                <div>
                  <div className="muted small">Member Since</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{new Date(profile.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <button className="btn mt-md" onClick={() => setEditing(true)}>Edit Profile</button>
            </>
          ) : (
            <form onSubmit={saveProfile} className="form">
              {editErr && <div className="alert error">{editErr}</div>}

              <label>
                Full Name
                <input
                  value={editForm.fullName}
                  onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))}
                  required
                />
              </label>

              <label>
                Email
                <input value={profile.email} disabled style={{ opacity: 0.5 }} />
                <span className="muted small">Email cannot be changed</span>
              </label>

              <label>
                College/University
                <input
                  value={editForm.college}
                  onChange={e => setEditForm(p => ({ ...p, college: e.target.value }))}
                />
              </label>

              <div className="flex-gap">
                <button className="btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" className="btn ghost" onClick={() => { setEditing(false); setEditErr(""); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Side */}
        <div>
          {/* Stats */}
          <div className="panel mb-md">
            <h3 style={{ marginBottom: 12 }}>Booking Stats</h3>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="flex-between">
                <span className="muted">Total Bookings</span>
                <span style={{ fontWeight: 700 }}>{stats.total}</span>
              </div>
              <div className="flex-between">
                <span className="muted">Completed/Paid</span>
                <span style={{ fontWeight: 700, color: "var(--ok)" }}>{stats.paid}</span>
              </div>
              <div className="flex-between">
                <span className="muted">Upcoming</span>
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>{stats.upcoming}</span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="panel">
            <div className="flex-between" style={{ marginBottom: 10 }}>
              <h3>Change Password</h3>
              {!isGoogleUser && (
                <button className="btn small ghost" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? "Hide" : "Change"}
                </button>
              )}
            </div>

            {isGoogleUser ? (
              <p className="muted small">Your account uses Google login. Password is managed by Google.</p>
            ) : showPassword ? (
              <form onSubmit={changePassword} className="form">
                {passErr && <div className="alert error">{passErr}</div>}

                <label>
                  Current Password
                  <input
                    type="password"
                    value={passForm.currentPassword}
                    onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                    required
                  />
                </label>

                <label>
                  New Password
                  <input
                    type="password"
                    value={passForm.newPassword}
                    onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min 8 characters"
                    required
                  />
                </label>

                <label>
                  Confirm New Password
                  <input
                    type="password"
                    value={passForm.confirmNewPassword}
                    onChange={e => setPassForm(p => ({ ...p, confirmNewPassword: e.target.value }))}
                    required
                  />
                </label>

                <button className="btn" disabled={passLoading}>
                  {passLoading ? "Changing..." : "Update Password"}
                </button>
              </form>
            ) : (
              <p className="muted small">Click "Change" to update your password.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}