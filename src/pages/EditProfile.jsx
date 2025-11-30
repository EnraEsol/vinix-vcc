// src/pages/EditProfile.jsx
import { useState } from "react";
import { getCurrentUser, updateUser } from "../utils/users";
import { categorizedSkills } from "../data/categorizedSkills";
import "./EditProfile.css";

export default function EditProfile() {
  const current = getCurrentUser();
  if (!current) return <div style={{ padding: 40 }}>Login dulu.</div>;

  const [user, setUser] = useState(current);

  const [bio, setBio] = useState(current.bio || "");
  const [expInput, setExpInput] = useState("");

  const [links, setLinks] = useState({
    github: current.links?.github || "",
    linkedin: current.links?.linkedin || "",
    website: current.links?.website || "",
  });

  /* =======================================
     SKILL DROPDOWN MODERN (UI SAMA)
  ======================================== */
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [skillSearch, setSkillSearch] = useState("");

  const categoryList = Object.keys(categorizedSkills);

  const filteredSkills = categoryList
    .map((cat) => ({
      category: cat,
      skills: categorizedSkills[cat].filter((skill) =>
        skill.toLowerCase().includes(skillSearch.toLowerCase())
      ),
    }))
    .filter((cat) => cat.skills.length > 0);

  const addSkill = (skill) => {
    if (!skill || user.skills?.includes(skill)) return;

    setUser({
      ...user,
      skills: [...(user.skills || []), skill],
    });

    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const removeSkill = (s) => {
    const skills = user.skills.filter((x) => x !== s);
    setUser({ ...user, skills });
  };

  /* =======================================
     EXPERIENCES
  ======================================== */
  const addExp = () => {
    if (!expInput.trim()) return;

    setUser({
      ...user,
      experiences: [...(user.experiences || []), { title: expInput }],
    });

    setExpInput("");
  };

  const removeExp = (i) => {
    setUser({
      ...user,
      experiences: user.experiences.filter((_, idx) => idx !== i)
    });
  };

  /* =======================================
     SAVE PROFILE
  ======================================== */
  const saveChanges = () => {
    const updated = {
      ...user,
      bio,
      links,
    };

    updateUser(updated);
    alert("Profile updated!");
    window.location.href = `/u/${user.name}`;
  };

  return (
    <div className="edit-profile-page">
      <h1>Edit Profile</h1>

      {/* BIO */}
      <div className="box">
        <h3>Bio</h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows="4"
        />
      </div>

      {/* SKILLS */}
      <div className="box">
        <h3>Skills</h3>

        {/* LIST */}
        <div className="chip-list">
          {(user.skills || []).map((s) => (
            <span key={s} className="chip" onClick={() => removeSkill(s)}>
              {s} ✕
            </span>
          ))}
        </div>

        {/* INPUT + DROPDOWN */}
        <div className="skill-dropdown-wrapper">
          <input
            className="block"
            placeholder="Cari skill atau pilih dari daftar"
            value={skillSearch}
            onChange={(e) => {
              setSkillSearch(e.target.value);
              setShowSkillDropdown(true);
            }}
            onFocus={() => setShowSkillDropdown(true)}
          />

          {showSkillDropdown && (
            <div className="skill-dropdown">
              {filteredSkills.length === 0 && (
                <div className="skill-empty">Skill tidak ditemukan</div>
              )}

              {filteredSkills.map((group) => (
                <div key={group.category}>
                  <div className="skill-cat-title">{group.category}</div>

                  {group.skills.map((sk) => (
                    <div
                      key={sk}
                      className="skill-option"
                      onClick={() => addSkill(sk)}
                    >
                      {sk}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EXPERIENCE */}
      <div className="box">
        <h3>Experience</h3>

        {(user.experiences || []).map((ex, i) => (
          <div key={i} className="exp-item">
            {ex.title}
            <button className="btn small ghost" onClick={() => removeExp(i)}>
              Remove
            </button>
          </div>
        ))}

        <div className="input-row">
          <input
            value={expInput}
            onChange={(e) => setExpInput(e.target.value)}
            placeholder="Tambah pengalaman..."
          />
          <button className="btn" onClick={addExp}>
            Add
          </button>
        </div>
      </div>

      {/* LINKS */}
      <div className="box">
        <h3>Links</h3>

        <input
          className="block"
          placeholder="Github URL"
          value={links.github}
          onChange={(e) => setLinks({ ...links, github: e.target.value })}
        />

        <input
          className="block"
          placeholder="LinkedIn URL"
          value={links.linkedin}
          onChange={(e) => setLinks({ ...links, linkedin: e.target.value })}
        />

        <input
          className="block"
          placeholder="Website URL"
          value={links.website}
          onChange={(e) => setLinks({ ...links, website: e.target.value })}
        />
      </div>

      <button className="btn" onClick={saveChanges}>
        Save Changes
      </button>
    </div>
  );
}
