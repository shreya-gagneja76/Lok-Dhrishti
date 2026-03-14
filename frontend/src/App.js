import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminComplaints from "./pages/AdminComplaints";
import ComplaintForm from "./pages/ComplaintForm";
import ComplaintList from "./pages/ComplaintList";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Router>
      <Navbar />
      <main className="h-[calc(100vh-72px)] bg-tirangaWhite">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Citizen protected routes */}
          <Route
            path="/complaints"
            element={
              <PrivateRoute>
                <ComplaintList />
              </PrivateRoute>
            }
          />
          <Route
            path="/complaints/new"
            element={
              <PrivateRoute>
                <ComplaintForm />
              </PrivateRoute>
            }
          />

          {/* Admin protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute adminOnly={true}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <PrivateRoute adminOnly={true}>
                <AdminComplaints />
              </PrivateRoute>
            }
          />

          {/* Optional: Catch-all 404 page */}
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </main>
    </Router>
  );
}

export default App;
