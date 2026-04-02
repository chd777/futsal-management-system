import React, { useState } from "react";
import { api } from "../api/axios";

export default function PitchManage() {
  const [pin, setPin] = useState("");
  const [pitch, setPitch] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Edit pitch
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editMsg, setEditMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Bookings
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  // Revenue
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  // Closures
  const [closures, setClosures] = useState([]);
  const [closuresLoading, setClosuresLoading] = useState(false);
  const [closureForm, setClosureForm] = useState({ date: "", reason: "" });
  const [closureMsg, setClosureMsg] = useState("");

  // Login with PIN
  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/pitch-manage/login", { pin });
      setPitch(res.data.pitch);
      setEditForm({
        name: res.data.pitch.name,
        address: res.data.pitch.address,
        pricePerHour: res.data.pitch.pricePerHour,
        openTime: res.data.pitch.openTime,
        closeTime: res.data.pitch.closeTime,
        lat: res.data.pitch.lat,
        lng: res.data.pitch.lng
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid PIN");
    } finally {
      setLoading(false);
    }
  }

  // Load bookings
  async function loadBookings() {
    setBookingsLoading(true);
    try {
      const res = await api.get(`/api/pitch-manage/${pitch._id}/bookings?pin=${pin}`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setBookingsLoading(false);
    }
  }

  // Load revenue
  async function loadRevenue() {
    setRevenueLoading(true);
    try {
      const res = await api.get(`/api/pitch-manage/${pitch._id}/revenue?pin=${pin}`);
      setRevenue(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRevenueLoading(false);
    }
  }

  // Load closures
  async function loadClosures() {
    setClosuresLoading(true);
    try {
      const res = await api.get(`/api/pitch-manage/${pitch._id}/closures?pin=${pin}`);
      setClosures(res.data.closures || []);
    } catch (err) {
      console.error(err);
    } finally {
      setClosuresLoading(false);
    }
  }

  // Switch tabs
  function switchTab(tab) {
    setActiveTab(tab);
    if (tab === "bookings") loadBookings();
    if (tab === "revenue") loadRevenue();
    if (tab === "closures") loadClosures();
  }

  // Save pitch edits
  async function saveEdit(e) {
    e.preventDefault();
    setSaving(true);
    setEditMsg("");
    try {
      const res = await api.put(`/api/pitch-manage/${pitch._id}`, { ...editForm, pin });
      setPitch(res.data.pitch);
      setEditMode(false);
      setEditMsg("Pitch updated successfully!");
      setTimeout(() => setEditMsg(""), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  // Delete pitch
  async function deletePitch() {
    if (!confirm("Are you sure you want to permanently delete this pitch? All future bookings will be cancelled and users notified. This cannot be undone.")) return;
    if (!confirm("FINAL CONFIRMATION: Delete this pitch permanently?")) return;
    try {
      const res = await api.delete(`/api/pitch-manage/${pitch._id}`, { data: { pin } });
      alert(res.data.message + (res.data.cancelledBookings > 0 ? ` ${res.data.cancelledBookings} booking(s) were cancelled.` : ""));
      setPitch(null);
      setPin("");
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  }

  // Cancel booking
  async function confirmCancelBooking() {
    if (!cancelReason.trim()) { alert("Reason is required"); return; }
    try {
      await api.put(`/api/pitch-manage/${pitch._id}/bookings/${cancelModal._id}/cancel`, { pin, reason: cancelReason });
      setCancelModal(null);
      setCancelReason("");
      loadBookings();
    } catch (err) {
      alert(err?.response?.data?.message || "Cancel failed");
    }
  }

  // Add closure
  async function addClosure(e) {
    e.preventDefault();
    setClosureMsg("");
    try {
      const res = await api.post(`/api/pitch-manage/${pitch._id}/closures`, { pin, ...closureForm });
      setClosureMsg(res.data.message || "Closure added!");
      setClosureForm({ date: "", reason: "" });
      loadClosures();
      setTimeout(() => setClosureMsg(""), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add closure");
    }
  }

  // Remove closure
  async function removeClosure(id) {
    if (!confirm("Remove this closure?")) return;
    try {
      await api.delete(`/api/pitch-manage/${pitch._id}/closures/${id}`, { data: { pin } });
      loadClosures();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed");
    }
  }

  function statusPill(status) {
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "CONFIRMED_PAY_LATER") return <span className="pill pending">Pay at Venue</span>;
    if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending</span>;
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  // PIN Login Screen
  if (!pitch) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 28, background: "radial-gradient(900px 500px at 20% 0%, #13233f 0%, #0b0f17 55%)" }}>
        <div className="card" style={{ maxWidth: 400, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔐</div>
          <h1 style={{ marginBottom: 4 }}>Pitch Management</h1>
          <p className="muted">Enter your 6-digit management PIN to access your pitch dashboard.</p>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleLogin} className="form" style={{ marginTop: 20 }}>
            <input
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter 6-digit PIN"
              maxLength={6}
              style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 800 }}
              required
            />
            <button className="btn auth-btn" disabled={loading || pin.length < 6}>
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>

          <p className="muted small" style={{ marginTop: 16 }}>
            Don't have a PIN? Contact the platform admin.
          </p>
        </div>
      </div>
    );
  }

  // Pitch Owner Dashboard
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(900px 500px at 20% 0%, #13233f 0%, #0b0f17 55%)" }}>
      {/* Header */}
      <nav className="user-nav">
        <div className="nav-left">
          <span className="brand">⚽ FutsalMS</span>
          <span className="muted">Pitch Management</span>
        </div>
        <div className="nav-right">
          <span className="pill" style={{ borderColor: "rgba(61,220,151,0.5)", color: "var(--ok)" }}>🔐 {pitch.name}</span>
          <button className="btn small danger" onClick={() => { setPitch(null); setPin(""); }}>Logout</button>
        </div>
      </nav>

      <div className="container">
        {editMsg && <div className="alert ok">{editMsg}</div>}

        {/* Tabs */}
        <div className="tabs mt-md">
          <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => switchTab("overview")}>Overview</button>
          <button className={`tab ${activeTab === "bookings" ? "active" : ""}`} onClick={() => switchTab("bookings")}>Bookings</button>
          <button className={`tab ${activeTab === "revenue" ? "active" : ""}`} onClick={() => switchTab("revenue")}>Revenue</button>
          <button className={`tab ${activeTab === "closures" ? "active" : ""}`} onClick={() => switchTab("closures")}>Closures</button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <div className="panel">
              <div className="flex-between">
                <h2>Pitch Details</h2>
                <div className="flex-gap">
                  {!editMode && <button className="btn small" onClick={() => setEditMode(true)}>Edit</button>}
                  <button className="btn small danger" onClick={deletePitch}>Delete Pitch</button>
                </div>
              </div>

              {!editMode ? (
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  <div className="flex-between"><span className="muted">Name</span><span style={{ fontWeight: 700 }}>{pitch.name}</span></div>
                  <div className="flex-between"><span className="muted">Address</span><span>{pitch.address}</span></div>
                  <div className="flex-between"><span className="muted">Price</span><span style={{ fontWeight: 700, color: "var(--accent)" }}>NPR {pitch.pricePerHour}/hr</span></div>
                  <div className="flex-between"><span className="muted">Timing</span><span>{pitch.openTime} - {pitch.closeTime}</span></div>
                  <div className="flex-between"><span className="muted">Location</span><span>{pitch.lat}, {pitch.lng}</span></div>
                  <div className="flex-between"><span className="muted">Status</span>{pitch.isActive ? <span className="pill active">Active</span> : <span className="pill inactive">Inactive</span>}</div>
                </div>
              ) : (
                <form onSubmit={saveEdit} className="form" style={{ marginTop: 16 }}>
                  <label>Name<input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required /></label>
                  <label>Address<input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} required /></label>
                  <div className="grid2">
                    <label>Price (NPR/hr)<input type="number" value={editForm.pricePerHour} onChange={e => setEditForm(p => ({ ...p, pricePerHour: e.target.value }))} required /></label>
                    <label>Open Time<input type="time" value={editForm.openTime} onChange={e => setEditForm(p => ({ ...p, openTime: e.target.value }))} /></label>
                    <label>Close Time<input type="time" value={editForm.closeTime} onChange={e => setEditForm(p => ({ ...p, closeTime: e.target.value }))} /></label>
                    <label>Latitude<input type="number" step="0.000001" value={editForm.lat} onChange={e => setEditForm(p => ({ ...p, lat: e.target.value }))} /></label>
                    <label>Longitude<input type="number" step="0.000001" value={editForm.lng} onChange={e => setEditForm(p => ({ ...p, lng: e.target.value }))} /></label>
                  </div>
                  <div className="flex-gap">
                    <button className="btn" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                    <button type="button" className="btn ghost" onClick={() => setEditMode(false)}>Cancel</button>
                  </div>
                </form>
              )}
            </div>

            {/* Map */}
            {pitch.lat && pitch.lng && (
              <div className="panel mt-md">
                <h3 style={{ marginBottom: 10 }}>Location</h3>
                <div className="map-container">
                  <iframe
                    title="Pitch Location"
                    width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${pitch.lng - 0.01},${pitch.lat - 0.008},${Number(pitch.lng) + 0.01},${Number(pitch.lat) + 0.008}&layer=mapnik&marker=${pitch.lat},${pitch.lng}`}
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <div>
            <h2>Bookings</h2>
            {bookingsLoading ? <div className="loading-spinner">Loading...</div> : bookings.length === 0 ? (
              <div className="empty-state">No bookings found.</div>
            ) : (
              <div className="table-wrap mt-md">
                <table>
                  <thead>
                    <tr><th>Customer</th><th>Date</th><th>Slot</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{b.user?.fullName || "N/A"}</div>
                          <div className="muted small">{b.user?.email}</div>
                        </td>
                        <td>{b.date}</td>
                        <td>{b.slot}</td>
                        <td>NPR {b.priceAtBooking}</td>
                        <td>{statusPill(b.status)}</td>
                        <td>
                          {b.status !== "CANCELLED" && (
                            <button className="btn small danger" onClick={() => { setCancelModal(b); setCancelReason(""); }}>Cancel</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Cancel Modal */}
            {cancelModal && (
              <div className="modal-overlay" onClick={() => setCancelModal(null)}>
                <div className="modal" onClick={e => e.stopPropagation()}>
                  <h2>Cancel Booking</h2>
                  <p className="muted mt-sm">{cancelModal.user?.fullName} — {cancelModal.date} {cancelModal.slot}</p>
                  <div className="mt-md">
                    <label>Reason <span style={{ color: "var(--danger)" }}>*</span>
                      <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." rows={3} />
                    </label>
                  </div>
                  <div className="flex-gap mt-md">
                    <button className="btn danger" onClick={confirmCancelBooking} disabled={!cancelReason.trim()}>Confirm Cancel</button>
                    <button className="btn ghost" onClick={() => setCancelModal(null)}>Go Back</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === "revenue" && (
          <div>
            <h2>Revenue</h2>
            {revenueLoading || !revenue ? <div className="loading-spinner">Loading...</div> : (
              <>
                <div className="grid4 mt-md">
                  <div className="stat">
                    <div className="stat-title">Total Revenue</div>
                    <div className="stat-value" style={{ color: "var(--ok)" }}>NPR {revenue.totalRevenue?.toLocaleString()}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Bookings</div>
                    <div className="stat-value">{revenue.totalBookings}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Today's Revenue</div>
                    <div className="stat-value" style={{ color: "var(--accent)" }}>NPR {revenue.todayRevenue?.toLocaleString()}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Today's Bookings</div>
                    <div className="stat-value">{revenue.todayBookings}</div>
                  </div>
                </div>

                {Object.keys(revenue.monthly || {}).length > 0 && (
                  <div className="panel mt-md">
                    <h3>Monthly Revenue</h3>
                    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                      {Object.entries(revenue.monthly).sort((a, b) => b[0].localeCompare(a[0])).map(([month, amount]) => (
                        <div key={month} className="flex-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                          <span className="muted">{month}</span>
                          <span style={{ fontWeight: 700, color: "var(--ok)" }}>NPR {amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CLOSURES TAB */}
        {activeTab === "closures" && (
          <div>
            <h2>Closures & Holidays</h2>

            <div className="panel mt-md">
              <h3 style={{ marginBottom: 10 }}>Add Closure</h3>
              {closureMsg && <div className="alert ok">{closureMsg}</div>}
              <form onSubmit={addClosure} className="form">
                <div className="grid2">
                  <label>Date<input type="date" value={closureForm.date} min={new Date().toISOString().slice(0, 10)} onChange={e => setClosureForm(p => ({ ...p, date: e.target.value }))} required /></label>
                  <label>Reason<input value={closureForm.reason} onChange={e => setClosureForm(p => ({ ...p, reason: e.target.value }))} placeholder="e.g. Maintenance, Holiday..." required /></label>
                </div>
                <button className="btn">Add Closure</button>
              </form>
            </div>

            <h3 className="mt-md">Upcoming Closures ({closures.length})</h3>
            {closuresLoading ? <div className="loading-spinner">Loading...</div> : closures.length === 0 ? (
              <div className="empty-state mt-sm">No closures. Pitch is open every day.</div>
            ) : (
              <div className="list mt-sm">
                {closures.map(c => (
                  <div key={c._id} className="list-item">
                    <div>
                      <div className="list-title">{c.date}</div>
                      <div className="muted small">{c.reason}</div>
                    </div>
                    <button className="btn small danger" onClick={() => removeClosure(c._id)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}