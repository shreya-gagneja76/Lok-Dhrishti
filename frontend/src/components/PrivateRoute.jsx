import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function PrivateRoute({ children, adminOnly = false }) {

  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <p className="text-center">Checking authentication...</p>;
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin-only route check
  if (adminOnly && user.role !== "admin") {
    return <Navigate to="/complaints" replace />;
  }

  return children;
}