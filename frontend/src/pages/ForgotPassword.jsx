import React, { useState } from "react";
import { forgotPassword } from "../api";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [resetLink, setResetLink] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }
    setLoading(true);
    setError("");
    setResetLink("");
    try {
      const data = await forgotPassword(email.trim());
      if (data.reset_link) {
        setResetLink(data.reset_link);
      } else {
        setError("Could not generate reset link. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Failed to generate reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-xl shadow">
      <h2 className="text-2xl font-semibold mb-2 text-blue-900">Forgot Password</h2>
      <p className="text-gray-500 text-sm mb-6">
        Enter your email and we'll generate a reset link for you.
      </p>

      {!resetLink ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1 text-gray-700">
              Registered Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm"> {error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-white font-medium ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
            }`}
          >
            {loading ? "Generating..." : "Get Reset Link"}
          </button>

          <p
            className="text-center text-sm text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </p>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium mb-2">Reset link generated!</p>
            <p className="text-gray-600 text-sm mb-3">
              Click the button below to reset your password:
            </p>
            <a
              href={resetLink}
              className="block w-full text-center bg-blue-700 text-white py-2 rounded-lg hover:bg-blue-800 font-medium"
            >
              Reset My Password
            </a>
          </div>

          <p className="text-xs text-gray-400 text-center">
            This link expires in 15 minutes
          </p>

          <p
            className="text-center text-sm text-blue-600 cursor-pointer hover:underline"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </p>
        </div>
      )}
    </div>
  );
}