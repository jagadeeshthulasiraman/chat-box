import React, { useState, useEffect, useRef } from "react";
import { login } from "../api";

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);

  // Autofocus email on mount
  useEffect(() => {
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.access_token) {
        onLogin(data.access_token);
      } else {
        alert(data.detail || "❌ Login failed");
      }
    } catch (err) {
      alert(err.response?.data?.detail || "❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleLogin}
      className="p-4 max-w-sm mx-auto bg-white dark:bg-gray-800 shadow rounded"
    >
      <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

      <input
        ref={emailRef}
        type="email"
        aria-label="Email"
        className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        aria-label="Password"
        className="w-full p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white"
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

      <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-300">
        Don’t have an account?{" "}
        <button
          type="button" // ✅ prevents accidental submit
          className="text-blue-600 dark:text-blue-400 underline"
          onClick={onSwitch}
        >
          Register
        </button>
      </p>
    </form>
  );
}
