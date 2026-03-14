import React, { useState, useContext } from "react";
import { NavLink } from "react-router-dom";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import logo from "../assets/logo.png";
import { AuthContext } from "../context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const { user, logout } = useContext(AuthContext);

  const isAdmin = user?.role === "admin";

  const linkClass = ({ isActive }) =>
    `transition-colors duration-500 ease-in-out font-semibold text-lg px-4 py-2 rounded ${
      isActive
        ? "text-saffron underline underline-offset-4"
        : "text-navyBlue hover:text-saffron hover:bg-saffron/10"
    }`;

  return (
    <nav className="sticky top-0 bg-tirangaWhite border-b-4 border-navyBlue shadow-md z-50">
      <div className="h-1 bg-saffron"></div>

      <div className="flex items-center justify-between px-8 py-5 md:px-12 md:py-6">

        {/* Logo */}
        <div className="flex items-center space-x-4">
          <img
            src={logo}
            alt="Lok Drishti Logo"
            className="h-12 w-12 object-contain"
          />
          <span className="text-2xl font-bold text-navyBlue tracking-wide">
            Lok Drishti
          </span>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-8 items-center">

          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>

          {/* USER LINKS */}
          {user && !isAdmin && (
            <>
              <NavLink to="/complaints" className={linkClass}>
                My Complaints
              </NavLink>

              <NavLink to="/complaints/new" className={linkClass}>
                Submit Complaint
              </NavLink>
            </>
          )}

          {/* GUEST LINKS */}
          {!user && (
            <>
              <NavLink to="/signup" className={linkClass}>
                Signup
              </NavLink>

              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
            </>
          )}

          {/* ADMIN LINKS */}
          {user && isAdmin && (
            <div className="relative">

              <button
                onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                className="flex items-center text-navyBlue font-semibold text-lg px-4 py-2 rounded hover:text-saffron hover:bg-saffron/10"
              >
                Admin <FiChevronDown className="ml-1" />
              </button>

              {adminDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-navyBlue rounded shadow-lg">

                  <NavLink
                    to="/dashboard"
                    className="block px-4 py-2 text-navyBlue hover:bg-saffron hover:text-white"
                    onClick={() => setAdminDropdownOpen(false)}
                  >
                    Dashboard
                  </NavLink>

                  <NavLink
                    to="/admin/complaints"
                    className="block px-4 py-2 text-navyBlue hover:bg-saffron hover:text-white"
                    onClick={() => setAdminDropdownOpen(false)}
                  >
                    Manage Complaints
                  </NavLink>

                </div>
              )}

            </div>
          )}

          {/* LOGOUT */}
          {user && (
            <button
              onClick={logout}
              className="text-navyBlue font-semibold text-lg px-4 py-2 hover:text-saffron"
            >
              Logout
            </button>
          )}

        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-navyBlue"
        >
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-tirangaWhite px-6 pb-4 space-y-4 border-t border-navyBlue">

          <NavLink to="/" className={linkClass} end onClick={() => setMenuOpen(false)}>
            Home
          </NavLink>

          {user && !isAdmin && (
            <>
              <NavLink to="/complaints" className={linkClass} onClick={() => setMenuOpen(false)}>
                My Complaints
              </NavLink>

              <NavLink to="/complaints/new" className={linkClass} onClick={() => setMenuOpen(false)}>
                Submit Complaint
              </NavLink>
            </>
          )}

          {!user && (
            <>
              <NavLink to="/signup" className={linkClass} onClick={() => setMenuOpen(false)}>
                Signup
              </NavLink>

              <NavLink to="/login" className={linkClass} onClick={() => setMenuOpen(false)}>
                Login
              </NavLink>
            </>
          )}

          {user && isAdmin && (
            <>
              <NavLink to="/dashboard" className={linkClass} onClick={() => setMenuOpen(false)}>
                Admin Dashboard
              </NavLink>

              <NavLink to="/admin/complaints" className={linkClass} onClick={() => setMenuOpen(false)}>
                Manage Complaints
              </NavLink>
            </>
          )}

          {user && (
            <button
              onClick={() => {
                logout();
                setMenuOpen(false);
              }}
              className="text-left text-navyBlue font-semibold text-lg px-4 py-2 hover:text-saffron"
            >
              Logout
            </button>
          )}

        </div>
      )}
    </nav>
  );
}