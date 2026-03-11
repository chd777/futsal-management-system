import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPitch, setFilterPitch] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPitch) params.set("pitch", filterPitch);
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);

      const [bRes, pRes] = await Promise.all([
        api.get(`/api/admin/bookings?${params.toString()}`),
        api.get("/api/admin/pitches")
      ]);
      setBookings(bRes.data.bookings || []);
      setPitches(pRes.data.pitches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [filterPitch, filterDate, filterStatus]);

  async function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api.put(`/api/admin/bookings/${id}/cancel`);
      loadData();
    } catch (e) {
      alert(e?.response?.data?.message || "Cancel failed");
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
      <h1>All Bookings</h1>
      <p className="muted mt-sm">View and manage all customer bookings.</p>

      <div className="filter-bar mt-md">
        <label>
          Filter by Pitch
          <select value={filterPitch} onChange={e => setFilterPitch(e.target.value)}>
            <option value="">All Pitches</option>
            {pitches.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label>
          Filter by Date
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </label>

        <label>
          Filter by Status
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="PAID">Paid</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>

        {(filterPitch || filterDate || filterStatus) && (
          <button className="btn small ghost" onClick={() => { setFilterPitch(""); setFilterDate(""); setFilterStatus(""); }}>
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading bookings...</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No bookings found.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Pitch</th>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => (
                <tr key={b._id}>
                  <td>{b.user?.fullName || "—"}</td>
                  <td className="muted">{b.user?.email || "—"}</td>
                  <td>{b.pitch?.name || "—"}</td>
                  <td>{b.date}</td>
                  <td>{b.slot}</td>
                  <td>NPR {b.priceAtBooking}</td>
                  <td>{statusPill(b.status)}</td>
                  <td>
                    {b.status !== "CANCELLED" && (
                      <button className="btn small danger" onClick={() => cancelBooking(b._id)}>
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

      <p className="muted small mt-md">Total: {bookings.length} booking(s)</p>
    </div>
  );
}