import { useState } from "react";
import { chat } from "../api";

export default function ChatPage({ token, project, onClose }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState(project.chat || []);
  const chatEndRef = useRef(null);

  async function sendMessage() {
    if (!message.trim()) return;
    try {
      const res = await chat(token, project.id, message);
      setHistory(res.history);
      setMessage("");
    } catch {
      alert("❌ Failed to send message");
    }
  }

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="border rounded p-4 bg-white shadow mt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">💬 Chat - {project.name}</h3>
        <button
          onClick={onClose}
          className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
        >
          Close
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto border p-3 rounded bg-gray-50">
        {history.map((m, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded max-w-[75%] ${
              m.role === "user"
                ? "ml-auto bg-blue-500 text-white"
                : "mr-auto bg-gray-200 text-black"
            }`}
          >
            {m.content}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <textarea
          className="flex-grow border rounded p-2 resize-none"
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message and press Enter..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Send
        </button>
      </div>
    </div>
  );
}
