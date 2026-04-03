import React, { useMemo, useState } from "react";
import { api } from "../api/axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

export default function PitchManage() {
  const [pin, setPin] = useState("");
  const [pitch, setPitch] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editMsg, setEditMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const [bookingFilterDate, setBookingFilterDate] = useState("");
  const [bookingFilterStatus, setBookingFilterStatus] = useState("ALL");

  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);

  const [closures, setClosures] = useState([]);
  const [closuresLoading, setClosuresLoading] = useState(false);
  const [closureForm, setClosureForm] = useState({ date: "", reason: "" });
  const [closureMsg, setClosureMsg] = useState("");

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
        lng: res.data.pitch.lng,
        image: res.data.pitch.image || ""
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid PIN");
    } finally {
      setLoading(false);
    }
  }

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

  function switchTab(tab) {
    setActiveTab(tab);
    if (tab === "bookings") loadBookings();
    if (tab === "revenue") loadRevenue();
    if (tab === "closures") loadClosures();
  }

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

  async function deletePitch() {
    if (
      !confirm(
        "Are you sure you want to permanently delete this pitch? All future bookings will be cancelled and users notified. This cannot be undone."
      )
    ) {
      return;
    }
    if (!confirm("FINAL CONFIRMATION: Delete this pitch permanently?")) return;
    try {
      const res = await api.delete(`/api/pitch-manage/${pitch._id}`, { data: { pin } });
      alert(
        res.data.message +
          (res.data.cancelledBookings > 0
            ? ` ${res.data.cancelledBookings} booking(s) were cancelled.`
            : "")
      );
      setPitch(null);
      setPin("");
      setError("");
      setActiveTab("overview");
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  }

  async function confirmCancelBooking() {
    if (!cancelReason.trim()) {
      alert("Reason is required");
      return;
    }
    try {
      await api.put(`/api/pitch-manage/${pitch._id}/bookings/${cancelModal._id}/cancel`, {
        pin,
        reason: cancelReason
      });
      setCancelModal(null);
      setCancelReason("");
      loadBookings();
    } catch (err) {
      alert(err?.response?.data?.message || "Cancel failed");
    }
  }

  async function addClosure(e) {
    e.preventDefault();
    setClosureMsg("");
    try {
      const res = await api.post(`/api/pitch-manage/${pitch._id}/closures`, {
        pin,
        ...closureForm
      });
      setClosureMsg(res.data.message || "Closure added!");
      setClosureForm({ date: "", reason: "" });
      loadClosures();
      setTimeout(() => setClosureMsg(""), 4000);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to add closure");
    }
  }

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
    if (status === "CONFIRMED_PAY_LATER") {
      return <span className="pill pending">Pay at Venue</span>;
    }
    if (status === "PENDING_PAYMENT") {
      return <span className="pill pending">Pending</span>;
    }
    if (status === "CANCELLED") {
      return <span className="pill cancelled">Cancelled</span>;
    }
    return <span className="pill">{status}</span>;
  }

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const dateMatch = bookingFilterDate ? b.date === bookingFilterDate : true;
      const statusMatch =
        bookingFilterStatus === "ALL" ? true : b.status === bookingFilterStatus;
      return dateMatch && statusMatch;
    });
  }, [bookings, bookingFilterDate, bookingFilterStatus]);

  const monthlyRevenueChartData = useMemo(() => {
    if (!revenue?.monthly) return [];
    return Object.entries(revenue.monthly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, amount]) => ({
        month,
        revenue: amount
      }));
  }, [revenue]);

  const revenueStatusPieData = useMemo(() => {
    if (!bookings.length) return [];

    const summary = {
      PAID: 0,
      CONFIRMED_PAY_LATER: 0,
      PENDING_PAYMENT: 0,
      CANCELLED: 0
    };

    bookings.forEach((b) => {
      if (summary[b.status] !== undefined) summary[b.status] += 1;
    });

    return [
      { name: "Paid", value: summary.PAID },
      { name: "Pay at Venue", value: summary.CONFIRMED_PAY_LATER },
      { name: "Pending", value: summary.PENDING_PAYMENT },
      { name: "Cancelled", value: summary.CANCELLED }
    ].filter((item) => item.value > 0);
  }, [bookings]);

  const PIE_COLORS = ["#3ddc97", "#f0b44c", "#5b8cff", "#ff6b7a"];

  if (!pitch) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: 28,
          background:
            "radial-gradient(900px 500px at 20% 0%, #13233f 0%, #0b0f17 55%)"
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: 440,
            width: "100%",
            textAlign: "center",
            padding: "34px 30px",
            borderRadius: 20,
            border: "1px solid rgba(91,140,255,0.18)",
            background: "rgba(10,15,24,0.88)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.35)"
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 18px",
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(91,140,255,0.22)",
              background: "linear-gradient(135deg, rgba(91,140,255,0.18), rgba(91,140,255,0.06))"
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                border: "2px solid #5b8cff"
              }}
            />
          </div>

          <h1 style={{ marginBottom: 8 }}>Pitch Management</h1>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Enter your 6-digit management PIN to access your pitch dashboard.
          </p>

          {error && <div className="alert error">{error}</div>}

          <form onSubmit={handleLogin} className="form" style={{ marginTop: 22 }}>
            <label style={{ textAlign: "left" }}>
              Management PIN
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit PIN"
                maxLength={6}
                style={{
                  textAlign: "center",
                  fontSize: 28,
                  letterSpacing: 10,
                  fontWeight: 800,
                  padding: "16px 18px",
                  borderRadius: 16
                }}
                required
              />
            </label>

            <button
              className="btn auth-btn"
              disabled={loading || pin.length < 6}
              style={{ marginTop: 6 }}
            >
              {loading ? "Verifying..." : "Access Dashboard"}
            </button>
          </form>

          <p className="muted small" style={{ marginTop: 18 }}>
            Contact the platform admin if you do not have a management PIN.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(900px 500px at 20% 0%, #13233f 0%, #0b0f17 55%)"
      }}
    >
      <nav className="user-nav">
        <div className="nav-left">
          <span className="brand">⚽ FutsalMS</span>
          <span className="muted">Pitch Management</span>
        </div>
        <div className="nav-right">
          <span
            className="pill"
            style={{ borderColor: "rgba(61,220,151,0.5)", color: "var(--ok)" }}
          >
            {pitch.name}
          </span>
          <button
            className="btn small danger"
            onClick={() => {
              setPitch(null);
              setPin("");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="flex-between" style={{ alignItems: "flex-start", gap: 16 }}>
            <div>
              <h1 style={{ marginBottom: 4 }}>{pitch.name}</h1>
              <p className="muted">{pitch.address}</p>
            </div>
            <div className="flex-gap" style={{ alignItems: "center", flexWrap: "wrap" }}>
              <span className={`pill ${pitch.isActive ? "active" : "inactive"}`}>
                {pitch.isActive ? "Active" : "Inactive"}
              </span>
              <span style={{ fontWeight: 700, color: "var(--accent)" }}>
                NPR {pitch.pricePerHour}/hr
              </span>
            </div>
          </div>
        </div>

        {editMsg && <div className="alert ok">{editMsg}</div>}

        <div
          className="tabs mt-md"
          style={{
            display: "flex",
            gap: 10,
            padding: 10,
            background: "var(--bg-surface)",
            borderRadius: 12,
            border: "1px solid var(--border)"
          }}
        >
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => switchTab("overview")}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => switchTab("bookings")}
          >
            Bookings
          </button>
          <button
            className={`tab ${activeTab === "revenue" ? "active" : ""}`}
            onClick={() => switchTab("revenue")}
          >
            Revenue
          </button>
          <button
            className={`tab ${activeTab === "closures" ? "active" : ""}`}
            onClick={() => switchTab("closures")}
          >
            Closures
          </button>
        </div>

        {activeTab === "overview" && (
          <div>
            {pitch.image && (
              <div className="panel" style={{ marginTop: 16, marginBottom: 16 }}>
                <img
                  src={pitch.image}
                  alt="Pitch"
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 12
                  }}
                />
              </div>
            )}

            <div className="panel">
              <div className="flex-between">
                <h2>Pitch Details</h2>
                <div className="flex-gap">
                  {!editMode && (
                    <button className="btn small" onClick={() => setEditMode(true)}>
                      Edit
                    </button>
                  )}
                  <button className="btn small danger" onClick={deletePitch}>
                    Delete Pitch
                  </button>
                </div>
              </div>

              {!editMode ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginTop: 16
                  }}
                >
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Name</div>
                    <div style={{ fontWeight: 700, marginTop: 6 }}>{pitch.name}</div>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Address</div>
                    <div style={{ marginTop: 6 }}>{pitch.address}</div>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Price</div>
                    <div style={{ fontWeight: 700, color: "var(--accent)", marginTop: 6 }}>
                      NPR {pitch.pricePerHour}/hr
                    </div>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Timing</div>
                    <div style={{ marginTop: 6 }}>
                      {pitch.openTime} - {pitch.closeTime}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Location</div>
                    <div style={{ marginTop: 6 }}>
                      {pitch.lat}, {pitch.lng}
                    </div>
                  </div>
                  <div className="card" style={{ padding: 14 }}>
                    <div className="muted small">Status</div>
                    <div style={{ marginTop: 6 }}>
                      {pitch.isActive ? (
                        <span className="pill active">Active</span>
                      ) : (
                        <span className="pill inactive">Inactive</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={saveEdit} className="form" style={{ marginTop: 16 }}>
                  <label>
                    Name
                    <input
                      value={editForm.name || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Address
                    <input
                      value={editForm.address || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, address: e.target.value }))
                      }
                      required
                    />
                  </label>

                  <label>
                    Image URL
                    <input
                      value={editForm.image || ""}
                      onChange={(e) =>
                        setEditForm((p) => ({ ...p, image: e.target.value }))
                      }
                      placeholder="Paste image URL"
                    />
                  </label>

                  <div className="grid2">
                    <label>
                      Price (NPR/hr)
                      <input
                        type="number"
                        value={editForm.pricePerHour || ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, pricePerHour: e.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      Open Time
                      <input
                        type="time"
                        value={editForm.openTime || ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, openTime: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Close Time
                      <input
                        type="time"
                        value={editForm.closeTime || ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, closeTime: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Latitude
                      <input
                        type="number"
                        step="0.000001"
                        value={editForm.lat || ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, lat: e.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Longitude
                      <input
                        type="number"
                        step="0.000001"
                        value={editForm.lng || ""}
                        onChange={(e) =>
                          setEditForm((p) => ({ ...p, lng: e.target.value }))
                        }
                      />
                    </label>
                  </div>

                  <div className="flex-gap">
                    <button className="btn" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {pitch.lat && pitch.lng && (
              <div className="panel mt-md">
                <h3 style={{ marginBottom: 10 }}>Location</h3>
                <div className="map-container">
                  <iframe
                    title="Pitch Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                      pitch.lng - 0.01
                    },${pitch.lat - 0.008},${Number(pitch.lng) + 0.01},${
                      Number(pitch.lat) + 0.008
                    }&layer=mapnik&marker=${pitch.lat},${pitch.lng}`}
                    allowFullScreen
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "bookings" && (
          <div>
            <div className="flex-between" style={{ alignItems: "center", marginBottom: 14 }}>
              <h2>Bookings</h2>
              <div className="muted small">
                Showing {filteredBookings.length} of {bookings.length}
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 16 }}>
              <div className="grid2">
                <label>
                  Filter by Date
                  <input
                    type="date"
                    value={bookingFilterDate}
                    onChange={(e) => setBookingFilterDate(e.target.value)}
                  />
                </label>

                <label>
                  Filter by Status
                  <select
                    value={bookingFilterStatus}
                    onChange={(e) => setBookingFilterStatus(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING_PAYMENT">Pending</option>
                    <option value="CONFIRMED_PAY_LATER">Pay at Venue</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
              </div>

              <div className="flex-gap mt-md">
                <button
                  className="btn ghost small"
                  onClick={() => {
                    setBookingFilterDate("");
                    setBookingFilterStatus("ALL");
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {bookingsLoading ? (
              <div className="loading-spinner">Loading...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 40 }}>📭</div>
                No bookings found for the selected filters.
              </div>
            ) : (
              <div
                className="table-wrap mt-md"
                style={{
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid var(--border)"
                }}
              >
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Slot</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {b.user?.fullName || "N/A"}
                          </div>
                          <div className="muted small">{b.user?.email}</div>
                        </td>
                        <td>{b.date}</td>
                        <td>{b.slot}</td>
                        <td>NPR {b.priceAtBooking}</td>
                        <td>{statusPill(b.status)}</td>
                        <td>
                          {b.status !== "CANCELLED" && (
                            <button
                              className="btn small danger"
                              onClick={() => {
                                setCancelModal(b);
                                setCancelReason("");
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {cancelModal && (
              <div className="modal-overlay" onClick={() => setCancelModal(null)}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                  <h2>Cancel Booking</h2>
                  <p className="muted mt-sm">
                    {cancelModal.user?.fullName} — {cancelModal.date} {cancelModal.slot}
                  </p>
                  <div className="mt-md">
                    <label>
                      Reason <span style={{ color: "var(--danger)" }}>*</span>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation..."
                        rows={3}
                      />
                    </label>
                  </div>
                  <div className="flex-gap mt-md">
                    <button
                      className="btn danger"
                      onClick={confirmCancelBooking}
                      disabled={!cancelReason.trim()}
                    >
                      Confirm Cancel
                    </button>
                    <button
                      className="btn ghost"
                      onClick={() => setCancelModal(null)}
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "revenue" && (
          <div>
            <h2>Revenue</h2>
            {revenueLoading || !revenue ? (
              <div className="loading-spinner">Loading...</div>
            ) : (
              <>
                <div className="grid4 mt-md">
                  <div className="stat">
                    <div className="stat-title">Total Revenue</div>
                    <div className="stat-value" style={{ color: "var(--ok)" }}>
                      NPR {revenue.totalRevenue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Total Bookings</div>
                    <div className="stat-value">{revenue.totalBookings}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Today's Revenue</div>
                    <div className="stat-value" style={{ color: "var(--accent)" }}>
                      NPR {revenue.todayRevenue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Today's Bookings</div>
                    <div className="stat-value">{revenue.todayBookings}</div>
                  </div>
                </div>

                <div className="grid2 mt-md">
                  <div className="panel">
                    <h3 style={{ marginBottom: 14 }}>Monthly Revenue</h3>
                    {monthlyRevenueChartData.length === 0 ? (
                      <div className="empty-state">No monthly revenue data yet.</div>
                    ) : (
                      <div style={{ width: "100%", height: 320 }}>
                       <ResponsiveContainer>
  <BarChart data={monthlyRevenueChartData} barCategoryGap={40}>
    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
    <XAxis
      dataKey="month"
      tick={{ fill: "#9aa4b2", fontSize: 12 }}
      axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
      tickLine={false}
    />
    <YAxis
      tick={{ fill: "#9aa4b2", fontSize: 12 }}
      axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
      tickLine={false}
    />
    <Tooltip
      contentStyle={{
        background: "#0f1724",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        color: "#eef2f7"
      }}
      labelStyle={{ color: "#eef2f7" }}
      cursor={{ fill: "rgba(91,140,255,0.08)" }}
      formatter={(value) => [`NPR ${Number(value).toLocaleString()}`, "Revenue"]}
    />
    <Bar
      dataKey="revenue"
      fill="#5b8cff"
      radius={[10, 10, 0, 0]}
      maxBarSize={80}
    />
  </BarChart>
</ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="panel">
                    <h3 style={{ marginBottom: 14 }}>Booking Status Distribution</h3>
                    {revenueStatusPieData.length === 0 ? (
                      <div className="empty-state">No booking status data yet.</div>
                    ) : (
                      <div style={{ width: "100%", height: 320 }}>
                        <ResponsiveContainer>
  <PieChart>
    <Pie
      data={revenueStatusPieData}
      cx="50%"
      cy="45%"
      outerRadius={88}
      innerRadius={42}
      paddingAngle={3}
      dataKey="value"
      nameKey="name"
      label={({ value }) => value}
    >
      {revenueStatusPieData.map((entry, index) => (
        <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
      ))}
    </Pie>
    <Tooltip
      contentStyle={{
        background: "#0f1724",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        color: "#eef2f7"
      }}
      labelStyle={{ color: "#eef2f7" }}
    />
    <Legend wrapperStyle={{ color: "#9aa4b2", paddingTop: 16 }} />
  </PieChart>
</ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </div>

                {Object.keys(revenue.monthly || {}).length > 0 && (
                  <div className="panel mt-md">
                    <h3>Monthly Revenue Summary</h3>
                    <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                      {Object.entries(revenue.monthly)
                        .sort((a, b) => b[0].localeCompare(a[0]))
                        .map(([month, amount]) => (
                          <div
                            key={month}
                            className="flex-between"
                            style={{
                              padding: "8px 0",
                              borderBottom: "1px solid var(--border)"
                            }}
                          >
                            <span className="muted">{month}</span>
                            <span style={{ fontWeight: 700, color: "var(--ok)" }}>
                              NPR {amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "closures" && (
          <div>
            <h2>Closures & Holidays</h2>

            <div className="panel mt-md">
              <h3 style={{ marginBottom: 10 }}>Add Closure</h3>
              {closureMsg && <div className="alert ok">{closureMsg}</div>}
              <form onSubmit={addClosure} className="form">
                <div className="grid2">
                  <label>
                    Date
                    <input
                      type="date"
                      value={closureForm.date}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        setClosureForm((p) => ({ ...p, date: e.target.value }))
                      }
                      required
                    />
                  </label>
                  <label>
                    Reason
                    <input
                      value={closureForm.reason}
                      onChange={(e) =>
                        setClosureForm((p) => ({ ...p, reason: e.target.value }))
                      }
                      placeholder="e.g. Maintenance, Holiday..."
                      required
                    />
                  </label>
                </div>
                <button className="btn">Add Closure</button>
              </form>
            </div>

            <h3 className="mt-md">Upcoming Closures ({closures.length})</h3>
            {closuresLoading ? (
              <div className="loading-spinner">Loading...</div>
            ) : closures.length === 0 ? (
              <div className="empty-state mt-sm">
                <div style={{ fontSize: 40 }}>📅</div>
                No closures. Pitch is open every day.
              </div>
            ) : (
              <div className="list mt-sm">
                {closures.map((c) => (
                  <div key={c._id} className="list-item">
                    <div>
                      <div className="list-title">{c.date}</div>
                      <div className="muted small">{c.reason}</div>
                    </div>
                    <button
                      className="btn small danger"
                      onClick={() => removeClosure(c._id)}
                    >
                      Remove
                    </button>
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