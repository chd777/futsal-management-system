const router = require("express").Router();
const Pitch = require("../models/Pitch");
const Booking = require("../models/Booking");
const PitchClosure = require("../models/PitchClosure");
const User = require("../models/User");
const emailService = require("../utils/emailService");

// POST /api/pitch-manage/login - Verify PIN and return pitch data
router.post("/login", async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || !pin.trim()) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const pitch = await Pitch.findOne({ managementPin: pin.trim() });
    if (!pitch) {
      return res.status(401).json({ message: "Invalid PIN. Please check with your admin." });
    }

    res.json({ pitch, message: "Access granted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitch-manage/:pitchId/verify?pin=XXXXXX - Verify PIN for a pitch
router.get("/:pitchId/verify", async (req, res) => {
  try {
    const { pin } = req.query;
    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }
    res.json({ pitch });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/pitch-manage/:pitchId - Update pitch (with PIN verification)
router.put("/:pitchId", async (req, res) => {
  try {
    const { pin, name, address, pricePerHour, openTime, closeTime, lat, lng } = req.body;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (name) pitch.name = name;
    if (address) pitch.address = address;
    if (pricePerHour) pitch.pricePerHour = Number(pricePerHour);
    if (openTime) pitch.openTime = openTime;
    if (closeTime) pitch.closeTime = closeTime;
    if (lat) pitch.lat = Number(lat);
    if (lng) pitch.lng = Number(lng);

    await pitch.save();
    res.json({ message: "Pitch updated successfully", pitch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/pitch-manage/:pitchId - Delete pitch (with PIN verification)
router.delete("/:pitchId", async (req, res) => {
  try {
    const { pin } = req.body;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // Cancel all future bookings and notify users
    const today = new Date().toISOString().slice(0, 10);
    const futureBookings = await Booking.find({
      pitch: pitch._id,
      date: { $gte: today },
      status: { $ne: "CANCELLED" }
    });

    for (const booking of futureBookings) {
      booking.status = "CANCELLED";
      booking.cancelledAt = new Date();
      booking.cancelReason = "Pitch permanently closed by owner";
      booking.cancelledBy = "admin";
      await booking.save();

      const user = await User.findById(booking.user);
      if (user) {
        emailService.sendBookingCancelledByAdmin(user, booking, pitch, "Pitch permanently closed by owner").catch(() => {});
      }
    }

    await Pitch.findByIdAndDelete(req.params.pitchId);
    await PitchClosure.deleteMany({ pitch: req.params.pitchId });

    res.json({
      message: "Pitch deleted successfully",
      cancelledBookings: futureBookings.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitch-manage/:pitchId/bookings?pin=XXXXXX - Get bookings for this pitch
router.get("/:pitchId/bookings", async (req, res) => {
  try {
    const { pin, date, status } = req.query;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    const filter = { pitch: req.params.pitchId };
    if (date) filter.date = date;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate("user", "fullName email")
      .sort({ date: -1, slot: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/pitch-manage/:pitchId/bookings/:bookingId/cancel - Cancel a booking
router.put("/:pitchId/bookings/:bookingId/cancel", async (req, res) => {
  try {
    const { pin, reason } = req.body;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    const booking = await Booking.findOne({ _id: req.params.bookingId, pitch: req.params.pitchId });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === "CANCELLED") return res.status(400).json({ message: "Already cancelled" });

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: "Cancellation reason is required" });
    }

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    booking.cancelReason = reason.trim();
    booking.cancelledBy = "admin";
    await booking.save();

    const user = await User.findById(booking.user);
    if (user) {
      emailService.sendBookingCancelledByAdmin(user, booking, pitch, reason.trim()).catch(() => {});
    }

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitch-manage/:pitchId/revenue?pin=XXXXXX - Revenue for this pitch
router.get("/:pitchId/revenue", async (req, res) => {
  try {
    const { pin } = req.query;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    const bookings = await Booking.find({
      pitch: req.params.pitchId,
      status: { $in: ["PAID", "CONFIRMED_PAY_LATER"] }
    });

    const totalRevenue = bookings.reduce((sum, b) => sum + (b.priceAtBooking || 0), 0);
    const totalBookings = bookings.length;

    const today = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter(b => b.date === today);
    const todayRevenue = todayBookings.reduce((sum, b) => sum + (b.priceAtBooking || 0), 0);

    // Monthly revenue (last 6 months)
    const monthly = {};
    for (const b of bookings) {
      const month = b.date.slice(0, 7);
      if (!monthly[month]) monthly[month] = 0;
      monthly[month] += b.priceAtBooking || 0;
    }

    res.json({
      totalRevenue,
      totalBookings,
      todayRevenue,
      todayBookings: todayBookings.length,
      monthly
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/pitch-manage/:pitchId/closures?pin=XXXXXX - Closures for this pitch
router.get("/:pitchId/closures", async (req, res) => {
  try {
    const { pin } = req.query;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    const today = new Date().toISOString().slice(0, 10);
    const closures = await PitchClosure.find({
      pitch: req.params.pitchId,
      date: { $gte: today }
    }).sort({ date: 1 });

    res.json({ closures });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/pitch-manage/:pitchId/closures - Add closure
router.post("/:pitchId/closures", async (req, res) => {
  try {
    const { pin, date, reason } = req.body;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    if (!date || !reason) {
      return res.status(400).json({ message: "Date and reason are required" });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (date < today) {
      return res.status(400).json({ message: "Cannot close a past date" });
    }

    const closure = await PitchClosure.create({
      pitch: req.params.pitchId,
      date,
      reason: reason.trim()
    });

    // Auto-cancel existing bookings on this date
    const affectedBookings = await Booking.find({
      pitch: req.params.pitchId,
      date,
      status: { $ne: "CANCELLED" }
    });

    for (const booking of affectedBookings) {
      booking.status = "CANCELLED";
      booking.cancelledAt = new Date();
      booking.cancelReason = `Pitch closed: ${reason.trim()}`;
      booking.cancelledBy = "admin";
      await booking.save();

      const user = await User.findById(booking.user);
      if (user) {
        emailService.sendBookingCancelledByAdmin(user, booking, pitch, `Pitch closed: ${reason.trim()}`).catch(() => {});
      }
    }

    res.status(201).json({
      closure,
      cancelledBookings: affectedBookings.length,
      message: affectedBookings.length > 0
        ? `Closure added. ${affectedBookings.length} booking(s) cancelled and users notified.`
        : "Closure added."
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This date is already closed" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/pitch-manage/:pitchId/closures/:closureId - Remove closure
router.delete("/:pitchId/closures/:closureId", async (req, res) => {
  try {
    const { pin } = req.body;

    const pitch = await Pitch.findById(req.params.pitchId);
    if (!pitch || pitch.managementPin !== pin) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    await PitchClosure.findOneAndDelete({ _id: req.params.closureId, pitch: req.params.pitchId });
    res.json({ message: "Closure removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;