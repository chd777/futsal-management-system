import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AdminPitches() {
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const emptyForm = {
    name: "",
    address: "",
    pricePerHour: "",
    openTime: "06:00",
    closeTime: "22:00",
    lat: "",
    lng: "",
    image: "",
    managementPin: ""
  };

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  // Location search
  const [locQuery, setLocQuery] = useState("");
  const [locResults, setLocResults] = useState([]);
  const [locSearching, setLocSearching] = useState(false);
  const [locMsg, setLocMsg] = useState("");

  async function loadPitches() {
    setError("");
    setLoading(true);
    try {
      const res = await api.get("/api/admin/pitches");
      setPitches(res.data.pitches || []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load pitches");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPitches();
  }, []);

  function onChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function startEdit(p) {
    setEditId(p._id);
    setForm({
      name: p.name,
      address: p.address,
      pricePerHour: p.pricePerHour,
      openTime: p.openTime,
      closeTime: p.closeTime,
      lat: p.lat,
      lng: p.lng,
      image: p.image || "",
      managementPin: p.managementPin || ""
    });
    setLocQuery("");
    setLocResults([]);
    setLocMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditId(null);
    setForm(emptyForm);
    setLocQuery("");
    setLocResults([]);
    setLocMsg("");
  }

  async function searchLocation() {
    const query = locQuery.trim() || form.address.trim();
    if (!query) {
      setLocMsg("Enter a location to search");
      return;
    }
    setLocSearching(true);
    setLocResults([]);
    setLocMsg("");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&countrycodes=np`
      );
      const data = await res.json();
      if (data.length === 0) {
        setLocMsg("No results found. Try a different name or add 'Kathmandu' to your search.");
      } else {
        setLocResults(data);
      }
    } catch (err) {
      setLocMsg("Search failed. Check your internet connection.");
    } finally {
      setLocSearching(false);
    }
  }

  function selectLocation(item) {
    setForm((p) => ({
      ...p,
      lat: parseFloat(item.lat).toFixed(6),
      lng: parseFloat(item.lon).toFixed(6),
      address: p.address || item.display_name.split(",").slice(0, 3).join(",").trim()
    }));
    setLocResults([]);
    setLocMsg(
      "Location set! Lat: " +
        parseFloat(item.lat).toFixed(6) +
        ", Lng: " +
        parseFloat(item.lon).toFixed(6)
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        pricePerHour: Number(form.pricePerHour),
        lat: Number(form.lat),
        lng: Number(form.lng),
        image: form.image,
        managementPin: form.managementPin || null
      };

      if (editId) {
        await api.put(`/api/admin/pitches/${editId}`, payload);
      } else {
        await api.post("/api/admin/pitches", payload);
      }

      resetForm();
      await loadPitches();
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this pitch permanently?")) return;
    try {
      await api.delete(`/api/admin/pitches/${id}`);
      await loadPitches();
    } catch (e) {
      alert(e?.response?.data?.message || "Delete failed");
    }
  }

  async function toggleActive(p) {
    try {
      await api.put(`/api/admin/pitches/${p._id}`, { isActive: !p.isActive });
      await loadPitches();
    } catch (e) {
      alert("Failed to update status");
    }
  }

  return (
    <div>
      <h1>Manage Pitches</h1>
      <p className="muted mt-sm">
        Add, edit, enable/disable pitches with pricing, location, and image.
      </p>

      {error && <div className="alert error">{error}</div>}

      <div className="panel mt-md">
        <h2 style={{ marginBottom: 10 }}>{editId ? "Edit Pitch" : "Add New Pitch"}</h2>

        <form onSubmit={onSubmit} className="form">
          <label>
            Pitch Name
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              required
              placeholder="e.g. Kathmandu Futsal Arena"
            />
          </label>

          <label>
            Address
            <input
              name="address"
              value={form.address}
              onChange={onChange}
              required
              placeholder="e.g. Baneshwor, Kathmandu"
            />
          </label>

          <label>
            Image URL
            <input
              name="image"
              value={form.image}
              onChange={onChange}
              placeholder="Paste image URL (e.g. https://...)"
            />
          </label>

          {form.image && (
            <div style={{ marginTop: 4 }}>
              <img
                src={form.image}
                alt="Pitch preview"
                style={{
                  width: "100%",
                  height: 180,
                  objectFit: "cover",
                  borderRadius: 12,
                  border: "1px solid var(--border)"
                }}
              />
            </div>
          )}

          <div className="grid2">
            <label>
              Price per Hour (NPR)
              <input
                name="pricePerHour"
                type="number"
                min="0"
                value={form.pricePerHour}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Open Time
              <input
                name="openTime"
                type="time"
                value={form.openTime}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Close Time
              <input
                name="closeTime"
                type="time"
                value={form.closeTime}
                onChange={onChange}
                required
              />
            </label>

            <label>
              Management PIN
              <input
                name="managementPin"
                value={form.managementPin}
                onChange={onChange}
                placeholder="6-digit PIN for pitch owner"
                maxLength={6}
              />
              <span className="muted small">Give this PIN to the pitch owner so they can manage their pitch at /pitch-manage</span>
            </label>
          </div>

          {/* Location Search Section */}
          <div
            className="panel"
            style={{
              background: "rgba(91,140,255,0.05)",
              border: "1px solid rgba(91,140,255,0.2)"
            }}
          >
            <h3 style={{ marginBottom: 8 }}>📍 Find Location</h3>
            <p className="muted small" style={{ marginBottom: 10 }}>
              Search by futsal name or address. This will auto-fill the coordinates.
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={locQuery}
                onChange={(e) => setLocQuery(e.target.value)}
                placeholder="e.g. Futsal Arena Baneshwor Kathmandu"
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchLocation();
                  }
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={searchLocation}
                disabled={locSearching}
              >
                {locSearching ? "Searching..." : "🔍 Search"}
              </button>
            </div>

            {locResults.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <p className="muted small" style={{ marginBottom: 6 }}>
                  Click to select a location:
                </p>
                {locResults.map((item, i) => (
                  <div
                    key={i}
                    onClick={() => selectLocation(item)}
                    style={{
                      padding: "10px 12px",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      marginBottom: 6,
                      cursor: "pointer",
                      background: "rgba(15, 22, 34, 0.55)",
                      fontSize: 13,
                      transition: "border-color 0.15s"
                    }}
                    onMouseEnter={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onMouseLeave={(e) => (e.target.style.borderColor = "var(--border)")}
                  >
                    📍 {item.display_name}
                  </div>
                ))}
              </div>
            )}

            {locMsg && (
              <p
                className={locMsg.includes("set") ? "text-ok" : "muted"}
                style={{ marginTop: 8, fontSize: 13 }}
              >
                {locMsg}
              </p>
            )}

            <div className="grid2" style={{ marginTop: 10 }}>
              <label>
                Latitude
                <input
                  name="lat"
                  type="number"
                  step="0.000001"
                  value={form.lat}
                  onChange={onChange}
                  required
                  placeholder="Auto-filled"
                />
              </label>
              <label>
                Longitude
                <input
                  name="lng"
                  type="number"
                  step="0.000001"
                  value={form.lng}
                  onChange={onChange}
                  required
                  placeholder="Auto-filled"
                />
              </label>
            </div>

            {form.lat && form.lng && (
              <div
                style={{
                  marginTop: 10,
                  borderRadius: 10,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  height: 200
                }}
              >
                <iframe
                  title="Location Preview"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${form.lng - 0.01},${form.lat - 0.008},${Number(form.lng) + 0.01},${Number(form.lat) + 0.008}&layer=mapnik&marker=${form.lat},${form.lng}`}
                />
              </div>
            )}
          </div>

          <div className="flex-gap mt-sm">
            <button className="btn" disabled={saving}>
              {saving ? "Saving..." : editId ? "Update Pitch" : "Add Pitch"}
            </button>
            {editId && (
              <button type="button" className="btn ghost" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <h2 className="mt-lg">All Pitches ({pitches.length})</h2>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : pitches.length === 0 ? (
        <div className="empty-state">No pitches yet. Add one above.</div>
      ) : (
        <div className="list mt-sm">
          {pitches.map((p) => (
            <div
              key={p._id}
              className="list-item"
              style={{ flexDirection: "column", alignItems: "stretch" }}
            >
              <div className="flex-between">
                <div style={{ flex: 1 }}>
                  <div className="flex-gap">
                    <h3>{p.name}</h3>
                    <span className={`pill ${p.isActive ? "active" : "inactive"}`}>
                      {p.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <p className="muted small mt-sm">{p.address}</p>

                  <p className="muted small mt-sm">
                    NPR {p.pricePerHour}/hr &middot; {p.openTime} - {p.closeTime} &middot; (
                    {p.lat}, {p.lng})
                  </p>

                  {p.managementPin && (
                    <p className="muted small mt-sm">
                      🔐 PIN: <strong>{p.managementPin}</strong>
                    </p>
                  )}

                  {p.image && (
                    <div style={{ marginTop: 10 }}>
                      <img
                        src={p.image}
                        alt={p.name}
                        style={{
                          width: "220px",
                          height: "120px",
                          objectFit: "cover",
                          borderRadius: 12,
                          border: "1px solid var(--border)"
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-gap">
                  <button className="btn small" onClick={() => toggleActive(p)}>
                    {p.isActive ? "Disable" : "Enable"}
                  </button>
                  <button className="btn small" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="btn small danger" onClick={() => onDelete(p._id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}