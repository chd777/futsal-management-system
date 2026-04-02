const router = require("express").Router();
const axios = require("axios");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Pitch = require("../models/Pitch");
const User = require("../models/User");
const auth = require("../middleware/auth");
const emailService = require("../utils/emailService");

// Khalti ePayment base URL
const KHALTI_BASE = "https://a.khalti.com";

function sortBySlot(bookings) {
  return [...bookings].sort((a, b) => a.slot.localeCompare(b.slot));
}

function buildCombinedSlot(bookings) {
  const sorted = sortBySlot(bookings);
  if (sorted.length === 0) return "";
  if (sorted.length === 1) return sorted[0].slot;

  const firstStart = sorted[0].slot.split("-")[0];
  const lastEnd = sorted[sorted.length - 1].slot.split("-")[1];
  return `${firstStart}-${lastEnd}`;
}

async function getGroupedBookings(anchorBooking, userId, expectedStatus = null) {
  let filter;

  if (anchorBooking.bookingGroup) {
    filter = {
      user: userId,
      bookingGroup: anchorBooking.bookingGroup,
      pitch: anchorBooking.pitch,
      date: anchorBooking.date
    };
  } else {
    filter = {
      _id: anchorBooking._id,
      user: userId
    };
  }

  if (expectedStatus) {
    filter.status = expectedStatus;
  }

  const bookings = await Booking.find(filter);
  return sortBySlot(bookings);
}

async function getGroupedBookingsForAnyStatus(anchorBooking, userId) {
  let filter;

  if (anchorBooking.bookingGroup) {
    filter = {
      user: userId,
      bookingGroup: anchorBooking.bookingGroup,
      pitch: anchorBooking.pitch,
      date: anchorBooking.date
    };
  } else {
    filter = {
      _id: anchorBooking._id,
      user: userId
    };
  }

  const bookings = await Booking.find(filter);
  return sortBySlot(bookings);
}

function buildEmailBooking(groupBookings) {
  const first = groupBookings[0];
  const totalPrice = groupBookings.reduce(
    (sum, b) => sum + Number(b.priceAtBooking || 0),
    0
  );

  return {
    ...first.toObject(),
    slot: buildCombinedSlot(groupBookings),
    priceAtBooking: totalPrice
  };
}

// ==============================
// KHALTI INITIATE
// POST /api/payments/khalti/initiate
// ==============================
router.post("/khalti/initiate", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.sub
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    const groupedBookings = await getGroupedBookings(
      booking,
      req.user.sub,
      "PENDING_PAYMENT"
    );

    if (!groupedBookings.length) {
      return res.status(404).json({ message: "No pending bookings found to pay" });
    }

    const user = await User.findById(req.user.sub);
    const pitch = await Pitch.findById(booking.pitch);

    if (!pitch) {
      return res.status(404).json({ message: "Pitch not found" });
    }

    const totalPrice = groupedBookings.reduce(
      (sum, b) => sum + Number(b.priceAtBooking || 0),
      0
    );
    const amountInPaisa = Math.round(totalPrice * 100);

    const combinedSlot = buildCombinedSlot(groupedBookings);
    const purchaseOrderId = booking.bookingGroup || booking._id.toString();

    const response = await axios.post(
      `${KHALTI_BASE}/api/v2/epayment/initiate/`,
      {
        return_url: `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/payment/verify`,
        website_url: process.env.CLIENT_ORIGIN || "http://localhost:5173",
        amount: amountInPaisa,
        purchase_order_id: purchaseOrderId,
        purchase_order_name: `${pitch.name} - ${booking.date} ${combinedSlot}`,
        customer_info: {
          name: user?.fullName || user?.name || "Customer",
          email: user?.email || "test@example.com",
          phone: user?.phone || "9800000001"
        }
      },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    await Booking.updateMany(
      { _id: { $in: groupedBookings.map((b) => b._id) } },
      { $set: { khaltiPidx: response.data.pidx } }
    );

    return res.json({
      message: "Payment initiated successfully",
      payment_url: response.data.payment_url,
      pidx: response.data.pidx
    });
  } catch (err) {
    console.error("Khalti initiate error:", err?.response?.data || err.message);
    return res.status(500).json({
      message: "Payment initiation failed",
      error: err?.response?.data || err.message
    });
  }
});

