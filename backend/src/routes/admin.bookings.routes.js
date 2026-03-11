const router = require("express").Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// GET /api/admin/bookings?pitch=xxx&date=YYYY-MM-DD&status=PAID
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.pitch) filter.pitch = req.query.pitch;
    if (req.query.date) filter.date = req.query.date;
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate("user", "fullName email")
      .populate("pitch", "name address")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/bookings/:id/cancel
router.put("/:id/cancel", auth, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
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