// backend/src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

// Route imports
const authRoutes = require("./routes/auth.routes");
const adminPitchRoutes = require("./routes/admin.pitches.routes");
const adminBookingRoutes = require("./routes/admin.bookings.routes");
const adminRevenueRoutes = require("./routes/admin.revenue.routes");
const pitchRoutes = require("./routes/pitches.routes");
const bookingRoutes = require("./routes/bookings.routes");
const paymentRoutes = require("./routes/payments.routes");
const reviewRoutes = require("./routes/reviews.routes");
const adminClosureRoutes = require("./routes/admin.closures.routes");

const app = express();

// Parse JSON
app.use(express.json());

// ---- Robust CORS ----
const allowedOrigins = new Set(
  [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    process.env.CLIENT_ORIGIN
  ]
    .filter(Boolean)
    .map((o) => String(o).trim().replace(/\/$/, ""))
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const cleanOrigin = String(origin).trim().replace(/\/$/, "");
      if (allowedOrigins.has(cleanOrigin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.options("*", cors());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "OK", service: "Futsal MVP API" });
});

// ---------- Routes ----------
// Auth
app.use("/api/auth", authRoutes);

// Admin
app.use("/api/admin/pitches", adminPitchRoutes);
app.use("/api/admin/bookings", adminBookingRoutes);
app.use("/api/admin/revenue", adminRevenueRoutes);

// Public / User
app.use("/api/pitches", pitchRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin/closures", adminClosureRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

// Start server
const PORT = process.env.PORT || 5000;

(async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI missing in .env");
    if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET missing in .env");

    await connectDB(process.env.MONGO_URI);

    console.log("MongoDB connected");
    app.listen(PORT, () =>
      console.log(`Backend running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
})();