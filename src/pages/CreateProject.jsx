// src/pages/CreateProject.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categorizedSkills } from "../data/categorizedSkills";
import { createProject as storageCreateProject } from "../utils/storage";
import { getCurrentUser } from "../utils/users";
import "./CreateProject.css";

export default function CreateProject() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // blok kalau tidak login
  useEffect(() => {
    if (!currentUser) {
      alert("Anda harus login untuk membuat proyek.");
      navigate("/login");
    }
  }, [currentUser]);

  // basic form
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [desc, setDesc] = useState("");

  const [selectedSkills, setSelectedSkills] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const collaborationOptions = [
    "Remote", "On-site", "Hybrid", "Freelance",
    "Volunteer", "Part-time", "Full-time"
  ];
  const [collabType, setCollabType] = useState(collaborationOptions[0]);

  const rolesOptions = [
    "UI/UX Designer", "Frontend Developer", "Backend Developer",
    "Fullstack Developer", "Data Analyst", "Marketing",
    "Copywriter", "Product Manager", "Videographer",
    "QA", "DevOps"
  ];
  const [selectedRoles, setSelectedRoles] = useState([]);

  const outputsOptions = [
    "Website", "Mobile App", "Branding", "Pitch Deck",
    "Report", "Prototype", "Video"
  ];
  const [selectedOutputs, setSelectedOutputs] = useState([]);

  const toggleArrayItem = (setter, arr, item) => {
    if (arr.includes(item)) setter(arr.filter((i) => i !== item));
    else setter([...arr, item]);
  };

  const handleSkillSelect = (skill) => {
    if (selectedSkills.includes(skill))
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    else
      setSelectedSkills([...selectedSkills, skill]);
  };

  const validate = () => {
    if (!title.trim()) return "Isi nama proyek.";
    if (!goal.trim()) return "Isi tujuan proyek singkat.";
    if (selectedSkills.length === 0) return "Pilih minimal 1 skill.";
    if (selectedRoles.length === 0) return "Pilih minimal 1 role.";
    if (selectedOutputs.length === 0) return "Pilih minimal 1 output.";
    if (startDate && endDate && new Date(startDate) > new Date(endDate))
      return "Start date harus sebelum end date.";
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    const newProject = {
      id: Date.now().toString(),

      title: title.trim(),
      goal: goal.trim(),
      description: desc.trim(),

      skills: selectedSkills,
      rolesNeeded: selectedRoles,   // 🔥 penting untuk Explore filter
      outputs: selectedOutputs,

      startDate: startDate || null,
      endDate: endDate || null,
      collaborationType: collabType,
      timeline: startDate && endDate ? `${startDate} → ${endDate}` : "",

      createdAt: new Date().toISOString(),

      owner: currentUser.name,
      ownerId: currentUser.id,

      members: [],
      applicants: [],
      invites: [],
      messages: [],
      tasks: [],
      files: [],

      thumbnail: "",
      status: "open",       // 🔥 cocok dengan Explore filter
      completedAt: null,
    };

    storageCreateProject(newProject);

    // 🔥 untuk halaman lama yg masih pakai listener storage
    window.dispatchEvent(new Event("storage"));

    alert("Proyek berhasil dibuat!");
    navigate("/explore");
  };

  return (
    <div className="create-container">
      <h2>Buat Proyek Baru</h2>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="row">
          <label>Nama Proyek</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Sistem Informasi UMKM"
          />
        </div>

        <div className="row">
          <label>Tujuan Singkat</label>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Contoh: Digitalisasi UMKM"
          />
        </div>

        <div className="row">
          <label>Deskripsi</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Deskripsi lengkap proyek"
          />
        </div>

        <div className="row">
          <label>Skill yang Dibutuhkan</label>

          <div className="category-container">
            {Object.entries(categorizedSkills).map(([cat, skills]) => (
              <div key={cat} className="category-box">
                <h4>{cat}</h4>
                <div className="skills-grid">
                  {skills.map((s) => (
                    <button
                      type="button"
                      key={s}
                      className={`skill-button ${
                        selectedSkills.includes(s) ? "active" : ""
                      }`}
                      onClick={() => handleSkillSelect(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="row split">
          <div>
            <label>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <label>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="row">
          <label>Jenis Kolaborasi</label>
          <select value={collabType} onChange={(e) => setCollabType(e.target.value)}>
            {collaborationOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Roles yang Dibutuhkan</label>
          <div className="multi-list">
            {rolesOptions.map((r) => (
              <button
                key={r}
                type="button"
                className={`role-btn ${
                  selectedRoles.includes(r) ? "active" : ""
                }`}
                onClick={() => toggleArrayItem(setSelectedRoles, selectedRoles, r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="row">
          <label>Deliverable / Output</label>
          <div className="multi-list">
            {outputsOptions.map((o) => (
              <button
                key={o}
                type="button"
                className={`role-btn ${
                  selectedOutputs.includes(o) ? "active" : ""
                }`}
                onClick={() => toggleArrayItem(setSelectedOutputs, selectedOutputs, o)}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="row actions">
          <button type="submit" className="create-btn">Buat Proyek</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => {
              if (confirm("Batalkan pembuatan proyek?")) navigate("/explore");
            }}
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}
