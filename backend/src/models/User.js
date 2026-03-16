const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: null }, // null for Google-only users
    college: { type: String, default: "Not specified", trim: true, maxlength: 120 },
    role: { type: String, default: "user", enum: ["user", "admin"] },
    googleId: { type: String, default: null },
    profilePicture: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);