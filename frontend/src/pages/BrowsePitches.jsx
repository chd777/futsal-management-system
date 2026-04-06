import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import StarRating from "../components/StarRating";

export default function BrowsePitches() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const FALLBACK_PITCH_IMAGE =
    "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80";

  async function loadPitches() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (maxPrice) params.set("maxPrice", maxPrice);

      const res = await api.get(`/api/pitches?${params.toString()}`);
      setPitches(res.data.pitches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(loadPitches, 300);
    return () => clearTimeout(timer);
  }, [search, maxPrice]);

  return (
    <div>
      <section
        className="panel"
        style={{
          padding: "24px",
          background:
            "linear-gradient(135deg, rgba(91,140,255,0.16), rgba(18,26,39,0.95))"
        }}
      >
        <h1 style={{ marginBottom: 8 }}>Browse Pitches</h1>
        <p className="muted">
          Find the perfect futsal pitch near you, compare prices, check reviews,
          and book your next game easily.
        </p>

        <div className="filter-bar mt-md">
          <label>
            Search
            <input
              placeholder="Search by pitch name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 240 }}
            />
          </label>

          <label>
            Max Price (NPR/hr)
            <input
              type="number"
              placeholder="e.g. 2000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </label>
        </div>
      </section>

      {pitches.length > 0 && (
        <div className="panel mt-lg">
          <div className="panel-head">
            <div>
              <h2>Pitch Locations</h2>
              <p className="muted small mt-sm" style={{ marginBottom: 0 }}>
                Explore nearby futsal grounds and select the one that suits your match.
              </p>
            </div>
          </div>

          <div className="map-container" id="pitches-map">
            <iframe
              title="Pitch Locations"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(pitches[0]?.lng || 85.324) - 0.05},${(pitches[0]?.lat || 27.7172) - 0.03},${(pitches[0]?.lng || 85.324) + 0.05},${(pitches[0]?.lat || 27.7172) + 0.03}&layer=mapnik&marker=${pitches[0]?.lat || 27.7172},${pitches[0]?.lng || 85.324}`}
              allowFullScreen
            />
          </div>

          <p className="muted small mt-sm">
            Showing {pitches.length} pitch(es). Click a card below to view details,
            availability, and booking options.
          </p>
        </div>
      )}

      <section className="mt-lg">
        {loading ? (
          <div className="loading-spinner">Loading pitches...</div>
        ) : pitches.length === 0 ? (
          <div className="empty-state">No pitches found. Try a different search.</div>
        ) : (
          <div className="grid3">
            {pitches.map((p) => (
              <Link
                key={p._id}
                to={`/pitches/${p._id}`}
                className="pitch-card"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                  overflow: "hidden"
                }}
              >
                <img
  src={
    p.image &&
    typeof p.image === "string" &&
    p.image.trim().startsWith("http") &&
    !p.image.includes("google.com/search")
      ? p.image.trim()
      : FALLBACK_PITCH_IMAGE
  }
  alt={p.name}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = FALLBACK_PITCH_IMAGE;
  }}
  style={{
    width: "100%",
    height: "160px",
    objectFit: "cover",
    borderRadius: "14px",
    marginBottom: "14px",
    border: "1px solid rgba(255,255,255,0.04)"
  }}
/>
                <div className="flex-between" style={{ alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ marginBottom: 6 }}>{p.name}</h3>
                    <p className="muted small">{p.address}</p>
                  </div>
                  <div
                    className="pill"
                    style={{
                      borderColor: "rgba(91,140,255,0.35)",
                      color: "var(--accent)",
                      background: "rgba(91,140,255,0.10)"
                    }}
                  >
                    Available
                  </div>
                </div>

                <div className="flex-between mt-md">
                  <span
                    style={{
                      fontWeight: 800,
                      color: "var(--accent)",
                      fontSize: "15px"
                    }}
                  >
                    NPR {p.pricePerHour}/hr
                  </span>
                  <span className="muted small">
                    {p.openTime} - {p.closeTime}
                  </span>
                </div>

                <div className="flex-gap mt-sm" style={{ alignItems: "center" }}>
                  <StarRating value={p.avgRating || 0} readOnly size={16} />
                  <span className="muted small">
                    {p.reviewCount > 0
                      ? `${p.avgRating.toFixed(1)} (${p.reviewCount} review${p.reviewCount !== 1 ? "s" : ""})`
                      : "No reviews yet"}
                  </span>
                </div>

                <div
                  style={{
                    marginTop: "16px",
                    paddingTop: "14px",
                    borderTop: "1px solid var(--border)"
                  }}
                >
                  <span className="btn small">View Details</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}