const router = require("express").Router();
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const auth = require("../middleware/auth");

// helper: recalculate pitch rating stats
async function updatePitchRatingStats(pitchId) {
  const reviews = await Review.find({ pitch: pitchId });

  const reviewCount = reviews.length;
  const avgRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  await Pitch.findByIdAndUpdate(pitchId, {
    avgRating,
    reviewCount
  });
}

// POST /api/reviews - create a review (after completed booking)
router.post("/", auth, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const userId = req.user.sub;

    if (!bookingId || !rating) {
      return res.status(400).json({ message: "bookingId and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.user.toString() !== userId) {
      return res.status(403).json({ message: "Not your booking" });
    }

    // allow PAID and pay-later completed bookings if you want
    if (booking.status !== "PAID" && booking.status !== "CONFIRMED_PAY_LATER") {
      return res.status(400).json({
        message: "Can only review completed bookings"
      });
    }

    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(409).json({ message: "You have already reviewed this booking" });
    }

    const review = await Review.create({
      user: userId,
      pitch: booking.pitch,
      booking: bookingId,
      rating: Number(rating),
      comment: comment || ""
    });

    await updatePitchRatingStats(booking.pitch);

    res.status(201).json({ review });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already reviewed this booking" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reviews/pitch/:pitchId
router.get("/pitch/:pitchId", async (req, res) => {
  try {
    const reviews = await Review.find({ pitch: req.params.pitchId })
      .populate("user", "fullName")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/reviews/my - user's reviews
router.get("/my", auth, async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user.sub })
      .populate("pitch", "name")
      .populate("booking", "_id")
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;