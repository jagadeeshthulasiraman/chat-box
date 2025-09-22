import React, { useState } from "react";
import { register } from "../api";


export default function Register({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await register(email, password);

      if (data.msg || data.message) {
        setSuccess(data.msg || data.message);
        setTimeout(() => {
          onSwitch(); // Go to login after short delay
        }, 1500);
      } else {
        setError(data.detail || "❌ Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.detail || "❌ Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleRegister}
      className="p-6 max-w-sm mx-auto bg-white dark:bg-gray-800 shadow-md rounded"
    >
      <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

      {error && (
        <p className="mb-3 text-sm text-red-600 dark:text-red-400 text-center">
          {error}
        </p>
      )}
      {success && (
        <p className="mb-3 text-sm text-green-600 dark:text-green-400 text-center">
          ✅ {success}
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
        className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:opacity-50 flex justify-center"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Registering...</span>
          </div>
        ) : (
          "Register"
        )}
      </button>

      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-300">
        Already have an account?{" "}
        <button
          type="button"
          className="text-blue-600 dark:text-blue-400 underline"
          onClick={onSwitch}
        >
          Login
        </button>
      </p>
    </form>
  );
}
