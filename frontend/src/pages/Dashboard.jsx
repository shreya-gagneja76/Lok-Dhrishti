import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getComplaints } from "../api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from "recharts";

const STATUS_COLORS  = { Pending: "#f59e0b", "In Progress": "#3b82f6", Resolved: "#10b981", Rejected: "#ef4444" };
const CATEGORY_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"];

function StatCard({ label, value, color, icon }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-5 border-l-4 flex items-center gap-4`} style={{ borderColor: color }}>
      <span className="text-3xl">{icon}</span>
      <div>
        <p className="text-2xl font-bold" style={{ color }}>{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    if (!isAdmin) return;
    getComplaints(user.token)
      .then(data => setComplaints(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  // ── Stats ──────────────────────────────────────────
  const total      = complaints.length;
  const pending    = complaints.filter(c => c.status === "Pending").length;
  const inProgress = complaints.filter(c => c.status === "In Progress").length;
  const resolved   = complaints.filter(c => c.status === "Resolved").length;
  const rejected   = complaints.filter(c => c.status === "Rejected").length;

  // Pie chart data — status breakdown
  const statusData = [
    { name: "Pending",     value: pending },
    { name: "In Progress", value: inProgress },
    { name: "Resolved",    value: resolved },
    { name: "Rejected",    value: rejected },
  ].filter(d => d.value > 0);

  // Bar chart data — complaints per category
  const categoryMap = {};
  complaints.forEach(c => {
    categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
  });
  const categoryData = Object.entries(categoryMap).map(([name, count]) => ({ name, count }));

  // ── Non-admin view ─────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto mt-12 p-6 bg-white rounded-xl shadow">
        <h1 className="text-3xl font-bold mb-4 text-blue-900">Dashboard</h1>
        <p className="mb-6 text-gray-600">Welcome, <strong>{user?.email}</strong></p>
        <div className="flex gap-4">
          <button onClick={() => navigate("/complaints/new")}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">
            Submit Complaint
          </button>
          <button onClick={() => navigate("/complaints")}
            className="border border-blue-900 text-blue-900 px-6 py-2 rounded-lg hover:bg-blue-900 hover:text-white">
            My Complaints
          </button>
        </div>
        <div className="mt-8">
          <button onClick={logout} className="text-red-500 hover:underline text-sm">Logout</button>
        </div>
      </div>
    );
  }

  // ── Admin view ─────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-6">

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome, {user?.email}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/admin/complaints")}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 text-sm">
            Manage Complaints
          </button>
          <button onClick={logout}
            className="border border-red-400 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-16">Loading analytics...</p>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Complaints" value={total}      color="#6366f1" icon="📋" />
            <StatCard label="Pending"          value={pending}    color="#f59e0b" icon="⏳" />
            <StatCard label="In Progress"      value={inProgress} color="#3b82f6" icon="🔄" />
            <StatCard label="Resolved"         value={resolved}   color="#10b981" icon="✅" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

            {/* Pie Chart — Status Breakdown */}
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <h2 className="font-semibold text-gray-700 mb-4">Status Breakdown</h2>
              {statusData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={90}
                      dataKey="value" label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }>
                      {statusData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || "#6b7280"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar Chart — Complaints by Category */}
            <div className="bg-white rounded-xl shadow-sm p-5 border">
              <h2 className="font-semibold text-gray-700 mb-4">Complaints by Category</h2>
              {categoryData.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={categoryData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Complaints Table */}
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-gray-700">Recent Complaints</h2>
              <button onClick={() => navigate("/admin/complaints")}
                className="text-blue-600 text-sm hover:underline">
                View all →
              </button>
            </div>
            {complaints.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No complaints yet</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 pr-4">#</th>
                    <th className="pb-2 pr-4">Title</th>
                    <th className="pb-2 pr-4">Category</th>
                    <th className="pb-2 pr-4">Citizen</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.slice(0, 5).map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-400">{c.id}</td>
                      <td className="py-2 pr-4 font-medium text-gray-800">{c.title}</td>
                      <td className="py-2 pr-4 text-gray-500">{c.category}</td>
                      <td className="py-2 pr-4 text-gray-500">{c.user_email}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.status === "Resolved"    ? "bg-green-100 text-green-700" :
                          c.status === "Pending"     ? "bg-yellow-100 text-yellow-700" :
                          c.status === "In Progress" ? "bg-blue-100 text-blue-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}