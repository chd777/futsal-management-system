import React, { useEffect, useState } from "react";
import { api } from "../api/axios";
import StarRating from "../components/StarRating";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming");

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewedSet, setReviewedSet] = useState(new Set());

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

  useEffect(() => { loadBookings(); }, []);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = bookings.filter(b => {
    if (tab === "upcoming") return b.date >= today && b.status !== "CANCELLED";
    if (tab === "past") return b.date < today || b.status === "CANCELLED";
    return true;
  });

  async function cancelBooking(id) {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api.put(`/api/bookings/${id}/cancel`);
      loadBookings();
    } catch (e) {
      alert(e?.response?.data?.message || "Cancel failed");
    }
  }

  async function initiatePayment(bookingId) {
    try {
      const res = await api.post("/api/payments/khalti/initiate", { bookingId });
      if (res.data.payment_url) {
        window.location.href = res.data.payment_url;
      } else {
        alert("Failed to get payment URL");
      }
    } catch (e) {
      alert(e?.response?.data?.message || "Payment initiation failed");
    }
  }

  async function submitReview() {
    if (!reviewModal) return;
    setReviewLoading(true);
    try {
      await api.post("/api/reviews", {
        bookingId: reviewModal._id,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewedSet(prev => new Set([...prev, reviewModal._id]));
      setReviewModal(null);
      setReviewRating(5);
      setReviewComment("");
      alert("Review submitted! Thank you.");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  function statusPill(status) {
    if (status === "PAID") return <span className="pill paid">Paid</span>;
    if (status === "PENDING_PAYMENT") return <span className="pill pending">Pending Payment</span>;
    if (status === "CANCELLED") return <span className="pill cancelled">Cancelled</span>;
    return <span className="pill">{status}</span>;
  }

  return (
    <div>
      <h1>My Bookings</h1>
      <p className="muted mt-sm">View, manage, and pay for your bookings.</p>

      <div className="tabs mt-md">
        <button className={`tab ${tab === "upcoming" ? "active" : ""}`} onClick={() => setTab("upcoming")}>Upcoming</button>
        <button className={`tab ${tab === "past" ? "active" : ""}`} onClick={() => setTab("past")}>Past</button>
        <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>All</button>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading bookings...</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">No bookings found in this category.</div>
      ) : (
        <div className="list">
          {filtered.map(b => (
            <div key={b._id} className="list-item" style={{ flexDirection: "column", alignItems: "stretch" }}>
              <div className="flex-between">
                <div>
                  <div className="list-title">{b.pitch?.name || "Pitch"}</div>
                  <div className="muted small mt-sm">{b.pitch?.address}</div>
                  <div className="muted small mt-sm">
                    {b.date} &middot; {b.slot} &middot; NPR {b.priceAtBooking}
                  </div>

                  {/* Show cancellation reason if cancelled by admin */}
                  {b.status === "CANCELLED" && b.cancelReason && (
                    <div className="alert error" style={{ marginTop: 8, padding: "8px 12px", fontSize: 13 }}>
                      <strong>Cancelled by admin:</strong> {b.cancelReason}
                    </div>
                  )}
                  {b.status === "CANCELLED" && !b.cancelReason && b.cancelledBy === "admin" && (
                    <div className="alert error" style={{ marginTop: 8, padding: "8px 12px", fontSize: 13 }}>
                      Cancelled by admin
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                  {statusPill(b.status)}

                  <div className="flex-gap">
                    {b.status === "PENDING_PAYMENT" && (
                      <>
                        <button className="btn small ok" onClick={() => initiatePayment(b._id)}>
                          Pay with Khalti
                        </button>
                        <button className="btn small danger" onClick={() => cancelBooking(b._id)}>
                          Cancel
                        </button>
                      </>
                    )}
                    {b.status === "PAID" && b.date < today && !reviewedSet.has(b._id) && (
                      <button className="btn small" onClick={() => { setReviewModal(b); setReviewRating(5); setReviewComment(""); }}>
                        Write Review
                      </button>
                    )}
                    {reviewedSet.has(b._id) && (
                      <span className="pill active">Reviewed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Write a Review</h2>
            <p className="muted mt-sm">{reviewModal.pitch?.name} &middot; {reviewModal.date}</p>

            <div className="mt-md">
              <label className="mb-sm">Rating</label>
              <StarRating value={reviewRating} onChange={setReviewRating} />
            </div>

            <div className="mt-md">
              <label>
                Comment (optional)
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="How was your experience?"
                  rows={3}
                />
              </label>
            </div>

            <div className="flex-gap mt-md">
              <button className="btn ok" onClick={submitReview} disabled={reviewLoading}>
                {reviewLoading ? "Submitting..." : "Submit Review"}
              </button>
              <button className="btn ghost" onClick={() => setReviewModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}