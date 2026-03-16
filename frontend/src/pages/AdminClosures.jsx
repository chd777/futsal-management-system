import React, { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function AdminClosures() {
  const [closures, setClosures] = useState([]);
  const [pitches, setPitches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    pitchId: "",
    date: "",
    reason: ""
  });

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        api.get("/api/admin/closures"),
        api.get("/api/admin/pitches")
      ]);
      setClosures(cRes.data.closures || []);
      setPitches(pRes.data.pitches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOk("");
    setSaving(true);
    try {
      const res = await api.post("/api/admin/closures", form);
      setOk(res.data.message || "Closure added successfully!");
      setForm({ pitchId: "", date: "", reason: "" });
      loadData();
      setTimeout(() => setOk(""), 5000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to add closure");
    } finally {
      setSaving(false);
    }
  }

  async function removeClosure(id) {
    if (!confirm("Remove this closure? The pitch will be available again on this date.")) return;
    try {
      await api.delete(`/api/admin/closures/${id}`);
      loadData();
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to remove closure");
    }
  }

  const quickReasons = [
    "Public Holiday",
    "Pitch Maintenance",
    "Weather Conditions",
    "Private Event",
    "Staff Unavailable",
    "Emergency Closure"
  ];

  return (
    <div>
      <h1>Pitch Closures & Holidays</h1>
      <p className="muted mt-sm">Mark dates when pitches are unavailable. Existing bookings will be automatically cancelled and users will be notified via email.</p>

      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}

      {/* Add Closure Form */}
      <div className="panel mt-md">
        <h2 style={{ marginBottom: 10 }}>Add Closure</h2>

        <form onSubmit={onSubmit} className="form">
          <div className="grid2">
            <label>
              Select Pitch
              <select
                value={form.pitchId}
                onChange={e => setForm(p => ({ ...p, pitchId: e.target.value }))}
                required
              >
                <option value="">-- Choose Pitch --</option>
                {pitches.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.address})</option>
                ))}
              </select>
            </label>

            <label>
              Date
              <input
                type="date"
                value={form.date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            Reason
            <input
              value={form.reason}
              onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="e.g. Public Holiday, Maintenance, Weather..."
              required
            />
          </label>

          {/* Quick reason buttons */}
          <div className="flex-gap">
            {quickReasons.map(r => (
              <button
                key={r}
                type="button"
                className={`btn small ${form.reason === r ? "" : "ghost"}`}
                onClick={() => setForm(p => ({ ...p, reason: r }))}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="alert warn" style={{ padding: "10px 14px", fontSize: 13 }}>
            <strong>Note:</strong> Adding a closure will automatically cancel all existing bookings on this date and notify affected users via email.
          </div>

          <button className="btn" disabled={saving}>
            {saving ? "Adding..." : "Add Closure"}
          </button>
        </form>
      </div>

      {/* Existing Closures */}
      <h2 className="mt-lg">Upcoming Closures ({closures.length})</h2>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : closures.length === 0 ? (
        <div className="empty-state mt-sm">No upcoming closures. All pitches are open.</div>
      ) : (
        <div className="list mt-sm">
          {closures.map(c => (
            <div key={c._id} className="list-item">
              <div>
                <div className="list-title">{c.pitch?.name || "Pitch"}</div>
                <div className="muted small mt-sm">
                  📅 {c.date} &middot; {c.reason}
                </div>
              </div>
              <button className="btn small danger" onClick={() => removeClosure(c._id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}