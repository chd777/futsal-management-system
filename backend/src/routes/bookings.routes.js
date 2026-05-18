const router = require("express").Router();
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const User = require("../models/User");
const auth = require("../middleware/auth");
const emailService = require("../utils/emailService");

const LOYALTY_THRESHOLD = 5;

function sortSlots(slotArray) {
  return [...slotArray].sort((a, b) => a.localeCompare(b));
}

function buildCombinedSlotFromBookings(bookings) {
  if (!bookings.length) return "";

  const sorted = [...bookings].sort((a, b) => a.slot.localeCompare(b.slot));

  if (sorted.length === 1) return sorted[0].slot;

  const firstStart = sorted[0].slot.split("-")[0];
  const lastEnd = sorted[sorted.length - 1].slot.split("-")[1];

  return `${firstStart}-${lastEnd}`;
}

function buildCombinedEmailBooking(bookings) {
  const sorted = [...bookings].sort((a, b) => a.slot.localeCompare(b.slot));
  const first = sorted[0];

  const totalPrice = sorted.reduce(
    (sum, b) => sum + Number(b.priceAtBooking || 0),
    0
  );

  return {
    ...first.toObject(),
    slot: buildCombinedSlotFromBookings(sorted),
    priceAtBooking: totalPrice
  };
}

// Loyalty check helper — used in both booking creation and loyalty status
async function checkLoyalty(userId, pitchId) {
  // Count only PAID bookings that are NOT loyalty rewards
  const paidCount = await Booking.countDocuments({
    user: userId,
    pitch: pitchId,
    status: { $in: ["PAID", "CONFIRMED_PAY_LATER"] },
    isLoyaltyReward: { $ne: true }
  });

  // Count how many free rewards have been claimed
  const rewardsUsed = await Booking.countDocuments({
    user: userId,
    pitch: pitchId,
    isLoyaltyReward: true
  });

  // How many rewards has the user earned based on paid bookings
  const rewardsEarned = Math.floor(paidCount / LOYALTY_THRESHOLD);

  // Next is free only if earned more rewards than used
  const nextIsFree = paidCount > 0 && rewardsEarned > rewardsUsed;

  // Progress in current cycle
  const rawProgress = paidCount % LOYALTY_THRESHOLD;
  const progress = nextIsFree ? LOYALTY_THRESHOLD : rawProgress;
  const remaining = nextIsFree ? 0 : LOYALTY_THRESHOLD - rawProgress;

  return {
    paidCount,
    rewardsUsed,
    rewardsEarned,
    nextIsFree,
    progress,
    remaining
  };
}

// Create booking (supports single slot or multiple consecutive slots)
router.post("/", auth, async (req, res) => {
  try {
    const { pitchId, date, slot, slots } = req.body;
    const userId = req.user.sub;

    // Support both old (slot) and new (slots) format
    const slotList = slots || (slot ? [slot] : []);

    if (!pitchId || !date || slotList.length === 0) {
      return res.status(400).json({
        message: "pitchId, date, and at least one slot are required"
      });
    }

    const sortedSlotList = sortSlots(slotList);

    const pitch = await Pitch.findById(pitchId);
    if (!pitch) return res.status(404).json({ message: "Pitch not found" });
    if (!pitch.isActive) {
      return res.status(400).json({ message: "This pitch is currently unavailable" });
    }

    // Check all slots for existing bookings
    for (const s of sortedSlotList) {
      const existing = await Booking.findOne({
        pitch: pitchId,
        date,
        slot: s,
        status: { $ne: "CANCELLED" }
      });

      if (existing) {
        return res.status(409).json({ message: `Slot ${s} is already booked` });
      }
    }

    // Check loyalty using the helper
    const loyalty = await checkLoyalty(userId, pitchId);
    const isLoyaltyReward = loyalty.nextIsFree;

    // IMPORTANT: create one bookingGroup for the whole request
    const bookingGroup =
      sortedSlotList.length > 1
        ? `BG-${pitchId}-${date}-${userId}-${Date.now()}`
        : null;

    // Create bookings for all selected slots
    const createdBookings = [];
    for (let i = 0; i < sortedSlotList.length; i++) {
      // Only the FIRST slot gets the loyalty reward
      const isThisLoyalty = i === 0 && isLoyaltyReward;

      const booking = await Booking.create({
        user: userId,
        pitch: pitchId,
        date,
        slot: sortedSlotList[i],
        priceAtBooking: isThisLoyalty ? 0 : pitch.pricePerHour,
        status: isThisLoyalty ? "PAID" : "PENDING_PAYMENT",
        isLoyaltyReward: isThisLoyalty,
        paidAt: isThisLoyalty ? new Date() : null,
        bookingGroup
      });

      createdBookings.push(booking);
    }

    // Build combined booking object for emails and response summary
    const combinedEmailBooking = buildCombinedEmailBooking(createdBookings);

    // Send email for the booking
    const user = await User.findById(userId);
    if (user) {
      if (isLoyaltyReward) {
        emailService
          .sendLoyaltyRewardEmail(user, combinedEmailBooking, pitch, loyalty.paidCount)
          .catch(() => {});
      } else {
        emailService
          .sendBookingConfirmation(user, combinedEmailBooking, pitch)
          .catch(() => {});
      }
    }

    // Notify admin
    const admins = await User.find({ role: "admin" }).select("email");
    for (const admin of admins) {
      emailService
        .sendAdminNewBookingAlert(admin.email, user, combinedEmailBooking, pitch)
        .catch(() => {});
    }

    const totalPrice = createdBookings.reduce(
      (sum, b) => sum + b.priceAtBooking,
      0
    );

    res.status(201).json({
      bookings: createdBookings,
      booking: createdBookings[0], // backward compatibility
      bookingGroup,
      isLoyaltyReward,
      totalSlots: sortedSlotList.length,
      totalPrice,
      combinedSlot: combinedEmailBooking.slot,
      message: isLoyaltyReward
        ? "🎉 Congratulations! This booking is FREE as a loyalty reward!"
        : sortedSlotList.length > 1
          ? `${sortedSlotList.length} slots booked successfully! Total: NPR ${totalPrice}`
          : "Booking created successfully"
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        message: "One or more slots are already booked"
      });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get my bookings
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.sub })
      .populate("pitch", "name address pricePerHour image")
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
    const loyalty = await checkLoyalty(req.user.sub, req.params.pitchId);

    res.json({
      completedBookings: loyalty.paidCount,
      progress: loyalty.progress,
      remaining: loyalty.remaining,
      nextIsFree: loyalty.nextIsFree,
      threshold: LOYALTY_THRESHOLD,
      rewardsEarned: loyalty.rewardsEarned,
      rewardsUsed: loyalty.rewardsUsed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel booking (user)
router.put("/:id/cancel", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user.sub
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    if (booking.status === "PAID" && !booking.isLoyaltyReward) {
      return res.status(400).json({
        message: "Cannot cancel a paid booking. Contact admin."
      });
    }

    booking.status = "CANCELLED";
    booking.cancelledAt = new Date();
    await booking.save();

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