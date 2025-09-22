import React, { useState } from "react";
import { login } from "../api";

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await login(email, password);
      if (data.access_token) {
        onLogin(data.access_token);
      } else {
        setError(data.detail || "❌ Login failed");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="p-6 max-w-sm mx-auto bg-white dark:bg-gray-800 shadow-md rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}

      <input
        type="email"
        className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:text-white"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 flex justify-center"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Logging in...</span>
          </div>
        ) : (
          "Login"
        )}
      </button>

      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
        Don’t have an account?{" "}
        <button
          type="button"
          className="text-blue-600 dark:text-blue-400 underline"
          onClick={onSwitch}
        >
          Register
        </button>
      </p>
    </form>
  );
}
