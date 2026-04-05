import React, { useEffect, useState } from "react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
    title: "Futsal Booking Made Simple",
    subtitle: "Discover, book and play without hassle."
  },
  {
    image: "https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=1200&q=80",
    title: "Play Anytime, Anywhere",
    subtitle: "Find the best futsal pitches near you."
  },
  {
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=1200&q=80",
    title: "Built for Players",
    subtitle: "Fast booking, secure payment, great experience."
  }
];

const stats = [
  { value: "5+", label: "Pitches Listed" },
  { value: "100+", label: "Bookings Made" },
  { value: "50+", label: "Happy Players" },
  { value: "24/7", label: "Online Booking" }
];

const features = [
  { icon: "⚡", title: "Instant Booking", desc: "Book your favourite futsal pitch in seconds with real-time slot availability." },
  { icon: "💳", title: "Secure Payments", desc: "Pay online via Khalti or choose to pay cash at the venue — your choice." },
  { icon: "🎁", title: "Loyalty Rewards", desc: "Book 5 times at any pitch and get your 6th game absolutely FREE." },
  { icon: "⭐", title: "Ratings & Reviews", desc: "Read honest reviews from real players before choosing your pitch." },
  { icon: "📍", title: "Location Maps", desc: "Find pitches near you with integrated maps and directions." },
  { icon: "🤖", title: "Smart Chatbot", desc: "Get instant answers about pricing, availability, and bookings." }
];

const team = [
  { name: "Satish Chad", role: "Developer & Designer", avatar: "SC" },
];

export default function AboutUs() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* HERO with Image Slider */}
      <div style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        height: 380, marginBottom: 0
      }}>
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.image}
            alt=""
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80"; e.target.onerror = null; }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", transition: "opacity 1s ease",
              opacity: i === index ? 1 : 0
            }}
          />
        ))}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(11,15,23,0.95) 0%, rgba(11,15,23,0.4) 50%, rgba(11,15,23,0.2) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "40px 36px"
        }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 8, lineHeight: 1.2 }}>
            {slides[index].title}
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)", maxWidth: 500 }}>
            {slides[index].subtitle}
          </p>

          {/* Slide indicators */}
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => setIndex(i)} style={{
                width: i === index ? 32 : 10, height: 4,
                borderRadius: 4, cursor: "pointer",
                background: i === index ? "var(--accent)" : "rgba(255,255,255,0.3)",
                transition: "all 0.3s"
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
        margin: "20px 0"
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "18px 12px",
            background: "rgba(18,26,39,0.75)", borderRadius: 14,
            border: "1px solid var(--border)"
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "var(--accent)" }}>{s.value}</div>
            <div className="muted small" style={{ marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Who We Are */}
      <div className="panel" style={{ padding: 28 }}>
        <h2 style={{ marginBottom: 12, fontSize: 22 }}>Who We Are</h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 15 }}>
          FutsalMS is Nepal's premier futsal pitch booking platform — built to streamline
          how players discover, book, and manage their futsal experience. Whether you're a
          casual player looking for a weekend game or a competitive team booking regular
          practice sessions, FutsalMS connects you with the best futsal venues in your area
          with just a few clicks.
        </p>
        <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: 15, marginTop: 12 }}>
          We believe sports should be accessible to everyone. That's why we built a platform
          that eliminates phone calls, waiting, and confusion — replacing them with instant
          online booking, transparent pricing, and real player reviews.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎯</div>
          <h3 style={{ marginBottom: 8 }}>Our Mission</h3>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Making futsal accessible to everyone by simplifying the booking process,
            ensuring transparent pricing, and creating a seamless experience for both
            players and pitch owners across Nepal.
          </p>
        </div>
        <div className="panel" style={{ padding: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🚀</div>
          <h3 style={{ marginBottom: 8 }}>Our Vision</h3>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            To become the leading sports facility booking platform in South Asia,
            expanding beyond futsal to cover all indoor and outdoor sports — making
            every game just a tap away.
          </p>
        </div>
      </div>

      {/* Features */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 16 }}>What Makes FutsalMS Different</h2>
        <div className="grid3">
          {features.map((f, i) => (
            <div key={i} className="panel" style={{ padding: 20, transition: "transform 0.18s, border-color 0.18s" }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ marginBottom: 6, fontSize: 15 }}>{f.title}</h3>
              <p className="muted small" style={{ lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="panel" style={{ marginTop: 20, padding: 28 }}>
        <h2 style={{ marginBottom: 16 }}>How It Works</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { step: "1", icon: "🔍", title: "Find a Pitch", desc: "Browse pitches by location, price, and ratings" },
            { step: "2", icon: "📅", title: "Pick a Slot", desc: "Select your date and time — book 1 or 2+ hours" },
            { step: "3", icon: "💳", title: "Pay Online", desc: "Pay via Khalti or choose cash at venue" },
            { step: "4", icon: "⚽", title: "Play!", desc: "Show up and enjoy your game" }
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                background: "rgba(91,140,255,0.12)", border: "1px solid rgba(91,140,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24
              }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, marginBottom: 4 }}>STEP {s.step}</div>
              <h4 style={{ margin: "0 0 4px" }}>{s.title}</h4>
              <p className="muted small">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ marginTop: 20 }}>
        <h2 style={{ marginBottom: 16 }}>Meet the Team</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {team.map((t, i) => (
            <div key={i} className="panel" style={{ padding: 24, textAlign: "center", minWidth: 200 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
                background: "rgba(91,140,255,0.2)", border: "2px solid rgba(91,140,255,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, color: "var(--accent)"
              }}>{t.avatar}</div>
              <h3 style={{ marginBottom: 4 }}>{t.name}</h3>
              <p className="muted small">{t.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="panel" style={{ marginTop: 20, padding: 24 }}>
        <h2 style={{ marginBottom: 12 }}>Built With</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["React", "Node.js", "Express", "MongoDB", "Khalti API", "Cloudinary", "OpenStreetMap", "Google OAuth", "Nodemailer"].map((tech, i) => (
            <span key={i} className="pill" style={{
              borderColor: "rgba(91,140,255,0.3)", color: "var(--accent)",
              background: "rgba(91,140,255,0.08)", padding: "6px 14px", fontSize: 13
            }}>{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}