// src/pages/RecommendedProjects.jsx
import { useEffect, useState } from "react";
import { recommendProjectsForUser, getUserProfile } from "../utils/recommend";
import { useNavigate } from "react-router-dom";
import "./RecommendedProjects.css";

export default function RecommendedProjects() {
  const navigate = useNavigate();

  const [recommended, setRecommended] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const userProfile = getUserProfile();
    setProfile(userProfile);

    const rec = recommendProjectsForUser({
      limit: 10,
      minScore: 0.05,
      includeOwnProjects: false,
    });

    setRecommended(rec);
  }, []);

  if (!profile) {
    return (
      <div className="rec-empty">
        <h2>Recommended Projects</h2>
        <p>
          Kamu belum mengatur <strong>Skill & Minat</strong>.  
          Rekomendasi akan jauh lebih akurat setelah kamu update profil.
        </p>

        <button className="btn" onClick={() => navigate("/edit-profile")}>
          Update Profile
        </button>
      </div>
    );
  }

  return (
    <div className="rec-page">
      <h1 className="rec-title">🎯 Recommended for You</h1>
      <p className="rec-sub">
        Berdasarkan skill: <strong>{profile.skills?.join(", ")}</strong>
      </p>

      {recommended.length === 0 ? (
        <div className="rec-empty">
          <p>Tidak ada rekomendasi proyek yang cocok.</p>
        </div>
      ) : (
        <div className="rec-list">
          {recommended.map((item) => {
            const p = item.project;

            return (
              <div
                key={p.id}
                className="rec-card"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <div className="rec-header">
                  <h3>{p.title}</h3>
                  <span className="score">{(item.score * 100).toFixed(0)}%</span>
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
                    <span className="tag" key={s}>
                      {s}
                    </span>
                  ))}

                  {p.skills?.length > 5 && (
                    <span className="tag more">+{p.skills.length - 5}</span>
                  )}
                </div>

                <div className="meta">
                  <small>Owner: {p.owner}</small>
                  <small>• {new Date(p.createdAt).toLocaleDateString()}</small>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
