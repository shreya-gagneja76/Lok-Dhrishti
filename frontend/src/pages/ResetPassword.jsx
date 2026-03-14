import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../api";

export default function ResetPassword() {

  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token.");
    }
  }, [token]);


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!password || !confirmPassword) {
      setError("Please fill both password fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {

      const data = await resetPassword(token, password);

      setSuccess(data?.message || "Password reset successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {

      console.error("Reset password error:", err);

      setError(err.message || "Password reset failed.");

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">

      <h2 className="text-2xl font-semibold mb-6">
        Reset Password
      </h2>

      {!token ? (

        <p className="text-red-600">
          Invalid or missing reset token.
        </p>

      ) : (

        <form onSubmit={handleSubmit}>

          <label className="block mb-1 font-medium">
            New Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            minLength={6}
            placeholder="Enter new password"
            className="w-full p-2 border rounded mb-4"
          />

          <label className="block mb-1 font-medium">
            Confirm New Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError("");
            }}
            required
            minLength={6}
            placeholder="Confirm new password"
            className="w-full p-2 border rounded mb-4"
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
            {loading ? "Resetting..." : "Reset Password"}
          </button>

        </form>

      )}

      {error && (
        <p className="mt-4 text-red-600">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 text-green-600">
          {success}
        </p>
      )}

    </div>

  );

}