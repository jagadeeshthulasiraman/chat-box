import { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  uploadFile,
  deleteFile,
} from "../api";
import Chat from "./Chat";

export default function Projects({ token }) {
  const [projects, setProjects] = useState([]);
  const [newName, setNewName] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await getProjects(token);
      setProjects(res);
      if (selected) {
        const updated = res.find((p) => p.id === selected.id);
        setSelected(updated || null);
      }
    } catch (err) {
      console.error("Error loading projects:", err);
    }
  };

  const addProject = async () => {
    if (!newName.trim()) return;
    const res = await createProject(token, newName);
    setProjects([...projects, res]);
    setNewName("");
  };

  const handleUpload = async (e) => {
    if (!selected) return alert("Select a project first");
    const file = e.target.files[0];
    if (!file) return;
    await uploadFile(token, selected.id, file);
    await loadProjects();
  };

  const handleDeleteFile = async (index) => {
    await deleteFile(token, selected.id, index);
    await loadProjects();
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Projects</h2>

      <ul className="mb-3">
        {projects.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setSelected(p)}
              className={`px-2 py-1 rounded ${
                selected?.id === p.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200"
              }`}
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>

      <div className="mb-4">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New project name"
          className="border px-2 py-1 mr-2"
        />
        <button
          onClick={addProject}
          className="bg-green-500 text-white px-3 py-1 rounded"
        >
          Create
        </button>
      </div>

      {selected && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">
            Selected: {selected.name}
          </h3>

          {/* File upload */}
          <input type="file" onChange={handleUpload} className="mb-2" />

          {/* File list */}
          <ul className="mb-4">
            {selected.files &&
              selected.files.map((f, i) => (
                <li key={i} className="flex justify-between items-center">
                  <span>{f}</span>
                  <button
                    onClick={() => handleDeleteFile(i)}
                    className="bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Delete
                  </button>
                </li>
              ))}
          </ul>

          {/* Chatbox */}
          <Chat token={token} project={selected} />
        </div>
      )}
    </div>
  );
}
