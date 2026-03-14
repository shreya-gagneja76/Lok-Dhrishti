import React from "react";

export function Button({ children, className = "", variant = "solid", ...props }) {
  let baseClasses =
    "px-4 py-2 rounded-md font-semibold transition-colors duration-200 cursor-pointer";

  let variantClasses = "";

  if (variant === "solid") {
    variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
  } else if (variant === "outline") {
    variantClasses = "border border-blue-600 text-blue-600 hover:bg-blue-100";
  }

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
