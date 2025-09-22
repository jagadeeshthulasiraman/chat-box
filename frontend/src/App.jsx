import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Projects from "./components/Projects";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [view, setView] = useState(token ? "projects" : "login");

  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  const handleLogin = (newToken) => {
    setToken(newToken);
    setView("projects");
  };

  const handleLogout = () => {
    setToken(null);
    setView("login");
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-4 flex justify-between items-center border-b border-gray-300">
        <h1 className="text-2xl font-bold">Minimal Chatbot</h1>
        {token && (
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        )}
      </header>

      {/* Content */}
      <main
        className={
          view === "projects"
            ? "p-4 flex-grow"
            : "flex-grow flex items-center justify-center"
        }
      >
        {view === "login" && (
          <Login onLogin={handleLogin} onSwitch={() => setView("register")} />
        )}
        {view === "register" && (
          <Register onSwitch={() => setView("login")} />
        )}
        {view === "projects" && <Projects token={token} />}
      </main>
    </div>
  );
}
