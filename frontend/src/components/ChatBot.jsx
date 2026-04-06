import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/axios";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hey! 👋 I'm FutsalMS Bot. Ask me about pitches, bookings, prices, or anything else!",
      suggestions: ["Trending pitch", "Cheapest pitch", "How to book", "My bookings"],
      time: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    const userMsg = (text || input).trim();
    if (!userMsg || loading) return;

    setInput("");
    setMessages(prev => [...prev, { from: "user", text: userMsg, time: new Date() }]);
    setLoading(true);

    try {
      const res = await api.post("/api/chat", { message: userMsg });
      setMessages(prev => [...prev, {
        from: "bot",
        text: res.data.reply,
        suggestions: res.data.suggestions || [],
        time: new Date()
      }]);
    } catch {
      setMessages(prev => [...prev, {
        from: "bot",
        text: "Sorry, something went wrong. Try again!",
        suggestions: ["Help"],
        time: new Date()
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage();
  }

  function handleSuggestionClick(text) {
    sendMessage(text);
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  function formatMessage(text) {
    return text.split("\n").map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} style={{ minHeight: line === "" ? 6 : "auto" }} />;
    });
  }

  function clearChat() {
    setMessages([{
      from: "bot",
      text: "Chat cleared! 🧹 How can I help you?",
      suggestions: ["Trending pitch", "Cheapest pitch", "How to book", "My bookings"],
      time: new Date()
    }]);
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
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="chat-close"
                onClick={clearChat}
                title="Clear chat"
                style={{ fontSize: 14 }}
              >🗑</button>
              <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i}>
                <div className={`chat-msg ${m.from}`}>
                  {m.from === "bot" && <span className="chat-avatar">⚽</span>}
                  <div className={`chat-bubble ${m.from}`}>
                    {m.from === "bot" ? formatMessage(m.text) : m.text}
                    <div style={{ fontSize: 10, color: "rgba(154,164,178,0.6)", marginTop: 4, textAlign: m.from === "user" ? "right" : "left" }}>
                      {formatTime(m.time)}
                    </div>
                  </div>
                </div>

                {/* Suggestion chips — only show on last bot message */}
                {m.from === "bot" && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && !loading && (
                  <div style={{
                    display: "flex", gap: 6, flexWrap: "wrap",
                    marginTop: 8, marginLeft: 34, marginBottom: 4
                  }}>
                    {m.suggestions.map((s, j) => (
                      <button
                        key={j}
                        onClick={() => handleSuggestionClick(s)}
                        style={{
                          padding: "5px 12px", borderRadius: 20,
                          border: "1px solid rgba(91,140,255,0.3)",
                          background: "rgba(91,140,255,0.08)",
                          color: "var(--accent)", fontSize: 12,
                          cursor: "pointer", fontWeight: 500,
                          transition: "all 0.15s", whiteSpace: "nowrap"
                        }}
                        onMouseEnter={e => { e.target.style.background = "rgba(91,140,255,0.2)"; }}
                        onMouseLeave={e => { e.target.style.background = "rgba(91,140,255,0.08)"; }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
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
          <form className="chat-input-bar" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
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