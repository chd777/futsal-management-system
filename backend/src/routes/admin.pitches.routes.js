const router = require("express").Router();
const Pitch = require("../models/Pitch");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

// GET all pitches
router.get("/", auth, adminOnly, async (req, res) => {
  const pitches = await Pitch.find().sort({ createdAt: -1 });
  res.json({ pitches });
});

// POST create pitch
router.post("/", auth, adminOnly, async (req, res) => {
  const { name, address, pricePerHour, openTime, closeTime, lat, lng, image, managementPin } = req.body;

  if (!name || !address || !pricePerHour || !openTime || !closeTime || lat == null || lng == null) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const pitch = await Pitch.create({
    name: name.trim(),
    address: address.trim(),
    pricePerHour: Number(pricePerHour),
    openTime,
    closeTime,
    lat: Number(lat),
    lng: Number(lng),
    image: image ? String(image).trim() : "",
    managementPin: managementPin || null
  });

  res.status(201).json({ pitch });
});

// PUT update pitch
router.put("/:id", auth, adminOnly, async (req, res) => {
  const { name, address, pricePerHour, openTime, closeTime, lat, lng, isActive, image, managementPin } = req.body;

  const update = {};
  if (name != null) update.name = String(name).trim();
  if (address != null) update.address = String(address).trim();
  if (pricePerHour != null) update.pricePerHour = Number(pricePerHour);
  if (openTime != null) update.openTime = openTime;
  if (closeTime != null) update.closeTime = closeTime;
  if (lat != null) update.lat = Number(lat);
  if (lng != null) update.lng = Number(lng);
  if (isActive != null) update.isActive = Boolean(isActive);
  if (image != null) update.image = String(image).trim();
  if (managementPin != null) update.managementPin = managementPin || null;

  const pitch = await Pitch.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!pitch) return res.status(404).json({ message: "Pitch not found" });

  res.json({ pitch });
});

// DELETE pitch
router.delete("/:id", auth, adminOnly, async (req, res) => {
  const pitch = await Pitch.findByIdAndDelete(req.params.id);
  if (!pitch) return res.status(404).json({ message: "Pitch not found" });
  res.json({ message: "Pitch deleted" });
});

module.exports = router;