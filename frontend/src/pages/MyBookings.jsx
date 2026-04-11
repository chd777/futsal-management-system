import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/axios";
import StarRating from "../components/StarRating";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedSet, setReviewedSet] = useState(new Set());

  // FILTER STATES
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  async function loadBookings() {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        api.get("/api/bookings/my"),
        api.get("/api/reviews/my")
      ]);

      setBookings(bRes.data.bookings || []);

      const reviews = rRes.data.reviews || [];
      const reviewedBookingIds = new Set();
      for (const r of reviews) {
        if (r.booking) {
          reviewedBookingIds.add(r.booking._id || r.booking);
        }
      }
      setReviewedSet(reviewedBookingIds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  function formatDate(dateStr) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    if (dateStr === todayStr) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";

    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function sortSlots(items) {
    return [...items].sort((a, b) => a.slot.localeCompare(b.slot));
  }

  function buildDisplaySlot(items) {
    const sorted = sortSlots(items);
    if (sorted.length === 0) return "";
    if (sorted.length === 1) return sorted[0].slot;

    const firstStart = sorted[0].slot.split("-")[0];
    const lastEnd = sorted[sorted.length - 1].slot.split("-")[1];
    const hours = sorted.length;

    return `${firstStart}-${lastEnd} (${hours} hr${hours > 1 ? "s" : ""})`;
  }

  const groupedBookings = useMemo(() => {
    const map = new Map();

    for (const b of bookings) {
      const key = b.bookingGroup || b._id;

      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(b);
    }

    return Array.from(map.entries())
      .map(([groupKey, items]) => {
        const sortedItems = sortSlots(items);
        const first = sortedItems[0];
        const totalPrice = sortedItems.reduce(
          (sum, item) => sum + Number(item.priceAtBooking || 0),
          0
        );

        return {
          groupKey,
          representativeId: first._id,
          bookingGroup: first.bookingGroup || null,
          pitch: first.pitch,
          date: first.date,
          status: first.status,
          refundStatus: first.refundStatus,
          cancelReason: first.cancelReason,
          isLoyaltyReward: first.isLoyaltyReward,
          displaySlot: buildDisplaySlot(sortedItems),
          priceAtBooking: totalPrice,
          bookingIds: sortedItems.map((item) => item._id),
          bookings: sortedItems,
          totalHours: sortedItems.length,
          isReviewed: sortedItems.some((item) => reviewedSet.has(item._id))
        };
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.displaySlot.localeCompare(b.displaySlot);
      });
  }, [bookings, reviewedSet]);

  const upcomingList = groupedBookings.filter(
    (b) => b.date >= today && b.status !== "CANCELLED"
  );
  const pastList = groupedBookings.filter(
    (b) => b.date < today || b.status === "CANCELLED"
  );

  const filteredBase =
    tab === "upcoming" ? upcomingList : tab === "past" ? pastList : groupedBookings;

  const filtered = filteredBase.filter((b) => {
    const matchesSearch = b.pitch?.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ? true : b.status === statusFilter;

    const matchesDate = dateFilter ? b.date === dateFilter : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  async function cancelBookingGroup(group) {
    if (!confirm("Cancel this booking?")) return;

    try {
      await Promise.all(
        group.bookingIds.map((id) => api.put(`/api/bookings/${id}/cancel`))
      );
      loadBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Cancel failed");
    }
  }

  async function handleKhaltiPayment(group) {
    try {
      const res = await api.post("/api/payments/khalti/initiate", {
        bookingId: group.representativeId
      });

      if (res.data?.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        alert("Payment URL not received.");
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to initiate payment");
    }
  }

  async function payLater(group) {
    if (!confirm("Confirm booking with Pay Later? You'll need to pay with cash at the venue.")) {
      return;
    }

    try {
      const res = await api.post("/api/payments/pay-later", {
        bookingId: group.representativeId
      });
      alert(res.data.message || "Booking confirmed with Pay Later!");
      loadBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to confirm");
    }
  }

  async function submitReview() {
    if (!reviewModal) return;

    setReviewLoading(true);
    try {
      await api.post("/api/reviews", {
        bookingId: reviewModal.representativeId,
        rating: reviewRating,
        comment: reviewComment
      });

      setReviewedSet((prev) => new Set([...prev, reviewModal.representativeId]));
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment("");
      alert("Review submitted! Thank you.");
      loadBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  function statusPill(status, isLoyalty, refundStatus) {
    if (isLoyalty) {
      return (
        <span className="pill paid" style={{ background: "rgba(61,220,151,0.15)" }}>
          🎉 Free
        </span>
      );
    }
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "CONFIRMED_PAY_LATER") {
      return <span className="pill pending">Pay at Venue</span>;
    }
    if (status === "PENDING_PAYMENT") {
      return <span className="pill pending">Pending</span>;
    }
    if (status === "CANCELLED" && refundStatus === "REFUNDED") {
      return <span className="pill cancelled">Cancelled & Refunded</span>;
    }
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  // Date input style to fix visibility on dark theme
  const dateInputStyle = {
    colorScheme: "dark",
    minWidth: 160,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid var(--border)",
    background: "#0f1622",
    color: "#eef2f7",
    fontSize: 14,
    outline: "none"
  };

  const hasFilters = searchTerm || statusFilter !== "ALL" || dateFilter;

  function clearFilters() {
    setSearchTerm("");
    setStatusFilter("ALL");
    setDateFilter("");
  }

  return (
    <div>
      <h1>My Bookings</h1>
      <p className="muted mt-sm">View, manage, and pay for your bookings.</p>

      <div className="tabs mt-md">
        <button
          className={`tab ${tab === "upcoming" ? "active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcomingList.length})
        </button>
        <button
          className={`tab ${tab === "past" ? "active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past ({pastList.length})
        </button>
        <button
          className={`tab ${tab === "all" ? "active" : ""}`}
          onClick={() => setTab("all")}
        >
          All ({groupedBookings.length})
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar mt-md" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label>
          Search Pitch
          <input
            type="text"
            placeholder="Search by pitch name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </label>

        <label>
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PAID">Paid</option>
            <option value="PENDING_PAYMENT">Pending</option>
            <option value="CONFIRMED_PAY_LATER">Pay at Venue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>

        <label>
          Date
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={dateInputStyle}
          />
        </label>

        {hasFilters && (
          <button
            className="btn small ghost"
            onClick={clearFilters}
            style={{ marginBottom: 1 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-spinner">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <p>No bookings found in this category.</p>
          {hasFilters && (
            <button className="btn small mt-md" onClick={clearFilters}>
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="list">
          {filtered.map((g) => (
            <div
              key={g.groupKey}
              className="list-item"
              style={{ flexDirection: "column", alignItems: "stretch" }}
            >
              <div className="flex-between">
                <div>
                  <div className="list-title">{g.pitch?.name || "Pitch"}</div>
                  <div className="muted small mt-sm">{g.pitch?.address}</div>

                  <div className="muted small mt-sm">
                    {formatDate(g.date)} &middot; {g.displaySlot} &middot;{" "}
                    {g.isLoyaltyReward ? (
                      <span style={{ color: "var(--ok)", fontWeight: 700 }}>
                        FREE (Loyalty)
                      </span>
                    ) : (
                      <span>NPR {g.priceAtBooking}</span>
                    )}
                  </div>

                  {g.status === "CANCELLED" && g.cancelReason && (
                    <div
                      className="alert error"
                      style={{ marginTop: 8, padding: "8px 12px", fontSize: 13 }}
                    >
                      <strong>Cancelled:</strong> {g.cancelReason}
                    </div>
                  )}

                  {g.status === "CONFIRMED_PAY_LATER" && (
                    <div
                      className="alert warn"
                      style={{ marginTop: 8, padding: "8px 12px", fontSize: 13 }}
                    >
                      Pay <strong>NPR {g.priceAtBooking}</strong> cash at the venue.
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 8
                  }}
                >
                  {statusPill(g.status, g.isLoyaltyReward, g.refundStatus)}

                  <div className="flex-gap">
                    {g.status === "PENDING_PAYMENT" && (
                      <>
                        <button
                          className="btn small ok"
                          onClick={() => handleKhaltiPayment(g)}
                        >
                          Pay Now
                        </button>
                        <button
                          className="btn small warn"
                          onClick={() => payLater(g)}
                        >
                          Pay Later
                        </button>
                        <button
                          className="btn small danger"
                          onClick={() => cancelBookingGroup(g)}
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {(g.status === "PAID" || g.status === "CONFIRMED_PAY_LATER") &&
                      g.date <= today &&
                      !g.isReviewed && (
                        <button
                          className="btn small"
                          onClick={() => {
                            setReviewModal(g);
                            setReviewRating(5);
                            setReviewComment("");
                          }}
                        >
                          Write Review
                        </button>
                      )}

                    {g.isReviewed && (
                      <span
                        className="pill active"
                        style={{ background: "rgba(59,130,246,0.15)" }}
                      >
                        ⭐ Reviewed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Write a Review</h2>
            <p className="muted mt-sm">
              {reviewModal.pitch?.name} &middot; {formatDate(reviewModal.date)}
            </p>

            <div className="mt-md">
              <label className="mb-sm">Rating</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>

            <div className="mt-md">
              <label>
                Comment (optional)
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="How was your experience?"
                  rows={3}
                />
              </label>
            </div>

            <div className="flex-gap mt-md">
              <button className="btn ok" onClick={submitReview} disabled={reviewLoading}>
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
              <button className="btn ghost" onClick={() => setReviewModal(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}