const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pitch: { type: mongoose.Schema.Types.ObjectId, ref: "Pitch", required: true },
    date: { type: String, required: true },       // "YYYY-MM-DD"
    slot: { type: String, required: true },        // "07:00-08:00"
    priceAtBooking: { type: Number, required: true },
    status: {
      type: String,
      enum: ["PENDING_PAYMENT", "PAID", "CANCELLED"],
      default: "PENDING_PAYMENT"
    },
    khaltiPidx: { type: String, default: null },
    khaltiTxnId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Unique compound index prevents double booking at DB level
bookingSchema.index(
  { pitch: 1, date: 1, slot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: "CANCELLED" } }
  }
);

module.exports = mongoose.model("Booking", bookingSchema);