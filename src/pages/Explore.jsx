// src/pages/Explore.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { loadProjects, onVccUpdate } from "../utils/storage";
import "./Explore.css";

/* ===========================================================
   COMPONENT: PROJECT CARD
=========================================================== */
const ProjectCard = ({
  project,
  onClick,
  compareList,
  toggleCompare,
  savedList,
  toggleSave
}) => {
  const isAdded = compareList.includes(project.id);
  const isSaved = savedList.includes(project.id);

  return (
    <div className="project-card" onClick={onClick}>
      <div className="card-left">
        <div className="letter-thumb">
          {(project.title || "?").charAt(0).toUpperCase()}
        </div>
      </div>

      <div className="card-right">
        <h3 className="project-title">{project.title}</h3>

        <p className="project-desc">
          {project.description
            ? project.description.length > 160
              ? project.description.slice(0, 160) + "..."
              : project.description
            : "Tidak ada deskripsi."}
        </p>

        <div className="meta-row">
          <div className="tags">
            {project.skills?.slice(0, 6).map((s) => (
              <span className="tag" key={s}>{s}</span>
            ))}
          </div>

          <div className="meta-right">
            <small>Owner: {project.owner}</small>
            <small>• {new Date(project.createdAt).toLocaleDateString()}</small>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            className={`btn small ${isAdded ? "ghost" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleCompare(project.id);
            }}
          >
            {isAdded ? "✓ Added" : "Compare"}
          </button>

          <button
            className={`btn small ${isSaved ? "ghost" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(project.id);
            }}
          >
            ⭐ {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ===========================================================
   PAGE: EXPLORE
=========================================================== */
export default function Explore() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [compareList, setCompareList] = useState([]);
  const [savedList, setSavedList] = useState([]);

  /* ===========================================================
     1) LOAD DATA (Main Function)
  ============================================================ */
  const refresh = useCallback(() => {
    setProjects(loadProjects() || []);
    setCompareList(JSON.parse(localStorage.getItem("vcc_compare_projects") || "[]"));
    setSavedList(JSON.parse(localStorage.getItem("vcc_saved_projects") || "[]"));
  }, []);

  /* ===========================================================
     2) INITIAL LOAD + REALTIME
  ============================================================ */
  useEffect(() => {
    refresh(); // initial

    // listen to our custom update system
    const unsub = onVccUpdate(() => refresh());

    // fallback storage event
    const storageHandler = () => refresh();
    window.addEventListener("storage", storageHandler);

    return () => {
      unsub();
      window.removeEventListener("storage", storageHandler);
    };
  }, [refresh]);

  /* ===========================================================
     3) COMPARE & SAVE LIST
  ============================================================ */
  const toggleCompare = (id) => {
    let updated = compareList.includes(id)
      ? compareList.filter((x) => x !== id)
      : [...compareList, id];

    setCompareList(updated);
    localStorage.setItem("vcc_compare_projects", JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent("vcc_update"));
  };

  const toggleSave = (id) => {
    let updated = savedList.includes(id)
      ? savedList.filter((x) => x !== id)
      : [...savedList, id];

    setSavedList(updated);
    localStorage.setItem("vcc_saved_projects", JSON.stringify(updated));

    window.dispatchEvent(new CustomEvent("vcc_update"));
  };

  /* ===========================================================
     4) FILTER + SORTING
  ============================================================ */
  const filteredProjects = useMemo(() => {
    let out = [...projects];

    const qLow = q.trim().toLowerCase();
    if (qLow) {
      out = out.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(qLow) ||
          (p.description || "").toLowerCase().includes(qLow)
      );
    }

    // sorting
    out.sort((a, b) => {
      const A = new Date(a.createdAt || 0).getTime();
      const B = new Date(b.createdAt || 0).getTime();
      return sortOrder === "newest" ? B - A : A - B;
    });

    return out;
  }, [projects, q, sortOrder]);

  /* ===========================================================
     5) RENDER
  ============================================================ */
  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2>Explore Proyek</h2>
        <p className="sub">Jelajahi proyek aktif dan temukan kesempatan kolaborasi.</p>
      </div>

      {compareList.length > 0 && (
        <button
          className="btn"
          style={{ marginBottom: 20 }}
          onClick={() => navigate("/compare")}
        >
          Compare Selected ({compareList.length})
        </button>
      )}

      {savedList.length > 0 && (
        <button
          className="btn ghost"
          style={{ marginBottom: 20 }}
          onClick={() => navigate("/saved")}
        >
          ⭐ View Saved ({savedList.length})
        </button>
      )}

      {/* SEARCH + SORT */}
      <div className="explore-controls">
        <input
          type="search"
          placeholder="Cari judul atau deskripsi..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input"
        />

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      <div className="results-info">
        Menemukan <strong>{filteredProjects.length}</strong> proyek
      </div>

      {/* LIST */}
      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty">Belum ada proyek.</div>
        ) : (
          filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              compareList={compareList}
              toggleCompare={toggleCompare}
              savedList={savedList}
              toggleSave={toggleSave}
              onClick={() => navigate(`/project/${p.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
