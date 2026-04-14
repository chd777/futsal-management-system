const router = require("express").Router();
const Pitch = require("../models/Pitch");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const PitchClosure = require("../models/PitchClosure");

// GET /api/pitches - Browse active pitches
router.get("/", async (req, res) => {
  try {
    const filter = { isActive: true };

    // Search by name
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: "i" };
    }

    // Filter by max price
    if (req.query.maxPrice) {
      filter.pricePerHour = { $lte: Number(req.query.maxPrice) };
    }

    // Filter by location (city)
    if (req.query.location) {
      filter.address = { $regex: req.query.location, $options: "i" };
    }

    const pitches = await Pitch.find(filter);

    // Add avg rating and review count
    const result = await Promise.all(
      pitches.map(async (p) => {
        const reviews = await Review.find({ pitch: p._id });
        const avgRating = reviews.length
          ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          : 0;
        return {
          ...p.toObject(),
          avgRating: Math.round(avgRating * 10) / 10,
          reviewCount: reviews.length
        };
      })
    );

    // Sort results
    const sortBy = req.query.sort;
    if (sortBy === "price_low") {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "price_high") {
      result.sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === "rating_high" || sortBy === "rating") {
      // 'rating' kept as fallback for backwards compatibility
      result.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sortBy === "rating_low") {
      result.sort((a, b) => a.avgRating - b.avgRating);
    } else {
      // Default: relevance (highest rated + most reviewed first)
      result.sort((a, b) => {
        if (b.avgRating !== a.avgRating) return b.avgRating - a.avgRating;
        return b.reviewCount - a.reviewCount;
      });
    }

    res.json({ pitches: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitches/:id - Pitch detail + reviews
router.get("/:id", async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    const reviews = await Review.find({ pitch: pitch._id })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    const avgRating = reviews.length
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

    res.json({
      pitch: {
        ...pitch.toObject(),
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: reviews.length
      },
      reviews
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitches/:id/slots?date=YYYY-MM-DD
router.get("/:id/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: "date query param required" });

    const pitch = await Pitch.findById(req.params.id);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    // Check if pitch is closed on this date
    const closure = await PitchClosure.findOne({ pitch: pitch._id, date });
    if (closure) {
      return res.json({
        slots: [],
        closed: true,
        closureReason: closure.reason
      });
    }

    // Generate hourly slots between open and close time
    const openHour = parseInt(pitch.openTime.split(":")[0], 10);
    const closeHour = parseInt(pitch.closeTime.split(":")[0], 10);

    const slots = [];
    for (let h = openHour; h < closeHour; h++) {
      const start = `${String(h).padStart(2, "0")}:00`;
      const end = `${String(h + 1).padStart(2, "0")}:00`;
      slots.push(`${start}-${end}`);
    }

    // Check which slots are booked
    const bookings = await Booking.find({
      pitch: pitch._id,
      date,
      status: { $ne: "CANCELLED" }
    });
    const bookedSlots = new Set(bookings.map((b) => b.slot));

    // Check past slots
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentHour = now.getHours();

    const result = slots.map((slot) => {
      const slotHour = parseInt(slot.split(":")[0], 10);
      const booked = bookedSlots.has(slot);
      const past = date === todayStr && slotHour <= currentHour;

      return {
        slot,
        available: !booked && !past,
        booked,
        past
      };
    });

    res.json({ slots: result, closed: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;