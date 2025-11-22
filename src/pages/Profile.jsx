// src/pages/Profile.jsx 
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  updateUser,
  setCurrentUser
} from "../utils/users";
import "./Profile.css";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Kamu belum login</h2>
        <button className="btn" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
    );
  }

  const handleChange = (k, v) => setUser((s) => ({ ...s, [k]: v }));

  const handleSave = () => {
    updateUser(user);
    setCurrentUser(user);
    alert("Profil disimpan!");
  };

  const addSkill = (skill) => {
    if (!skill) return;
    setUser((s) => ({
      ...s,
      skills: Array.from(new Set([...(s.skills || []), skill]))
    }));
  };

  const removeSkill = (skill) =>
    setUser((s) => ({
      ...s,
      skills: (s.skills || []).filter((x) => x !== skill)
    }));

  const addBadge = (badge) => {
    if (!badge) return;
    setUser((s) => ({
      ...s,
      badges: Array.from(new Set([...(s.badges || []), badge]))
    }));
  };

  const removeBadge = (b) =>
    setUser((s) => ({
      ...s,
      badges: (s.badges || []).filter((x) => x !== b)
    }));

  const addExperience = (exp) => {
    if (!exp.title) return;
    setUser((s) => ({
      ...s,
      experiences: [...(s.experiences || []), exp]
    }));
  };

  const removeExperience = (i) =>
    setUser((s) => ({
      ...s,
      experiences: (s.experiences || []).filter((_, idx) => idx !== i)
    }));

  const [skillInput, setSkillInput] = useState("");
  const [badgeInput, setBadgeInput] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expRole, setExpRole] = useState("");

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Profil Saya</h2>

        <label>Nama</label>
        <input value={user.name} onChange={(e) => handleChange("name", e.target.value)} />

        <label>Email</label>
        <input value={user.email} disabled />

        <div style={{ marginTop: 12 }}>
          <h4>Skills</h4>
          <div className="chips">
            {(user.skills || []).map((s) => (
              <span key={s} className="chip">
                {s} <button className="xbtn" onClick={() => removeSkill(s)}>×</button>
              </span>
            ))}
          </div>

          <div className="row">
            <input
              placeholder="Tambah skill"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
            />
            <button
              className="btn small"
              onClick={() => {
                addSkill(skillInput.trim());
                setSkillInput("");
              }}
            >
              Tambah
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Badges</h4>
          <div className="chips">
            {(user.badges || []).map((b) => (
              <span key={b} className="chip">
                {b} <button className="xbtn" onClick={() => removeBadge(b)}>×</button>
              </span>
            ))}
          </div>

          <div className="row">
            <input
              placeholder="Tambah badge"
              value={badgeInput}
              onChange={(e) => setBadgeInput(e.target.value)}
            />
            <button
              className="btn small"
              onClick={() => {
                addBadge(badgeInput.trim());
                setBadgeInput("");
              }}
            >
              Tambah
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <h4>Experience</h4>
          {(user.experiences || []).map((ex, i) => (
            <div key={i} className="exp-row">
              <strong>{ex.title}</strong> — <small>{ex.role}</small>
              <button className="btn small ghost" onClick={() => removeExperience(i)}>
                Hapus
              </button>
            </div>
          ))}

          <div className="row">
            <input placeholder="Judul" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} />
            <input placeholder="Role" value={expRole} onChange={(e) => setExpRole(e.target.value)} />
            <button
              className="btn small"
              onClick={() => {
                addExperience({ title: expTitle, role: expRole });
                setExpTitle("");
                setExpRole("");
              }}
            >
              Tambah
            </button>
          </div>
        </div>

        <button style={{ marginTop: 14 }} className="btn primary" onClick={handleSave}>
          Simpan Profil
        </button>
      </div>
    </div>
  );
}
