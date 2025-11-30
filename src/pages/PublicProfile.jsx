// src/pages/PublicProfile.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { loadUsers, getCurrentUser } from "../utils/users";
import { loadProjects, sendInvite } from "../utils/storage";
import { matchUserToProject } from "../utils/matching";
import "./PublicProfile.css";

export default function PublicProfile() {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const currentUser = getCurrentUser();

  const [createdProjects, setCreatedProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [portfolioProjects, setPortfolioProjects] = useState([]);

  const projectId = new URLSearchParams(location.search).get("project");
  const [aiMatch, setAiMatch] = useState(null);

  /* ================================
        LOAD PROFILE DATA
  ================================= */
  useEffect(() => {
    const all = loadUsers();
    const found = all.find(
      (u) => u.name?.toLowerCase() === name?.toLowerCase()
    );

    setUser(found || null);

    const projects = loadProjects();

    setCreatedProjects(
      projects.filter((p) => p.owner === name && p.status !== "completed")
    );

    setPortfolioProjects(
      projects.filter((p) => p.owner === name && p.status === "completed")
    );

    setJoinedProjects(
      projects.filter((p) =>
        (p.members || []).some((m) => m.name === name)
      )
    );

    if (projectId && found) {
      const match = matchUserToProject(projectId, found);
      setAiMatch(match);
    }
  }, [name, projectId]);

  /* ================================
        INVITE HANDLER
  ================================= */
  const handleInvite = (project) => {
    if (!currentUser) return alert("Login dulu!");

    const inv = {
      id: Date.now().toString(),
      invitedBy: currentUser.name,
      toName: user.name,
      role: "Collaborator",
      message: `Anda diundang ke proyek "${project.title}"`,
      status: "pending",
      date: new Date().toISOString(),
    };

    sendInvite(project.id, inv);
    alert("Undangan dikirim!");
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <div className="muted">Public profile tidak ditemukan.</div>
        </div>
      </div>
    );
  }

  const isSelf = currentUser?.name === user.name;

  return (
    <div className="profile-page">

      {/* ========= PROFILE BANNER ========= */}
      {user.banner && (
        <div
          className="profile-banner"
          style={{
            backgroundImage: `url(${user.banner})`,
          }}
        />
      )}

      <div className="profile-card">

        {/* ===== HEADER ===== */}
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
            <div className="muted small">{user.email}</div>

            {user.location && (
              <div className="muted small">{user.location}</div>
            )}

            {user.title && (
              <div className="muted small">{user.title}</div>
            )}

            {isSelf && (
              <button
                className="btn small"
                style={{ marginTop: 10 }}
                onClick={() => navigate("/edit-profile")}
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ===== BADGES ===== */}
        <div className="box-inline">
          <h4>Badges</h4>
          {user.badges?.length > 0 ? (
            <div className="chips">
              {user.badges.map((b, i) => (
                <span key={i} className="badge-chip">{b}</span>
              ))}
            </div>
          ) : (
            <div className="muted small">Belum memiliki badge.</div>
          )}
        </div>

        {/* ===== BIO ===== */}
        <div className="box-inline">
          <h4>About</h4>
          <p>{user.bio || "Tidak ada bio."}</p>
        </div>

        {/* ===== SKILLS ===== */}
        <div className="box-inline">
          <h4>Skills</h4>
          {user.skills?.length > 0 ? (
            <div className="chips">
              {user.skills.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
          ) : (
            <div className="muted small">Tidak ada skill.</div>
          )}
        </div>

        {/* ===== EXPERIENCE ===== */}
        <div className="box-inline">
          <h4>Experience</h4>
          {user.experiences?.length > 0 ? (
            user.experiences.map((ex, i) => (
              <div key={i} className="exp-row">
                <strong>{ex.title}</strong>

                <div className="muted small">
                  {ex.role && <span>{ex.role}</span>}
                  {ex.year && ` — ${ex.year}`}
                </div>

                {ex.description && (
                  <p className="exp-desc">{ex.description}</p>
                )}
              </div>
            ))
          ) : (
            <div className="muted small">Tidak ada pengalaman.</div>
          )}
        </div>

        {/* ===== FULL SOCIAL LINKS ===== */}
        <div className="box-inline">
          <h4>Links</h4>

          {user.links ? (
            <div className="links">
              {user.links.github && (
                <a href={user.links.github} target="_blank" className="link-item">
                  GitHub →
                </a>
              )}
              {user.links.linkedin && (
                <a href={user.links.linkedin} target="_blank" className="link-item">
                  LinkedIn →
                </a>
              )}
              {user.links.website && (
                <a href={user.links.website} target="_blank" className="link-item">
                  Website →
                </a>
              )}
              {user.links.instagram && (
                <a href={user.links.instagram} target="_blank" className="link-item">
                  Instagram →
                </a>
              )}
              {user.links.twitter && (
                <a href={user.links.twitter} target="_blank" className="link-item">
                  Twitter / X →
                </a>
              )}
              {user.links.behance && (
                <a href={user.links.behance} target="_blank" className="link-item">
                  Behance →
                </a>
              )}
              {user.links.dribbble && (
                <a href={user.links.dribbble} target="_blank" className="link-item">
                  Dribbble →
                </a>
              )}
            </div>
          ) : (
            <div className="muted small">Tidak ada link.</div>
          )}
        </div>

        {/* ===== PROJECTS CREATED ===== */}
        <div className="box-inline">
          <h4>Projects Created</h4>
          {createdProjects.length === 0 ? (
            <div className="muted small">Tidak ada proyek.</div>
          ) : (
            createdProjects.map((p) => (
              <div
                key={p.id}
                className="project-row"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <strong>{p.title}</strong>
                <div className="muted small">{p.goal}</div>
              </div>
            ))
          )}
        </div>

        {/* ===== PORTFOLIO (Completed Projects) ===== */}
        <div className="box-inline">
          <h4>Project Portfolio (Completed)</h4>
          {portfolioProjects.length === 0 ? (
            <div className="muted small">Belum ada proyek selesai.</div>
          ) : (
            portfolioProjects.map((p) => (
              <div
                key={p.id}
                className="project-row completed"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <strong>{p.title}</strong>
                <div className="muted small">Completed</div>
              </div>
            ))
          )}
        </div>

        {/* ===== MANUAL PORTFOLIO ===== */}
        <div className="box-inline">
          <h4>Extra Portfolio</h4>

          {user.portfolio?.length > 0 ? (
            user.portfolio.map((pf, i) => (
              <div key={i} className="portfolio-item">
                {pf.image && <img src={pf.image} className="portfolio-thumb" />}

                <strong>{pf.title}</strong>

                {pf.description && (
                  <p className="muted small">{pf.description}</p>
                )}

                {pf.link && (
                  <a href={pf.link} target="_blank" className="link-item small">
                    Visit →
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="muted small">Belum ada portfolio tambahan.</div>
          )}
        </div>

        {/* ===== JOINED PROJECTS ===== */}
        <div className="box-inline">
          <h4>Projects Joined</h4>
          {joinedProjects.length === 0 ? (
            <div className="muted small">Belum mengikuti proyek.</div>
          ) : (
            joinedProjects.map((p) => (
              <div
                key={p.id}
                className="project-row"
                onClick={() => navigate(`/project/${p.id}`)}
              >
                <strong>{p.title}</strong>
                <div className="muted small">{p.goal}</div>
              </div>
            ))
          )}
        </div>

        {/* ===== INVITE BUTTON ===== */}
        {!isSelf && currentUser && (
          <div style={{ marginTop: 14 }}>
            <h4>Invite ke Proyek Anda</h4>

            {createdProjects.length > 0 ? (
              createdProjects.map((p) => (
                <button
                  key={p.id}
                  className="btn"
                  style={{ marginTop: 6 }}
                  onClick={() => handleInvite(p)}
                >
                  Invite ke "{p.title}"
                </button>
              ))
            ) : (
              <div className="muted small">Anda belum membuat proyek.</div>
            )}
          </div>
        )}

        {/* CONTACT */}
        <div style={{ marginTop: 20 }}>
          <a className="btn" href={`mailto:${user.email}`}>
            Contact
          </a>
        </div>
      </div>
    </div>
  );
}
