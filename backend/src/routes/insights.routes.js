const router = require("express").Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

// GET /api/insights/user-dashboard
router.get("/user-dashboard", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({
      status: { $in: ["PAID", "CONFIRMED_PAY_LATER"] }
    }).populate("pitch", "name address image");

    const pitchMap = {};
    const slotMap = {};

    bookings.forEach((b) => {
      const pitchId = b.pitch?._id?.toString();
      const pitchName = b.pitch?.name || "Unknown Pitch";
      const pitchAddress = b.pitch?.address || "";
      const pitchImage = b.pitch?.image || "";

      if (pitchId) {
        if (!pitchMap[pitchId]) {
          pitchMap[pitchId] = {
            pitchId,
            name: pitchName,
            address: pitchAddress,
            image: pitchImage,
            count: 0
          };
        }
        pitchMap[pitchId].count += 1;
      }

      if (b.slot) {
        if (!slotMap[b.slot]) {
          slotMap[b.slot] = {
            slot: b.slot,
            count: 0
          };
        }
        slotMap[b.slot].count += 1;
      }
    });

    const trendingPitches = Object.values(pitchMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const peakSlots = Object.values(slotMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.json({
      trendingPitches,
      peakSlots,
      totalCompletedBookings: bookings.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;