import React, { useState } from "react";
import { chat } from "../api.js";  // ✅ use shared API helper

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    if (!message) return;

    try {
      const res = await chat(token, 1, message);  // ✅ uses backend API helper
      setChatHistory(res.history || []);
      setMessage("");
    } catch (err) {
      alert("❌ " + (err.detail || "Server error"));
    }
  };

  return (
    <div>
      <h2>Chat</h2>

      {/* Chat messages */}
      <div>
        {chatHistory.map((c, i) => (
          <p key={i}>
            <b>{c.role}:</b> {c.content}
          </p>
        ))}
      </div>

      {/* Input + Send */}
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type here..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
