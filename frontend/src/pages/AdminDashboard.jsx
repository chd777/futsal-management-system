import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/revenue");
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading-spinner">Loading dashboard...</div>;

  return (
    <div>
      <h1>Dashboard</h1>
      <p className="muted mt-sm">Overview of your futsal business.</p>

      <div className="grid4 mt-md">
        <div className="stat">
          <div className="stat-title">Total Bookings (Paid)</div>
          <div className="stat-value">{stats?.totalBookings || 0}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">NPR {(stats?.totalRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Today's Revenue</div>
          <div className="stat-value">NPR {(stats?.todayRevenue || 0).toLocaleString()}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Pending Payments</div>
          <div className="stat-value">{stats?.pendingCount || 0}</div>
        </div>
      </div>

      <div className="grid2 mt-md">
        <div className="stat">
          <div className="stat-title">This Month's Revenue</div>
          <div className="stat-value">NPR {(stats?.monthlyRevenue || 0).toLocaleString()}</div>
          <div className="muted small mt-sm">{stats?.monthlyBookings || 0} bookings this month</div>
        </div>
        <div className="stat">
          <div className="stat-title">Today's Bookings</div>
          <div className="stat-value">{stats?.todayBookings || 0}</div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid3 mt-lg">
        <Link to="/admin/pitches" className="panel" style={{ textDecoration: "none" }}>
          <h2>Manage Pitches</h2>
          <p className="muted mt-sm">Add, edit, enable/disable pitches.</p>
        </Link>
        <Link to="/admin/bookings" className="panel" style={{ textDecoration: "none" }}>
          <h2>View Bookings</h2>
          <p className="muted mt-sm">See all bookings, filter, cancel.</p>
        </Link>
        <Link to="/admin/revenue" className="panel" style={{ textDecoration: "none" }}>
          <h2>Revenue Analytics</h2>
          <p className="muted mt-sm">Charts and per-pitch breakdown.</p>
        </Link>
      </div>
    </div>
  );
}