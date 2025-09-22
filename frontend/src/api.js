import axios from "axios";

const API_URL = "http://127.0.0.1:8000"; // change when deploying if needed

// ---------- AUTH ----------
export async function login(email, password) {
  const res = await axios.post(`${API_URL}/token`, {
    username: email,
    password,
  });
  return res.data;
}

export async function register(email, password) {
  const res = await axios.post(`${API_URL}/register`, {
    email,
    password,
  });
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

  const res = await axios.post(`${API_URL}/upload/${project_id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function deleteFile(token, project_id, filename) {
  const res = await axios.delete(
    `${API_URL}/delete/${project_id}/${filename}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}
