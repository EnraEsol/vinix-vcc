// src/pages/EditProject.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProjectById, updateProject } from "../utils/storage";
import "./EditProject.css";

export default function EditProject() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState([]);
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFileName, setThumbnailFileName] = useState("");

  useEffect(() => {
    const p = getProjectById(id);
    if (!p) return;
    setProject(p);
    setTitle(p.title || "");
    setDescription(p.description || "");
    setSkills(p.skills || []);
    setThumbnail(p.thumbnail || "");
  }, [id]);

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const handleThumbnailUpload = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const b = await fileToBase64(f);
      setThumbnail(b);
      setThumbnailFileName(f.name);
    } catch {
      alert("Gagal membaca file thumbnail.");
    }
  };

  const handleSkillAdd = (e) => {
    if (e.key === "Enter") {
      const v = e.target.value.trim();
      if (!v) return;
      if (!skills.includes(v)) setSkills([...skills, v]);
      e.target.value = "";
    }
  };

  const handleRemoveSkill = (s) => {
    setSkills(skills.filter((x) => x !== s));
  };

  const handleSave = () => {
    if (!title.trim()) return alert("Judul harus diisi.");

    const updated = {
      ...project,
      title: title.trim(),
      description: description.trim(),
      skills,
      thumbnail,
      updatedAt: new Date().toISOString(),
    };

    updateProject(updated);
    alert("Project berhasil diperbarui!");
    navigate(`/project/${project.id}`);
  };

  if (!project) return <div style={{ marginTop: 80, textAlign: "center" }}>Proyek tidak ditemukan.</div>;

  return (
    <div style={{ maxWidth: 900, margin: "80px auto", padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Edit Project</h1>

      <div className="box">
        <label className="label">Judul Project</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />

        <label className="label">Deskripsi</label>
        <textarea className="input" style={{ minHeight: 120 }} value={description} onChange={(e) => setDescription(e.target.value)} />

        <label className="label">Skill (tekan Enter)</label>
        <input className="input" onKeyDown={handleSkillAdd} placeholder="Tambahkan skill..." />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {skills.map((s) => (
            <span key={s} className="skill-pill" onClick={() => handleRemoveSkill(s)}>
              {s} ✕
            </span>
          ))}
        </div>

        <label className="label">Thumbnail (URL atau upload)</label>
        <input
          className="input"
          placeholder="URL thumbnail..."
          value={thumbnail.startsWith("data:") ? thumbnailFileName : thumbnail}
          onChange={(e) => setThumbnail(e.target.value)}
        />

        <input type="file" accept="image/*" style={{ marginTop: 8 }} onChange={handleThumbnailUpload} />

        {thumbnail && <img src={thumbnail} style={{ width: "100%", maxHeight: 220, marginTop: 10, borderRadius: 10, objectFit: "cover" }} />}

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button className="btn" onClick={handleSave}>Simpan Perubahan</button>
          <button className="btn ghost" onClick={() => navigate(`/project/${project.id}`)}>Batal</button>
        </div>
      </div>
    </div>
  );
}
