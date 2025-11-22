// src/pages/ProjectDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import {
  getProjectById,
  addApplicant,
  addMessage,
  sendInvite,
  addTask,
  updateTask,
  deleteTask,
  changeTaskStatus,
  assignTask,
  addProjectFile,
  deleteProjectFile,
  getProjectFiles,
} from "../utils/storage";
import { getCurrentUser } from "../utils/users";
import { matchCandidates } from "../utils/matching";
import "./ProjectDetail.css";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);

  const [activeTab, setActiveTab] = useState("overview"); // overview | tasks | files | chat

  // apply
  const [applyMessage, setApplyMessage] = useState("");

  // chat
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef(null);

  // task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignTo, setTaskAssignTo] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  // file upload
  const [uploadingFiles, setUploadingFiles] = useState([]); // preview before send

  useEffect(() => {
    const p = getProjectById(id);
    if (!p) {
      setProject(null);
      return;
    }
    setProject(p);
    setMessages(p.messages || []);
    setTasks(p.tasks || []);
    setFiles(getProjectFiles(p.id) || []);
  }, [id]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  const isOwner = project?.owner === (currentUser?.name || "");
  const isMember = project?.members?.some((m) => m.name === (currentUser?.name || ""));
  const hasPending = project?.applicants?.some((a) => a.name === (currentUser?.name || "") && a.status === "pending");

  /* matching */
  useEffect(() => {
    if (!project) return;
    const rec = matchCandidates(project);
    const clean = rec.filter((r) => {
      const name = r.user.name;
      if (project.owner === name) return false;
      if ((project.members || []).some((m) => m.name === name)) return false;
      return true;
    });
    setRecommended(clean);
  }, [project]);

  /* helpers */
  const refreshAll = () => {
    const p = getProjectById(id);
    if (p) {
      setProject(p);
      setMessages(p.messages || []);
      setTasks(p.tasks || []);
      setFiles(getProjectFiles(p.id) || []);
    }
  };

  /* ======================
     TASK HANDLERS
     ====================== */
  const handleCreateOrUpdateTask = () => {
    if (!taskTitle.trim()) return alert("Judul tugas harus diisi.");
    const base = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      dueDate: taskDue || null,
      assignedTo: taskAssignTo || null,
      status: editingTask ? editingTask.status : "todo",
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (editingTask) {
      const ok = updateTask(project.id, base);
      if (!ok) return alert("Gagal update tugas.");
      setEditingTask(null);
    } else {
      const ok = addTask(project.id, base);
      if (!ok) return alert("Gagal menambah tugas.");
    }

    setTaskTitle("");
    setTaskDesc("");
    setTaskDue("");
    setTaskAssignTo("");
    refreshAll();
    setActiveTab("tasks");
  };

  const handleEditTask = (t) => {
    setEditingTask(t);
    setTaskTitle(t.title || "");
    setTaskDesc(t.description || "");
    setTaskDue(t.dueDate || "");
    setTaskAssignTo(t.assignedTo || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveTab("tasks");
  };

  const handleDeleteTask = (taskId) => {
    if (!confirm("Hapus tugas ini?")) return;
    const ok = deleteTask(project.id, taskId);
    if (!ok) return alert("Gagal menghapus tugas.");
    refreshAll();
  };

  const handleChangeTaskStatus = (taskId, newStatus) => {
    const t = (project.tasks || []).find((x) => x.id === taskId);
    if (!t) return;
    if (!isOwner && t.assignedTo !== (currentUser?.name || "")) {
      return alert("Hanya owner atau anggota yang ditugaskan yang dapat mengubah status.");
    }
    const ok = changeTaskStatus(project.id, taskId, newStatus);
    if (!ok) return alert("Gagal mengubah status.");
    refreshAll();
  };

  const handleAssignTask = (taskId, memberName) => {
    if (!isOwner) return alert("Hanya owner yang dapat menetapkan tugas.");
    const ok = assignTask(project.id, taskId, memberName || null);
    if (!ok) return alert("Gagal menetapkan tugas.");
    refreshAll();
  };

  /* ======================
     APPLY / INVITE / CHAT
     ====================== */
  const handleInvite = (candidate, role = "Kolaborator") => {
    if (!currentUser) return alert("Silakan login untuk mengundang.");
    const inv = {
      id: Date.now().toString(),
      projectId: project.id,
      toName: candidate.user.name,
      invitedBy: currentUser.name,
      role,
      message: `Anda direkomendasikan & diundang untuk bergabung dalam proyek "${project.title}"`,
      date: new Date().toISOString(),
      status: "pending",
    };
    const ok = sendInvite(project.id, inv);
    if (!ok) return alert("Gagal mengirim undangan.");
    alert("Undangan berhasil dikirim!");
    refreshAll();
  };

  const handleApply = () => {
    if (!applyMessage.trim()) return alert("Isi alasan bergabung");
    const applicant = {
      id: Date.now().toString(),
      name: currentUser?.name || "User Demo",
      message: applyMessage,
      date: new Date().toISOString(),
      status: "pending",
    };
    const ok = addApplicant(id, applicant);
    if (!ok) return alert("Gagal.");
    refreshAll();
    setApplyMessage("");
    alert("Lamaran terkirim!");
    setActiveTab("overview");
  };

  const sendChat = () => {
    if (!chatText.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: currentUser?.name || "",
      text: chatText.trim(),
      time: new Date().toISOString(),
    };
    const ok = addMessage(id, msg);
    if (!ok) return;
    refreshAll();
    setChatText("");
    setActiveTab("chat");
  };

  /* ======================
     FILE SHARING
     ====================== */
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

  const handleFilesSelected = async (e) => {
    const fList = Array.from(e.target.files || []);
    if (fList.length === 0) return;
    const converted = [];
    for (const f of fList) {
      try {
        const data = await fileToBase64(f);
        converted.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
          name: f.name,
          type: f.type,
          data,
          uploadedBy: currentUser?.name || "Unknown",
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        // skip problematic file
      }
    }
    if (converted.length) {
      // save to project files
      converted.forEach((cf) => addProjectFile(project.id, cf));
      refreshAll();
      setUploadingFiles([]);
      setActiveTab("files");
    }
    e.target.value = "";
  };

  const handleDeleteFile = (fileId) => {
    if (!confirm("Hapus file ini?")) return;
    const ok = deleteProjectFile(project.id, fileId);
    if (!ok) return alert("Gagal menghapus file.");
    refreshAll();
  };

  /* small UI helpers */
  const renderFilePreview = (f) => {
    if (!f || !f.type) return <div className="file-doc">FILE</div>;
    if (f.type.includes("image")) {
      return <img src={f.data} alt={f.name} style={{ maxWidth: 120, borderRadius: 8 }} />;
    }
    if (f.type.includes("pdf")) {
      return <div className="file-pdf">PDF</div>;
    }
    return <div className="file-doc">FILE</div>;
  };

  if (!project) return <div className="not-found">Proyek tidak ditemukan.</div>;

  return (
    <div className="detail-container">
      <header className="detail-header">
        <div>
          <h1 className="project-title">{project.title}</h1>
          <div className="meta-line">
            <span>Pembuat: <strong>{project.owner}</strong></span>
            <span>•</span>
            <span>{new Date(project.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={() => navigate("/explore")} className="btn ghost">Kembali</button>
          {isOwner && <span className="badge owner">Owner</span>}
          {isMember && <span className="badge member">Member</span>}
        </div>
      </header>

      {/* TAB NAV */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${activeTab === "overview" ? "" : "ghost"}`} onClick={() => setActiveTab("overview")}>Overview</button>
        <button className={`btn ${activeTab === "tasks" ? "" : "ghost"}`} onClick={() => setActiveTab("tasks")}>Tasks</button>
        <button className={`btn ${activeTab === "files" ? "" : "ghost"}`} onClick={() => setActiveTab("files")}>Files</button>
        <button className={`btn ${activeTab === "chat" ? "" : "ghost"}`} onClick={() => setActiveTab("chat")}>Chat</button>
      </div>

      <main className="detail-main">
        {/* LEFT: main content */}
        <section className="left-col">
          <img src={project.thumbnail || "/default-project-thumb.png"} alt="thumb" className="project-thumb" />

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <>
              <div className="box">
                <h3>Deskripsi</h3>
                <p className="project-desc">{project.description || "Tidak ada deskripsi."}</p>
              </div>

              <div className="box">
                <h3>Skill yang Dibutuhkan</h3>
                <div className="skill-list">{project.skills?.map((s) => <span key={s} className="skill-tag">{s}</span>)}</div>
              </div>

              <div className="box">
                <h3>Anggota Tim</h3>
                {(project.members || []).length ? (
                  (project.members || []).map((m, i) => (
                    <div key={i} className="member-item">
                      <div>
                        <div className="member-name">{m.name}</div>
                        <div className="member-meta">
  joined {new Date(m.joinedAt || new Date()).toLocaleDateString()}
</div>
                      </div>
                    </div>
                  ))
                ) : <div className="muted">Belum ada anggota.</div>}
              </div>
            </>
          )}

          {/* TASKS */}
          {activeTab === "tasks" && (
            <div className="box">
              <h3>Task & Progress</h3>

              {isOwner && (
                <div className="task-add-form">
                  <h4>{editingTask ? "Edit Task" : "Tambah Task"}</h4>
                  <input placeholder="Judul tugas" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                  <textarea placeholder="Deskripsi (opsional)" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
                  <input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <select value={taskAssignTo} onChange={(e) => setTaskAssignTo(e.target.value)}>
                      <option value="">Tidak ditugaskan</option>
                      {(project.members || []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                    </select>
                    <button className="btn small" onClick={handleCreateOrUpdateTask}>{editingTask ? "Update" : "Tambah"}</button>
                    {editingTask && <button className="btn ghost small" onClick={() => { setEditingTask(null); setTaskTitle(""); setTaskDesc(""); setTaskDue(""); setTaskAssignTo(""); }}>Batal</button>}
                  </div>
                </div>
              )}

              <div className="task-list">
                {(tasks || []).length === 0 && <div className="muted">Belum ada tugas.</div>}
                {(tasks || []).map((t) => (
                  <div key={t.id} className="task-item">
                    <div className="task-left">
                      <strong>{t.title}</strong>
                      <div className="muted small">{t.description}</div>
                      <div className="muted" style={{ marginTop: 6 }}>{t.assignedTo ? `Assigned: ${t.assignedTo}` : "Unassigned"} • {t.dueDate ? `Due: ${t.dueDate}` : "No due date"}</div>
                    </div>

                    <div className="task-right">
                      <div className={`task-status status-${t.status}`}>{t.status}</div>

                      <div className="task-actions">
                        {isOwner && (
                          <>
                            <button className="btn small" onClick={() => handleEditTask(t)}>Edit</button>
                            <button className="btn small ghost" onClick={() => handleDeleteTask(t.id)}>Hapus</button>

                            <div style={{ marginTop: 6 }}>
                              <select value={t.assignedTo || ""} onChange={(e) => handleAssignTask(t.id, e.target.value)}>
                                <option value="">Assign to...</option>
                                {(project.members || []).map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
                              </select>
                            </div>
                          </>
                        )}

                        {((t.assignedTo === (currentUser?.name || "")) || isOwner) && (
                          <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                            {t.status !== "todo" && <button className="btn small ghost" onClick={() => handleChangeTaskStatus(t.id, "todo")}>Set TODO</button>}
                            {t.status !== "inprogress" && <button className="btn small" onClick={() => handleChangeTaskStatus(t.id, "inprogress")}>In Progress</button>}
                            {t.status !== "done" && <button className="btn small" onClick={() => handleChangeTaskStatus(t.id, "done")}>Done</button>}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FILES */}
          {activeTab === "files" && (
            <div className="box">
              <h3>Files & Sharing</h3>

              <div style={{ marginBottom: 10 }}>
                <input type="file" multiple onChange={handleFilesSelected} />
                <div style={{ marginTop: 8 }} className="muted">Allowed: images, pdf, docs — files saved to project.</div>
              </div>

              <div className="file-preview">
                {files?.length === 0 && <div className="muted">Belum ada file.</div>}
                {files?.map((f) => (
                  <div key={f.id} className="file-item" style={{ width: 160 }}>
                    <div style={{ minHeight: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {renderFilePreview(f)}
                    </div>
                    <div className="file-name" title={f.name}>{f.name}</div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <a href={f.data} download={f.name}><button className="btn small">Download</button></a>
                      {(isOwner || isMember) && <button className="btn small ghost" onClick={() => handleDeleteFile(f.id)}>Hapus</button>}
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", textAlign: "center" }}>
                      <div>{f.uploadedBy || "-"}</div>
                      <div style={{ fontSize: 11 }}>{new Date(f.uploadedAt || "").toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT */}
          {activeTab === "chat" && (
            <div className="box chat-box">
              <h3>Chat Tim</h3>

              <div className="chat-window">
                {messages?.length ? (
                  messages.map((m) => (
                    <div key={m.id} className={`chat-message ${m.sender === (currentUser?.name || "") ? "me" : ""}`}>
                      <div className="chat-meta"><strong>{m.sender}</strong> <small className="muted">{new Date(m.time).toLocaleTimeString()}</small></div>
                      <div className="chat-text">{m.text}</div>
                    </div>
                  ))
                ) : <div className="muted">Belum ada pesan.</div>}
                <div ref={chatEndRef} />
              </div>

              <div className="chat-input">
                <input placeholder="Ketik pesan..." value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                <button className="btn small" onClick={sendChat}>Kirim</button>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT: sidebar */}
        <aside className="right-col">
          {/* Owner: rekomendasi + applicants + quick actions */}
          {isOwner && (
            <div className="box">
              <h3>Rekomendasi Kandidat</h3>
              {recommended.length === 0 ? (
                <div className="muted">Tidak ada kandidat yang cocok.</div>
              ) : (
                recommended.map((r) => (
                  <div className="rekom-card" key={r.user.id}>
                    <div className="rekom-left">
                      <strong>{r.user.name}</strong>
                      <div className="muted small">{r.user.skills?.join(", ") || "-"}</div>
                      <ul className="reason-list">{r.reasons.slice(0,3).map((t,i)=>(<li key={i}>{t}</li>))}</ul>
                    </div>
                    <div className="rekom-right">
                      <div className="score">{Math.round(r.score)}</div>
                      <button className="btn small" onClick={() => handleInvite(r)}>Invite</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Apply / Join */}
          {!isOwner && !isMember && (
            <div className="box apply-box">
              <h3>Ajukan Diri / Join</h3>
              {hasPending ? (
                <div className="muted">Lamaranmu sedang diproses.</div>
              ) : (
                <>
                  <textarea placeholder="Ceritakan kenapa kamu cocok..." value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button className="btn" onClick={handleApply}>Kirim Lamaran</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Small quick task summary */}
          <div className="box">
            <h3>Ringkasan Tugas</h3>
            <div className="muted small">Total tugas: {(tasks||[]).length}</div>
            <div style={{ marginTop: 8 }}>
              <div className="muted small">Done: {(tasks||[]).filter(t=>t.status==="done").length}</div>
              <div className="muted small">In Progress: {(tasks||[]).filter(t=>t.status==="inprogress").length}</div>
            </div>
          </div>

          {/* Project files quick list */}
          <div className="box">
            <h3>Files (quick)</h3>
            {(files || []).length === 0 ? <div className="muted">Belum ada file.</div> : (
              (files||[]).slice(0,6).map((f) => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{f.name}</div>
                  <a href={f.data} download={f.name}><button className="btn small">D</button></a>
                </div>
              ))
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
