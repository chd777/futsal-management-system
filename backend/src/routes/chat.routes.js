const router = require("express").Router();
const Pitch = require("../models/Pitch");
const Booking = require("../models/Booking");
const Review = require("../models/Review");
const auth = require("../middleware/auth");

// POST /api/chat
router.post("/", auth, async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.sub;

    if (!message || !message.trim()) {
      return res.json({ reply: "Please type a message!" });
    }

    const msg = message.toLowerCase().trim();
    let reply = "";

    // ==========================================
    // GREETING
    // ==========================================
    if (msg.match(/^(hi|hello|hey|namaste|yo|sup)/)) {
      reply = "Hey there! 👋 Welcome to FutsalMS. I can help you with:\n\n" +
        "⚽ **Find pitches** — try 'cheapest pitch' or 'best rated'\n" +
        "📍 **Search by area** — try 'pitches near Baneshwor'\n" +
        "📅 **Check slots** — try 'slots available tomorrow'\n" +
        "📋 **Your bookings** — try 'my bookings'\n" +
        "💰 **Payment info** — try 'how to pay'\n" +
        "🎁 **Loyalty info** — try 'loyalty reward'\n\n" +
        "What would you like to know?";
    }

    // ==========================================
    // HELP
    // ==========================================
    else if (msg.match(/help|what can you do|commands|menu/)) {
      reply = "Here's what I can help with:\n\n" +
        "🔍 **Search pitches:**\n" +
        "• 'cheapest pitch' — find lowest price\n" +
        "• 'best rated pitch' — highest rated\n" +
        "• 'all pitches' — list all available\n" +
        "• 'pitches near [area]' — search by location\n\n" +
        "📅 **Booking help:**\n" +
        "• 'my bookings' — your upcoming bookings\n" +
        "• 'how to book' — booking guide\n\n" +
        "💰 **Payment:**\n" +
        "• 'how to pay' — payment options\n" +
        "• 'khalti' — about Khalti payment\n\n" +
        "🎁 **Other:**\n" +
        "• 'loyalty' — loyalty reward info\n" +
        "• 'cancel booking' — cancellation info\n" +
        "• 'review' — how to leave reviews";
    }

    // ==========================================
    // CHEAPEST PITCH
    // ==========================================
    else if (msg.match(/cheap|lowest price|affordable|budget|minimum price/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ pricePerHour: 1 }).limit(3);
      if (pitches.length === 0) {
        reply = "No pitches available right now. Check back later!";
      } else {
        reply = "💰 **Most Affordable Pitches:**\n\n";
        pitches.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n   ⏰ ${p.openTime} - ${p.closeTime}\n\n`;
        });
        reply += "Click on Browse Pitches to book!";
      }
    }

    // ==========================================
    // MOST EXPENSIVE / PREMIUM
    // ==========================================
    else if (msg.match(/expensive|costly|premium|highest price|luxury/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ pricePerHour: -1 }).limit(3);
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = "💎 **Premium Pitches:**\n\n";
        pitches.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n\n`;
        });
      }
    }

    // ==========================================
    // BEST RATED
    // ==========================================
    else if (msg.match(/best|top rated|highest rated|popular|recommended/)) {
      const pitches = await Pitch.find({ isActive: true });
      const withRatings = await Promise.all(
        pitches.map(async (p) => {
          const reviews = await Review.find({ pitch: p._id });
          const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
          return { ...p.toObject(), avgRating: Math.round(avg * 10) / 10, reviewCount: reviews.length };
        })
      );
      const sorted = withRatings.filter(p => p.reviewCount > 0).sort((a, b) => b.avgRating - a.avgRating);

      if (sorted.length === 0) {
        reply = "No pitches have been rated yet. Be the first to book and leave a review! ⭐";
      } else {
        reply = "⭐ **Top Rated Pitches:**\n\n";
        sorted.slice(0, 3).forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — ⭐ ${p.avgRating}/5 (${p.reviewCount} reviews)\n   📍 ${p.address} — NPR ${p.pricePerHour}/hr\n\n`;
        });
      }
    }

    // ==========================================
    // ALL PITCHES
    // ==========================================
    else if (msg.match(/all pitch|list pitch|show pitch|available pitch/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ name: 1 });
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = `⚽ **All Available Pitches (${pitches.length}):**\n\n`;
        pitches.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n\n`;
        });
      }
    }

    // ==========================================
    // SEARCH BY LOCATION
    // ==========================================
    else if (msg.match(/near|location|area|where|pitches in|futsal in/)) {
      // Extract location from message
      const words = msg.replace(/near|location|area|pitches in|futsal in|where is|around|close to/g, "").trim();
      if (words.length < 2) {
        reply = "Please specify an area. For example: 'pitches near Baneshwor' or 'futsal in Chabahil'";
      } else {
        const pitches = await Pitch.find({
          isActive: true,
          $or: [
            { address: { $regex: words, $options: "i" } },
            { name: { $regex: words, $options: "i" } }
          ]
        });
        if (pitches.length === 0) {
          reply = `No pitches found near "${words}". Try a different area or type 'all pitches' to see everything.`;
        } else {
          reply = `📍 **Pitches near ${words}:**\n\n`;
          pitches.forEach((p, i) => {
            reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n\n`;
          });
        }
      }
    }

    // ==========================================
    // MY BOOKINGS
    // ==========================================
    else if (msg.match(/my booking|my book|upcoming|my schedule/)) {
      const today = new Date().toISOString().slice(0, 10);
      const bookings = await Booking.find({
        user: userId,
        date: { $gte: today },
        status: { $ne: "CANCELLED" }
      })
        .populate("pitch", "name address")
        .sort({ date: 1, slot: 1 })
        .limit(5);

      if (bookings.length === 0) {
        reply = "You don't have any upcoming bookings. Browse pitches to book one! ⚽";
      } else {
        reply = `📋 **Your Upcoming Bookings (${bookings.length}):**\n\n`;
        bookings.forEach((b, i) => {
          const statusEmoji = b.status === "PAID" ? "✅" : b.status === "CONFIRMED_PAY_LATER" ? "💵" : "⏳";
          reply += `${i + 1}. **${b.pitch?.name}**\n   📅 ${b.date} | ⏰ ${b.slot}\n   ${statusEmoji} ${b.status === "PAID" ? "Paid" : b.status === "CONFIRMED_PAY_LATER" ? "Pay at Venue" : "Pending Payment"}\n\n`;
        });
      }
    }

    // ==========================================
    // HOW TO BOOK
    // ==========================================
    else if (msg.match(/how to book|booking process|book a pitch|how do i book/)) {
      reply = "📖 **How to Book a Pitch:**\n\n" +
        "1️⃣ Go to **Browse Pitches** from the menu\n" +
        "2️⃣ Click on a pitch you like\n" +
        "3️⃣ Select a **date** and available **time slot**\n" +
        "4️⃣ Click **Confirm Booking**\n" +
        "5️⃣ Choose payment: **Pay with Khalti** or **Pay Later (Cash)**\n\n" +
        "That's it! You'll get an email confirmation. 📧";
    }

    // ==========================================
    // PAYMENT INFO
    // ==========================================
    else if (msg.match(/payment|how to pay|pay|khalti|cash/)) {
      reply = "💰 **Payment Options:**\n\n" +
        "1️⃣ **Pay with Khalti** — Online payment using Khalti digital wallet. Instant confirmation.\n\n" +
        "2️⃣ **Pay Later (Cash)** — Book now, pay with cash when you arrive at the venue.\n\n" +
        "Both options confirm your booking. You'll receive an email confirmation either way! 📧";
    }

    // ==========================================
    // LOYALTY
    // ==========================================
    else if (msg.match(/loyalty|reward|free|discount|offer/)) {
      reply = "🎁 **Loyalty Reward Program:**\n\n" +
        "Book **5 times** at the same pitch and your **6th booking is FREE!** 🎉\n\n" +
        "How it works:\n" +
        "• Book 1-5 → Pay normally\n" +
        "• Booking 6 → FREE! (auto-applied)\n" +
        "• Book 7-11 → Pay normally\n" +
        "• Booking 12 → FREE again!\n\n" +
        "Check your loyalty progress on any Pitch Detail page. Keep playing and earning! ⚽";
    }

    // ==========================================
    // CANCEL BOOKING
    // ==========================================
    else if (msg.match(/cancel|cancellation|refund/)) {
      reply = "❌ **Cancellation Policy:**\n\n" +
        "• You can cancel **unpaid** bookings anytime from My Bookings page\n" +
        "• **Paid** bookings can only be cancelled by admin\n" +
        "• If admin cancels your booking, you'll receive an email with the reason\n" +
        "• If a pitch is closed for holidays/maintenance, your booking is auto-cancelled and you're notified by email";
    }

    // ==========================================
    // REVIEWS
    // ==========================================
    else if (msg.match(/review|rating|rate|feedback/)) {
      reply = "⭐ **Reviews & Ratings:**\n\n" +
        "• After your booking date has passed and you've paid, you can write a review\n" +
        "• Go to **My Bookings → Past** tab\n" +
        "• Click **Write Review** on any completed booking\n" +
        "• Rate 1-5 stars and add an optional comment\n" +
        "• Your review helps other players find the best pitches!";
    }

    // ==========================================
    // TIMING / OPENING HOURS
    // ==========================================
    else if (msg.match(/time|timing|hours|open|close|when/)) {
      const pitches = await Pitch.find({ isActive: true }).select("name openTime closeTime");
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = "⏰ **Pitch Timings:**\n\n";
        pitches.forEach(p => {
          reply += `• **${p.name}** — ${p.openTime} to ${p.closeTime}\n`;
        });
      }
    }

    // ==========================================
    // PRICE LIST
    // ==========================================
    else if (msg.match(/price|cost|rate|how much|charge|fee/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ pricePerHour: 1 });
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = "💰 **Price List:**\n\n";
        pitches.forEach(p => {
          reply += `• **${p.name}** — NPR ${p.pricePerHour}/hr\n`;
        });
        reply += "\nEvery 6th booking at the same pitch is FREE! 🎁";
      }
    }

    // ==========================================
    // THANK YOU
    // ==========================================
    else if (msg.match(/thank|thanks|thx|dhanyabad/)) {
      reply = "You're welcome! 😊 Happy to help. Enjoy your game! ⚽";
    }

    // ==========================================
    // BYE
    // ==========================================
    else if (msg.match(/bye|goodbye|see you|later/)) {
      reply = "Goodbye! 👋 See you on the pitch! ⚽";
    }

    // ==========================================
    // DEFAULT / UNKNOWN
    // ==========================================
    else {
      // Try to search pitches by the message as a keyword
      const pitches = await Pitch.find({
        isActive: true,
        $or: [
          { name: { $regex: msg, $options: "i" } },
          { address: { $regex: msg, $options: "i" } }
        ]
      });

      if (pitches.length > 0) {
        reply = `I found ${pitches.length} pitch(es) matching "${message}":\n\n`;
        pitches.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n\n`;
        });
      } else {
        reply = "I'm not sure about that. Here are some things you can ask me:\n\n" +
          "• 'cheapest pitch' or 'best rated'\n" +
          "• 'pitches near [area]'\n" +
          "• 'my bookings'\n" +
          "• 'how to book' or 'how to pay'\n" +
          "• 'loyalty reward'\n" +
          "• 'price list' or 'timings'\n\n" +
          "Or just type a pitch name or area to search!";
      }
    }

    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again!" });
  }
});

module.exports = router;