import React, { useState, useEffect } from "react";
import {
  getProjects,
  createProject,
  chat,
  uploadFile,
  deleteFile,
} from "../api";

export default function Projects({ token }) {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState("");

  // Load projects
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects(token);
        setProjects(data);
      } catch (err) {
        console.error("❌ Failed to fetch projects:", err);
      }
    }
    fetchProjects();
  }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newProject.trim()) return;

    try {
      const project = await createProject(token, newProject);
      setProjects([...projects, project]);
      setNewProject("");
    } catch (err) {
      console.error("❌ Failed to create project:", err);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Projects</h2>

      <form onSubmit={handleCreate} className="mb-4 flex">
        <input
          type="text"
          className="flex-grow border p-2 rounded-l dark:bg-gray-700 dark:text-white"
          placeholder="New Project Name"
          value={newProject}
          onChange={(e) => setNewProject(e.target.value)}
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 rounded-r hover:bg-green-700"
        >
          Create
        </button>
      </form>

      <ul className="space-y-2">
        {projects.map((p) => (
          <li
            key={p.id}
            className="p-2 border rounded bg-white dark:bg-gray-800 shadow"
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
