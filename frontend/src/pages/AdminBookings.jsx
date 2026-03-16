import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPitch, setFilterPitch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function loadBookings() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPitch) params.set("pitch", filterPitch);
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);

      const res = await api.get(`/api/admin/bookings?${params.toString()}`);
      setBookings(res.data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function loadPitches() {
    try {
      const res = await api.get("/api/admin/pitches");
      setPitches(res.data.pitches || []);
    } catch {}
  }

  useEffect(() => {
    loadPitches();
    loadBookings();
  }, []);

  useEffect(() => {
    loadBookings();
  }, [filterPitch, filterDate, filterStatus]);

  function openCancelModal(booking) {
    setCancelModal(booking);
    setCancelReason("");
  }

  async function confirmCancel() {
    if (!cancelReason.trim()) {
      alert("Please provide a reason for cancellation");
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/api/admin/bookings/${cancelModal._id}/cancel`, {
        reason: cancelReason.trim()
      });
      setCancelModal(null);
      setCancelReason("");
      loadBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  function statusPill(status) {
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending</span>;
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  return (
    <div>
      <h1>Manage Bookings</h1>
      <p className="muted mt-sm">View all bookings, filter, and manage cancellations.</p>

      {/* Filters */}
      <div className="filter-bar mt-md">
        <label>
          Pitch
          <select value={filterPitch} onChange={e => setFilterPitch(e.target.value)}>
            <option value="">All Pitches</option>
            {pitches.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </label>
        <label>
          Status
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="loading-spinner">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No bookings found.</div>
      ) : (
        <div className="table-wrap mt-md">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Pitch</th>
                <th>Date</th>
                <th>Slot</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{b.user?.fullName || "N/A"}</div>
                    <div className="muted small">{b.user?.email}</div>
                  </td>
                  <td>{b.pitch?.name || "N/A"}</td>
                  <td>{b.date}</td>
                  <td>{b.slot}</td>
                  <td>NPR {b.priceAtBooking}</td>
                  <td>
                    {statusPill(b.status)}
                    {b.cancelReason && (
                      <div className="muted small mt-sm" style={{ maxWidth: 150 }}>
                        Reason: {b.cancelReason}
                      </div>
                    )}
                  </td>
                  <td>
                    {b.status !== "CANCELLED" && (
                      <button
                        className="btn small danger"
                        onClick={() => openCancelModal(b)}
                      >
                        Cancel
                      </button>
                    )}
                    {b.status === "CANCELLED" && (
                      <span className="muted small">Cancelled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="muted small mt-md">Total: {bookings.length} booking(s)</p>

      {/* Cancel Reason Modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Cancel Booking</h2>
            <p className="muted mt-sm">
              {cancelModal.user?.fullName} — {cancelModal.pitch?.name} — {cancelModal.date} {cancelModal.slot}
            </p>

            <div className="mt-md">
              <label>
                Reason for cancellation <span style={{ color: "var(--danger)" }}>*</span>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g. Pitch maintenance, Weather conditions, Holiday closure..."
                  rows={3}
                  style={{ marginTop: 6 }}
                />
              </label>
            </div>

            <p className="muted small mt-sm">
              The customer will receive an email notification with this reason.
            </p>

            <div className="flex-gap mt-md">
              <button
                className="btn danger"
                onClick={confirmCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
              <button className="btn ghost" onClick={() => setCancelModal(null)}>
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}