const router = require("express").Router();
const PitchClosure = require("../models/PitchClosure");
const Pitch = require("../models/Pitch");
const Booking = require("../models/Booking");
const User = require("../models/User");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");
const emailService = require("../utils/emailService");

// GET /api/admin/closures?pitch=xxx
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.pitch) filter.pitch = req.query.pitch;
    
    const today = new Date().toISOString().slice(0, 10);
    filter.date = { $gte: today };

    const closures = await PitchClosure.find(filter)
      .populate("pitch", "name address")
      .sort({ date: 1 });

    res.json({ closures });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/closures - Add closure + auto-cancel existing bookings
router.post("/", auth, adminOnly, async (req, res) => {
  try {
    const { pitchId, date, reason } = req.body;

    if (!pitchId || !date || !reason) {
      return res.status(400).json({ message: "Pitch, date, and reason are required" });
    }

    const pitch = await Pitch.findById(pitchId);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ message: "Cannot close a past date" });
    }

    // Create the closure
    const closure = await PitchClosure.create({
      pitch: pitchId,
      date,
      reason: reason.trim(),
      createdBy: req.user.sub
    });

    // Auto-cancel all existing non-cancelled bookings on this pitch + date
    const affectedBookings = await Booking.find({
      pitch: pitchId,
      date,
      status: { $ne: "CANCELLED" }
    });

    let cancelledCount = 0;
    for (const booking of affectedBookings) {
      booking.status = "CANCELLED";
      booking.cancelledAt = new Date();
      booking.cancelReason = `Pitch closed: ${reason.trim()}`;
      booking.cancelledBy = "admin";
      await booking.save();
      cancelledCount++;

      // Send email notification to each affected user
      const user = await User.findById(booking.user);
      if (user) {
        emailService.sendBookingCancelledByAdmin(
          user,
          booking,
          pitch,
          `Pitch closed: ${reason.trim()}`
        ).catch(() => {});
      }
    }

    res.status(201).json({
      closure,
      cancelledBookings: cancelledCount,
      message: cancelledCount > 0
        ? `Closure added. ${cancelledCount} existing booking(s) were automatically cancelled and users have been notified.`
        : "Closure added. No existing bookings were affected."
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This date is already marked as closed for this pitch" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/admin/closures/:id - Remove closure
router.delete("/:id", auth, adminOnly, async (req, res) => {
  try {
    const closure = await PitchClosure.findByIdAndDelete(req.params.id);
    if (!closure) return res.status(404).json({ message: "Closure not found" });
    res.json({ message: "Closure removed. Users can now book on this date again." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;