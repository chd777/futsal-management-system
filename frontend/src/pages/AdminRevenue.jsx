import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AdminRevenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/admin/revenue");
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="loading-spinner">Loading analytics...</div>;
  if (!data) return <div className="empty-state">Failed to load analytics.</div>;

  const maxRev = Math.max(...(data.monthlyChart || []).map(m => m.revenue), 1);

  return (
    <div>
      <h1>Revenue Analytics</h1>
      <p className="muted mt-sm">Revenue breakdown and booking statistics.</p>

      <div className="grid4 mt-md">
        <div className="stat">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value">NPR {data.totalRevenue.toLocaleString()}</div>
          <div className="muted small mt-sm">{data.totalBookings} paid bookings</div>
        </div>
        <div className="stat">
          <div className="stat-title">Today's Revenue</div>
          <div className="stat-value">NPR {data.todayRevenue.toLocaleString()}</div>
          <div className="muted small mt-sm">{data.todayBookings} bookings today</div>
        </div>
        <div className="stat">
          <div className="stat-title">Monthly Revenue</div>
          <div className="stat-value">NPR {data.monthlyRevenue.toLocaleString()}</div>
          <div className="muted small mt-sm">{data.monthlyBookings} this month</div>
        </div>
        <div className="stat">
          <div className="stat-title">Pending Payments</div>
          <div className="stat-value">{data.pendingCount}</div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="panel mt-lg">
        <h2 className="mb-md">Monthly Revenue (Last 6 Months)</h2>
        {data.monthlyChart && data.monthlyChart.length > 0 ? (
          <div className="chart-bar-container">
            {data.monthlyChart.map((m, i) => (
              <div key={i} className="chart-bar-wrapper">
                <div className="chart-value">NPR {m.revenue.toLocaleString()}</div>
                <div
                  className="chart-bar"
                  style={{ height: `${Math.max((m.revenue / maxRev) * 140, 4)}px` }}
                />
                <div className="chart-label">{m.month}</div>
                <div className="chart-label">{m.bookings} bookings</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No data yet.</div>
        )}
      </div>

      {/* Per Pitch Breakdown */}
      <div className="panel mt-lg">
        <h2 className="mb-md">Revenue by Pitch</h2>
        {data.perPitch && data.perPitch.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Pitch</th>
                  <th>Bookings</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.perPitch.map((p, i) => (
                  <tr key={i}>
                    <td>{p.pitchName}</td>
                    <td>{p.bookingCount}</td>
                    <td>NPR {p.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">No revenue data yet.</div>
        )}
      </div>
    </div>
  );
}