import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../auth/AuthContext";
import { api } from "../api/axios";

/* ── group bookings (same logic as MyBookings/Profile) ── */
function groupBookings(bookings) {
  const map = new Map();
  for (const b of bookings) {
    const key = b.bookingGroup || b._id;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(b);
  }
  return Array.from(map.values()).map((items) => {
    const sorted = [...items].sort((a, b) => a.slot.localeCompare(b.slot));
    const first = sorted[0];
    const totalPrice = sorted.reduce((sum, b) => sum + Number(b.priceAtBooking || 0), 0);
    let displaySlot = first.slot;
    if (sorted.length > 1) {
      displaySlot = `${sorted[0].slot.split("-")[0]}-${sorted[sorted.length - 1].slot.split("-")[1]}`;
    }
    return {
      _id: first._id, groupKey: first.bookingGroup || first._id,
      pitch: first.pitch, date: first.date, slot: first.slot,
      displaySlot, status: first.status, isLoyaltyReward: first.isLoyaltyReward,
      priceAtBooking: totalPrice, createdAt: first.createdAt,
    };
  });
}

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
  const [insights, setInsights] = useState({ trendingPitches: [], peakSlots: [], totalCompletedBookings: 0 });

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/bookings/my");
        const rawBookings = res.data.bookings || [];
        const today = new Date().toISOString().slice(0, 10);
        const grouped = groupBookings(rawBookings);

        const upcoming = grouped.filter(b => b.date >= today && b.status !== "CANCELLED");
        const paidGroups = grouped.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER");
        const cancelledGroups = grouped.filter(b => b.status === "CANCELLED");
        const totalSpent = rawBookings
          .filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER")
          .reduce((sum, b) => sum + (b.priceAtBooking || 0), 0);
        const freeEarned = rawBookings.filter(b => b.isLoyaltyReward).length;

        setStats({ total: grouped.length, upcoming: upcoming.length, paid: paidGroups.length, cancelled: cancelledGroups.length, totalSpent, freeEarned });

        const sortedUpcoming = [...upcoming].sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));
        setUpcomingBookings(sortedUpcoming.slice(0, 4));
        if (sortedUpcoming.length > 0) setNextBooking(sortedUpcoming[0]);

        const paidRaw = rawBookings.filter(b => b.status === "PAID" || b.status === "CONFIRMED_PAY_LATER");
        const pitchCount = {};
        for (const b of paidRaw) {
          const id = b.pitch?._id || "unknown";
          if (!pitchCount[id]) pitchCount[id] = { name: b.pitch?.name || "Unknown", address: b.pitch?.address || "", count: 0, freeEarned: 0 };
          pitchCount[id].count++;
          if (b.isLoyaltyReward) pitchCount[id].freeEarned++;
        }
        const loyaltyList = Object.values(pitchCount).sort((a, b) => b.count - a.count);
        setLoyaltyData(loyaltyList);
        if (loyaltyList.length > 0 && loyaltyList[0].count >= 2) setMostBooked(loyaltyList[0]);

        const sortedAll = [...grouped].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setRecentActivity(sortedAll.slice(0, 5));

        const insightsRes = await api.get("/api/insights/user-dashboard");
        setInsights(insightsRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!nextBooking) return;
    function updateCountdown() {
      const slotStart = nextBooking.slot.split("-")[0];
      const slotEnd = nextBooking.slot.split("-")[1];
      const target = new Date(`${nextBooking.date}T${slotStart}:00`);
      const endTime = new Date(`${nextBooking.date}T${slotEnd}:00`);
      const now = new Date();
      if (now > endTime) {
        const rem = upcomingBookings.filter(b => new Date(`${b.date}T${b.slot.split("-")[1]}:00`) > now);
        rem.length > 0 ? setNextBooking(rem[0]) : setNextBooking(null);
        setCountdown(""); return;
      }
      if (now >= target && now <= endTime) { setCountdown("Happening now!"); return; }
      const diff = target - now;
      const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000);
      setCountdown(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    }
    updateCountdown();
    const iv = setInterval(updateCountdown, 60000);
    return () => clearInterval(iv);
  }, [nextBooking, upcomingBookings]);

  function statusPill(status, isLoyalty) {
    if (isLoyalty) return <span className="pill paid">🎉 Free</span>;
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "CONFIRMED_PAY_LATER") return <span className="pill pending">Pay at Venue</span>;
    if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending</span>;
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  function formatDate(dateStr) {
    const t = new Date().toISOString().slice(0, 10);
    const tm = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    if (dateStr === t) return "Today";
    if (dateStr === tm) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  }

  return (
    <div>
      {/* Next Game Banner */}
      {nextBooking && !loading && (
        <section className="panel" style={{
          padding: "20px 24px", marginBottom: 14,
          background: "linear-gradient(135deg, rgba(91,140,255,0.15), rgba(61,220,151,0.08))",
          border: "1px solid rgba(91,140,255,0.25)",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16
        }}>
          <div>
            <div className="muted small" style={{ marginBottom: 4 }}>⏰ YOUR NEXT GAME</div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{nextBooking.pitch?.name || "Pitch"}</div>
            <div className="muted" style={{ marginTop: 4 }}>
              {formatDate(nextBooking.date)} · {nextBooking.displaySlot || nextBooking.slot}
              {nextBooking.pitch?.address && <span> · {nextBooking.pitch.address}</span>}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="muted small" style={{ marginBottom: 4 }}>STARTS IN</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: countdown === "Happening now!" ? "var(--ok)" : "var(--accent)", letterSpacing: 1 }}>{countdown}</div>
            {statusPill(nextBooking.status, nextBooking.isLoyaltyReward)}
          </div>
        </section>
      )}

      {/* Hero */}
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
              Discover top futsal venues, manage your bookings, complete secure online payments, and track your upcoming matches in one place.
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
              <div className="hero-mini-value" style={{ fontSize: 18 }}>
                {loading ? "..." : `NPR ${stats.totalSpent.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions — compact 3-column grid */}
      <section className="mt-lg">
        <div className="quick-grid">
          <Link to="/pitches" className="panel quick-card" style={{ textDecoration: "none", color: "inherit", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(91,140,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📍</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>Explore Pitches</h3>
                <p className="muted small" style={{ margin: "2px 0 0" }}>Browse grounds with pricing & ratings</p>
              </div>
            </div>
          </Link>

          <Link to="/my-bookings" className="panel quick-card" style={{ textDecoration: "none", color: "inherit", padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(61,220,151,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📅</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>Manage Bookings</h3>
                <p className="muted small" style={{ margin: "2px 0 0" }}>Upcoming matches & payment status</p>
              </div>
            </div>
          </Link>

          <div className="panel quick-card" style={{ cursor: "pointer", padding: 16 }} onClick={() => setLoyaltyModal(true)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(245,166,35,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎁</div>
              <div>
                <h3 style={{ margin: 0, fontSize: 14 }}>Loyalty Rewards</h3>
                <p className="muted small" style={{ margin: "2px 0 0" }}>
                  {stats.freeEarned > 0 ? `${stats.freeEarned} free game${stats.freeEarned > 1 ? "s" : ""} earned!` : "Get every 6th game FREE!"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Insights */}
      <section className="two-col mt-lg">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 style={{ marginBottom: 4 }}>🔥 Recommended Right Now</h2>
              <p className="muted small" style={{ margin: 0 }}>Most booked pitches across the platform</p>
            </div>
          </div>
          {insights.trendingPitches.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>No trending data yet.</div>
          ) : (
            <div className="list">
              {insights.trendingPitches.slice(0, 3).map((p, i) => (
                <div key={p.pitchId || i} className="list-item">
                  <div>
                    <div className="list-title">#{i + 1} {p.name}</div>
                    <div className="muted small">{p.address}</div>
                  </div>
                  <span className="pill paid">{p.count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head">
            <div>
              <h2 style={{ marginBottom: 4 }}>⏰ Smart Insights</h2>
              <p className="muted small" style={{ margin: 0 }}>Peak playing hours based on real data</p>
            </div>
          </div>
          {insights.peakSlots.length === 0 ? (
            <div className="empty-state" style={{ padding: 20 }}>No peak hour data yet.</div>
          ) : (
            <div className="list">
              {insights.peakSlots.slice(0, 3).map((s, i) => (
                <div key={s.slot || i} className="list-item">
                  <div>
                    <div className="list-title">#{i + 1} {s.slot}</div>
                    <div className="muted small">Rush hour slot</div>
                  </div>
                  <span className="pill pending">{s.count} bookings</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Upcoming + Summary */}
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
            <div className="empty-state" style={{ border: "1px dashed var(--border)", borderRadius: 14, padding: 24 }}>
              <p className="muted">No upcoming bookings yet.</p>
              <Link to="/pitches" className="btn small mt-sm">Book Your First Pitch</Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {upcomingBookings.map(b => (
                <div key={b._id || b.groupKey} className="booking-card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{b.pitch?.name || "Pitch"}</div>
                      <div className="muted small">{formatDate(b.date)} · {b.displaySlot || b.slot}</div>
                      {b.pitch?.address && <div className="muted small mt-sm">{b.pitch.address}</div>}
                    </div>
                    <div>{statusPill(b.status, b.isLoyaltyReward)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Booking Summary */}
          <div className="panel">
            <h2 className="mb-sm">Booking Summary</h2>
            <div style={{ display: "grid", gap: 10 }}>
              <div className="flex-between">
                <span className="muted">Total Bookings</span>
                <span style={{ fontWeight: 700 }}>{stats.total}</span>
              </div>
              <div className="flex-between">
                <span className="muted">Completed</span>
                <span style={{ fontWeight: 700, color: "var(--ok)" }}>{stats.paid}</span>
              </div>
              <div className="flex-between">
                <span className="muted">Cancelled</span>
                <span style={{ fontWeight: 700, color: "var(--danger)" }}>{stats.cancelled}</span>
              </div>
              <div className="flex-between">
                <span className="muted">Free Games Earned</span>
                <span style={{ fontWeight: 700, color: "var(--ok)" }}>{stats.freeEarned} 🎁</span>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }} className="flex-between">
                <span className="muted">Total Spent</span>
                <span style={{ fontWeight: 800, color: "var(--accent)" }}>NPR {stats.totalSpent.toLocaleString()}</span>
              </div>
              {mostBooked && (
                <div style={{ marginTop: 6, padding: "12px 14px", background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)", borderRadius: 12 }}>
                  <div className="muted small" style={{ marginBottom: 4 }}>⭐ YOUR GO-TO PITCH</div>
                  <div style={{ fontWeight: 700 }}>{mostBooked.name}</div>
                  <div className="muted small">{mostBooked.address} · {mostBooked.count} bookings</div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="panel">
            <h2 className="mb-sm">Recent Activity</h2>
            {loading ? <div className="muted">Loading...</div>
            : recentActivity.length === 0 ? <div className="muted small">No activity yet. Start booking!</div>
            : (
              <div style={{ display: "grid", gap: 8 }}>
                {recentActivity.map(b => (
                  <div key={b._id || b.groupKey} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(34,48,71,0.5)" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b.pitch?.name || "Pitch"}</div>
                      <div className="muted small">{b.date} · {b.displaySlot || b.slot}</div>
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

      {/* Loyalty Modal */}
      {loyaltyModal && (
        <div className="modal-overlay" onClick={() => setLoyaltyModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <h2>🎁 Loyalty Rewards</h2>
              <button className="btn small ghost" onClick={() => setLoyaltyModal(false)}>✕</button>
            </div>
            <div style={{ padding: "14px 16px", borderRadius: 12, marginBottom: 16, background: "rgba(91,140,255,0.08)", border: "1px solid rgba(91,140,255,0.2)" }}>
              <p style={{ margin: 0, fontSize: 14 }}>
                Book <strong>5 times</strong> at the same pitch and your <strong style={{ color: "var(--ok)" }}>6th booking is FREE!</strong> The cycle repeats.
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
                 const cycleProgress = p.count % 5 === 0 && p.count > 0 ? 5 : p.count % 5;
const nextIsFree = cycleProgress === 5;
const remaining = 5 - cycleProgress;
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
                          <div style={{ fontSize: 22, fontWeight: 800, color: nextIsFree ? "var(--ok)" : "var(--accent)" }}>{cycleProgress}/5</div>
                          {p.freeEarned > 0 && <div className="muted small">{p.freeEarned} free earned</div>}
                        </div>
                      </div>
                      <div style={{ marginTop: 10, background: "var(--border)", borderRadius: 8, height: 6, overflow: "hidden" }}>
                        <div style={{
                          width: `${nextIsFree ? 100 : (cycleProgress / 5) * 100}%`, height: "100%",
                          background: nextIsFree ? "var(--ok)" : "var(--accent)", borderRadius: 8, transition: "width 0.3s"
                        }} />
                      </div>
                      <div className="muted small" style={{ marginTop: 6 }}>
                        {nextIsFree ? "🎉 Your next booking here is FREE!" : `${remaining} more booking${remaining !== 1 ? "s" : ""} until free game`}
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