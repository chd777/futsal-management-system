import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import StarRating from "../components/StarRating";

export default function PitchDetail() {
  const { id } = useParams();
  const nav = useNavigate();

  const [pitch, setPitch] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState("");
  const [bookErr, setBookErr] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);

  // Loyalty
  const [loyalty, setLoyalty] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get(`/api/pitches/${id}`);
        setPitch(res.data.pitch);
        setReviews(res.data.reviews || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();

    // Load loyalty status
    (async () => {
      try {
        const res = await api.get(`/api/bookings/loyalty/${id}`);
        setLoyalty(res.data);
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    if (!selectedDate || !id) return;
    (async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await api.get(`/api/pitches/${id}/slots?date=${selectedDate}`);
        if (res.data.closed) {
          setSlots([]);
          setClosureInfo(res.data.closureReason);
        } else {
          setSlots(res.data.slots || []);
          setClosureInfo(null);
        }
      } catch (err) {
        console.error(err);
        setSlots([]);
        setClosureInfo(null);
      } finally {
        setSlotsLoading(false);
      }
    })();
  }, [id, selectedDate]);

  async function handleBook() {
    if (!selectedSlot) return;
    setBooking(true);
    setBookMsg("");
    setBookErr("");
    try {
      const res = await api.post("/api/bookings", {
        pitchId: id,
        date: selectedDate,
        slot: selectedSlot
      });

      if (res.data.isLoyaltyReward) {
        setBookMsg("🎉 Congratulations! This booking is FREE as a loyalty reward!");
      } else {
        setBookMsg("Booking created! Redirecting to My Bookings...");
      }
      setSelectedSlot(null);

      // Refresh slots
      const slotRes = await api.get(`/api/pitches/${id}/slots?date=${selectedDate}`);
      if (slotRes.data.closed) {
        setSlots([]);
        setClosureInfo(slotRes.data.closureReason);
      } else {
        setSlots(slotRes.data.slots || []);
        setClosureInfo(null);
      }

      // Refresh loyalty
      try {
        const loyRes = await api.get(`/api/bookings/loyalty/${id}`);
        setLoyalty(loyRes.data);
      } catch {}

      setTimeout(() => nav("/my-bookings"), 2000);
    } catch (err) {
      setBookErr(err?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <div className="loading-spinner">Loading pitch details...</div>;
  if (!pitch) return <div className="empty-state">Pitch not found.</div>;

  const mapSrc = pitch.lat && pitch.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${pitch.lng-0.01},${pitch.lat-0.008},${Number(pitch.lng)+0.01},${Number(pitch.lat)+0.008}&layer=mapnik&marker=${pitch.lat},${pitch.lng}`
    : null;

  return (
    <div>
      <button className="btn small ghost mb-md" onClick={() => nav("/pitches")}>&larr; Back to Pitches</button>

      <div className="flex-between">
        <div>
          <h1>{pitch.name}</h1>
          <p className="muted mt-sm">{pitch.address}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>NPR {pitch.pricePerHour}/hr</div>
          <div className="muted small">{pitch.openTime} - {pitch.closeTime}</div>
        </div>
      </div>

      <div className="flex-gap mt-sm">
        <StarRating value={pitch.avgRating} readOnly size={20} />
        <span className="muted">{pitch.avgRating ? pitch.avgRating.toFixed(1) : "No ratings"} ({pitch.reviewCount} review{pitch.reviewCount !== 1 ? "s" : ""})</span>
      </div>

      {/* Loyalty Progress */}
      {loyalty && (
        <div className="panel mt-md" style={{ background: loyalty.nextIsFree ? "rgba(61,220,151,0.08)" : "rgba(91,140,255,0.05)", border: loyalty.nextIsFree ? "1px solid rgba(61,220,151,0.3)" : "1px solid rgba(91,140,255,0.2)" }}>
          <div className="flex-between">
            <div>
              {loyalty.nextIsFree ? (
                <>
                  <h3 style={{ color: "var(--ok)" }}>🎉 Your next booking is FREE!</h3>
                  <p className="muted small mt-sm">You've completed {loyalty.completedBookings} bookings here. Enjoy your free game!</p>
                </>
              ) : (
                <>
                  <h3>🎯 Loyalty Progress</h3>
                  <p className="muted small mt-sm">
                    {loyalty.completedBookings > 0
                      ? `${loyalty.progress}/5 bookings — ${loyalty.remaining} more for a free game!`
                      : "Book 5 times at this pitch to earn a free game!"
                    }
                  </p>
                </>
              )}
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: loyalty.nextIsFree ? "var(--ok)" : "var(--accent)" }}>
              {loyalty.progress}/5
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 10, background: "var(--border)", borderRadius: 8, height: 8, overflow: "hidden" }}>
            <div style={{
              width: `${loyalty.nextIsFree ? 100 : (loyalty.progress / 5) * 100}%`,
              height: "100%",
              background: loyalty.nextIsFree ? "var(--ok)" : "var(--accent)",
              borderRadius: 8,
              transition: "width 0.3s"
            }} />
          </div>
        </div>
      )}

      {/* Map */}
      {mapSrc && (
        <div className="map-container mt-md">
          <iframe
            title="Pitch Location"
            width="100%"
            height="100%"
            frameBorder="0"
            style={{ border: 0 }}
            src={mapSrc}
            allowFullScreen
          />
        </div>
      )}

      {/* Slot Selection */}
      <div className="panel mt-lg">
        <h2>Book a Slot</h2>

        <div className="flex-gap mt-sm">
          <label>
            Select Date
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </label>
        </div>

        {bookMsg && <div className="alert ok mt-sm">{bookMsg}</div>}
        {bookErr && <div className="alert error mt-sm">{bookErr}</div>}

        <div className="mt-md">
          {slotsLoading ? (
            <div className="muted">Loading slots...</div>
          ) : (
            <>
              {closureInfo && (
                <div className="alert warn" style={{ marginBottom: 12 }}>
                  <strong>⚠️ Pitch closed on this date:</strong> {closureInfo}
                </div>
              )}
              {!closureInfo && slots.length === 0 && (
                <div className="muted">No slots available for this date.</div>
              )}
              {slots.length > 0 && (
                <>
                  <p className="muted small mb-sm">Click an available slot to select it, then confirm booking.</p>
                  <div className="slot-grid">
                    {slots.map(s => (
                      <button
                        key={s.slot}
                        className={`slot-btn ${!s.available ? (s.booked ? "booked" : "") : ""} ${selectedSlot === s.slot ? "selected" : ""}`}
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.slot === selectedSlot ? null : s.slot)}
                      >
                        {s.slot}
                        {s.booked && <span className="small"> (Booked)</span>}
                        {s.past && <span className="small"> (Past)</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {selectedSlot && (
          <div className="mt-md" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <strong>Selected:</strong> {selectedDate} &middot; {selectedSlot} &middot;{" "}
              {loyalty?.nextIsFree ? (
                <span style={{ color: "var(--ok)", fontWeight: 800 }}>FREE 🎉</span>
              ) : (
                <span>NPR {pitch.pricePerHour}</span>
              )}
            </div>
            <button className="btn ok" onClick={handleBook} disabled={booking}>
              {booking ? "Booking..." : loyalty?.nextIsFree ? "🎉 Book for FREE" : "Confirm Booking"}
            </button>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="panel mt-lg">
        <h2>Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="muted mt-sm">No reviews yet.</div>
        ) : (
          <div className="list mt-sm">
            {reviews.map(r => (
              <div key={r._id} className="review-card">
                <div className="flex-between">
                  <strong>{r.user?.fullName || "User"}</strong>
                  <StarRating value={r.rating} readOnly size={16} />
                </div>
                {r.comment && <p className="muted mt-sm">{r.comment}</p>}
                <p className="muted small mt-sm">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}