// ==============================
// KHALTI VERIFY
// POST /api/payments/khalti/verify
// ==============================
router.post("/khalti/verify", auth, async (req, res) => {
  try {
    const { pidx, bookingId } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: "pidx required" });
    }

    const response = await axios.post(
      `${KHALTI_BASE}/api/v2/epayment/lookup/`,
      { pidx },
      {
        headers: {
          Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const paymentData = response.data;
    let booking = null;

    if (bookingId) {
      // Only query by _id if it is a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(bookingId)) {
        booking = await Booking.findOne({
          _id: bookingId,
          user: req.user.sub
        });
      }

      // If not found by _id, try bookingGroup
      if (!booking) {
        booking = await Booking.findOne({
          bookingGroup: bookingId,
          user: req.user.sub
        });
      }
    }

    // Fallback: find by pidx
    if (!booking) {
      booking = await Booking.findOne({
        khaltiPidx: pidx,
        user: req.user.sub
      });
    }

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found for this payment"
      });
    }

    const groupedBookings = await getGroupedBookingsForAnyStatus(booking, req.user.sub);

   if (paymentData.status === "Completed") {
  const txnId =
    paymentData.transaction_id ||
    paymentData.transactionId ||
    null;

  const latestGroupedBookings = await getGroupedBookingsForAnyStatus(
    booking,
    req.user.sub
  );

  // Update only those not already PAID
  const updateResult = await Booking.updateMany(
    {
      _id: { $in: latestGroupedBookings.map((b) => b._id) },
      status: { $ne: "PAID" }
    },
    {
      $set: {
        status: "PAID",
        khaltiPidx: pidx,
        khaltiTxnId: txnId,
        paidAt: new Date()
      }
    }
  );

  // Send emails ONLY if something was actually updated now
  if (updateResult.modifiedCount > 0) {
    const user = await User.findById(booking.user);
    const pitch = await Pitch.findById(booking.pitch);

    if (user && pitch) {
      const refreshedBookings = await getGroupedBookingsForAnyStatus(
        booking,
        req.user.sub
      );
      const emailBooking = buildEmailBooking(refreshedBookings);

      // user payment confirmation
      emailService
        .sendPaymentConfirmation(user, emailBooking, pitch)
        .catch(() => {});

      // admin payment confirmation
      const admins = await User.find({ role: "admin" }).select("email");
      for (const admin of admins) {
        emailService
          .sendAdminPaymentConfirmation(admin.email, user, emailBooking, pitch)
          .catch(() => {});
      }
    }
  }

  return res.json({
    message: "Payment verified successfully",
    status: "PAID",
    bookingGroup: booking.bookingGroup || null,
    bookingsUpdated: latestGroupedBookings.length
  });
}

    if (paymentData.status === "Pending" || paymentData.status === "Initiated") {
      return res.json({
        message: "Payment is still pending",
        status: "PENDING",
        khaltiStatus: paymentData.status
      });
    }

    return res.json({
      message: "Payment not completed",
      status: "FAILED",
      khaltiStatus: paymentData.status
    });
  } catch (err) {
    console.error("Khalti verify error:", err?.response?.data || err.message);
    return res.status(500).json({
      message: "Payment verification failed",
      error: err?.response?.data || err.message
    });
  }
});

// ==============================
// MOCK PAYMENT SUCCESS
// POST /api/payments/mock/success
// ==============================
router.post("/mock/success", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.sub
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    const groupedBookings = await getGroupedBookings(
      booking,
      req.user.sub,
      "PENDING_PAYMENT"
    );

    const mockPidx = "MOCK_PIDX_" + Date.now();
    const mockTxn = "MOCK_TXN_" + Date.now();

    await Booking.updateMany(
      { _id: { $in: groupedBookings.map((b) => b._id) } },
      {
        $set: {
          status: "PAID",
          paidAt: new Date(),
          khaltiPidx: mockPidx,
          khaltiTxnId: mockTxn
        }
      }
    );

    const user = await User.findById(booking.user);
    const pitch = await Pitch.findById(booking.pitch);

    if (user && pitch) {
      const emailBooking = buildEmailBooking(groupedBookings);
      emailService.sendPaymentConfirmation(user, emailBooking, pitch).catch(() => {});
    }

    return res.json({
      message: "Mock payment successful",
      status: "PAID",
      bookingsUpdated: groupedBookings.length
    });
  } catch (err) {
    console.error("Mock payment success error:", err.message);
    return res.status(500).json({
      message: "Mock payment failed"
    });
  }
});

// ==============================
// MOCK PAYMENT FAIL
// POST /api/payments/mock/fail
// ==============================
router.post("/mock/fail", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.sub
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    return res.json({
      message: "Mock payment failed",
      status: "FAILED",
      booking
    });
  } catch (err) {
    console.error("Mock payment fail error:", err.message);
    return res.status(500).json({
      message: "Mock payment fail route error"
    });
  }
});

// ==============================
// PAY LATER
// POST /api/payments/pay-later
// ==============================
router.post("/pay-later", auth, async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "bookingId required" });
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      user: req.user.sub
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking is not pending payment" });
    }

    const groupedBookings = await getGroupedBookings(
      booking,
      req.user.sub,
      "PENDING_PAYMENT"
    );

    await Booking.updateMany(
      { _id: { $in: groupedBookings.map((b) => b._id) } },
      { $set: { status: "CONFIRMED_PAY_LATER" } }
    );

    const user = await User.findById(req.user.sub);
    const pitch = await Pitch.findById(booking.pitch);

    if (user && pitch) {
      const emailBooking = buildEmailBooking(groupedBookings);
      emailService.sendBookingConfirmation(user, emailBooking, pitch).catch(() => {});
    }

    return res.json({
      message: "Booking confirmed! Please pay with cash at the venue.",
      bookingsUpdated: groupedBookings.length
    });
  } catch (err) {
    console.error("Pay later error:", err.message);
    return res.status(500).json({
      message: "Server error"
    });
  }
});

module.exports = router;