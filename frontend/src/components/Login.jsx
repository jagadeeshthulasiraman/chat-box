import React, { useState } from "react";
import { login } from "../api";

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const data = await login(email, password);
    setLoading(false);

    if (data.access_token) {
      onLogin(data.access_token);
    } else {
      alert(data.detail || "Login failed");
    }
  }

  return (
    <form onSubmit={handleLogin} className="p-4 max-w-sm mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <input
        type="email"
        className="w-full p-2 border rounded mb-2"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        className="w-full p-2 border rounded mb-2"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="w-5 h-5 border-4 border-white border-dashed rounded-full animate-spin"></div>
            <span className="ml-2">Logging in...</span>
          </div>
        ) : (
          "Login"
        )}
      </button>
      <p className="mt-2 text-sm">
        Don’t have an account?{" "}
        <button className="text-blue-600 underline" onClick={onSwitch}>
          Register
        </button>
      </p>
    </form>
  );
}
