import React, { useState, useEffect, useContext } from "react";
import { getComplaints } from "../api";
import { AuthContext } from "../context/AuthContext";

const statusColor = (status) => {
  if (status === "Resolved")   return "text-green-600";
  if (status === "Pending")    return "text-yellow-600";
  if (status === "In Progress") return "text-blue-600";
  if (status === "Rejected")   return "text-red-600";
  return "text-gray-600";
};

const statusBadge = (status) => {
  if (status === "Resolved")    return "bg-green-100 text-green-700";
  if (status === "Pending")     return "bg-yellow-100 text-yellow-700";
  if (status === "In Progress") return "bg-blue-100 text-blue-700";
  if (status === "Rejected")    return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
};

export default function ComplaintList() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        setError("");
        // ✅ Only pass token — no email needed
        const data = await getComplaints(token);
        setComplaints(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.message || "Failed to fetch complaints");
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [token]);

  if (!user) {
    return <p className="text-center text-red-600 mt-8">Please login to view complaints.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">My Complaints</h2>

      {loading && (
        <div className="text-center py-8 text-gray-500">Loading complaints...</div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {!loading && complaints.length === 0 && !error && (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-lg">No complaints yet.</p>
          <a href="/complaints/new" className="mt-4 inline-block bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-800">
            Submit your first complaint
          </a>
        </div>
      )}

      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs text-gray-400">#{complaint.id}</span>
                <h3 className="font-semibold text-lg text-gray-800">{complaint.title}</h3>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${statusBadge(complaint.status)}`}>
                {complaint.status}
              </span>
            </div>

            <p className="text-gray-600 text-sm mb-3">{complaint.description}</p>

            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span> {complaint.category}</span>
              <span> {complaint.location}</span>
              <span> {new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>

            {/* Show image if attached */}
            {complaint.media_url && (
              <div className="mt-3">
                {complaint.media_url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                  <video
                    src={`http://localhost:8000${complaint.media_url}`}
                    controls
                    className="max-h-48 rounded-lg"
                  />
                ) : (
                  <img
                    src={`http://localhost:8000${complaint.media_url}`}
                    alt="complaint"
                    className="max-h-48 rounded-lg object-cover"
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}