const mongoose = require("mongoose");

const pitchClosureSchema = new mongoose.Schema(
  {
    pitch: { type: mongoose.Schema.Types.ObjectId, ref: "Pitch", required: true },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    reason: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

// One closure per pitch per date
pitchClosureSchema.index({ pitch: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("PitchClosure", pitchClosureSchema);