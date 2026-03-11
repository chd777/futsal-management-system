const User = require("../models/User");

module.exports = async function adminOnly(req, res, next) {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("role");
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
