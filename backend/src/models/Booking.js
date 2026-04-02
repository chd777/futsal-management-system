const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pitch: { type: mongoose.Schema.Types.ObjectId, ref: "Pitch", required: true },
    date: { type: String, required: true },
    slot: { type: String, required: true },
    priceAtBooking: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PAID", "CONFIRMED_PAY_LATER", "CANCELLED"],
      default: "PENDING_PAYMENT"
    },
    isLoyaltyReward: { type: Boolean, default: false },
    bookingGroup: { type: String, default: null },
    khaltiPidx: { type: String, default: null },
    khaltiTxnId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
    cancelledBy: { type: String, enum: ["user", "admin", null], default: null },
    refundStatus: {
      type: String,
      enum: ["NONE", "PENDING", "REFUNDED"],
      default: "NONE"
    },
    refundedAt: { type: Date, default: null },
    refundReason: { type: String, default: null }
  },
  { timestamps: true }
);

bookingSchema.index(
  { pitch: 1, date: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "CANCELLED" } }
  }
);

module.exports = mongoose.model("Booking", bookingSchema);