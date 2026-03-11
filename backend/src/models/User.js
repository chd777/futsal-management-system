const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    college: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, default: "user", enum: ["user", "admin"] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
