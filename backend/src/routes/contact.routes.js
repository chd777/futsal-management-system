const router = require("express").Router();
const nodemailer = require("nodemailer");

// POST /api/contact - Send contact form email to admin
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Send to admin
    await transporter.sendMail({
      from: `"FutsalMS Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // futsalms6@gmail.com
      replyTo: email,
      subject: `[FutsalMS Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0b0f17; padding: 20px; border-radius: 12px; color: #eef2f7;">
            <h2 style="color: #5b8cff; margin: 0 0 16px;">New Contact Message</h2>
            <table style="width: 100%; color: #eef2f7;">
              <tr><td style="padding: 8px 0; color: #9aa4b2;">Name:</td><td style="padding: 8px 0; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #9aa4b2;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #5b8cff;">${email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #9aa4b2;">Subject:</td><td style="padding: 8px 0; font-weight: 600;">${subject}</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px; border-left: 3px solid #5b8cff;">
              <p style="color: #9aa4b2; margin: 0 0 8px; font-size: 12px;">MESSAGE:</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <p style="color: #9aa4b2; font-size: 12px; margin-top: 20px;">You can reply directly to this email to respond to ${name}.</p>
          </div>
        </div>
      `
    });

    // Send confirmation to user
    await transporter.sendMail({
      from: `"FutsalMS" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Thanks for contacting FutsalMS!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0b0f17; padding: 20px; border-radius: 12px; color: #eef2f7;">
            <h2 style="color: #5b8cff; margin: 0 0 12px;">Thanks for reaching out, ${name}!</h2>
            <p style="color: #9aa4b2; line-height: 1.6;">We've received your message and will get back to you within 24 hours.</p>
            <div style="margin-top: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 8px;">
              <p style="color: #9aa4b2; margin: 0 0 4px; font-size: 12px;">YOUR MESSAGE:</p>
              <p style="margin: 0; font-weight: 600;">${subject}</p>
              <p style="margin: 8px 0 0; color: #9aa4b2;">${message}</p>
            </div>
            <p style="color: #9aa4b2; font-size: 13px; margin-top: 20px;">— Team FutsalMS</p>
          </div>
        </div>
      `
    });

    res.json({ message: "Message sent successfully!" });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ message: "Failed to send message. Please try again." });
  }
});

module.exports = router;