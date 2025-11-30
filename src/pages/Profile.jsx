// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  getCurrentUser,
  updateUser,
  setCurrentUser,
} from "../utils/users";
import { awardBadgesForUser } from "../utils/badges";
import { loadProjects } from "../utils/storage";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [editing, setEditing] = useState(false);

  // temp fields for edit
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skillInput, setSkillInput] = useState("");
  const [badgeInput, setBadgeInput] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expRole, setExpRole] = useState("");
  const [projectsCreated, setProjectsCreated] = useState([]);
  const [projectsJoined, setProjectsJoined] = useState([]);

  useEffect(() => {
    const u = getCurrentUser();
    setUser(u);
    setName(u?.name || "");
    setBio(u?.bio || "");
    refreshProjects(u);
    // eslint-disable-next-line
  }, []);

  function refreshProjects(u) {
    const all = loadProjects() || [];
    if (!u) {
      setProjectsCreated([]);
      setProjectsJoined([]);
      return;
    }
    const created = all.filter((p) => p.owner === u.name);
    const joined = all.filter((p) =>
      (p.members || []).some((m) => m.name === u.name)
    );
    setProjectsCreated(created);
    setProjectsJoined(joined);
  }

  if (!user) {
    return (
      <div className="profile-empty">
        <h2>Kamu belum login</h2>
        <button className="btn primary" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    );
  }

  // helpers to update local component user state
  const localSet = (patch) => {
    setUser((s) => ({ ...s, ...patch }));
  };

  const handleSave = () => {
    const newUser = {
      ...user,
      name: name.trim() || user.name,
      bio: bio,
    };
    updateUser(newUser);
    setCurrentUser(newUser);
    setUser(newUser);
    setEditing(false);
    alert("Profil disimpan");
  };

  const addSkill = (val) => {
    if (!val) return;
    const arr = Array.from(new Set([...(user.skills || []), val]));
    localSet({ skills: arr });
    setUser((s) => ({ ...s, skills: arr }));
    setSkillInput("");
    // persist
    updateUser({ ...user, skills: arr });
    setCurrentUser({ ...user, skills: arr });
    awardBadgesForUser(user.name);
  };

  const removeSkill = (s) => {
    const arr = (user.skills || []).filter((x) => x !== s);
    localSet({ skills: arr });
    setUser((u) => ({ ...u, skills: arr }));
    updateUser({ ...user, skills: arr });
    setCurrentUser({ ...user, skills: arr });
  };

  const addBadge = (val) => {
    if (!val) return;
    const arr = Array.from(new Set([...(user.badges || []), val]));
    localSet({ badges: arr });
    setUser((u) => ({ ...u, badges: arr }));
    setBadgeInput("");
    updateUser({ ...user, badges: arr });
    setCurrentUser({ ...user, badges: arr });
  };

  const removeBadge = (b) => {
    const arr = (user.badges || []).filter((x) => x !== b);
    localSet({ badges: arr });
    setUser((u) => ({ ...u, badges: arr }));
    updateUser({ ...user, badges: arr });
    setCurrentUser({ ...user, badges: arr });
  };

  const addExperience = (title, role) => {
    if (!title) return;
    const arr = [...(user.experiences || []), { title, role, addedAt: new Date().toISOString() }];
    localSet({ experiences: arr });
    setUser((u) => ({ ...u, experiences: arr }));
    setExpTitle("");
    setExpRole("");
    updateUser({ ...user, experiences: arr });
    setCurrentUser({ ...user, experiences: arr });
  };

  const removeExperience = (idx) => {
    const arr = (user.experiences || []).filter((_, i) => i !== idx);
    localSet({ experiences: arr });
    setUser((u) => ({ ...u, experiences: arr }));
    updateUser({ ...user, experiences: arr });
    setCurrentUser({ ...user, experiences: arr });
  };

  // quick stats
  const stats = {
    created: projectsCreated.length,
    joined: projectsJoined.length,
    skills: (user.skills || []).length,
    badges: (user.badges || []).length,
  };

  return (
    <div className="profile-root">
      <aside className="profile-sidebar">
        <div className="profile-avatar-wrap">
          <div className="avatar">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <div className="avatar-initial">{(user.name || "U").slice(0, 1).toUpperCase()}</div>
            )}
          </div>
        </div>

        <div className="profile-name">{user.name}</div>
        <div className="profile-email">{user.email || ""}</div>

        <div className="profile-badges">
          {(user.badges || []).slice(0, 6).map((b) => (
            <span key={b} className="badge-pill">{b}</span>
          ))}
        </div>

        <div className="profile-stats">
          <div className="stat">
            <div className="stat-num">{stats.created}</div>
            <div className="stat-label">Created</div>
          </div>
          <div className="stat">
            <div className="stat-num">{stats.joined}</div>
            <div className="stat-label">Joined</div>
          </div>
          <div className="stat">
            <div className="stat-num">{stats.skills}</div>
            <div className="stat-label">Skills</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn primary full" onClick={() => setEditing(true)}>Edit Profile</button>
          <button className="btn ghost full" onClick={() => { setUser(null); setCurrentUser(null); navigate("/"); }}>Logout</button>
        </div>
      </aside>

      <main className="profile-main">
        <div className="profile-header">
          <h2>About</h2>
          {!editing ? (
            <p className="bio-text">{user.bio || "Belum ada bio. Klik Edit Profile untuk menambahkan."}</p>
          ) : (
            <textarea className="bio-edit" value={bio} onChange={(e) => setBio(e.target.value)} />
          )}
        </div>

        <div className="grid-cards">
          {/* Skills */}
          <section className="card">
            <div className="card-title">
              <h3>Skills</h3>
            </div>

            <div className="chip-wrap">
              {(user.skills || []).map((s) => (
                <div className="chip" key={s}>
                  {s}
                  <button className="chip-x" onClick={() => removeSkill(s)}>×</button>
                </div>
              ))}
            </div>

            <div className="card-actions">
              <input placeholder="Tambah skill (ex: React)" value={skillInput} onChange={(e) => setSkillInput(e.target.value)} />
              <button className="btn primary" onClick={() => addSkill(skillInput.trim())}>Tambah</button>
            </div>
          </section>

          {/* Badges */}
          <section className="card">
            <div className="card-title">
              <h3>Badges</h3>
            </div>

            <div className="chip-wrap">
              {(user.badges || []).map((b) => (
                <div className="badge-card" key={b}>
                  {b}
                  <button className="chip-x" onClick={() => removeBadge(b)}>×</button>
                </div>
              ))}
            </div>

            <div className="card-actions">
              <input placeholder="Tambah badge (ex: SQL Expert)" value={badgeInput} onChange={(e) => setBadgeInput(e.target.value)} />
              <button className="btn primary" onClick={() => addBadge(badgeInput.trim())}>Tambah</button>
            </div>
          </section>

          {/* Experience */}
          <section className="card">
            <div className="card-title"><h3>Experience</h3></div>

            <div>
              {(user.experiences || []).map((ex, idx) => (
                <div key={idx} className="exp-row">
                  <div>
                    <strong>{ex.title}</strong>
                    <div className="muted">{ex.role}</div>
                  </div>
                  <div>
                    <button className="btn ghost small" onClick={() => removeExperience(idx)}>Hapus</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-actions">
              <input placeholder="Judul (ex: Internship ABC)" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} />
              <input placeholder="Role (ex: Frontend)" value={expRole} onChange={(e) => setExpRole(e.target.value)} />
              <button className="btn primary" onClick={() => addExperience(expTitle.trim(), expRole.trim())}>Tambah</button>
            </div>
          </section>

          {/* Projects */}
          <section className="card projects-card">
            <div className="card-title"><h3>Projects Created</h3></div>
            <div className="projects-list">
              {projectsCreated.length === 0 ? <div className="muted">Belum membuat project.</div> : projectsCreated.map((p) => (
                <div key={p.id} className="project-row">
                  <Link to={`/project/${p.id}`} className="project-link">{p.title}</Link>
                  <div className="muted small">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="card projects-card">
            <div className="card-title"><h3>Projects Joined</h3></div>
            <div className="projects-list">
              {projectsJoined.length === 0 ? <div className="muted">Belum bergabung project.</div> : projectsJoined.map((p) => (
                <div key={p.id} className="project-row">
                  <Link to={`/project/${p.id}`} className="project-link">{p.title}</Link>
                  <div className="muted small">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Edit / Save controls */}
        <div style={{ marginTop: 18, display: "flex", gap: 10 }}>
          {editing ? (
            <>
              <button className="btn primary" onClick={handleSave}>Simpan</button>
              <button className="btn ghost" onClick={() => { setEditing(false); setBio(user.bio || ""); setName(user.name || ""); }}>Batal</button>
            </>
          ) : (
            <button className="btn" onClick={() => { setEditing(true); setBio(user.bio || ""); }}>Mulai Edit</button>
          )}
        </div>
      </main>
    </div>
  );
}
