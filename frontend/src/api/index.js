const API_URL = "http://localhost:8000/api";

/* ================= LOGIN ================= */
export async function login(credentials) {
  const formData = new URLSearchParams();
  formData.append("username", credentials.email);
  formData.append("password", credentials.password);

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Login failed");
  return data;
}

/* ================= SIGNUP ================= */
export async function signup(userData) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: userData.username,
      email: userData.email,
      password: userData.password,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Signup failed");
  return data;
}

/* ================= SUBMIT COMPLAINT (with media + map) ================= */
export async function submitComplaint(data, token) {
  // Use FormData so we can send files
  const form = new FormData();
  form.append("title",       data.title);
  form.append("description", data.description);
  form.append("category",    data.category);
  form.append("location",    data.location);

  if (data.latitude  != null) form.append("latitude",  data.latitude);
  if (data.longitude != null) form.append("longitude", data.longitude);
  if (data.media)             form.append("media",     data.media);

  const res = await fetch(`${API_URL}/complaints`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    // DO NOT set Content-Type — browser sets it automatically with boundary for FormData
    body: form,
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.detail || "Failed to submit complaint");
  return result;
}

/* ================= GET COMPLAINTS ================= */
export async function getComplaints(token) {
  const res = await fetch(`${API_URL}/complaints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to fetch complaints");
  return data;
}

/* ================= ADMIN UPDATE STATUS ================= */
export async function updateComplaintStatus(complaintId, status, token) {
  const res = await fetch(`${API_URL}/admin/complaints/${complaintId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to update status");
  return data;
}

/* ================= FORGOT PASSWORD ================= */
export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Failed to send reset link");
  return data;
}

/* ================= RESET PASSWORD ================= */
export async function resetPassword(token, password) {
  const res = await fetch(`${API_URL}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Password reset failed");
  return data;
}
