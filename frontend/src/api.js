import axios from "axios";

// ✅ Use backend URL depending on environment
const API_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:8000"
    : "https://chat-box-backend-pv5y.onrender.com"; // fixed URL

// 🔒 Include .data so components don’t deal with axios boilerplate
export const register = async (email, password) => {
  const res = await axios.post(`${API_URL}/register`, { email, password });
  return res.data;
};

export const login = async (email, password) => {
  const params = new URLSearchParams();
  params.append("username", email);
  params.append("password", password);

  const res = await axios.post(`${API_URL}/token`, params);
  return res.data;
};

export const getProjects = async (token) => {
  const res = await axios.get(`${API_URL}/projects`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createProject = async (token, project) => {
  const res = await axios.post(`${API_URL}/projects`, project, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const deleteProject = async (token, projectId) => {
  const res = await axios.delete(`${API_URL}/projects/${projectId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const sendMessage = async (token, chat) => {
  const res = await axios.post(`${API_URL}/chat`, chat, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const uploadFile = async (token, projectId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await axios.post(`${API_URL}/projects/${projectId}/upload`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const deleteFile = async (token, projectId, fileIndex) => {
  const res = await axios.delete(`${API_URL}/projects/${projectId}/files/${fileIndex}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
