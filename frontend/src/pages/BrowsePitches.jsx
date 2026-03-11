import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios";
import StarRating from "../components/StarRating";

export default function BrowsePitches() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

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
      <h1>Browse Pitches</h1>
      <p className="muted mt-sm">Find the perfect futsal pitch near you.</p>

      {/* Search & Filters */}
      <div className="filter-bar mt-md">
        <label>
          Search
          <input
            placeholder="Search by name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ minWidth: 220 }}
          />
        </label>
        <label>
          Max Price (NPR/hr)
          <input
            type="number"
            placeholder="e.g. 2000"
            value={maxPrice}
            onChange={e => setMaxPrice(e.target.value)}
          />
        </label>
      </div>

      {/* Map Section */}
      {pitches.length > 0 && (
        <div className="panel mb-md">
          <h2 className="mb-sm">Pitch Locations</h2>
          <div className="map-container" id="pitches-map">
            <iframe
              title="Pitch Locations"
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0 }}
             src={`https://www.openstreetmap.org/export/embed.html?bbox=${(pitches[0]?.lng || 85.324)-0.05},${(pitches[0]?.lat || 27.7172)-0.03},${(pitches[0]?.lng || 85.324)+0.05},${(pitches[0]?.lat || 27.7172)+0.03}&layer=mapnik&marker=${pitches[0]?.lat || 27.7172},${pitches[0]?.lng || 85.324}`}
              allowFullScreen
            />
          </div>
          <p className="muted small mt-sm">
            Showing {pitches.length} pitch(es). Click on a pitch card below to view details and book.
          </p>
        </div>
      )}

      {/* Pitch Cards */}
      {loading ? (
        <div className="loading-spinner">Loading pitches...</div>
      ) : pitches.length === 0 ? (
        <div className="empty-state">No pitches found. Try a different search.</div>
      ) : (
        <div className="grid3">
          {pitches.map(p => (
            <Link key={p._id} to={`/pitches/${p._id}`} className="pitch-card" style={{ textDecoration: "none", color: "inherit" }}>
              <h3>{p.name}</h3>
              <p className="muted small mt-sm">{p.address}</p>

              <div className="flex-between mt-sm">
                <span style={{ fontWeight: 700, color: "var(--accent)" }}>NPR {p.pricePerHour}/hr</span>
                <span className="muted small">{p.openTime} - {p.closeTime}</span>
              </div>

              <div className="flex-gap mt-sm">
                <StarRating value={p.avgRating} readOnly size={16} />
                <span className="muted small">
                  {p.avgRating ? p.avgRating.toFixed(1) : "No"} ({p.reviewCount} review{p.reviewCount !== 1 ? "s" : ""})
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}