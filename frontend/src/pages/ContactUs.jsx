import React, { useState } from "react";

export default function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSent(true);
      setSending(false);
      setForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSent(false), 5000);
    }, 1000);
  }

  return (
    <div>
      {/* Header */}
      <div className="panel" style={{
        padding: "28px",
        background: "linear-gradient(135deg, rgba(91,140,255,0.16), rgba(18,26,39,0.95))",
        marginBottom: 20
      }}>
        <h1 style={{ marginBottom: 6 }}>Contact Us</h1>
        <p className="muted">Have a question, feedback, or partnership inquiry? We'd love to hear from you.</p>
      </div>

      <div className="two-col">
        {/* Contact Form */}
        <div className="panel" style={{ padding: 24 }}>
          <h2 style={{ marginBottom: 4 }}>Send us a Message</h2>
          <p className="muted small" style={{ marginBottom: 16 }}>Fill out the form and we'll get back to you within 24 hours.</p>

          {sent && (
            <div className="alert ok" style={{ marginBottom: 14 }}>
              ✅ Your message has been sent successfully! We'll reply soon.
            </div>
          )}

          <form onSubmit={handleSubmit} className="form">
            <div className="grid2">
              <label>
                Your Name
                <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required />
              </label>
              <label>
                Email Address
                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required />
              </label>
            </div>

            <label>
              Subject
              <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Booking issue, Partnership inquiry..." required />
            </label>

            <label>
              Message
              <textarea name="message" value={form.message} onChange={handleChange} placeholder="Tell us what's on your mind..." rows={5} required />
            </label>

            <button className="btn" disabled={sending} style={{ width: "100%" }}>
              {sending ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        {/* Right Side - Info + Map */}
        <div style={{ display: "grid", gap: 16 }}>
          {/* Contact Info Cards */}
          <div className="panel" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 14 }}>Get in Touch</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(91,140,255,0.12)", border: "1px solid rgba(91,140,255,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>📍</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Our Location</div>
                  <div className="muted small">Kathmandu, Nepal</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(61,220,151,0.12)", border: "1px solid rgba(61,220,151,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>📧</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Email</div>
                  <div className="muted small">support@futsalms.com</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>📞</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Phone</div>
                  <div className="muted small">+977 9800000000</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: "rgba(255,91,110,0.12)", border: "1px solid rgba(255,91,110,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                }}>⏰</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Working Hours</div>
                  <div className="muted small">Sun - Fri: 6:00 AM - 10:00 PM</div>
                  <div className="muted small">Saturday: 7:00 AM - 9:00 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="panel" style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 10 }}>Find Us</h3>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", height: 200 }}>
              <iframe
                title="FutsalMS Location"
                width="100%" height="100%" frameBorder="0" style={{ border: 0 }}
                src="https://www.openstreetmap.org/export/embed.html?bbox=85.30,27.69,85.35,27.73&layer=mapnik&marker=27.7172,85.324"
                allowFullScreen
              />
            </div>
          </div>

          {/* FAQ */}
          <div className="panel" style={{ padding: 22 }}>
            <h3 style={{ marginBottom: 12 }}>Quick Answers</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>How do I book a pitch?</div>
                <div className="muted small">Browse pitches → select a slot → confirm → pay online or at venue.</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Can I cancel my booking?</div>
                <div className="muted small">Yes, pending bookings can be cancelled. Paid bookings need admin assistance.</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>How does the loyalty reward work?</div>
                <div className="muted small">Book 5 times at the same pitch and your 6th booking is FREE!</div>
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Are you a pitch owner?</div>
                <div className="muted small">Contact us to list your pitch on FutsalMS and reach more players.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}