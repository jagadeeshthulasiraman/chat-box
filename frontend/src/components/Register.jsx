import React, { useState, useEffect, useRef } from "react";
import { register } from "../api";

export default function Register({ onSwitch }) {
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

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await register(email, password);

      if (data.msg || data.message) {
        alert("✅ " + (data.msg || data.message));
        onSwitch(); // Switch back to login
      } else {
        alert("❌ " + (data.detail || "Registration failed"));
      }
    } catch (err) {
      alert(err.response?.data?.detail || "❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="p-6 max-w-sm mx-auto bg-white dark:bg-gray-800 shadow rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

      <input
        ref={emailRef}
        type="email"
        aria-label="Email"
        className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        aria-label="Password"
        className="w-full p-2 border rounded mb-3 dark:bg-gray-700 dark:text-white"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex justify-center items-center">
            <div className="w-5 h-5 border-4 border-white border-dashed rounded-full animate-spin"></div>
            <span className="ml-2">Registering...</span>
          </div>
        ) : (
          "Register"
        )}
      </button>

      <p className="mt-3 text-sm text-center text-gray-600 dark:text-gray-300">
        Already have an account?{" "}
        <button
          type="button" // ✅ prevents accidental submit
          className="text-blue-600 dark:text-blue-400 underline"
          onClick={onSwitch}
        >
          Login
        </button>
      </p>
    </form>
  );
}
