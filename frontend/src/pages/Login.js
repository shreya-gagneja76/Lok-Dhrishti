import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiLogin({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!data?.access_token) throw new Error("Invalid login response");

      const token = data.access_token;

      // Get role + email from response (backend now sends these directly)
      const role  = data.role  || "user";
      const email = data.email || formData.email.trim();

      // Save to context + localStorage
      login(token, role, email);

      // Redirect based on role
      if (role === "admin") {
        navigate("/dashboard");
      } else {
        navigate("/complaints");
      }

    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-6 text-navyBlue">Login</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email" name="email" placeholder="Email"
          value={formData.email} onChange={handleChange}
          required disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />
        <input
          type="password" name="password" placeholder="Password"
          value={formData.password} onChange={handleChange}
          required disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />

        <p
          className="text-sm text-blue-600 cursor-pointer text-right"
          onClick={() => navigate("/forgot-password")}
        >
          Forgot Password?
        </p>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit" disabled={loading}
          className="w-full bg-blue-700 text-white py-2 rounded hover:bg-blue-800 transition disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}