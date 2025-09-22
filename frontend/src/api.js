const API_URL = "http://127.0.0.1:8000";

// Register
export async function register(email, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

// Login
export async function login(email, password) {
  const res = await fetch(`${API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username: email, password }),
  });
  return res.json();
}

// List Projects
export async function listProjects(token) {
  const res = await fetch(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// Create Project
export async function createProject(token, name, description) {
  const res = await fetch(`${API_URL}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name, description }),
  });
  return res.json();
}

// Send Chat
export async function chat(token, projectId, message) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ project_id: projectId, message }),
  });
  return res.json();
}

// Upload PDF
export async function uploadFile(token, projectId, file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_URL}/projects/${projectId}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

// Delete uploaded file
export async function deleteFile(token, projectId, fileIndex) {
  const res = await fetch(`${API_URL}/projects/${projectId}/files/${fileIndex}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}
