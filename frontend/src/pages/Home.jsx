import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { AuthContext } from "../context/AuthContext";

export default function Home() {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigate = useNavigate();

  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50">

      <main className="max-w-5xl mx-auto px-6 py-16 flex-grow w-full">

        {/* Welcome message — uses email since we don't store username */}
        {user && (
          <div className="mb-8 text-right text-lg text-gray-700">
            Welcome, <span className="font-semibold text-blue-800">
              {user.email}
            </span>!
            {isAdmin && (
              <span className="ml-2 text-xs bg-blue-700 text-white px-2 py-1 rounded-full">
                Admin
              </span>
            )}
          </div>
        )}

        <section className="mb-16 text-center max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-blue-900">
            What is Lok Dhrishti?
          </h1>
          <p className="text-lg leading-relaxed text-gray-800">
            Lok Dhrishti is a digital platform designed to improve transparency
            in public grievance redressal. Citizens can submit complaints,
            track their progress in real time, and communicate with authorities,
            creating a more accountable governance system.
          </p>
        </section>

        <section className="mb-16 bg-white shadow-md rounded-lg p-10 max-w-3xl mx-auto">
          <h2 className="text-3xl font-semibold mb-8 text-center text-blue-900">
            How to Use Lok Dhrishti
          </h2>
          <ol className="list-decimal list-inside space-y-6 text-gray-700 text-lg">
            <li>Login or Signup to create your account.</li>
            <li>Submit complaints with photos and location pin.</li>
            <li>Track complaint status in "My Complaints".</li>
            <li>Track your complaint status in real time from My Complaints.</li>
          </ol>
        </section>

        <section className="text-center">
          {user ? (
            isAdmin ? (
              /* Admin buttons */
              <div className="flex justify-center gap-6">
                <Button onClick={() => navigate("/dashboard")}>
                  Admin Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/admin/complaints")}>
                  Manage Complaints
                </Button>
              </div>
            ) : (
              /* Citizen buttons */
              <div className="flex justify-center gap-6">
                <Button onClick={() => navigate("/complaints/new")}>
                  Submit Complaint
                </Button>
                <Button variant="outline" onClick={() => navigate("/complaints")}>
                  My Complaints
                </Button>
              </div>
            )
          ) : (
            /* Not logged in */
            <div className="flex justify-center gap-6">
              <Button onClick={() => navigate("/login")}>Login</Button>
              <Button variant="outline" onClick={() => navigate("/signup")}>Signup</Button>
            </div>
          )}
        </section>

      </main>

      <footer className="bg-blue-900 text-white py-6 text-center text-sm">
        <p>© {new Date().getFullYear()} Lok Dhrishti. All rights reserved.</p>
      </footer>

    </div>
  );
}