const router = require("express").Router();
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const auth = require("../middleware/auth");

// POST /api/bookings - create a booking
router.post("/", auth, async (req, res) => {
  try {
    const { pitchId, date, slot } = req.body;
    const userId = req.user.sub;

    if (!pitchId || !date || !slot) {
      return res.status(400).json({ message: "pitchId, date, and slot are required" });
    }

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Don't allow past dates
    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ message: "Cannot book a past date" });
    }

    // Get pitch
    const pitch = await Pitch.findById(pitchId);
    if (!pitch || !pitch.isActive) {
      return res.status(404).json({ message: "Pitch not found or inactive" });
    }

    // Validate slot format and range
    const [startStr] = slot.split("-");
    const slotHour = parseInt(startStr, 10);
    const [openH] = pitch.openTime.split(":").map(Number);
    const [closeH] = pitch.closeTime.split(":").map(Number);

    if (slotHour < openH || slotHour >= closeH) {
      return res.status(400).json({ message: "Slot outside pitch operating hours" });
    }

    // Check for past time on today
    if (date === today) {
      const now = new Date();
      if (slotHour <= now.getHours()) {
        return res.status(400).json({ message: "Cannot book a past time slot" });
      }
    }

    // Check double booking
    const existing = await Booking.findOne({
      pitch: pitchId,
      date,
      slot,
      status: { $ne: "CANCELLED" }
    });
    if (existing) {
      return res.status(409).json({ message: "This slot is already booked" });
    }

    const booking = await Booking.create({
      user: userId,
      pitch: pitchId,
      date,
      slot,
      priceAtBooking: pitch.pricePerHour,
      status: "PENDING_PAYMENT"
    });

    res.status(201).json({ booking });
  } catch (err) {
    // Handle mongoose unique index violation (double booking race condition)
    if (err.code === 11000) {
      return res.status(409).json({ message: "This slot is already booked" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/bookings/my - user's bookings
router.get("/my", auth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const bookings = await Booking.find({ user: userId })
      .populate("pitch", "name address pricePerHour")
      .sort({ date: -1, slot: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/bookings/:id/cancel - user cancels own booking (only before payment)
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Can only cancel unpaid bookings" });
    }

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;