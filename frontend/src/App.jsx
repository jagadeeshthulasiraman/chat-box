import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Projects from "./components/Projects";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [view, setView] = useState(token ? "projects" : "login");

  useEffect(() => {
    // The key in localStorage should match what you set it as.
    // Let's use 'accessToken' to be consistent with potential API modules.
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
    }
  }, [token]);

  const handleLogin = (t) => {
    setToken(t);
    setView("projects");
  };

  const handleLogout = () => {
    setToken(null);
    setView("login");
  };

  // When not logged in, we want to center the form.
  // When logged in, we want the projects view to take up the full width.
  const contentContainerClass =
    view === "projects"
      ? "p-4"
      : "flex-grow flex items-center justify-center";

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-gray-300">
        <h1 className="text-2xl font-bold"> Minimal Chatbot</h1>
        <div>
          {token && (
            <button
              className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>

      <div className={contentContainerClass}>
        {view === "login" && <Login onLogin={handleLogin} onSwitch={() => setView("register")} />}
        {view === "register" && <Register onSwitch={() => setView("login")} />}
        {view === "projects" && <Projects token={token} />}
      </div>
    </div>
  );
}
