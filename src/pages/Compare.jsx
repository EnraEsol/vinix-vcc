// src/pages/Compare.jsx
import { useEffect, useState } from "react";
import { loadProjects } from "../utils/storage";
import "./Compare.css";

export default function Compare() {
  const [compareIds, setCompareIds] = useState([]);
  const [compareProjects, setCompareProjects] = useState([]);

  /* LOAD SELECTED PROJECTS */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vcc_compare_projects") || "[]");
    setCompareIds(saved);

    const all = loadProjects();
    const result = all.filter((p) => saved.includes(p.id));

    setCompareProjects(result);
  }, []);

  /* REMOVE SINGLE PROJECT */
  const removeFromCompare = (id) => {
    const newIds = compareIds.filter((x) => x !== id);
    setCompareIds(newIds);
    localStorage.setItem("vcc_compare_projects", JSON.stringify(newIds));

    const all = loadProjects();
    const result = all.filter((p) => newIds.includes(p.id));
    setCompareProjects(result);
  };

  /* CLEAR ALL */
  const clearAll = () => {
    localStorage.removeItem("vcc_compare_projects");
    setCompareIds([]);
    setCompareProjects([]);
  };

  /* EMPTY PAGE */
  if (compareProjects.length === 0) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Compare Projects</h2>
        <p>Belum ada proyek yang dipilih untuk dibandingkan.</p>
      </div>
    );
  }

  return (
    <div className="compare-page">
      <div className="compare-header">
        <h1>Compare Projects</h1>

        <button className="btn ghost" onClick={clearAll}>
          Clear All
        </button>
      </div>

      {compareProjects.length < 2 && (
        <p className="muted small" style={{ marginBottom: 20 }}>
          Tambahkan minimal 2 proyek untuk perbandingan.
        </p>
      )}

      <table className="compare-table">
        <thead>
          <tr>
            <th style={{ width: 180 }}>Field</th>

            {compareProjects.map((p) => (
              <th key={p.id}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  {p.title}

                  <button
                    className="remove-btn"
                    title="Remove from compare"
                    onClick={() => removeFromCompare(p.id)}
                  >
                    ✕
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>Owner</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{p.owner}</td>
            ))}
          </tr>

          <tr>
            <td>Description</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{p.description || "-"}</td>
            ))}
          </tr>

          <tr>
            <td>Skills</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{(p.skills || []).join(", ") || "-"}</td>
            ))}
          </tr>

          <tr>
            <td>Roles Needed</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{(p.rolesNeeded || []).join(", ") || "-"}</td>
            ))}
          </tr>

          <tr>
            <td>Total Members</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{(p.members || []).length}</td>
            ))}
          </tr>

          <tr>
            <td>Total Tasks</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{(p.tasks || []).length}</td>
            ))}
          </tr>

          <tr>
            <td>Status</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{p.status || "open"}</td>
            ))}
          </tr>

          <tr>
            <td>Created At</td>
            {compareProjects.map((p) => (
              <td key={p.id}>{new Date(p.createdAt).toLocaleString()}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
