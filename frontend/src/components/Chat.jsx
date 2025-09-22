import { useState } from "react";
import { chat } from "../api";

export default function Chat({ token, project }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;
    try {
      const res = await chat(token, project.id, message);
      setHistory(res.history);
      setMessage("");
    } catch (err) {
      alert("❌ Chat error");
    }
  };

  return (
    <div className="mt-4 border p-3 rounded bg-gray-50">
      <h4 className="font-semibold mb-2">Chat with {project.name}</h4>

      <div className="h-40 overflow-y-auto border mb-2 p-2 bg-white">
        {history.map((m, i) => (
          <div key={i} className="mb-1">
            <strong>{m.role === "user" ? "You" : "Bot"}:</strong>{" "}
            {m.content}
          </div>
        ))}
      </div>

      <div className="flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border px-2 py-1 mr-2"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
