import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=80",
    title: "Futsal Booking Made Simple",
    subtitle: "Discover, book and play without hassle."
  },
  {
    image: "https://images.unsplash.com/photo-1552667466-07770ae110d0?w=1200&q=80",
    title: "Play Anytime, Anywhere",
    subtitle: "Find the best futsal pitches near you."
  },
  {
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1200&q=80",
    title: "Built for Players",
    subtitle: "Fast booking, secure payment, great experience."
  },
  {
    image: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1200&q=80",
    title: "Your Game, Your Way",
    subtitle: "Choose your pitch, pick your time, just play."
  }
];

const teal = "#2dd4bf";
const purple = "#a78bfa";

export default function AboutUs() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % slides.length);
        setFade(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const sectionStyle = { maxWidth: 1100, margin: "0 auto", padding: "0 18px" };

  return (
    <div>
      {/* HERO with Image Slider */}
      <div style={{
        position: "relative", borderRadius: 20, overflow: "hidden",
        height: 420, marginBottom: 0
      }}>
        {slides.map((s, i) => (
          <img key={i} src={s.image} alt=""
            onError={(e) => { e.target.src = slides[0].image; e.target.onerror = null; }}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", objectPosition: "center",
              transition: "opacity 0.8s ease-in-out",
              opacity: i === index ? 1 : 0
            }}
          />
        ))}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(11,15,23,0.97) 0%, rgba(11,15,23,0.6) 40%, rgba(11,15,23,0.25) 100%)",
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "44px 40px"
        }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 999, marginBottom: 16,
            background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)",
            fontSize: 13, fontWeight: 600, color: teal, width: "fit-content"
          }}>✨ About FutsalMS</div>
          <h1 style={{
            fontSize: 42, fontWeight: 900, marginBottom: 10, lineHeight: 1.15,
            transition: "opacity 0.4s", opacity: fade ? 1 : 0
          }}>
            {slides[index].title}
          </h1>
          <p style={{
            fontSize: 17, color: "rgba(255,255,255,0.7)", maxWidth: 520,
            transition: "opacity 0.4s", opacity: fade ? 1 : 0
          }}>
            {slides[index].subtitle}
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 22 }}>
            {slides.map((_, i) => (
              <div key={i} onClick={() => { setIndex(i); setFade(true); }} style={{
                width: i === index ? 40 : 10, height: 4,
                borderRadius: 4, cursor: "pointer",
                background: i === index ? teal : "rgba(255,255,255,0.2)",
                transition: "all 0.4s"
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, margin: "20px 0" }}>
        {[
          { icon: "📍", value: "5+", label: "VERIFIED PITCHES" },
          { icon: "📅", value: "100+", label: "BOOKINGS MADE" },
          { icon: "👥", value: "50+", label: "ACTIVE PLAYERS" },
          { icon: "⭐", value: "4.8★", label: "AVERAGE RATING" }
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "20px 12px",
            background: "rgba(18,26,39,0.6)", borderRadius: 16,
            border: "1px solid rgba(45,212,191,0.12)"
          }}>
            <div style={{ fontSize: 16, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: teal }}>{s.value}</div>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)", marginTop: 4, textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Everything You Need Section */}
      <div style={{ textAlign: "center", marginTop: 40, marginBottom: 24 }}>
        <h2 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2 }}>
          Everything You Need<br />
          <span style={{ color: teal }}>to Play Better</span>
        </h2>
      </div>

      <div className="grid3" style={{ gap: 14 }}>
        {[
          { icon: "📍", title: "Discover Pitches", desc: "Browse verified futsal venues with live pricing, timings, and player ratings." },
          { icon: "📅", title: "Instant Booking", desc: "Select your slots and book in seconds with our streamlined booking flow." },
          { icon: "💳", title: "Secure Payments", desc: "Pay via Khalti or choose pay-at-venue. Get instant booking confirmation." },
          { icon: "⭐", title: "Reviews & Ratings", desc: "Read verified player reviews and rate your experience after every match." },
          { icon: "🎁", title: "Loyalty Rewards", desc: "Earn free bookings through our loyalty program. The more you play, the more you save.", highlight: true },
          { icon: "🕐", title: "Multi-Slot Booking", desc: "Book consecutive time slots in a single flow for extended match sessions." }
        ].map((f, i) => (
          <div key={i} style={{
            padding: "24px 22px", borderRadius: 16,
            background: f.highlight ? "rgba(45,212,191,0.06)" : "rgba(18,26,39,0.6)",
            border: f.highlight ? "1px solid rgba(45,212,191,0.3)" : "1px solid rgba(45,212,191,0.08)",
            transition: "transform 0.18s, border-color 0.18s",
            cursor: "default"
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.borderColor = "rgba(45,212,191,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = f.highlight ? "rgba(45,212,191,0.3)" : "rgba(45,212,191,0.08)"; }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, marginBottom: 16,
              background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
            }}>{f.icon}</div>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div style={{ textAlign: "center", marginTop: 48, marginBottom: 24 }}>
        <h2 style={{ fontSize: 36, fontWeight: 900 }}>
          How It <span style={{ color: teal }}>Works</span>
        </h2>
      </div>

      <div className="grid3" style={{ gap: 14 }}>
        {[
          { step: "01", title: "Browse", desc: "Explore verified pitches by location, rating, and availability.", color: teal },
          { step: "02", title: "Book", desc: "Select time slots, choose payment method, and confirm in seconds.", color: "#818cf8" },
          { step: "03", title: "Play", desc: "Show up and enjoy. Rate your experience after the match.", color: purple }
        ].map((s, i) => (
          <div key={i} style={{
            textAlign: "center", padding: "32px 24px", borderRadius: 16,
            background: "rgba(18,26,39,0.6)",
            border: "1px solid rgba(45,212,191,0.1)"
          }}>
            <div style={{ fontSize: 42, fontWeight: 900, color: s.color, opacity: 0.7, marginBottom: 12 }}>{s.step}</div>
            <h3 style={{ marginBottom: 8 }}>{s.title}</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.7 }}>{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Who We Are */}
      <div style={{
        marginTop: 48, padding: "40px 36px", borderRadius: 20,
        background: "rgba(18,26,39,0.5)",
        border: "1px solid rgba(45,212,191,0.1)"
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 16 }}>
          Who <span style={{ color: teal }}>We Are</span>
        </h2>
        <p style={{ color: "var(--muted)", lineHeight: 1.9, fontSize: 15, maxWidth: 800 }}>
          FutsalMS is Nepal's premier futsal pitch booking platform — built to streamline
          how players discover, book, and manage their futsal experience. Whether you're a
          casual player looking for a weekend game or a competitive team booking regular
          practice sessions, FutsalMS connects you with the best futsal venues in your area.
        </p>
        <p style={{ color: "var(--muted)", lineHeight: 1.9, fontSize: 15, maxWidth: 800, marginTop: 14 }}>
          We believe sports should be accessible to everyone. That's why we built a platform
          that eliminates phone calls, waiting, and confusion — replacing them with instant
          online booking, transparent pricing, and real player reviews.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="grid2" style={{ marginTop: 20, gap: 14 }}>
        <div style={{
          padding: "28px 24px", borderRadius: 16,
          background: "rgba(18,26,39,0.6)",
          border: "1px solid rgba(45,212,191,0.12)"
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, marginBottom: 16,
            background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>🎯</div>
          <h3 style={{ marginBottom: 8, fontSize: 18 }}>Our Mission</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}>
            Making futsal accessible to everyone by simplifying the booking process,
            ensuring transparent pricing, and creating a seamless experience for both
            players and pitch owners across Nepal.
          </p>
        </div>
        <div style={{
          padding: "28px 24px", borderRadius: 16,
          background: "rgba(18,26,39,0.6)",
          border: "1px solid rgba(167,139,250,0.15)"
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, marginBottom: 16,
            background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20
          }}>🚀</div>
          <h3 style={{ marginBottom: 8, fontSize: 18 }}>Our Vision</h3>
          <p style={{ color: "var(--muted)", lineHeight: 1.7, fontSize: 14 }}>
            To become the leading sports facility booking platform in South Asia,
            expanding beyond futsal to cover all indoor and outdoor sports — making
            every game just a tap away.
          </p>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        marginTop: 48, padding: "48px 36px", borderRadius: 20, textAlign: "center",
        background: "linear-gradient(135deg, rgba(45,212,191,0.08), rgba(167,139,250,0.06))",
        border: "1px solid rgba(45,212,191,0.15)"
      }}>
        <div style={{
          display: "inline-block", padding: "6px 16px", borderRadius: 999, marginBottom: 16,
          background: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)",
          fontSize: 13, fontWeight: 600, color: teal
        }}>✨ Join the Community</div>
        <h2 style={{ fontSize: 38, fontWeight: 900, marginBottom: 10 }}>
          Ready to Hit the <span style={{ color: teal }}>Pitch</span>?
        </h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
          Join thousands of players booking with FutsalMS every week.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/register" style={{
            padding: "14px 32px", borderRadius: 14, fontWeight: 700, fontSize: 15,
            background: "linear-gradient(135deg, #2dd4bf, #818cf8)",
            color: "#0b0f17", textDecoration: "none", display: "inline-block",
            transition: "transform 0.15s, box-shadow 0.15s"
          }}
            onMouseEnter={e => { e.target.style.transform = "translateY(-2px)"; e.target.style.boxShadow = "0 8px 30px rgba(45,212,191,0.3)"; }}
            onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}
          >Get Started Free →</Link>
          <Link to="/contact" style={{
            padding: "14px 32px", borderRadius: 14, fontWeight: 700, fontSize: 15,
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            color: "var(--text)", textDecoration: "none", display: "inline-block",
            transition: "background 0.15s"
          }}
            onMouseEnter={e => { e.target.style.background = "rgba(255,255,255,0.05)"; }}
            onMouseLeave={e => { e.target.style.background = "transparent"; }}
          >Learn More</Link>
        </div>
      </div>

      {/* Team */}
      <div style={{ marginTop: 40, marginBottom: 8 }}>
        <h2 style={{ marginBottom: 16, fontSize: 24, fontWeight: 900 }}>
          Meet the <span style={{ color: teal }}>Team</span>
        </h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{
            padding: 24, textAlign: "center", minWidth: 200, borderRadius: 16,
            background: "rgba(18,26,39,0.6)", border: "1px solid rgba(45,212,191,0.12)"
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
              background: "rgba(45,212,191,0.15)", border: "2px solid rgba(45,212,191,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, fontWeight: 800, color: teal
            }}>SC</div>
            <h3 style={{ marginBottom: 4 }}>Satish Chad</h3>
            <p className="muted small">Developer & Designer</p>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div style={{
        marginTop: 20, padding: 24, borderRadius: 16,
        background: "rgba(18,26,39,0.5)", border: "1px solid rgba(45,212,191,0.1)"
      }}>
        <h2 style={{ marginBottom: 14, fontSize: 20, fontWeight: 800 }}>
          Built <span style={{ color: teal }}>With</span>
        </h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["React", "Node.js", "Express", "MongoDB", "Khalti API", "Cloudinary", "OpenStreetMap", "Google OAuth", "Nodemailer"].map((tech, i) => (
            <span key={i} style={{
              padding: "7px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              background: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.15)",
              color: teal
            }}>{tech}</span>
          ))}
        </div>
      </div>
    </div>
  );
}