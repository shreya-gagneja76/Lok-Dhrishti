import React, { useState, useContext, useEffect, useRef } from "react";
import { submitComplaint } from "../api";
import { AuthContext } from "../context/AuthContext";

// Leaflet map imports (CDN-based, no npm needed)
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

function loadLeaflet() {
  return new Promise((resolve) => {
    if (window.L) return resolve(window.L);
    // Load CSS
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }
    // Load JS
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.onload = () => resolve(window.L);
    document.head.appendChild(script);
  });
}

export default function ComplaintForm() {
  const { user } = useContext(AuthContext);
  const token = user?.token;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Road",
    location: "",
  });
  const [latitude,  setLatitude]  = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [mediaFile, setMediaFile] = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [status,    setStatus]    = useState("");
  const [loading,   setLoading]   = useState(false);
  const [mapReady,  setMapReady]  = useState(false);

  const mapRef       = useRef(null);
  const mapInstance  = useRef(null);
  const markerRef    = useRef(null);

  // Load Leaflet and init map
  useEffect(() => {
    loadLeaflet().then((L) => {
      if (mapInstance.current) return; // already init
      const map = L.map(mapRef.current).setView([28.6139, 77.2090], 13); // Default: Delhi
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        setFormData((prev) => ({
          ...prev,
          location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        }));
        // Move marker
        if (markerRef.current) markerRef.current.setLatLng(e.latlng);
        else markerRef.current = L.marker(e.latlng).addTo(map);
      });

      mapInstance.current = map;
      setMapReady(true);

      // Try to get user's real location
      navigator.geolocation?.getCurrentPosition((pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map.setView([lat, lng], 15);
      });
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setStatus("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.startsWith("video") ? "video" : "image" });
    setStatus("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setMediaFile(file);
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.startsWith("video") ? "video" : "image" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) { setStatus("You must be logged in."); return; }
    if (!formData.location) { setStatus("Please pin a location on the map or type one."); return; }

    try {
      setLoading(true);
      setStatus("");
      await submitComplaint(
        { ...formData, latitude, longitude, media: mediaFile },
        token
      );
      setStatus("success");
      setFormData({ title: "", description: "", category: "Road", location: "" });
      setMediaFile(null);
      setPreview(null);
      setLatitude(null);
      setLongitude(null);
      if (markerRef.current && mapInstance.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    } catch (error) {
      setStatus(error?.message || "Failed to submit complaint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Submit a Complaint</h2>

      {status === "success" && (
        <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg border border-green-300">
          Complaint submitted successfully! You can track the status in My Complaints.
        </div>
      )}
      {status && status !== "success" && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg border border-red-300">
          {status}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl shadow">

        {/* Title */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Title *</label>
          <input
            name="title" value={formData.title} onChange={handleChange} required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. Broken road near bus stop"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Description *</label>
          <textarea
            name="description" value={formData.description} onChange={handleChange} required rows={3}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Describe the issue in detail"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Category *</label>
          <select
            name="category" value={formData.category} onChange={handleChange}
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="Road">Road Issue</option>
            <option value="Water"> Water Issue</option>
            <option value="Electricity"> Electricity Issue</option>
            <option value="Garbage">Garbage Issue</option>
            <option value="Other"> Other</option>
          </select>
        </div>

        {/* MAP */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            📍 Pin Location on Map *
          </label>
          <p className="text-sm text-gray-500 mb-2">Click on the map to drop a pin at the issue location</p>
          <div ref={mapRef} style={{ height: "280px", borderRadius: "8px", border: "1px solid #d1d5db" }} />
          {latitude && (
            <p className="mt-2 text-sm text-green-700 font-medium">
              Pinned: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </p>
          )}
        </div>

        {/* Location text (auto-filled from map, can edit) */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">Location / Address</label>
          <input
            name="location" value={formData.location} onChange={handleChange} required
            className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Auto-filled when you click map, or type manually"
          />
        </div>

        {/* Media Upload */}
        <div>
          <label className="block font-semibold mb-1 text-gray-700">
            📷 Attach Photo / Video (optional)
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
            onClick={() => document.getElementById("media-input").click()}
          >
            {preview ? (
              <div className="relative">
                {preview.type === "image" ? (
                  <img src={preview.url} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                ) : (
                  <video src={preview.url} controls className="max-h-48 mx-auto rounded-lg" />
                )}
                <p className="text-sm text-gray-500 mt-2">{mediaFile?.name}</p>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMediaFile(null); setPreview(null); }}
                  className="mt-1 text-red-500 text-sm hover:underline"
                >Remove</button>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-gray-400 text-3xl mb-2">📎</p>
                <p className="text-gray-600">Drag & drop or <span className="text-blue-600 underline">browse</span></p>
                <p className="text-gray-400 text-sm mt-1">JPG, PNG, GIF, MP4, MOV supported</p>
              </div>
            )}
          </div>
          <input
            id="media-input" type="file"
            accept="image/*,video/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition-colors ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-700 hover:bg-blue-800"
          }`}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>
      </form>
    </div>
  );
}