import axios from "axios";

// Use deployed backend
const API_URL = "https://chat-box-backend-pv5y.onrender.com";

// ---------- AUTH ----------
export async function login(email, password) {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const res = await axios.post(`${API_URL}/token`, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return res.data;
}

export async function register(email, password) {
  const res = await axios.post(`${API_URL}/register`, { email, password });
  return res.data;
}

// ---------- PROJECTS ----------
export async function getProjects(token) {
  const res = await axios.get(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function createProject(token, name) {
  const res = await axios.post(
    `${API_URL}/projects`,
    { name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

export async function deleteProject(token, projectId) {
  const res = await axios.delete(`${API_URL}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ---------- CHAT ----------
export async function chat(token, project_id, message) {
  const res = await axios.post(
    `${API_URL}/chat`,
    { project_id, message },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

// ---------- FILE UPLOAD ----------
export async function uploadFile(token, project_id, file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(
    `${API_URL}/projects/${project_id}/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
}

export async function deleteFile(token, project_id, fileIndex) {
  const res = await axios.delete(
    `${API_URL}/projects/${project_id}/files/${fileIndex}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
