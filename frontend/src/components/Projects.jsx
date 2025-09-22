import { useEffect, useState } from "react";
import { getProjects, createProject, deleteFile, uploadFile } from "../api";
import ChatPage from "./Chat";

export default function ProjectsPage({ token, onLogout }) {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [activeProject, setActiveProject] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      setLoading(true);
      const res = await getProjects(token);
      setProjects(res);
    } catch (err) {
      alert("❌ Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function addProject() {
    if (!newName.trim()) return;
    try {
      await createProject(token, newName);
      setNewName("");
      fetchProjects();
    } catch {
      alert("❌ Could not create project");
    }
  }

  async function handleUpload(e, projectId) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await uploadFile(token, projectId, file);
      fetchProjects();
    } catch {
      alert("❌ Upload failed");
    }
  }

  async function handleDeleteFile(projectId, index) {
    try {
      await deleteFile(token, projectId, index);
      fetchProjects();
    } catch {
      alert("❌ Could not delete file");
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">📂 Projects</h2>
        <button
          onClick={onLogout}
          className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Add Project */}
      <div className="mb-4 flex gap-2">
        <input
          className="border rounded p-2 flex-grow"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name"
        />
        <button
          onClick={addProject}
          className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Create
        </button>
      </div>

      {/* Project List */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li
              key={p.id}
              className="p-3 border rounded bg-white shadow-sm dark:bg-gray-800"
            >
              {/* Project Name */}
              <div
                className="font-semibold cursor-pointer text-blue-600"
                onClick={() => setActiveProject(p)}
              >
                {p.name}
              </div>

              {/* File Upload */}
              <div className="mt-2">
                <input
                  type="file"
                  onChange={(e) => handleUpload(e, p.id)}
                />
              </div>

              {/* File List */}
              <ul className="mt-2 pl-4 list-disc">
                {p.files.map((f, i) => (
                  <li key={i} className="flex justify-between items-center">
                    <span>{f}</span>
                    <button
                      onClick={() => handleDeleteFile(p.id, i)}
                      className="text-red-600 hover:underline"
                    >
                      ❌
                    </button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {/* Chat for Active Project */}
      {activeProject && (
        <div className="mt-6">
          <ChatPage
            token={token}
            project={activeProject}
            onClose={() => setActiveProject(null)}
          />
        </div>
      )}
    </div>
  );
}
