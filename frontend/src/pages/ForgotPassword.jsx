import React, { useState } from "react";
import { forgotPassword } from "../api";

export default function ForgotPassword() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your registered email.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      const data = await forgotPassword(email.trim());

      console.log("Backend response:", data);

      if (data.reset_link) {
        setSuccess(data.reset_link);
      } 
      else if (data.message) {
        setSuccess(data.message);
      } 
      else {
        setSuccess("Reset link generated successfully.");
      }

    } catch (err) {

      console.error(err);
      setError(err.message || "Failed to send reset link.");

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">

      <h2 className="text-2xl font-semibold mb-6">
        Forgot Password
      </h2>

      <form onSubmit={handleSubmit}>

        <label className="block mb-1 font-medium">
          Registered Email
        </label>

        <input
          type="email"
          placeholder="Enter registered email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
            setSuccess("");
          }}
          className="w-full p-2 border rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded text-white ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

      </form>

      {error && (
        <p className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {success && (
        <div className="mt-4 text-green-600">

          {success.startsWith("http") ? (
            <>
              <p>Reset link generated:</p>
              <a
                href={success}
                className="text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {success}
              </a>
            </>
          ) : (
            <p>{success}</p>
          )}

        </div>
      )}

    </div>
  );
}