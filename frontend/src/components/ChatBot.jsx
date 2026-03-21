import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/axios";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hey! 👋 I'm FutsalMS Bot. Ask me about pitches, bookings, prices, or anything else!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await api.post("/api/chat", { message: userMsg });
      setMessages(prev => [...prev, { from: "bot", text: res.data.reply }]);
    } catch {
      setMessages(prev => [...prev, { from: "bot", text: "Sorry, something went wrong. Try again!" }]);
    } finally {
      setLoading(false);
    }
  }

  // Format bot messages (bold, newlines)
  function formatMessage(text) {
    return text.split("\n").map((line, i) => {
      // Convert **bold** to <strong>
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ minHeight: line === "" ? 8 : "auto" }} />;
    });
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with FutsalMS Bot"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>⚽</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>FutsalMS Bot</div>
                <div style={{ fontSize: 11, color: "var(--ok)" }}>● Online</div>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                {m.from === "bot" && <span className="chat-avatar">⚽</span>}
                <div className={`chat-bubble ${m.from}`}>
                  {m.from === "bot" ? formatMessage(m.text) : m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <span className="chat-avatar">⚽</span>
                <div className="chat-bubble bot">
                  <div className="typing-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="chat-input-bar" onSubmit={sendMessage}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about pitches, bookings, prices..."
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}