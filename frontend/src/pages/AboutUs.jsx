import React, { useEffect, useState } from "react";

const slides = [
  {
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
    title: "Futsal Booking Made Simple",
    subtitle: "Discover, book and play without hassle."
  },
  {
    image: "https://images.unsplash.com/photo-1547347298-4074fc3086f0",
    title: "Play Anytime, Anywhere",
    subtitle: "Find the best futsal pitches near you."
  },
  {
    image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974",
    title: "Built for Players",
    subtitle: "Fast booking, secure payment, great experience."
  }
];

export default function AboutUs() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 2500); // change speed here

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {/* HERO */}
      <div className="about-hero">
        {slides.map((s, i) => (
          <img
            key={i}
            src={s.image}
            className={`hero-img ${i === index ? "active" : ""}`}
            alt=""
          />
        ))}

        <div className="hero-content">
          <h1>{slides[index].title}</h1>
          <p>{slides[index].subtitle}</p>
        </div>
      </div>

      {/* CONTENT */}
      <div className="about-section">
        <h2>Who We Are</h2>
        <p>
          FutsalMS is a modern futsal booking system that allows users to find
          pitches, book slots, and manage their games easily.
        </p>
      </div>

      <div className="about-section grid2">
        <div className="card">
          <h3>Our Mission</h3>
          <p>
            Make futsal booking fast, simple, and accessible for everyone.
          </p>
        </div>

        <div className="card">
          <h3>Our Vision</h3>
          <p>
            Build a modern sports booking ecosystem for Nepal and beyond.
          </p>
        </div>
      </div>
    </div>
  );
}