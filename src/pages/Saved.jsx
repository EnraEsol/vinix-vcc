// src/pages/Saved.jsx
import { useEffect, useState } from "react";
import { loadProjects } from "../utils/storage";
import { useNavigate } from "react-router-dom";
import "./Saved.css";

export default function Saved() {
  const navigate = useNavigate();

  const [savedIds, setSavedIds] = useState([]);
  const [savedProjects, setSavedProjects] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("vcc_saved_projects") || "[]");
    setSavedIds(saved);

    const all = loadProjects();
    const result = all.filter((p) => saved.includes(p.id));
    setSavedProjects(result);
  }, []);

  const removeFromSaved = (id) => {
    const updated = savedIds.filter((x) => x !== id);
    setSavedIds(updated);
    localStorage.setItem("vcc_saved_projects", JSON.stringify(updated));

    const all = loadProjects();
    const result = all.filter((p) => updated.includes(p.id));
    setSavedProjects(result);
  };

  if (savedProjects.length === 0) {
    return (
      <div className="saved-empty">
        <h2>Saved Projects</h2>
        <p>Kamu belum menyimpan proyek apapun.</p>

        <button className="btn" onClick={() => navigate("/explore")}>
          Explore Projects
        </button>
      </div>
    );
  }

  return (
    <div className="saved-page">
      <div className="saved-header">
        <h1>⭐ Saved Projects</h1>

        <button
          className="btn ghost"
          onClick={() => {
            localStorage.removeItem("vcc_saved_projects");
            setSavedIds([]);
            setSavedProjects([]);
          }}
        >
          Clear All
        </button>
      </div>

      <div className="saved-grid">
        {savedProjects.map((p) => (
          <div key={p.id} className="saved-card">
            <div
              className="saved-body"
              onClick={() => navigate(`/project/${p.id}`)}
            >
              <div className="saved-title-row">
                <h3>{p.title}</h3>
                <span className="date">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </div>

              <p className="desc">
                {p.description
                  ? p.description.length > 150
                    ? p.description.slice(0, 150) + "..."
                    : p.description
                  : "Tidak ada deskripsi."}
              </p>

              <div className="tags">
                {p.skills?.slice(0, 5).map((s) => (
                  <span key={s} className="tag">
                    {s}
                  </span>
                ))}

                {p.skills?.length > 5 && (
                  <span className="tag more">
                    +{p.skills.length - 5}
                  </span>
                )}
              </div>
            </div>

            <button
              className="btn small danger"
              onClick={() => removeFromSaved(p.id)}
            >
              Hapus
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
