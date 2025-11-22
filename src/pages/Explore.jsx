// src/pages/Explore.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loadProjects } from "../utils/storage";
import { categorizedSkills } from "../data/categorizedSkills";
import "./Explore.css";

const ProjectCard = ({ project, onClick }) => {
  const thumb = "/default-thumb.png"; // ganti dengan thumbnail kamu

  return (
    <div className="project-card" onClick={onClick}>
      <div className="card-left">
        <img src={thumb} alt="thumbnail" className="project-thumb" />
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
              <span className="tag" key={s}>
                {s}
              </span>
            ))}

            {project.skills && project.skills.length > 6 && (
              <span className="tag more">+{project.skills.length - 6}</span>
            )}
          </div>

          <div className="meta-right">
            <small>Owner: {project.owner || "User Demo"}</small>
            <small>• {new Date(project.createdAt).toLocaleDateString()}</small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Explore() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [q, setQ] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const p = loadProjects();
    setProjects(Array.isArray(p) ? p : []);
  }, []);

  const allSkills = useMemo(() => {
    const arr = [];
    Object.values(categorizedSkills).forEach((list) =>
      list.forEach((s) => arr.push(s))
    );
    return Array.from(new Set(arr)).sort();
  }, []);

  const filteredProjects = useMemo(() => {
    let out = [...projects];

    const qLow = q.trim().toLowerCase();
    if (qLow) {
      out = out.filter(
        (p) =>
          p.title?.toLowerCase().includes(qLow) ||
          p.description?.toLowerCase().includes(qLow)
      );
    }

    if (skillFilter) {
      out = out.filter(
        (p) => Array.isArray(p.skills) && p.skills.includes(skillFilter)
      );
    }

    if (categoryFilter) {
      const catSkills = categorizedSkills[categoryFilter] || [];
      out = out.filter(
        (p) =>
          Array.isArray(p.skills) &&
          p.skills.some((s) => catSkills.includes(s))
      );
    }

    out.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? tb - ta : ta - tb;
    });

    return out;
  }, [projects, q, skillFilter, categoryFilter, sortOrder]);

  return (
    <div className="explore-page">
      <div className="explore-header">
        <h2>Explore Proyek</h2>
        <p className="sub">Lihat dan temukan proyek yang membutuhkan kolaborator.</p>
      </div>

      <div className="explore-controls">
        <input
          type="search"
          placeholder="Cari judul atau deskripsi..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="search-input"
        />

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setSkillFilter("");
          }}
        >
          <option value="">Semua Kategori</option>
          {Object.keys(categorizedSkills).map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
        >
          <option value="">Semua Skill</option>
          {allSkills.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
        </select>
      </div>

      <div className="results-info">
        Menemukan <strong>{filteredProjects.length}</strong> proyek
      </div>

      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="empty">Belum ada proyek yang cocok.</div>
        ) : (
          filteredProjects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/project/${p.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
