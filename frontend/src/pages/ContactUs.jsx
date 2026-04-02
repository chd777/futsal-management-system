import React, { useState } from "react";

export default function ContactUs() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: ""
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert("Message sent (UI only)");
  }

  return (
    <div>
      <h1>Contact Us</h1>
      <p className="muted">We’d love to hear from you.</p>

      <div className="contact-grid">
        {/* LEFT INFO */}
        <div className="card">
          <h3>Contact Info</h3>
          <p>Kathmandu, Nepal</p>
          <p>support@futsalms.com</p>
          <p>+977 98XXXXXXXX</p>
        </div>

        {/* FORM */}
        <form className="card" onSubmit={handleSubmit}>
          <label>Name</label>
          <input name="name" value={form.name} onChange={handleChange} required />

          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required />

          <label>Message</label>
          <textarea name="message" value={form.message} onChange={handleChange} rows="4" required />

          <button className="btn">Send</button>
        </form>
      </div>
    </div>
  );
}