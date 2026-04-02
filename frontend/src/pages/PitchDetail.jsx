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

  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [booking, setBooking] = useState(false);
  const [bookMsg, setBookMsg] = useState("");
  const [bookErr, setBookErr] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);
  const [loyalty, setLoyalty] = useState(null);

  const FALLBACK_PITCH_IMAGE =
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80";

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
      setSelectedSlots([]);
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

  function toggleSlot(slot) {
    setSelectedSlots((prev) => {
      if (prev.includes(slot)) {
        const idx = prev.indexOf(slot);
        return prev.slice(0, idx);
      } else {
        if (prev.length === 0) return [slot];
        const lastSelected = prev[prev.length - 1];
        const lastEnd = lastSelected.split("-")[1];
        const newStart = slot.split("-")[0];
        if (lastEnd === newStart) {
          return [...prev, slot];
        }
        return [slot];
      }
    });
  }

  function isSlotSelectable(slot) {
    if (selectedSlots.length === 0) return true;
    if (selectedSlots.includes(slot)) return true;
    const lastSelected = selectedSlots[selectedSlots.length - 1];
    const lastEnd = lastSelected.split("-")[1];
    const newStart = slot.split("-")[0];
    return lastEnd === newStart;
  }

  const totalPrice = selectedSlots.length * (pitch?.pricePerHour || 0);
  const totalHours = selectedSlots.length;

  async function handleBook() {
    if (selectedSlots.length === 0) return;

    setBooking(true);
    setBookMsg("");
    setBookErr("");

    try {
      const res = await api.post("/api/bookings", {
        pitchId: id,
        date: selectedDate,
        slots: selectedSlots
      });

      if (res.data.isLoyaltyReward) {
        setBookMsg(`🎉 ${res.data.message}`);
      } else if (selectedSlots.length > 1) {
        setBookMsg(
          `Booked ${selectedSlots.length} slots successfully! Redirecting to My Bookings...`
        );
      } else {
        setBookMsg("Booking created! Redirecting to My Bookings...");
      }

      setSelectedSlots([]);

      const slotRes = await api.get(`/api/pitches/${id}/slots?date=${selectedDate}`);
      if (slotRes.data.closed) {
        setSlots([]);
        setClosureInfo(slotRes.data.closureReason);
      } else {
        setSlots(slotRes.data.slots || []);
        setClosureInfo(null);
      }

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

  const mapSrc =
    pitch.lat && pitch.lng
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${pitch.lng - 0.01},${pitch.lat - 0.008},${Number(pitch.lng) + 0.01},${Number(pitch.lat) + 0.008}&layer=mapnik&marker=${pitch.lat},${pitch.lng}`
      : null;

  return (
    <div>
      <button className="btn small ghost mb-md" onClick={() => nav("/pitches")}>
        &larr; Back to Pitches
      </button>

      <img
        src={pitch.image || FALLBACK_PITCH_IMAGE}
        alt={pitch.name}
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = FALLBACK_PITCH_IMAGE;
        }}
        style={{
          width: "100%",
          height: "300px",
          objectFit: "cover",
          objectPosition: "center",
          borderRadius: "16px",
          marginBottom: "18px",
          border: "1px solid var(--border)"
        }}
      />

      <div className="flex-between">
        <div>
          <h1>{pitch.name}</h1>
          <p className="muted mt-sm">{pitch.address}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}
          >
            NPR {pitch.pricePerHour}/hr
          </div>
          <div className="muted small">
            {pitch.openTime} - {pitch.closeTime}
          </div>
        </div>
      </div>

      <div className="flex-gap mt-sm">
        <StarRating value={pitch.avgRating} readOnly size={20} />
        <span className="muted">
          {pitch.avgRating ? pitch.avgRating.toFixed(1) : "No ratings"} (
          {pitch.reviewCount} review{pitch.reviewCount !== 1 ? "s" : ""})
        </span>
      </div>

      {loyalty && (
        <div
          className="panel mt-md"
          style={{
            background: loyalty.nextIsFree
              ? "rgba(61,220,151,0.08)"
              : "rgba(91,140,255,0.05)",
            border: loyalty.nextIsFree
              ? "1px solid rgba(61,220,151,0.3)"
              : "1px solid rgba(91,140,255,0.2)"
          }}
        >
          <div className="flex-between">
            <div>
              {loyalty.nextIsFree ? (
                <>
                  <h3 style={{ color: "var(--ok)" }}>
                    🎉 Your next booking is FREE!
                  </h3>
                  <p className="muted small mt-sm">
                    You've completed {loyalty.completedBookings} bookings here.
                    Enjoy your free game!
                  </p>
                </>
              ) : (
                <>
                  <h3>🎯 Loyalty Progress</h3>
                  <p className="muted small mt-sm">
                    {loyalty.completedBookings > 0
                      ? `${loyalty.progress}/5 bookings — ${loyalty.remaining} more for a free game!`
                      : "Book 5 times at this pitch to earn a free game!"}
                  </p>
                </>
              )}
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: loyalty.nextIsFree ? "var(--ok)" : "var(--accent)"
              }}
            >
              {loyalty.progress}/5
            </div>
          </div>

          <div
            style={{
              marginTop: 10,
              background: "var(--border)",
              borderRadius: 8,
              height: 8,
              overflow: "hidden"
            }}
          >
            <div
              style={{
                width: `${loyalty.nextIsFree ? 100 : (loyalty.progress / 5) * 100}%`,
                height: "100%",
                background: loyalty.nextIsFree ? "var(--ok)" : "var(--accent)",
                borderRadius: 8,
                transition: "width 0.3s"
              }}
            />
          </div>
        </div>
      )}

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

      <div className="panel mt-lg">
        <h2>Book a Slot</h2>
        <p className="muted small mt-sm">
          Select one or more consecutive slots to book together and pay once.
        </p>

        <div className="flex-gap mt-sm">
          <label>
            Select Date
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setSelectedDate(e.target.value)}
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
                  <p className="muted small mb-sm">
                    Click consecutive slots to book multiple hours. Green = selected.
                  </p>
                  <div className="slot-grid">
                    {slots.map((s) => {
                      const isSelected = selectedSlots.includes(s.slot);
                      const selectable = s.available && isSlotSelectable(s.slot);

                      return (
                        <button
                          key={s.slot}
                          className={`slot-btn ${isSelected ? "selected" : ""} ${s.booked ? "booked" : ""}`}
                          disabled={!s.available || (!isSelected && !selectable)}
                          onClick={() => toggleSlot(s.slot)}
                          style={
                            isSelected
                              ? {
                                  borderColor: "var(--ok)",
                                  background: "rgba(61,220,151,0.15)",
                                  color: "var(--ok)"
                                }
                              : {}
                          }
                        >
                          {s.slot}
                          {s.booked && <span className="small"> (Booked)</span>}
                          {s.past && <span className="small"> (Past)</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {selectedSlots.length > 0 && (
          <div
            className="mt-md"
            style={{
              padding: "16px",
              borderRadius: 14,
              border: "1px solid rgba(91,140,255,0.3)",
              background: "rgba(91,140,255,0.06)"
            }}
          >
            <div className="flex-between" style={{ marginBottom: 8 }}>
              <div>
                <strong>Booking Summary</strong>
                <div className="muted small mt-sm">{selectedDate}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {loyalty?.nextIsFree ? (
                  <span
                    style={{ color: "var(--ok)", fontWeight: 800, fontSize: 18 }}
                  >
                    FREE 🎉
                  </span>
                ) : (
                  <span
                    style={{
                      color: "var(--accent)",
                      fontWeight: 800,
                      fontSize: 18
                    }}
                  >
                    NPR {totalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 12
              }}
            >
              {selectedSlots.map((s) => (
                <span
                  key={s}
                  className="pill"
                  style={{
                    borderColor: "rgba(61,220,151,0.5)",
                    color: "var(--ok)"
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            <div className="muted small" style={{ marginBottom: 12 }}>
              {totalHours} hour{totalHours > 1 ? "s" : ""} &middot;{" "}
              {selectedSlots[0]?.split("-")[0]} to{" "}
              {selectedSlots[selectedSlots.length - 1]?.split("-")[1]}
              {!loyalty?.nextIsFree && totalHours > 1 && (
                <span> &middot; NPR {pitch.pricePerHour} × {totalHours}</span>
              )}
            </div>

            <button
              className="btn ok"
              onClick={handleBook}
              disabled={booking}
              style={{ width: "100%" }}
            >
              {booking
                ? "Booking..."
                : loyalty?.nextIsFree
                  ? "🎉 Book for FREE"
                  : `Confirm Booking — NPR ${totalPrice.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>

      <div className="panel mt-lg">
        <h2>Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="muted mt-sm">No reviews yet.</div>
        ) : (
          <div className="list mt-sm">
            {reviews.map((r) => (
              <div key={r._id} className="review-card">
                <div className="flex-between">
                  <strong>{r.user?.fullName || "User"}</strong>
                  <StarRating value={r.rating} readOnly size={16} />
                </div>
                {r.comment && <p className="muted mt-sm">{r.comment}</p>}
                <p className="muted small mt-sm">
                  {new Date(r.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}