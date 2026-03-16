const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, college, acceptTerms } = req.body;

    if (!fullName || !email || !password || !confirmPassword || !college) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    if (acceptTerms !== true) {
      return res.status(400).json({ message: "You must accept the terms" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      college,
      role: "user"
    });

    return res.status(201).json({ message: "Registered successfully. Please login." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // If user registered via Google and has no password
    if (!user.passwordHash) {
      return res.status(401).json({ message: "This account uses Google login. Please use 'Continue with Google'." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = signToken(user._id.toString());

    return res.json({
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, college: user.college, role: user.role }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};

// Google OAuth Login
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      return res.status(400).json({ message: "Could not get email from Google" });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user from Google data
      user = await User.create({
        fullName: name || "Google User",
        email: email.toLowerCase(),
        passwordHash: null, // No password for Google users
        college: "Not specified",
        role: "user",
        googleId: googleId,
        profilePicture: picture || null
      });
    } else {
      // Update Google info if not set
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture) user.profilePicture = picture;
        await user.save();
      }
    }

    const token = signToken(user._id.toString());

    return res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        college: user.college,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

exports.me = async (req, res) => {
  try {
    const userId = req.user?.sub;
    const user = await User.findById(userId).select("fullName email college role createdAt profilePicture");
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};