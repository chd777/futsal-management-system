const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection on startup
transporter.verify().then(() => {
  console.log("✅ Email service ready");
}).catch((err) => {
  console.log("⚠️ Email service not configured:", err.message);
});

// Base email template
function emailTemplate(title, body) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b0f17; color: #eef2f7; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1a2a4a 0%, #0b0f17 100%); padding: 24px 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; color: #5b8cff;">⚽ FutsalMS</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #eef2f7; margin-top: 0;">${title}</h2>
        ${body}
      </div>
      <div style="padding: 16px 30px; border-top: 1px solid #223047; text-align: center; font-size: 12px; color: #9aa4b2;">
        <p>&copy; ${new Date().getFullYear()} FutsalMS. All rights reserved.</p>
        <p>Kathmandu, Nepal</p>
      </div>
    </div>
  `;
}

// Send email helper
async function sendEmail(to, subject, htmlContent) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("⚠️ Email not configured, skipping:", subject);
      return false;
    }

    await transporter.sendMail({
      from: `"FutsalMS" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
    return true;
  } catch (err) {
    console.error("❌ Email send failed:", err.message);
    return false;
  }
}

// ==========================================
// EMAIL TEMPLATES
// ==========================================

// 1. Booking Created - to User
exports.sendBookingConfirmation = async (user, booking, pitch) => {
  const html = emailTemplate("Booking Confirmed! 🎉", `
    <p style="color: #9aa4b2;">Hi <strong style="color: #eef2f7;">${user.fullName}</strong>,</p>
    <p style="color: #9aa4b2;">Your booking has been created successfully!</p>
    
    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7; font-weight: 600;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📍 Address</td><td style="color: #eef2f7;">${pitch.address}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7; font-weight: 600;">${booking.slot}</td></tr>
        <tr><td style="padding: 6px 0;">💰 Price</td><td style="color: #5b8cff; font-weight: 600;">NPR ${booking.priceAtBooking}</td></tr>
        <tr><td style="padding: 6px 0;">📋 Status</td><td style="color: #f5a623; font-weight: 600;">${booking.status}</td></tr>
      </table>
    </div>
    
    <p style="color: #9aa4b2;">Please complete your payment to confirm the booking.</p>
    <p style="color: #9aa4b2;">Thank you for choosing FutsalMS!</p>
  `);

  return sendEmail(user.email, "✅ Booking Confirmed - FutsalMS", html);
};

// 2. New Booking - to Admin
// 2. New Booking - to Admin
exports.sendAdminNewBookingAlert = async (adminEmail, user, booking, pitch) => {
  const isLoyalty = booking.isLoyaltyReward;
  const html = emailTemplate("New Booking Alert 📢", `
    <p style="color: #9aa4b2;">A new booking has been made:</p>
    
    ${isLoyalty ? `
    <div style="background: rgba(61,220,151,0.1); border: 1px solid rgba(61,220,151,0.3); border-radius: 10px; padding: 12px; margin: 12px 0; text-align: center;">
      <p style="font-size: 16px; font-weight: 700; color: #3ddc97; margin: 0;">🎉 Loyalty Reward - FREE Booking</p>
    </div>
    ` : ""}

    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">👤 Customer</td><td style="color: #eef2f7; font-weight: 600;">${user.fullName} (${user.email})</td></tr>
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7; font-weight: 600;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7; font-weight: 600;">${booking.slot}</td></tr>
        <tr><td style="padding: 6px 0;">💰 Price</td><td style="color: ${isLoyalty ? '#3ddc97' : '#5b8cff'}; font-weight: 600;">${isLoyalty ? "FREE (Loyalty Reward)" : "NPR " + booking.priceAtBooking}</td></tr>
      </table>
    </div>
    
    <p style="color: #9aa4b2;">Check your admin dashboard for more details.</p>
  `);

  return sendEmail(adminEmail, isLoyalty ? "🎉 Loyalty Reward Booking - FutsalMS" : "📢 New Booking - FutsalMS", html);
};

// 3. Booking Cancelled by User - to User
exports.sendBookingCancelledByUser = async (user, booking, pitch) => {
  const html = emailTemplate("Booking Cancelled", `
    <p style="color: #9aa4b2;">Hi <strong style="color: #eef2f7;">${user.fullName}</strong>,</p>
    <p style="color: #9aa4b2;">Your booking has been cancelled as requested.</p>
    
    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7;">${booking.slot}</td></tr>
        <tr><td style="padding: 6px 0;">📋 Status</td><td style="color: #ff5b6e; font-weight: 600;">CANCELLED</td></tr>
      </table>
    </div>
    
    <p style="color: #9aa4b2;">You can book another slot anytime from our app.</p>
  `);

  return sendEmail(user.email, "❌ Booking Cancelled - FutsalMS", html);
};

