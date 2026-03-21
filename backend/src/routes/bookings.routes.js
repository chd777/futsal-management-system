const router = require("express").Router();
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const User = require("../models/User");
const auth = require("../middleware/auth");
const emailService = require("../utils/emailService");

const LOYALTY_THRESHOLD = 5; // Free booking every 6th time (after 5 paid)

// Create booking
router.post("/", auth, async (req, res) => {
  try {
    const { pitchId, date, slot } = req.body;
    const userId = req.user.sub;

    if (!pitchId || !date || !slot) {
      return res.status(400).json({ message: "pitchId, date, and slot are required" });
    }

    const pitch = await Pitch.findById(pitchId);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });
    if (!pitch.isActive) return res.status(400).json({ message: "This pitch is currently unavailable" });

    // Check for existing non-cancelled booking
    const existing = await Booking.findOne({
      pitch: pitchId,
      date,
      slot,
      status: { $ne: "CANCELLED" }
    });
    if (existing) {
      return res.status(409).json({ message: "This slot is already booked" });
    }

    // Check loyalty - count completed bookings for this user on this pitch
    const completedCount = await Booking.countDocuments({
      user: userId,
      pitch: pitchId,
      status: { $in: ["PAID", "CONFIRMED_PAY_LATER"] }
    });

    const isLoyaltyReward = completedCount > 0 && completedCount % LOYALTY_THRESHOLD === 0;

    const booking = await Booking.create({
      user: userId,
      pitch: pitchId,
      date,
      slot,
      priceAtBooking: isLoyaltyReward ? 0 : pitch.pricePerHour,
      status: isLoyaltyReward ? "PAID" : "PENDING_PAYMENT",
      isLoyaltyReward: isLoyaltyReward,
      paidAt: isLoyaltyReward ? new Date() : null
    });

    // Send email notification to user
    const user = await User.findById(userId);
    if (user) {
      if (isLoyaltyReward) {
        // Send special loyalty reward email
        emailService.sendLoyaltyRewardEmail(user, booking, pitch, completedCount).catch(() => {});
      } else {
        emailService.sendBookingConfirmation(user, booking, pitch).catch(() => {});
      }
    }

    // Send email notification to admin(s)
    const admins = await User.find({ role: "admin" }).select("email");
    for (const admin of admins) {
      emailService.sendAdminNewBookingAlert(admin.email, user, booking, pitch).catch(() => {});
    }

    res.status(201).json({
      booking,
      isLoyaltyReward,
      message: isLoyaltyReward
        ? "🎉 Congratulations! This booking is FREE as a loyalty reward! You've earned it after 5 bookings."
        : "Booking created successfully"
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This slot is already booked (duplicate)" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get my bookings
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.sub })
      .populate("pitch", "name address pricePerHour")
      .sort({ date: -1, slot: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get loyalty status for a pitch
router.get("/loyalty/:pitchId", auth, async (req, res) => {
  try {
    const completedCount = await Booking.countDocuments({
      user: req.user.sub,
      pitch: req.params.pitchId,
      status: { $in: ["PAID", "CONFIRMED_PAY_LATER"] }
    });

    const progress = completedCount % LOYALTY_THRESHOLD;
    const remaining = LOYALTY_THRESHOLD - progress;
    const nextIsFree = progress === 0 && completedCount > 0;

    res.json({
      completedBookings: completedCount,
      progress,
      remaining: nextIsFree ? 0 : remaining,
      nextIsFree,
      threshold: LOYALTY_THRESHOLD
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel booking (user)
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user.sub });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
    }
    if (booking.status === "PAID" && !booking.isLoyaltyReward) {
      return res.status(400).json({ message: "Cannot cancel a paid booking. Contact admin." });
    }

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    await booking.save();

    // Send cancellation email to user
    const user = await User.findById(req.user.sub);
    const pitch = await Pitch.findById(booking.pitch);
    if (user && pitch) {
      emailService.sendBookingCancelledByUser(user, booking, pitch).catch(() => {});
    }

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;