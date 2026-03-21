import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { api } from "../api/axios";

export default function Home() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, paid: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/bookings/my");
        const bookings = res.data.bookings || [];
        const today = new Date().toISOString().slice(0, 10);

        const upcoming = bookings.filter(b => b.date >= today && b.status !== "CANCELLED");
        const paid = bookings.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER");

        setStats({ total: bookings.length, upcoming: upcoming.length, paid: paid.length });
        setUpcomingBookings(upcoming.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function statusPill(status) {
  if (status === "PAID") return <span className="pill paid">Paid</span>;
  if (status === "CONFIRMED_PAY_LATER") return <span className="pill pending">Pay at Venue</span>;
  if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending</span>;
  if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
  return <span className="pill">{status}</span>;
}

  return (
    <div>
      <header style={{ padding: "10px 0 16px" }}>
        <h1>Welcome back, {user?.fullName || "Player"}</h1>
        <p className="muted mt-sm">Find and book the best futsal pitches near you.</p>
      </header>

      <div className="grid4">
        <div className="stat">
          <div className="stat-title">Total Bookings</div>
          <div className="stat-value">{loading ? "..." : stats.total}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Upcoming</div>
          <div className="stat-value">{loading ? "..." : stats.upcoming}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Paid</div>
          <div className="stat-value">{loading ? "..." : stats.paid}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Quick Actions</div>
          <div className="mt-sm">
            <Link to="/pitches" className="btn small">Browse Pitches</Link>
          </div>
        </div>
      </div>

      <div className="two-col mt-lg">
        <div className="panel">
          <div className="panel-head">
            <h2>Upcoming Bookings</h2>
            <Link to="/my-bookings" className="btn small ghost">View All</Link>
          </div>

          {loading ? (
            <div className="muted">Loading...</div>
          ) : upcomingBookings.length === 0 ? (
            <div className="empty-state">
              <p className="muted">No upcoming bookings.</p>
              <Link to="/pitches" className="btn small mt-sm">Book Now</Link>
            </div>
          ) : (
            <div className="list">
              {upcomingBookings.map(b => (
                <div key={b._id} className="list-item">
                  <div>
                    <div className="list-title">{b.pitch?.name || "Pitch"}</div>
                    <div className="muted small">{b.date} &middot; {b.slot}</div>
                  </div>
                  {statusPill(b.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="mb-md">Quick Links</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <Link to="/pitches" className="btn ghost">Browse Pitches</Link>
            <Link to="/my-bookings" className="btn ghost">My Bookings</Link>
          </div>
        </div>
      </div>
    </div>
  );
}