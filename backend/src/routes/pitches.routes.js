const router = require("express").Router();
const Pitch = require("../models/Pitch");
const Booking = require("../models/Booking");
const Review = require("../models/Review");

// GET /api/pitches - public list (only active pitches)
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

    // Filter by min price
    if (req.query.minPrice) {
      filter.pricePerHour = {
        ...filter.pricePerHour,
        $gte: Number(req.query.minPrice)
      };
    }

    let pitches = await Pitch.find(filter).sort({ createdAt: -1 }).lean();

    // Attach average rating to each pitch
    const pitchIds = pitches.map(p => p._id);
    const ratingAgg = await Review.aggregate([
      { $match: { pitch: { $in: pitchIds } } },
      { $group: { _id: "$pitch", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const ratingMap = {};
    for (const r of ratingAgg) ratingMap[r._id.toString()] = { avgRating: r.avgRating, reviewCount: r.count };

    pitches = pitches.map(p => ({
      ...p,
      avgRating: ratingMap[p._id.toString()]?.avgRating || 0,
      reviewCount: ratingMap[p._id.toString()]?.reviewCount || 0
    }));

    res.json({ pitches });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitches/:id - single pitch detail
router.get("/:id", async (req, res) => {
  try {
    const pitch = await Pitch.findById(req.params.id).lean();
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    // Attach average rating
    const ratingAgg = await Review.aggregate([
      { $match: { pitch: pitch._id } },
      { $group: { _id: "$pitch", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    pitch.avgRating = ratingAgg[0]?.avgRating || 0;
    pitch.reviewCount = ratingAgg[0]?.count || 0;

    // Get reviews
    const reviews = await Review.find({ pitch: pitch._id })
      .populate("user", "fullName")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ pitch, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitches/:id/slots?date=YYYY-MM-DD
router.get("/:id/slots", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Date required in YYYY-MM-DD format" });
    }

    const pitch = await Pitch.findById(req.params.id);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    // Generate all hourly slots between openTime and closeTime
    const [openH] = pitch.openTime.split(":").map(Number);
    const [closeH] = pitch.closeTime.split(":").map(Number);

    const allSlots = [];
    for (let h = openH; h < closeH; h++) {
      const start = `${String(h).padStart(2, "0")}:00`;
      const end = `${String(h + 1).padStart(2, "0")}:00`;
      allSlots.push(`${start}-${end}`);
    }

    // Find booked (non-cancelled) slots for this pitch + date
    const bookedBookings = await Booking.find({
      pitch: req.params.id,
      date,
      status: { $ne: "CANCELLED" }
    }).select("slot");
    const bookedSlots = new Set(bookedBookings.map(b => b.slot));

    // Check if date is today - mark past slots as unavailable
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const currentHour = now.getHours();

    const slots = allSlots.map(slot => {
      const slotHour = parseInt(slot.split(":")[0], 10);
      const isPast = (date === todayStr && slotHour <= currentHour);
      const isBooked = bookedSlots.has(slot);

      return {
        slot,
        available: !isBooked && !isPast,
        booked: isBooked,
        past: isPast
      };
    });

    res.json({ date, pitchId: pitch._id, slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;