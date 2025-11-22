// src/components/RecommendedProjects.jsx
import React from "react";
import { useEffect, useState } from "react";
import { recommendProjectsForUser } from "../utils/recommend";
import { useNavigate } from "react-router-dom";
import "./RecommendedProjects.css";

export default function RecommendedProjects({ limit = 6 }) {
  const [recs, setRecs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const r = recommendProjectsForUser({ limit, minScore: 0.03 });
    setRecs(r);
  }, [limit]);

  if (!recs || recs.length === 0) {
    return (
      <div className="rec-box">
        <h3>Rekomendasi Untukmu</h3>
        <div className="rec-empty">Tidak ada rekomendasi (lengkapi profil & skillsmu untuk hasil lebih baik).</div>
      </div>
    );
  }

  return (
    <div className="rec-box">
      <h3>Rekomendasi Untukmu</h3>
      <div className="rec-grid">
        {recs.map(({ project, score }, i) => (
          <div key={project.id || i} className="rec-card" onClick={() => navigate(`/project/${project.id}`)}>
            <div className="rec-thumb">
              {/* placeholder thumbnail: jika project.thumbnail tersedia pakai itu */}
              <img src={project.thumbnail || "/mnt/data/6ebc701b-180f-402c-8a2a-13543d53f8d5.png"} alt={project.title} />
            </div>
            <div className="rec-body">
              <div className="rec-title">{project.title}</div>
              <div className="rec-meta">
                <span className="owner">by {project.owner || "Anon"}</span>
                <span className="score">• {Math.round(score * 100)}%</span>
              </div>
              <div className="rec-desc">{project.description ? project.description.slice(0, 120) + (project.description.length > 120 ? "..." : "") : "Tidak ada deskripsi."}</div>
              <div className="rec-tags">
                {(project.skills || []).slice(0, 4).map((s) => <span key={s} className="rec-tag">{s}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
