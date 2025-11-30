// src/pages/PublicProfile.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { loadUsers } from "../utils/users";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { name } = useParams();
  const [user, setUser] = useState(null);

  /* ==========================
        LOAD USER BY NAME
  =========================== */
  useEffect(() => {
    const all = loadUsers();
    const found = all.find(
      (u) => u.name?.toLowerCase() === name?.toLowerCase()
    );
    setUser(found || null);
  }, [name]);

  /* ==========================
        USER NOT FOUND
  =========================== */
  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="muted">Public profile tidak ditemukan.</div>
        </div>
      </div>
    );
  }

  /* ==========================
        NORMAL RENDER
  =========================== */
  return (
    <div className="profile-page">
      <div className="profile-card">
        
        {/* HEADER */}
        <div className="profile-header">
          <div className="avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <div className="avatar-placeholder">
                {(user.name || "U").slice(0, 1)}
              </div>
            )}
          </div>

          <div className="header-info">
            <h2>{user.name}</h2>
            <div className="muted">{user.title || ""}</div>
            <div className="muted">{user.location || ""}</div>
            <div className="muted small">{user.email}</div>
          </div>
        </div>

        {/* BIO */}
        <div className="box-inline">
          <h4>About</h4>
          <p>{user.bio || "Tidak ada bio."}</p>
        </div>

        {/* SKILLS */}
        <div className="box-inline">
          <h4>Skills</h4>
          {user.skills?.length > 0 ? (
            <div className="chips">
              {user.skills.map((s) => (
                <span key={s} className="chip">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <div className="muted small">Tidak ada skill.</div>
          )}
        </div>

        {/* EXPERIENCE */}
        <div className="box-inline">
          <h4>Experience</h4>
          {user.experiences?.length > 0 ? (
            user.experiences.map((ex, i) => (
              <div key={i} className="exp-row">
                <strong>{ex.title}</strong>
                <div className="muted small">{ex.role}</div>
              </div>
            ))
          ) : (
            <div className="muted small">Tidak ada pengalaman.</div>
          )}
        </div>

        {/* LINKS */}
        <div className="box-inline">
          <h4>Links</h4>
          {user.links?.length > 0 ? (
            user.links.map((link, i) => (
              <a
                key={i}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="link-item"
              >
                {link}
              </a>
            ))
          ) : (
            <div className="muted small">Tidak ada link.</div>
          )}
        </div>

        {/* CONTACT BUTTONS */}
        <div style={{ marginTop: 14 }}>
          <a className="btn" href={`mailto:${user.email}`}>
            Contact
          </a>

          {user.github && (
            <a
              className="btn ghost"
              style={{ marginLeft: 6 }}
              href={user.github}
              target="_blank"
            >
              GitHub
            </a>
          )}

          {user.linkedin && (
            <a
              className="btn ghost"
              style={{ marginLeft: 6 }}
              href={user.linkedin}
              target="_blank"
            >
              LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
