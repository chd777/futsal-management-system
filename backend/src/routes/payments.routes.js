const router = require("express").Router();
const axios = require("axios");
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const User = require("../models/User");
const auth = require("../middleware/auth");
const emailService = require("../utils/emailService");

// Khalti sandbox base URL (change to https://khalti.com for production)
const KHALTI_BASE = "https://dev.khalti.com";

// POST /api/payments/khalti/initiate
router.post("/khalti/initiate", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.sub });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    const user = await User.findById(req.user.sub);
    const pitch = await Pitch.findById(booking.pitch);

    // Khalti expects amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = booking.priceAtBooking * 100;

    const response = await axios.post(
      `${KHALTI_BASE}/api/v2/epayment/initiate/`,
      {
        return_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment/verify`,
        website_url: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        amount: amountInPaisa,
        purchase_order_id: booking._id.toString(),
        purchase_order_name: `${pitch?.name || "Futsal"} - ${booking.date} ${booking.slot}`,
        customer_info: {
          name: user?.fullName || "Customer",
          email: user?.email || "",
          phone: "9800000001"
        }
      },
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Save pidx for verification later
    booking.khaltiPidx = response.data.pidx;
    await booking.save();

    res.json({
      payment_url: response.data.payment_url,
      pidx: response.data.pidx
    });
  } catch (err) {
    console.error("Khalti initiate error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Payment initiation failed", error: err?.response?.data });
  }
});

// POST /api/payments/khalti/verify
router.post("/khalti/verify", auth, async (req, res) => {
  try {
    const { pidx } = req.body;
    if (!pidx) return res.status(400).json({ message: "pidx required" });

    // Lookup payment status from Khalti
    const response = await axios.post(
      `${KHALTI_BASE}/api/v2/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const paymentData = response.data;

    if (paymentData.status === "Completed") {
      // Find booking by pidx and update
      const booking = await Booking.findOne({ khaltiPidx: pidx });
      if (!booking) return res.status(404).json({ message: "Booking not found" });

      booking.status = "PAID";
      booking.khaltiTxnId = paymentData.transaction_id;
      booking.paidAt = new Date();
      await booking.save();

      // Send payment confirmation email
      const user = await User.findById(booking.user);
      const pitch = await Pitch.findById(booking.pitch);
      if (user && pitch) {
        emailService.sendPaymentConfirmation(user, booking, pitch).catch(() => {});
      }

      return res.json({ message: "Payment verified", status: "PAID", booking });
    } else {
      return res.json({ message: "Payment not completed", status: paymentData.status });
    }
  } catch (err) {
    console.error("Khalti verify error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

// POST /api/payments/pay-later - Pay with cash later
router.post("/pay-later", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId required" });

    const booking = await Booking.findOne({ _id: bookingId, user: req.user.sub });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    // Mark as confirmed (pay later with cash)
    booking.status = "CONFIRMED_PAY_LATER";
    await booking.save();

    // Send confirmation email
    const user = await User.findById(req.user.sub);
    const pitch = await Pitch.findById(booking.pitch);
    if (user && pitch) {
      emailService.sendBookingConfirmation(user, booking, pitch).catch(() => {});
    }

    res.json({ message: "Booking confirmed! Please pay with cash at the venue.", booking });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;