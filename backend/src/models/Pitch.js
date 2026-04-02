const mongoose = require("mongoose");

const pitchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true },
    openTime: { type: String, default: "06:00" },
    closeTime: { type: String, default: "22:00" },
    lat: { type: Number, default: 27.7172 },
    lng: { type: Number, default: 85.324 },
    isActive: { type: Boolean, default: true },
    image: { type: String, default: null },
    managementPin: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pitch", pitchSchema);