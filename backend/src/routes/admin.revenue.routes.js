const router = require("express").Router();
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// GET /api/admin/revenue
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

    // Total paid bookings
    const paidBookings = await Booking.find({ status: "PAID" });
    const totalBookings = paidBookings.length;
    const totalRevenue = paidBookings.reduce((s, b) => s + (b.priceAtBooking || 0), 0);

    // Today's revenue
    const todayBookings = paidBookings.filter(b => b.date === todayStr);
    const todayRevenue = todayBookings.reduce((s, b) => s + (b.priceAtBooking || 0), 0);

    // Monthly revenue
    const monthlyBookings = paidBookings.filter(b => b.date >= monthStart);
    const monthlyRevenue = monthlyBookings.reduce((s, b) => s + (b.priceAtBooking || 0), 0);

    // Per-pitch breakdown
    const pitchMap = {};
    for (const b of paidBookings) {
      const pid = b.pitch.toString();
      if (!pitchMap[pid]) pitchMap[pid] = { count: 0, revenue: 0 };
      pitchMap[pid].count += 1;
      pitchMap[pid].revenue += b.priceAtBooking || 0;
    }

    // Populate pitch names
    const Pitch = require("../models/Pitch");
    const pitches = await Pitch.find({});
    const pitchNameMap = {};
    for (const p of pitches) pitchNameMap[p._id.toString()] = p.name;

    const perPitch = Object.entries(pitchMap).map(([pid, data]) => ({
      pitchId: pid,
      pitchName: pitchNameMap[pid] || "Unknown",
      bookingCount: data.count,
      revenue: data.revenue
    }));

    // Monthly chart data (last 6 months)
    const monthlyChart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", { month: "short", year: "numeric" });
      const mb = paidBookings.filter(b => b.date && b.date.startsWith(key));
      monthlyChart.push({
        month: label,
        bookings: mb.length,
        revenue: mb.reduce((s, b) => s + (b.priceAtBooking || 0), 0)
      });
    }

    // All bookings count (including pending)
    const allCount = await Booking.countDocuments({ status: { $ne: "CANCELLED" } });
    const pendingCount = await Booking.countDocuments({ status: "PENDING_PAYMENT" });

    res.json({
      totalBookings,
      totalRevenue,
      todayRevenue,
      todayBookings: todayBookings.length,
      monthlyRevenue,
      monthlyBookings: monthlyBookings.length,
      allBookingsCount: allCount,
      pendingCount,
      perPitch,
      monthlyChart
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;