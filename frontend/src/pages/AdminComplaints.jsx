import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getComplaints, updateComplaintStatus } from "../api";

const statusBadge = (status) => {
  if (status === "Resolved")    return "bg-green-100 text-green-700";
  if (status === "Pending")     return "bg-yellow-100 text-yellow-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Rejected")    return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function AdminComplaints() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [complaints, setComplaints] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error,      setError]      = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    fetchComplaints();
  }, [token]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getComplaints(token);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      setSuccessMsg("");
      await updateComplaintStatus(id, newStatus, token);
      setComplaints((prev) =>
        prev.map((c) => c.id === id ? { ...c, status: newStatus } : c)
      );
      setSuccessMsg(`Complaint #${id} updated to "${newStatus}" — citizen notified by email!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err?.message || "Error updating complaint");
    } finally {
      setUpdatingId(null);
    }
  };

  if (!token) return <p className="text-center text-red-600 mt-8">Admin login required.</p>;
  if (loading) return <p className="text-center mt-8">Loading complaints...</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-blue-900">Manage Complaints</h1>
        <span className="text-sm text-gray-500">{complaints.length} total complaints</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">⚠️ {error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">✅ {successMsg}</div>
      )}

      {complaints.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No complaints submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm p-5 border hover:shadow-md transition">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{c.id}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-lg">{c.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{c.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                    <span> {c.category}</span>
                    <span> {c.location}</span>
                    <span> {c.user_email}</span>
                    <span> {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                  {c.media_url && (
                    <div className="mt-3">
                      {c.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                        <video src={`http://localhost:8000${c.media_url}`} controls className="max-h-40 rounded-lg"/>
                      ) : (
                        <img src={`http://localhost:8000${c.media_url}`} alt="evidence"
                          className="max-h-40 rounded-lg object-cover cursor-pointer"
                          onClick={() => window.open(`http://localhost:8000${c.media_url}`)}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <label className="text-xs text-gray-500 font-medium">Update Status</label>
                  <select
                    value={c.status}
                    disabled={updatingId === c.id}
                    onChange={(e) => handleStatusChange(c.id, e.target.value)}
                    className="border border-gray-300 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  {updatingId === c.id && (
                    <span className="text-xs text-blue-500">Updating...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}