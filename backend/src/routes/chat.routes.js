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
      return res.json({ reply: "Please type a message!", suggestions: [] });
    }

    const msg = message.toLowerCase().trim();
    let reply = "";
    let suggestions = [];

    // ==========================================
    // GREETING
    // ==========================================
    if (msg.match(/^(hi|hello|hey|namaste|yo|sup|hola)/)) {
      reply = "Hey there! 👋 Welcome to FutsalMS. I can help you with:\n\n" +
        "⚽ **Find pitches** — try 'cheapest pitch' or 'best rated'\n" +
        "📍 **Search by area** — try 'pitches near Baneshwor'\n" +
        "📅 **Your bookings** — try 'my bookings'\n" +
        "🔥 **Trending** — try 'trending pitch'\n" +
        "⏰ **Rush hours** — try 'peak hours'\n" +
        "💰 **Payment info** — try 'how to pay'\n" +
        "🎁 **Loyalty info** — try 'loyalty reward'\n\n" +
        "What would you like to know?";
      suggestions = ["Trending pitch", "Cheapest pitch", "My bookings", "How to book"];
    }

    // ==========================================
    // HELP
    // ==========================================
    else if (msg.match(/help|what can you do|commands|menu/)) {
      reply = "Here's what I can help with:\n\n" +
        "🔍 **Search pitches:**\n" +
        "• 'cheapest pitch' — find lowest price\n" +
        "• 'best rated pitch' — highest rated\n" +
        "• 'trending pitch' — most booked this month\n" +
        "• 'all pitches' — list all available\n" +
        "• 'pitches near [area]' — search by location\n" +
        "• 'compare pitches' — side by side comparison\n\n" +
        "📅 **Booking help:**\n" +
        "• 'my bookings' — your upcoming bookings\n" +
        "• 'how to book' — booking guide\n" +
        "• 'multi slot' — book 2+ hours at once\n" +
        "• 'peak hours' — when pitches are busiest\n\n" +
        "💰 **Payment & More:**\n" +
        "• 'how to pay' — payment options\n" +
        "• 'loyalty' — loyalty reward info\n" +
        "• 'cancel booking' — cancellation info\n" +
        "• 'pitch owner' — manage your pitch with PIN";
      suggestions = ["Trending pitch", "Peak hours", "Compare pitches", "Loyalty"];
    }

    // ==========================================
    // TRENDING / MOST BOOKED
    // ==========================================
    else if (msg.match(/trending|most booked|popular|hot|famous|busiest/)) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().slice(0, 10);

      const trendingData = await Booking.aggregate([
        { $match: { date: { $gte: dateStr }, status: { $ne: "CANCELLED" } } },
        { $group: { _id: "$pitch", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 3 }
      ]);

      if (trendingData.length === 0) {
        reply = "No booking data yet this month. Be the first to book! ⚽";
      } else {
        const pitchIds = trendingData.map(t => t._id);
        const pitches = await Pitch.find({ _id: { $in: pitchIds } });
        const pitchMap = {};
        pitches.forEach(p => { pitchMap[p._id.toString()] = p; });

        reply = "🔥 **Trending Pitches This Month:**\n\n";
        trendingData.forEach((t, i) => {
          const p = pitchMap[t._id.toString()];
          if (p) {
            const fire = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
            reply += `${fire} **${p.name}** — ${t.count} bookings\n   📍 ${p.address} — NPR ${p.pricePerHour}/hr\n\n`;
          }
        });
        reply += "These are the most popular pitches right now!";
      }
      suggestions = ["Best rated", "Cheapest pitch", "Peak hours"];
    }

    // ==========================================
    // PEAK HOURS / RUSH HOUR
    // ==========================================
    else if (msg.match(/peak|rush hour|busy|busiest time|when.*busy|off.?peak|quiet/)) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().slice(0, 10);

      const hourData = await Booking.aggregate([
        { $match: { date: { $gte: dateStr }, status: { $ne: "CANCELLED" } } },
        { $group: { _id: "$slot", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      if (hourData.length === 0) {
        reply = "Not enough booking data yet to determine peak hours.";
      } else {
        const peak = hourData.slice(0, 3);
        const offPeak = hourData.slice(-3).reverse();

        reply = "⏰ **Peak & Off-Peak Hours (Last 7 Days):**\n\n";
        reply += "🔴 **Busiest slots (book early!):**\n";
        peak.forEach(h => {
          reply += `• ${h._id} — ${h.count} bookings\n`;
        });

        if (offPeak.length > 0 && offPeak[0].count < peak[0].count) {
          reply += "\n🟢 **Quietest slots (easier to get!):**\n";
          offPeak.forEach(h => {
            reply += `• ${h._id} — ${h.count} bookings\n`;
          });
        }

        reply += "\n💡 **Tip:** Book off-peak hours for easier availability!";
      }
      suggestions = ["Trending pitch", "My bookings", "How to book"];
    }

    // ==========================================
    // COMPARE PITCHES
    // ==========================================
    else if (msg.match(/compare|vs|versus|difference between/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ pricePerHour: 1 });
      if (pitches.length < 2) {
        reply = "Need at least 2 pitches to compare.";
      } else {
        const withRatings = await Promise.all(
          pitches.map(async (p) => {
            const reviews = await Review.find({ pitch: p._id });
            const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
            return { ...p.toObject(), avgRating: Math.round(avg * 10) / 10, reviewCount: reviews.length };
          })
        );

        reply = "📊 **Pitch Comparison:**\n\n";
        reply += "| Pitch | Price | Rating | Hours |\n";
        withRatings.forEach(p => {
          const stars = p.avgRating > 0 ? `⭐ ${p.avgRating}` : "No rating";
          reply += `• **${p.name}** — NPR ${p.pricePerHour}/hr — ${stars} — ${p.openTime}-${p.closeTime}\n`;
        });

        // Find best value
        const rated = withRatings.filter(p => p.avgRating > 0);
        if (rated.length > 0) {
          const bestValue = rated.sort((a, b) => (b.avgRating / b.pricePerHour) - (a.avgRating / a.pricePerHour))[0];
          reply += `\n💡 **Best value:** ${bestValue.name} (great rating at NPR ${bestValue.pricePerHour}/hr)`;
        }
      }
      suggestions = ["Cheapest pitch", "Best rated", "Trending pitch"];
    }

    // ==========================================
    // MULTI-SLOT BOOKING
    // ==========================================
    else if (msg.match(/multi.?slot|2 hour|two hour|multiple hour|book.*2|book.*more|extended/)) {
      reply = "📅 **Multi-Slot Booking:**\n\n" +
        "You can book 2 or more consecutive hours at once!\n\n" +
        "**How:**\n" +
        "1️⃣ Go to a pitch detail page\n" +
        "2️⃣ Click the first time slot (turns green)\n" +
        "3️⃣ Click the next consecutive slot (also turns green)\n" +
        "4️⃣ You'll see a summary: '2 hours · 14:00 to 16:00 · NPR 2800'\n" +
        "5️⃣ Click **Confirm Booking** — books all at once!\n" +
        "6️⃣ Pay once for the total amount\n\n" +
        "💡 You can only select **consecutive** slots (no gaps).";
      suggestions = ["How to book", "How to pay", "My bookings"];
    }

    // ==========================================
    // PITCH OWNER / PIN MANAGEMENT
    // ==========================================
    else if (msg.match(/pitch owner|pin|manage my pitch|owner dashboard|pitch manage/)) {
      reply = "🔐 **Pitch Owner Management:**\n\n" +
        "If you're a futsal pitch owner, you can manage your pitch without admin access!\n\n" +
        "**How it works:**\n" +
        "1️⃣ The platform admin creates your pitch and sets a **6-digit PIN**\n" +
        "2️⃣ You receive the PIN from the admin\n" +
        "3️⃣ Go to **futsalms.com/pitch-manage**\n" +
        "4️⃣ Enter your PIN to access your dashboard\n\n" +
        "**What you can do:**\n" +
        "• Edit pitch details (price, timing, location)\n" +
        "• View your bookings\n" +
        "• See your revenue\n" +
        "• Add closure/holiday dates\n" +
        "• Cancel bookings\n" +
        "• Delete your pitch\n\n" +
        "You can only see YOUR pitch — no access to other pitches or admin panel.";
      suggestions = ["How to book", "Contact us", "Help"];
    }

    // ==========================================
    // CHEAPEST PITCH
    // ==========================================
    else if (msg.match(/cheap|lowest price|affordable|budget|minimum price|sasto/)) {
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
      suggestions = ["Best rated", "Trending pitch", "How to book"];
    }

    // ==========================================
    // MOST EXPENSIVE / PREMIUM
    // ==========================================
    else if (msg.match(/expensive|costly|premium|highest price|luxury|mahango/)) {
      const pitches = await Pitch.find({ isActive: true }).sort({ pricePerHour: -1 }).limit(3);
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = "💎 **Premium Pitches:**\n\n";
        pitches.forEach((p, i) => {
          reply += `${i + 1}. **${p.name}** — NPR ${p.pricePerHour}/hr\n   📍 ${p.address}\n\n`;
        });
      }
      suggestions = ["Cheapest pitch", "Compare pitches", "Best rated"];
    }

    // ==========================================
    // BEST RATED
    // ==========================================
    else if (msg.match(/best|top rated|highest rated|recommended|ramro/)) {
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
      suggestions = ["Cheapest pitch", "Trending pitch", "Compare pitches"];
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
      suggestions = ["Cheapest pitch", "Best rated", "Compare pitches"];
    }

    // ==========================================
    // SEARCH BY LOCATION
    // ==========================================
    else if (msg.match(/near|location|area|where|pitches in|futsal in/)) {
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
      suggestions = ["All pitches", "Cheapest pitch", "How to book"];
    }

    // ==========================================
    // MY BOOKINGS
    // ==========================================
    else if (msg.match(/my booking|my book|upcoming|my schedule|mero booking/)) {
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
        suggestions = ["How to book", "Cheapest pitch", "Browse pitches"];
      } else {
        reply = `📋 **Your Upcoming Bookings (${bookings.length}):**\n\n`;
        bookings.forEach((b, i) => {
          const statusEmoji = b.status === "PAID" ? "✅" : b.status === "CONFIRMED_PAY_LATER" ? "💵" : "⏳";
          reply += `${i + 1}. **${b.pitch?.name}**\n   📅 ${b.date} | ⏰ ${b.slot}\n   ${statusEmoji} ${b.status === "PAID" ? "Paid" : b.status === "CONFIRMED_PAY_LATER" ? "Pay at Venue" : "Pending Payment"}\n\n`;
        });
        suggestions = ["How to pay", "Cancel booking", "Loyalty"];
      }
    }

    // ==========================================
    // HOW TO BOOK
    // ==========================================
    else if (msg.match(/how to book|booking process|book a pitch|how do i book|kasari book/)) {
      reply = "📖 **How to Book a Pitch:**\n\n" +
        "1️⃣ Go to **Browse Pitches** from the menu\n" +
        "2️⃣ Click on a pitch you like\n" +
        "3️⃣ Select a **date** and available **time slot(s)**\n" +
        "4️⃣ You can select **multiple consecutive slots** for 2+ hours!\n" +
        "5️⃣ Click **Confirm Booking**\n" +
        "6️⃣ Choose payment: **Pay with Khalti** or **Pay Later (Cash)**\n\n" +
        "That's it! You'll get an email confirmation. 📧";
      suggestions = ["How to pay", "Multi slot booking", "My bookings"];
    }

    // ==========================================
    // PAYMENT INFO
    // ==========================================
    else if (msg.match(/payment|how to pay|pay|khalti|cash|paisa/)) {
      reply = "💰 **Payment Options:**\n\n" +
        "1️⃣ **Pay with Khalti** — Online payment using Khalti digital wallet. Instant confirmation.\n\n" +
        "2️⃣ **Pay Later (Cash)** — Book now, pay with cash when you arrive at the venue.\n\n" +
        "💡 **Multi-slot:** If you book 2+ hours, you pay the total at once (not per slot).\n\n" +
        "Both options confirm your booking. You'll receive an email confirmation either way! 📧";
      suggestions = ["How to book", "My bookings", "Loyalty"];
    }

    // ==========================================
    // LOYALTY
    // ==========================================
    else if (msg.match(/loyalty|reward|free|discount|offer|free game/)) {
      reply = "🎁 **Loyalty Reward Program:**\n\n" +
        "Book **5 times** at the same pitch and your **6th booking is FREE!** 🎉\n\n" +
        "How it works:\n" +
        "• Book 1-5 → Pay normally\n" +
        "• Booking 6 → FREE! (auto-applied)\n" +
        "• Book 7-11 → Pay normally\n" +
        "• Booking 12 → FREE again!\n\n" +
        "Check your loyalty progress on any Pitch Detail page or click the 🎁 Loyalty Rewards card on your Home page.";
      suggestions = ["My bookings", "How to book", "Trending pitch"];
    }

    // ==========================================
    // CANCEL BOOKING
    // ==========================================
    else if (msg.match(/cancel|cancellation|refund/)) {
      reply = "❌ **Cancellation Policy:**\n\n" +
        "• You can cancel **unpaid** bookings anytime from My Bookings page\n" +
        "• **Paid** bookings can only be cancelled by admin\n" +
        "• If admin cancels your booking, you'll receive an email with the reason\n" +
        "• Multi-slot bookings: cancelling one cancels all slots in the group\n" +
        "• If a pitch is closed for holidays, your booking is auto-cancelled and you're notified";
      suggestions = ["My bookings", "How to pay", "Contact us"];
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
      suggestions = ["My bookings", "Best rated", "How to book"];
    }

    // ==========================================
    // TIMING / OPENING HOURS
    // ==========================================
    else if (msg.match(/time|timing|hours|open|close|when|kati baje/)) {
      const pitches = await Pitch.find({ isActive: true }).select("name openTime closeTime");
      if (pitches.length === 0) {
        reply = "No pitches available right now.";
      } else {
        reply = "⏰ **Pitch Timings:**\n\n";
        pitches.forEach(p => {
          reply += `• **${p.name}** — ${p.openTime} to ${p.closeTime}\n`;
        });
      }
      suggestions = ["Peak hours", "Price list", "How to book"];
    }

    // ==========================================
    // PRICE LIST
    // ==========================================
    else if (msg.match(/price|cost|rate|how much|charge|fee|kati/)) {
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
      suggestions = ["Cheapest pitch", "Compare pitches", "Loyalty"];
    }

    // ==========================================
    // CONTACT
    // ==========================================
    else if (msg.match(/contact|email|phone|support|reach/)) {
      reply = "📞 **Contact Us:**\n\n" +
        "📧 Email: **futsalms6@gmail.com**\n" +
        "📞 Phone: **+977 9800000000**\n" +
        "📍 Location: **Kathmandu, Nepal**\n\n" +
        "Or visit the **Contact Us** page to send us a message directly!";
      suggestions = ["Help", "How to book", "My bookings"];
    }

    // ==========================================
    // THANK YOU
    // ==========================================
    else if (msg.match(/thank|thanks|thx|dhanyabad|dhanyabaad/)) {
      reply = "You're welcome! 😊 Happy to help. Enjoy your game! ⚽";
      suggestions = ["How to book", "My bookings", "Trending pitch"];
    }

    // ==========================================
    // BYE
    // ==========================================
    else if (msg.match(/bye|goodbye|see you|later|bhetaula/)) {
      reply = "Goodbye! 👋 See you on the pitch! ⚽";
    }

    // ==========================================
    // DEFAULT / SMART SEARCH
    // ==========================================
    else {
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
        suggestions = ["How to book", "Compare pitches", "Peak hours"];
      } else {
        reply = "I'm not sure about that. Here are some things you can ask me:\n\n" +
          "• 'cheapest pitch' or 'best rated'\n" +
          "• 'trending pitch' or 'peak hours'\n" +
          "• 'compare pitches'\n" +
          "• 'pitches near [area]'\n" +
          "• 'my bookings'\n" +
          "• 'how to book' or 'how to pay'\n" +
          "• 'multi slot booking'\n" +
          "• 'loyalty reward'\n\n" +
          "Or just type a pitch name or area to search!";
        suggestions = ["Help", "Trending pitch", "All pitches", "How to book"];
      }
    }

    res.json({ reply, suggestions });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ reply: "Sorry, something went wrong. Please try again!", suggestions: [] });
  }
});

module.exports = router;