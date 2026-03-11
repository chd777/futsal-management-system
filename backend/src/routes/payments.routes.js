const router = require("express").Router();
const axios = require("axios");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

const KHALTI_SECRET = process.env.KHALTI_SECRET_KEY || "";
const KHALTI_BASE = "https://a.khalti.com/api/v2";
const CLIENT_URL = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// POST /api/payments/khalti/initiate
router.post("/khalti/initiate", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "bookingId is required" });

    const booking = await Booking.findById(bookingId).populate("pitch", "name");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.user.toString() !== req.user.sub) {
      return res.status(403).json({ message: "Not your booking" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    // Amount in paisa (1 NPR = 100 paisa)
    const amountInPaisa = booking.priceAtBooking * 100;

    const payload = {
      return_url: `${CLIENT_URL}/payment/verify`,
      website_url: CLIENT_URL,
      amount: amountInPaisa,
      purchase_order_id: booking._id.toString(),
      purchase_order_name: `Futsal Booking - ${booking.pitch?.name || "Pitch"}`,
      customer_info: {
        name: req.user.sub // Will be resolved on frontend
      }
    };

    const khaltiRes = await axios.post(`${KHALTI_BASE}/epayment/initiate/`, payload, {
      headers: { Authorization: `Key ${KHALTI_SECRET}` }
    });

    // Store pidx
    booking.khaltiPidx = khaltiRes.data.pidx;
    await booking.save();

    res.json({
      payment_url: khaltiRes.data.payment_url,
      pidx: khaltiRes.data.pidx
    });
  } catch (err) {
    console.error("Khalti initiate error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Payment initiation failed" });
  }
});

// POST /api/payments/khalti/verify
router.post("/khalti/verify", auth, async (req, res) => {
  try {
    const { pidx, bookingId } = req.body;
    if (!pidx) return res.status(400).json({ message: "pidx is required" });

    // Lookup the khalti transaction
    const khaltiRes = await axios.post(
      `${KHALTI_BASE}/epayment/lookup/`,
      { pidx },
      { headers: { Authorization: `Key ${KHALTI_SECRET}` } }
    );

    const { status, transaction_id, total_amount } = khaltiRes.data;

    // Find booking by pidx
    const booking = await Booking.findOne({ khaltiPidx: pidx });
    if (!booking) return res.status(404).json({ message: "Booking not found for this payment" });

    if (status === "Completed") {
      booking.status = "PAID";
      booking.khaltiTxnId = transaction_id;
      booking.paidAt = new Date();
      await booking.save();

      return res.json({ message: "Payment verified", status: "PAID", booking });
    } else if (status === "Pending") {
      return res.json({ message: "Payment pending", status: "PENDING" });
    } else {
      // Failed, Expired, Refunded, etc.
      return res.json({ message: `Payment status: ${status}`, status });
    }
  } catch (err) {
    console.error("Khalti verify error:", err?.response?.data || err.message);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

module.exports = router;