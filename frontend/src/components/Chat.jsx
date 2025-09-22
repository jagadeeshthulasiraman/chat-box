import { useState } from "react";
import axios from "axios";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(
        "http://127.0.0.1:8000/chat",
        { project_id: 1, message, reset: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChat(res.data.history);
      setMessage("");
    } catch (err) {
      alert("❌ " + err.response.data.detail);
    }
  };

  return (
    <div>
      <h2>Chat</h2>
      <div>
        {chat.map((c, i) => (
          <p key={i}>
            <b>{c.role}:</b> {c.content}
          </p>
        ))}
      </div>
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type here..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
