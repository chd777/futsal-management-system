import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { api } from "../api/axios";

export default function Home() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, paid: 0, cancelled: 0, totalSpent: 0, freeEarned: 0 });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [nextBooking, setNextBooking] = useState(null);
  const [mostBooked, setMostBooked] = useState(null);
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [loyaltyModal, setLoyaltyModal] = useState(false);
  const [loyaltyData, setLoyaltyData] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/bookings/my");
        const bookings = res.data.bookings || [];
        const today = new Date().toISOString().slice(0, 10);

        const upcoming = bookings.filter(b => b.date >= today && b.status !== "CANCELLED");
        const paid = bookings.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER");
        const cancelled = bookings.filter(b => b.status === "CANCELLED");
        const totalSpent = paid.reduce((sum, b) => sum + (b.priceAtBooking || 0), 0);
        const freeEarned = bookings.filter(b => b.isLoyaltyReward).length;

        setStats({
          total: bookings.length,
          upcoming: upcoming.length,
          paid: paid.length,
          cancelled: cancelled.length,
          totalSpent,
          freeEarned
        });

        const sortedUpcoming = [...upcoming].sort((a, b) => {
          const da = a.date + a.slot;
          const db = b.date + b.slot;
          return da.localeCompare(db);
        });
        setUpcomingBookings(sortedUpcoming.slice(0, 4));
        if (sortedUpcoming.length > 0) {
          setNextBooking(sortedUpcoming[0]);
        }

        // Build loyalty data per pitch
        const pitchCount = {};
        for (const b of paid) {
          const id = b.pitch?._id || "unknown";
          const name = b.pitch?.name || "Unknown";
          if (!pitchCount[id]) {
            pitchCount[id] = { name, address: b.pitch?.address || "", count: 0, freeEarned: 0 };
          }
          pitchCount[id].count++;
          if (b.isLoyaltyReward) pitchCount[id].freeEarned++;
        }
        const loyaltyList = Object.values(pitchCount).sort((a, b) => b.count - a.count);
        setLoyaltyData(loyaltyList);

        const sorted = [...loyaltyList];
        if (sorted.length > 0 && sorted[0].count >= 2) {
          setMostBooked(sorted[0]);
        }

        const sortedAll = [...bookings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentActivity(sortedAll.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live countdown with auto-switch
  useEffect(() => {
    if (!nextBooking) return;

    function updateCountdown() {
      const slotStart = nextBooking.slot.split("-")[0];
      const slotEnd = nextBooking.slot.split("-")[1];
      const target = new Date(`${nextBooking.date}T${slotStart}:00`);
      const endTime = new Date(`${nextBooking.date}T${slotEnd}:00`);
      const now = new Date();

      if (now > endTime) {
        const remaining = upcomingBookings.filter(b => {
          const bEnd = new Date(`${b.date}T${b.slot.split("-")[1]}:00`);
          return bEnd > now;
        });
        if (remaining.length > 0) {
          setNextBooking(remaining[0]);
        } else {
          setNextBooking(null);
        }
        setCountdown("");
        return;
      }

      if (now >= target && now <= endTime) {
        setCountdown("Happening now!");
        return;
      }

      const diff = target - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) setCountdown(`${days}d ${hrs}h ${mins}m`);
      else if (hrs > 0) setCountdown(`${hrs}h ${mins}m`);
      else setCountdown(`${mins}m`);
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextBooking, upcomingBookings]);

  function statusPill(status, isLoyalty) {
    if (isLoyalty) return <span className="pill paid" style={{ background: "rgba(61,220,151,0.15)" }}>🎉 Free</span>;
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "CONFIRMED_PAY_LATER") return <span className="pill pending">Pay at Venue</span>;
    if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending</span>;
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDate(dateStr) {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div>
      {/* Next Booking Highlight */}
      {nextBooking && !loading && (
        <section style={{
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(91,140,255,0.15), rgba(61,220,151,0.08))",
          border: "1px solid rgba(91,140,255,0.25)",
          borderRadius: 16, marginBottom: 14,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexWrap: "wrap", gap: 16
        }}>
          <div>
            <div className="muted small" style={{ marginBottom: 4 }}>⏰ YOUR NEXT GAME</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{nextBooking.pitch?.name || "Pitch"}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {formatDate(nextBooking.date)} &middot; {nextBooking.slot}
              {nextBooking.pitch?.address && <span> &middot; {nextBooking.pitch.address}</span>}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="muted small" style={{ marginBottom: 4 }}>STARTS IN</div>
            <div style={{
              fontSize: 28, fontWeight: 900,
              color: countdown === "Happening now!" ? "var(--ok)" : "var(--accent)",
              letterSpacing: 1
            }}>{countdown}</div>
            {statusPill(nextBooking.status, nextBooking.isLoyaltyReward)}
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="panel" style={{
        padding: "22px",
        background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(34,197,94,0.10), rgba(15,23,42,1))",
        border: "1px solid var(--border)", overflow: "hidden", position: "relative"
      }}>
        <div className="hero-grid">
          <div>
            <div className="hero-badge">⚽ Smart futsal booking platform</div>
            <h1 className="hero-title">Welcome back, {user?.fullName || "Player"}</h1>
            <p className="muted hero-subtext">
              Discover top futsal venues, manage your bookings, complete secure
              online payments, and track your upcoming matches in one place.
            </p>
            <div className="hero-actions">
              <Link to="/pitches" className="btn">Browse Pitches</Link>
              <Link to="/my-bookings" className="btn ghost">My Bookings</Link>
            </div>
          </div>
          <div className="hero-mini-stats">
            <div className="hero-mini-card">
              <div className="hero-mini-label">Total Bookings</div>
              <div className="hero-mini-value">{loading ? "..." : stats.total}</div>
            </div>
            <div className="hero-mini-card">
              <div className="hero-mini-label">Upcoming Matches</div>
              <div className="hero-mini-value">{loading ? "..." : stats.upcoming}</div>
            </div>
            <div className="hero-mini-card">
              <div className="hero-mini-label">Completed</div>
              <div className="hero-mini-value">{loading ? "..." : stats.paid}</div>
            </div>
            <div className="hero-mini-card">
              <div className="hero-mini-label">Total Spent</div>
              <div className="hero-mini-value" style={{ fontSize: 18 }}>{loading ? "..." : `NPR ${stats.totalSpent.toLocaleString()}`}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section className="mt-lg">
        <div className="quick-grid">
          <Link to="/pitches" className="panel quick-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="quick-icon">📍</div>
            <h3 style={{ margin: 0 }}>Explore Pitches</h3>
            <p className="muted mt-sm">Browse available futsal grounds with pricing, timings, and ratings.</p>
          </Link>

          <Link to="/my-bookings" className="panel quick-card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="quick-icon">📅</div>
            <h3 style={{ margin: 0 }}>Manage Bookings</h3>
            <p className="muted mt-sm">View your upcoming matches, payment status, and booking history.</p>
          </Link>

          {/* Loyalty card opens modal instead of linking */}
          <div className="panel quick-card" style={{ cursor: "pointer" }} onClick={() => setLoyaltyModal(true)}>
            <div className="quick-icon">🎁</div>
            <h3 style={{ margin: 0 }}>Loyalty Rewards</h3>
            <p className="muted mt-sm">
              {stats.freeEarned > 0
                ? `You've earned ${stats.freeEarned} free game${stats.freeEarned > 1 ? "s" : ""}! Tap to see your progress.`
                : "Book 5 times at the same pitch and get your 6th game FREE! Tap to learn more."
              }
            </p>
          </div>
        </div>
      </section>

      {/* Upcoming + Right Sidebar */}
      <section className="two-col mt-lg">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 style={{ marginBottom: 4 }}>Upcoming Bookings</h2>
              <p className="muted small" style={{ margin: 0 }}>Your next scheduled futsal matches</p>
            </div>
            <Link to="/my-bookings" className="btn small ghost">View All</Link>
          </div>

          {loading ? (
            <div className="muted">Loading...</div>
          ) : upcomingBookings.length === 0 ? (
            <div className="empty-state" style={{ border: "1px dashed var(--border)", borderRadius: "14px", padding: "24px" }}>
              <p className="muted">No upcoming bookings yet.</p>
              <Link to="/pitches" className="btn small mt-sm">Book Your First Pitch</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "14px" }}>
              {upcomingBookings.map(b => (
                <div key={b._id} className="booking-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>{b.pitch?.name || "Pitch"}</div>
                      <div className="muted small">{formatDate(b.date)} &middot; {b.slot}</div>
                      {b.pitch?.address && <div className="muted small mt-sm">{b.pitch.address}</div>}
                    </div>
                    <div>{statusPill(b.status, b.isLoyaltyReward)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {/* Booking Summary */}
          <div className="panel">
            <h2 className="mb-sm">Booking Summary</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Total Bookings</span>
                <span style={{ fontWeight: 700 }}>{stats.total}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Completed</span>
                <span style={{ fontWeight: 700, color: "var(--ok)" }}>{stats.paid}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Cancelled</span>
                <span style={{ fontWeight: 700, color: "var(--danger)" }}>{stats.cancelled}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Free Games Earned</span>
                <span style={{ fontWeight: 700, color: "var(--ok)" }}>{stats.freeEarned} 🎁</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
                <span className="muted">Total Spent</span>
                <span style={{ fontWeight: 800, color: "var(--accent)" }}>NPR {stats.totalSpent.toLocaleString()}</span>
              </div>

              {mostBooked && (
                <div style={{
                  marginTop: 6, padding: "12px 14px",
                  background: "rgba(91,140,255,0.08)",
                  border: "1px solid rgba(91,140,255,0.2)", borderRadius: 12
                }}>
                  <div className="muted small" style={{ marginBottom: 4 }}>⭐ YOUR GO-TO PITCH</div>
                  <div style={{ fontWeight: 700 }}>{mostBooked.name}</div>
                  <div className="muted small">{mostBooked.address} &middot; {mostBooked.count} bookings</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="panel">
            <h2 className="mb-sm">Recent Activity</h2>
            {loading ? (
              <div className="muted">Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div className="muted small">No activity yet. Start booking!</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {recentActivity.map(b => (
                  <div key={b._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(34,48,71,0.5)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.pitch?.name || "Pitch"}</div>
                      <div className="muted small">{b.date} &middot; {b.slot}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {statusPill(b.status, b.isLoyaltyReward)}
                      <div className="muted small mt-sm">{timeAgo(b.createdAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Loyalty Rewards Modal */}
      {loyaltyModal && (
        <div className="modal-overlay" onClick={() => setLoyaltyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <h2>🎁 Loyalty Rewards</h2>
              <button className="btn small ghost" onClick={() => setLoyaltyModal(false)}>✕</button>
            </div>

            <div style={{
              padding: "14px 16px", borderRadius: 12, marginBottom: 16,
              background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)"
            }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                Book <strong>5 times</strong> at the same pitch and your <strong style={{ color: "var(--ok)" }}>6th booking is FREE!</strong> The cycle repeats — every 6th booking is on us.
              </p>
            </div>

            {loyaltyData.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>
                <p className="muted">No bookings yet. Start playing to earn free games!</p>
                <Link to="/pitches" className="btn small mt-sm" onClick={() => setLoyaltyModal(false)}>Browse Pitches</Link>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {loyaltyData.map((p, i) => {
                  const progress = p.count % 5;
                  const nextIsFree = progress === 0 && p.count > 0;
                  const remaining = nextIsFree ? 0 : 5 - progress;

                  return (
                    <div key={i} style={{
                      padding: "14px 16px", borderRadius: 14,
                      border: nextIsFree ? "1px solid rgba(61,220,151,0.3)" : "1px solid var(--border)",
                      background: nextIsFree ? "rgba(61,220,151,0.06)" : "rgba(15,22,34,0.55)"
                    }}>
                      <div className="flex-between">
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
                          <div className="muted small">{p.address}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: nextIsFree ? "var(--ok)" : "var(--accent)" }}>
                            {progress}/5
                          </div>
                          {p.freeEarned > 0 && (
                            <div className="muted small">{p.freeEarned} free earned</div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginTop: 10, background: "var(--border)", borderRadius: 8, height: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${nextIsFree ? 100 : (progress / 5) * 100}%`,
                          height: "100%",
                          background: nextIsFree ? "var(--ok)" : "var(--accent)",
                          borderRadius: 8, transition: "width 0.3s"
                        }} />
                      </div>

                      <div className="muted small" style={{ marginTop: 6 }}>
                        {nextIsFree
                          ? "🎉 Your next booking here is FREE!"
                          : `${remaining} more booking${remaining !== 1 ? "s" : ""} until free game`
                        }
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div className="muted small">Total free games earned: <strong style={{ color: "var(--ok)" }}>{stats.freeEarned}</strong></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}