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

  // Slot selection
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState("");
  const [bookErr, setBookErr] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);

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
      setBookMsg("Booking created! Redirecting to payment...");
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

      // Redirect to my bookings after short delay
      setTimeout(() => nav("/my-bookings"), 1500);
    } catch (err) {
      setBookErr(err?.response?.data?.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  }

  if (loading) return <div className="loading-spinner">Loading pitch details...</div>;
  if (!pitch) return <div className="empty-state">Pitch not found.</div>;

  const mapSrc = pitch.lat && pitch.lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${pitch.lng-0.01},${pitch.lat-0.008},${pitch.lng+0.01},${pitch.lat+0.008}&layer=mapnik&marker=${pitch.lat},${pitch.lng}`
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
          <div className="mt-md" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <strong>Selected:</strong> {selectedDate} &middot; {selectedSlot} &middot; NPR {pitch.pricePerHour}
            </div>
            <button className="btn ok" onClick={handleBook} disabled={booking}>
              {booking ? "Booking..." : "Confirm Booking"}
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