import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signup } from "../api";

export default function Signup() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState([]);
  const [loading, setLoading] = useState(false);


  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setError([]);

  };


  const handleSubmit = async (e) => {

    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError(["Passwords do not match"]);
      return;
    }

    if (formData.password.length < 6) {
      setError(["Password must be at least 6 characters"]);
      return;
    }

    setLoading(true);
    setError([]);

    try {

      await signup({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      alert("Signup successful!");
      navigate("/login");

    } catch (err) {

      console.error("Signup error:", err);

      // FASTAPI VALIDATION ERROR
      if (err.response && err.response.data) {

        const data = err.response.data;

        if (Array.isArray(data.detail)) {

          const messages = data.detail.map(e => e.msg);
          setError(messages);

        } else if (typeof data.detail === "string") {

          setError([data.detail]);

        } else {

          setError(["Signup failed"]);

        }

      } else {

        setError([err.message || "Signup failed"]);

      }

    } finally {

      setLoading(false);

    }

  };


  return (

    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">

      <h2 className="text-2xl font-semibold mb-6 text-navyBlue">
        Create Account
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded"
        />

        {error.length > 0 && (
          <div className="text-red-500 text-sm space-y-1">
            {error.map((err, index) => (
              <p key={index}>{err}</p>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-saffron text-white py-2 rounded hover:bg-orange-500 transition disabled:opacity-50"
        >
          {loading ? "Signing up..." : "Signup"}
        </button>

      </form>

    </div>

  );

}