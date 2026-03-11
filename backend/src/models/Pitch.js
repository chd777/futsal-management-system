const mongoose = require("mongoose");

const pitchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    pricePerHour: { type: Number, required: true, min: 0 },

    openTime: { type: String, required: true },  // "06:00"
    closeTime: { type: String, required: true }, // "22:00"

    // for google maps
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pitch", pitchSchema);