// 4. Booking Cancelled by Admin - to User (with reason)
exports.sendBookingCancelledByAdmin = async (user, booking, pitch, reason) => {
  const html = emailTemplate("Booking Cancelled by Admin", `
    <p style="color: #9aa4b2;">Hi <strong style="color: #eef2f7;">${user.fullName}</strong>,</p>
    <p style="color: #9aa4b2;">Unfortunately, your booking has been cancelled by the admin.</p>
    
    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7;">${booking.slot}</td></tr>
      </table>
    </div>
    
    <div style="background: rgba(255,91,110,0.1); border: 1px solid rgba(255,91,110,0.3); border-radius: 10px; padding: 14px; margin: 16px 0;">
      <p style="color: #ff5b6e; font-weight: 600; margin: 0 0 4px;">Reason for cancellation:</p>
      <p style="color: #eef2f7; margin: 0;">${reason || "No reason provided"}</p>
    </div>
    
    <p style="color: #9aa4b2;">If you have any questions, please contact us. You can book another slot anytime.</p>
  `);

  return sendEmail(user.email, "⚠️ Booking Cancelled by Admin - FutsalMS", html);
};

// 5. Payment Successful - to User
exports.sendPaymentConfirmation = async (user, booking, pitch) => {
  const html = emailTemplate("Payment Successful! 💰", `
    <p style="color: #9aa4b2;">Hi <strong style="color: #eef2f7;">${user.fullName}</strong>,</p>
    <p style="color: #9aa4b2;">Your payment has been received successfully!</p>
    
    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7; font-weight: 600;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7; font-weight: 600;">${booking.slot}</td></tr>
        <tr><td style="padding: 6px 0;">💰 Amount Paid</td><td style="color: #3ddc97; font-weight: 600;">NPR ${booking.priceAtBooking}</td></tr>
        <tr><td style="padding: 6px 0;">📋 Status</td><td style="color: #3ddc97; font-weight: 600;">PAID ✅</td></tr>
      </table>
    </div>
    
    <p style="color: #9aa4b2;">Enjoy your game! See you at the pitch! ⚽</p>
  `);

  return sendEmail(user.email, "💰 Payment Confirmed - FutsalMS", html);
};

// 6. Loyalty Reward - Free Booking Email
exports.sendLoyaltyRewardEmail = async (user, booking, pitch, totalBookings) => {
  const html = emailTemplate("🎉 FREE Booking - Loyalty Reward!", `
    <p style="color: #9aa4b2;">Hi <strong style="color: #eef2f7;">${user.fullName}</strong>,</p>
    <p style="color: #9aa4b2;">Congratulations! You've earned a <strong style="color: #3ddc97;">FREE booking</strong> as a loyalty reward!</p>
    
    <div style="background: rgba(61,220,151,0.1); border: 1px solid rgba(61,220,151,0.3); border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center;">
      <p style="font-size: 20px; font-weight: 800; color: #3ddc97; margin: 0;">🎉 FREE GAME!</p>
      <p style="color: #9aa4b2; margin: 6px 0 0;">After ${totalBookings} bookings at ${pitch.name}</p>
    </div>

    <div style="background: #121a27; border: 1px solid #223047; border-radius: 10px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; color: #9aa4b2; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📍 Pitch</td><td style="color: #eef2f7; font-weight: 600;">${pitch.name}</td></tr>
        <tr><td style="padding: 6px 0;">📅 Date</td><td style="color: #eef2f7; font-weight: 600;">${booking.date}</td></tr>
        <tr><td style="padding: 6px 0;">⏰ Slot</td><td style="color: #eef2f7; font-weight: 600;">${booking.slot}</td></tr>
        <tr><td style="padding: 6px 0;">💰 Price</td><td style="color: #3ddc97; font-weight: 600;">FREE (NPR 0)</td></tr>
        <tr><td style="padding: 6px 0;">📋 Status</td><td style="color: #3ddc97; font-weight: 600;">CONFIRMED ✅</td></tr>
      </table>
    </div>
    
    <p style="color: #9aa4b2;">No payment needed — just show up and enjoy your game! ⚽</p>
    <p style="color: #9aa4b2;">Keep booking to earn more free games. Every 6th booking is on us!</p>
  `);

  return sendEmail(user.email, "🎉 FREE Booking - Loyalty Reward! - FutsalMS", html);
};