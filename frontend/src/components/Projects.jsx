import React, { useState, useEffect } from "react";
import { listProjects, createProject, chat, uploadFile, deleteFile } from "../api";

export default function Projects({ token, darkMode }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");

  // Fetch projects when token changes
  useEffect(() => {
    async function fetchProjects() {
      const data = await listProjects(token);
      setProjects(data.projects || []);
    }
    fetchProjects();
  }, [token]);

  // Create new project
  async function handleCreateProject() {
    if (!newProjectName) return alert("Project name is required!");
    const res = await createProject(token, newProjectName, newProjectDesc);
    setProjects([...projects, res]);
    setNewProjectName("");
    setNewProjectDesc("");
  }

  // Send chat message
  async function handleSendMessage() {
    if (!selectedProject || !message) return;
    const res = await chat(token, selectedProject.id, message);
    setChatHistory(res.history || []);
    setMessage("");
  }

  // Upload PDF
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const res = await uploadFile(token, selectedProject.id, file);
    alert(res.msg || "File uploaded!");

    // Refresh project list & current project
    const updated = await listProjects(token);
    setProjects(updated.projects || []);
    const updatedProject = updated.projects.find((p) => p.id === selectedProject.id);
    setSelectedProject(updatedProject);
  }

  // Delete uploaded file
  async function handleDeleteFile(fileIndex) {
    const res = await deleteFile(token, selectedProject.id, fileIndex);
    alert(res.msg || "File deleted!");

    // Refresh project list & current project
    const updated = await listProjects(token);
    setProjects(updated.projects || []);
    const updatedProject = updated.projects.find((p) => p.id === selectedProject.id);
    setSelectedProject(updatedProject);
  }

  // Delete whole project
  async function handleDeleteProject(projectId) {
    const res = await fetch(`http://127.0.0.1:8000/projects/${projectId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.msg || "Project deleted!");

    // Refresh list and clear selection if deleted project is open
    const updated = await listProjects(token);
    setProjects(updated.projects || []);
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(null);
      setChatHistory([]);
    }
  }

  // Reset chat history only
  async function handleResetChat() {
    const res = await fetch(`http://127.0.0.1:8000/projects/${selectedProject.id}/chats`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    alert(data.msg || "Chat history cleared!");
    setChatHistory([]);
  }

  // ✅ Styling helper for light/dark mode
  const boxStyle = {
    border: "1px solid #ccc",
    height: 200,
    overflowY: "auto",
    marginBottom: 10,
    padding: 5,
    backgroundColor: darkMode ? "#1e1e1e" : "#fff",
    color: darkMode ? "#f5f5f5" : "#000",
  };

  const inputStyle = {
    backgroundColor: darkMode ? "#333" : "#fff",
    color: darkMode ? "#fff" : "#000",
    border: "1px solid #ccc",
    padding: "5px",
    marginRight: "10px",
  };

  const buttonStyle = {
    backgroundColor: darkMode ? "#444" : "#eee",
    color: darkMode ? "#fff" : "#000",
    border: "none",
    padding: "5px 10px",
    cursor: "pointer",
  };

  return (
    <div>
      <h2>Projects</h2>

      {/* Create Project Form */}
      <div style={{ marginBottom: 20 }}>
        <input
          placeholder="Project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          style={inputStyle}
        />
        <input
          placeholder="Description"
          value={newProjectDesc}
          onChange={(e) => setNewProjectDesc(e.target.value)}
          style={inputStyle}
        />
        <button style={buttonStyle} onClick={handleCreateProject}>
          Create Project
        </button>
      </div>

      {/* Project List */}
      <ul>
        {projects.map((p) => (
          <li key={p.id}>
            <button
              style={buttonStyle}
              onClick={() => {
                setSelectedProject(p);
                setChatHistory([]);
              }}
            >
              {p.name}
            </button>
            <button
              style={{ ...buttonStyle, marginLeft: 10, backgroundColor: "red", color: "white" }}
              onClick={() => handleDeleteProject(p.id)}
            >
              ❌ Delete Project
            </button>
          </li>
        ))}
      </ul>

      {selectedProject && (
        <div style={{ marginTop: 20 }}>
          <h3>Chat – {selectedProject.name}</h3>

          {/* Show uploaded files */}
          {selectedProject.files && selectedProject.files.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <b>Uploaded Files:</b>
              <ul>
                {selectedProject.files.map((f, i) => (
                  <li key={i}>
                    {f.filename}
                    <button
                      style={{ marginLeft: 10, color: "red", background: "transparent", border: "none" }}
                      onClick={() => handleDeleteFile(i)}
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chat History */}
          <div style={boxStyle}>
            {chatHistory.map((m, i) => (
              <p key={i}>
                <b>{m.role}:</b> {m.content}
              </p>
            ))}
          </div>

          {/* Reset Chat Button */}
          <button
            style={{ ...buttonStyle, marginBottom: 10, backgroundColor: "orange", color: "white" }}
            onClick={handleResetChat}
          >
            Reset Chat History
          </button>

          {/* Chat Input */}
          <div>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              style={inputStyle}
            />
            <button style={buttonStyle} onClick={handleSendMessage}>
              Send
            </button>
          </div>

          {/* Upload PDF */}
          <div style={{ marginTop: 10 }}>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} />
          </div>
        </div>
      )}
    </div>
  );
}
