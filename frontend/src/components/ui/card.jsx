import React from "react";

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 ${className}`}
      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = "" }) {
  return (
    <div className={`text-gray-700 ${className}`}>
      {children}
    </div>
  );
}
