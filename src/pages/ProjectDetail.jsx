// src/pages/ProjectDetail.jsx
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  getProjectById,
  addApplicant,
  acceptApplicant,
  rejectApplicant,
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
  kickMember,
  promoteMember,
  setMemberRole,
  updateProject,
  addActivity,
  addNotification,
  completeProject as storageCompleteProject,
  onVccUpdate,
} from "../utils/storage";

import { getCurrentUser } from "../utils/users";
import { matchCandidates, matchUserToProject } from "../utils/matching";
import "./ProjectDetail.css";

/* ============================
   Small UI Subcomponents
============================ */
function Badge({ children, className }) {
  return <span className={`badge ${className || ""}`}>{children}</span>;
}

function MemberItem({ m, isOwner, isCompleted, currentUserName, onPromote, onSetRole, onKick }) {
  const isCoOwner = m.role === "co-owner" || m.role === "coowner";
  return (
    <div
      className="member-item"
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 10,
        border: "1px solid #eee",
        borderRadius: 8,
        marginBottom: 8,
      }}
    >
      <div>
        <div className="member-name">
          {m.name}
          {isCoOwner && <Badge className="co-owner">Co-Owner</Badge>}
        </div>
        <div className="member-meta">
          Bergabung {new Date(m.joinedAt || new Date()).toLocaleDateString()}
        </div>
      </div>

      {isOwner && !isCompleted && currentUserName !== m.name && (
        <div style={{ display: "flex", gap: 6 }}>
          {!isCoOwner && (
            <button className="btn small" onClick={() => { if (confirm(`Promosikan ${m.name} menjadi Co-Owner?`)) onPromote(m.name); }}>
              Promote
            </button>
          )}

          <select
            className="btn small"
            value={m.role || "member"}
            onChange={(e) => {
              if (e.target.value !== m.role) {
                onSetRole(m.name, e.target.value);
              }
            }}
          >
            <option value="member">Member</option>
            <option value="co-owner">Co-Owner</option>
          </select>

          <button
            className="btn small ghost"
            onClick={() => {
              if (confirm(`Keluarkan ${m.name} dari proyek?`)) onKick(m.name);
            }}
          >
            Kick
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================
   Main Component
============================ */
export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [files, setFiles] = useState([]);

  // UI state
  const [activeTab, setActiveTab] = useState("overview"); // overview | tasks | files | chat
  const [applyMessage, setApplyMessage] = useState("");
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef(null);

  // Task form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskAssignTo, setTaskAssignTo] = useState("");
  const [editingTask, setEditingTask] = useState(null);

  // candidate preview / local match (for showing "kecocokan kamu")
  const [myMatch, setMyMatch] = useState(null);

  // ---------------------------
  // refreshAll (stable)
  // ---------------------------
  const refreshAll = useCallback(() => {
    const p = getProjectById(id);
    if (p) {
      setProject(p);
      setMessages(p.messages || []);
      setTasks(p.tasks || []);
      setFiles(getProjectFiles(p.id) || []);
    } else {
      setProject(null);
      setMessages([]);
      setTasks([]);
      setFiles([]);
    }
  }, [id]);

  // initial load + listen for vcc_update events (realtime within same tab) + storage sync for cross-tab
  useEffect(() => {
    refreshAll();

    // vcc_update custom events (from saveProjects / saveNotifications etc)
    const unsub = onVccUpdate(() => {
      refreshAll();
    });

    // storage event (cross-tab)
    const onStorage = (e) => {
      // when localStorage keys change, refresh
      if (!e.key) return;
      if (e.key.includes("projects_vcc_v1") || e.key.includes("vcc_notifications_v1") || e.key.includes("vcc_activities_v1")) {
        refreshAll();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      try { unsub(); } catch {}
      window.removeEventListener("storage", onStorage);
    };
  }, [refreshAll]);

  // scroll chat to bottom when messages or tab change
  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // derived booleans
  const isOwner = project?.owner === (currentUser?.name || "");
  const isMember = project?.members?.some((m) => m.name === (currentUser?.name || ""));
  const isCompleted = project?.status === "completed";
  const hasPending = project?.applicants?.some((a) => a.name === (currentUser?.name || "") && a.status === "pending");

  // ---------------------------
  // Matching recommendations
  // Avoid infinite re-render: depend on stable keys only
  // ---------------------------
  useEffect(() => {
    if (!project) {
      setRecommended([]);
      setMyMatch(null);
      return;
    }

    // do matching asynchronously to avoid blocking render and reduce risk of loops
    setTimeout(() => {
      try {
        const rec = matchCandidates(project) || [];
        const clean = rec.filter((r) => {
          const name = r.user?.name;
          if (!name) return false;
          if (project.owner === name) return false;
          if ((project.members || []).some((m) => m.name === name)) return false;
          return true;
        });

        // update recommended only if changed (cheap check by ids)
        setRecommended((prev) => {
          const prevIds = (prev || []).map((x) => x.user?.id || x.user?.name).join(",");
          const newIds = (clean || []).map((x) => x.user?.id || x.user?.name).join(",");
          return prevIds === newIds ? prev : clean;
        });

        // compute myMatch for current user when appropriate
        if (currentUser && !isOwner) {
          const mm = matchUserToProject(project, currentUser);
          setMyMatch((prev) => {
            try {
              if (JSON.stringify(prev) === JSON.stringify(mm)) return prev;
            } catch {}
            return mm;
          });
        } else {
          setMyMatch(null);
        }
      } catch (err) {
        console.error("matchCandidates failed:", err);
        setRecommended([]);
        setMyMatch(null);
      }
    }, 0);
  }, [project?.id, project?.members?.length, currentUser?.name, isOwner]);

  /* ======================
     TASK HANDLERS
     ====================== */
  const handleCreateOrUpdateTask = () => {
    if (isCompleted) return alert("Proyek sudah selesai, tidak bisa mengubah tugas.");
    if (!taskTitle.trim()) return alert("Judul tugas harus diisi.");
    if (!project) return;

    const base = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      dueDate: taskDue || null,
      assignedTo: taskAssignTo || null,
      status: editingTask ? editingTask.status || "todo" : "todo",
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
      createdBy: currentUser?.name || null,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.name || null,
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
    if (isCompleted) return;
    setEditingTask(t);
    setTaskTitle(t.title || "");
    setTaskDesc(t.description || "");
    setTaskDue(t.dueDate || "");
    setTaskAssignTo(t.assignedTo || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveTab("tasks");
  };

  const handleDeleteTask = (taskId) => {
    if (isCompleted) return;
    if (!confirm("Hapus tugas ini?")) return;
    const ok = deleteTask(project.id, taskId);
    if (!ok) return alert("Gagal menghapus tugas.");
    refreshAll();
  };

  const handleChangeTaskStatus = (taskId, newStatus) => {
    if (isCompleted) return;
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
    if (isCompleted) return;
    if (!isOwner) return alert("Hanya owner yang dapat menetapkan tugas.");
    const ok = assignTask(project.id, taskId, memberName || null);
    if (!ok) return alert("Gagal menetapkan tugas.");
    refreshAll();
  };

  /* ======================
     APPLY / INVITE / CHAT
     ====================== */
  const handleInvite = (candidate, role = "Kolaborator") => {
    if (isCompleted) return alert("Proyek telah selesai, tidak dapat mengundang.");
    if (!currentUser) return alert("Silakan login untuk mengundang.");
    if (!candidate || !candidate.user) return alert("Kandidat tidak valid.");

    const targetName = candidate.user.name;

    // prevent inviting owner or existing members
    if (project.owner === targetName) return alert("Tidak bisa mengundang pemilik proyek.");
    if ((project.members || []).some((m) => m.name === targetName)) return alert("Pengguna sudah menjadi anggota.");

    const inv = {
      id: Date.now().toString(),
      invitedBy: currentUser.name,
      toName: targetName,
      role,
      message: `Anda direkomendasikan & diundang untuk bergabung dalam proyek "${project.title}"`,
      status: "pending",
      date: new Date().toISOString(),
    };

    const ok = sendInvite(project.id, inv);
    if (!ok) return alert("Gagal mengirim undangan.");
    alert("Undangan berhasil dikirim!");
    refreshAll();
  };

  const handleApply = () => {
    if (isCompleted) return alert("Proyek telah selesai, tidak dapat melamar.");
    if (!currentUser) return alert("Silakan login untuk melamar.");
    if (isOwner) return alert("Owner tidak bisa melamar ke proyek sendiri.");
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
    if (!currentUser) return alert("Silakan login untuk mengirim pesan.");
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
    if (isCompleted) return alert("Proyek sudah selesai, tidak dapat mengupload file.");
    const fList = Array.from(e.target.files || []);
    if (fList.length === 0) return;
    const converted = [];
    for (const f of fList) {
      try {
        const data = await fileToBase64(f);
        converted.push({
          id: Date.now().toString() + Math.random().toString(36).slice(2, 8),
          name: f.name,
          type: f.type || "application/octet-stream",
          data,
          uploadedBy: currentUser?.name || "Unknown",
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("file read err", err);
      }
    }
    if (converted.length) {
      converted.forEach((cf) => addProjectFile(project.id, cf));
      refreshAll();
      setActiveTab("files");
    }
    e.target.value = "";
  };

  const handleDeleteFile = (fileId) => {
    if (isCompleted) return alert("Proyek sudah selesai, tidak bisa menghapus file.");
    if (!confirm("Hapus file ini?")) return;
    const ok = deleteProjectFile(project.id, fileId);
    if (!ok) return alert("Gagal menghapus file.");
    refreshAll();
  };

  /* ======================
     MEMBER ACTIONS (owner)
     ====================== */
  const onPromote = (memberName) => {
    if (isCompleted) return alert("Proyek sudah selesai.");
    promoteMember(project.id, memberName);
    refreshAll();
  };

  const onSetRole = (memberName, role) => {
    if (isCompleted) return alert("Proyek sudah selesai.");
    setMemberRole(project.id, memberName, role);
    refreshAll();
  };

  const onKick = (memberName) => {
    if (isCompleted) return alert("Proyek sudah selesai.");
    kickMember(project.id, memberName);
    refreshAll();
  };

  /* ======================
     COMPLETE PROJECT
     ====================== */
  const completeProject = () => {
    if (!project) return;
    if (!confirm("Tandai proyek sebagai selesai?")) return;
    storageCompleteProject(project.id, currentUser?.name || project.owner);
    alert("Proyek ditandai selesai.");
    refreshAll();
  };

  /* -----------------------
     small helpers for rendering
     ----------------------- */
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

  // Guard: project not found
  if (!project) return <div className="not-found">Proyek tidak ditemukan.</div>;

  /* -----------------------
     Render UI
     ----------------------- */
  return (
    <div className="detail-container">
      <header className="detail-header">
        <div>
          <h1 className="project-title">{project.title}</h1>
          <div className="meta-line">
            <span>
              Pembuat: <strong>{project.owner}</strong>
            </span>
            <span>•</span>
            <span>{new Date(project.createdAt).toLocaleString()}</span>
            {project.startDate && project.endDate && <><span>•</span><span>{project.startDate} → {project.endDate}</span></>}
          </div>
        </div>

        <div className="header-actions">
          <button onClick={() => navigate("/explore")} className="btn ghost">
            Kembali
          </button>

          {isOwner && !isCompleted && (
            <button
              className="btn"
              style={{ backgroundColor: "#4ade80" }}
              onClick={completeProject}
            >
              Selesaikan Proyek
            </button>
          )}

          {isCompleted && <Badge className="completed">Completed</Badge>}
          {isOwner && <Badge className="owner">Owner</Badge>}
          {isMember && <Badge className="member">Member</Badge>}
        </div>
      </header>

      {/* TAB NAV */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button className={`btn ${activeTab === "overview" ? "" : "ghost"}`} onClick={() => setActiveTab("overview")}>
          Overview
        </button>
        <button className={`btn ${activeTab === "tasks" ? "" : "ghost"}`} onClick={() => setActiveTab("tasks")}>
          Tasks
        </button>
        <button className={`btn ${activeTab === "files" ? "" : "ghost"}`} onClick={() => setActiveTab("files")}>
          Files
        </button>
        <button className={`btn ${activeTab === "chat" ? "" : "ghost"}`} onClick={() => setActiveTab("chat")}>
          Chat
        </button>
      </div>

      <main className="detail-main">
        {/* LEFT */}
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
                <div className="skill-list">
                  {project.skills?.map((s) => <span key={s} className="skill-tag">{s}</span>) || <div className="muted">-</div>}
                </div>
              </div>

              <div className="box">
                <h3>Anggota Tim</h3>
                {(project.members || []).length === 0 ? (
                  <div className="muted">Belum ada anggota.</div>
                ) : (
                  project.members.map((m, i) => (
                    <MemberItem
                      key={i}
                      m={m}
                      isOwner={isOwner}
                      isCompleted={isCompleted}
                      currentUserName={currentUser?.name}
                      onPromote={onPromote}
                      onSetRole={onSetRole}
                      onKick={onKick}
                    />
                  ))
                )}
              </div>
            </>
          )}

          {/* TASKS */}
          {activeTab === "tasks" && (
            <div className="box">
              <h3>Task & Progress</h3>

              {isOwner && !isCompleted && (
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
                        {isOwner && !isCompleted && (
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

                        {!isCompleted && ((t.assignedTo === (currentUser?.name || "")) || isOwner) && (
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

              {!isCompleted && <div style={{ marginBottom: 10 }}>
                <input type="file" multiple onChange={handleFilesSelected} />
                <div style={{ marginTop: 8 }} className="muted">Allowed: images, pdf, docs — files saved to project.</div>
              </div>}

              <div className="file-preview">
                {files?.length === 0 && <div className="muted">Belum ada file.</div>}
                {files?.map((f) => (
                  <div key={f.id} className="file-item" style={{ width: 160 }}>
                    <div style={{ minHeight: 70, display: "flex", alignItems: "center", justifyContent: "center" }}>{renderFilePreview(f)}</div>
                    <div className="file-name" title={f.name}>{f.name}</div>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <a href={f.data} download={f.name}><button className="btn small">Download</button></a>
                      {(isOwner || isMember) && !isCompleted && <button className="btn small ghost" onClick={() => handleDeleteFile(f.id)}>Hapus</button>}
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
                ) : (
                  <div className="muted">Belum ada pesan.</div>
                )}
                <div ref={chatEndRef} />
              </div>

              {!isCompleted ? (
                <div className="chat-input">
                  <input placeholder="Ketik pesan..." value={chatText} onChange={(e) => setChatText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendChat()} />
                  <button className="btn small" onClick={sendChat}>Kirim</button>
                </div>
              ) : (
                <div className="muted">Proyek selesai — chat hanya bisa dibaca.</div>
              )}
            </div>
          )}
        </section>

        {/* Right: sidebar */}
        <aside className="right-col">
          {/* REKOMENDASI KANDIDAT (OWNER) */}
          {isOwner && !isCompleted && (
            <div className="box">
              <h3>Rekomendasi Kandidat</h3>
              {recommended.length === 0 ? <div className="muted">Tidak ada kandidat yang cocok.</div> : recommended.map((r) => (
                <div className="rekom-card" key={r.user?.id || r.user?.name}>
                  <div className="rekom-left">
                    <strong>{r.user?.name}</strong>
                    <div className="muted small">{r.user?.skills?.join(", ") || "-"}</div>
                    <ul className="reason-list">{(r.reasons || []).slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}</ul>
                  </div>

                  <div className="rekom-right">
                    <div className="score">{Math.round(r.score || 0)}</div>
                    <button className="btn small" onClick={() => handleInvite(r)}>Invite</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PELAMAR (OWNER) */}
          {isOwner && !isCompleted && (
            <div className="box">
              <h3>Pelamar Proyek</h3>
              {(project.applicants || []).length === 0 ? <div className="muted">Belum ada pelamar.</div> : (project.applicants || []).map((a) => (
                <div key={a.id} style={{ border: "1px solid #eee", padding: 10, borderRadius: 8, marginBottom: 8 }}>
                  <div><strong>{a.name}</strong><div className="muted small">{a.message}</div></div>
                  {a.status === "pending" ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <button className="btn small" onClick={() => { if (confirm(`Terima ${a.name}?`)) { acceptApplicant(project.id, a.id); refreshAll(); } }}>Terima</button>
                      <button className="btn small ghost" onClick={() => { if (confirm(`Tolak ${a.name}?`)) { rejectApplicant(project.id, a.id); refreshAll(); } }}>Tolak</button>
                    </div>
                  ) : (<div className="muted small">Status: {a.status}</div>)}
                </div>
              ))}
            </div>
          )}

          {/* APPLY / JOIN (NON MEMBER) */}
          {!isOwner && !isMember && !isCompleted && (
            <div className="box apply-box">
              <h3>Ajukan Diri / Join</h3>
              {hasPending ? <div className="muted">Lamaranmu sedang diproses.</div> : (
                <>
                  <textarea placeholder="Ceritakan kenapa kamu cocok..." value={applyMessage} onChange={(e) => setApplyMessage(e.target.value)} />
                  <div style={{ marginTop: 8 }}>
                    <button className="btn" onClick={handleApply}>Kirim Lamaran</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* MY MATCH (for logged-in non-owner users) */}
          {currentUser && !isOwner && !isMember && myMatch && (
            <div className="box">
              <h3>Kecocokanmu dengan proyek</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{myMatch.scorePercent}%</div>
                <div>
                  <div style={{ fontWeight: 600 }}>{myMatch.category}</div>
                  <div className="muted small">Skor relatif: {Math.round(myMatch.scoreRaw)}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <div className="muted small">Alasan utama:</div>
                <ul style={{ marginTop: 6 }}>
                  {myMatch.reasons?.slice(0, 4).map((r, i) => <li key={i} style={{ fontSize: 13 }}>{r}</li>)}
                </ul>
              </div>
              <div style={{ marginTop: 10 }}>
                <button className="btn" onClick={() => { setApplyMessage((s) => s || `Saya cocok karena ${myMatch.reasons?.[0] || "memiliki skill yang relevan"}`); setActiveTab("overview"); }}>Gunakan alasan otomatis</button>
              </div>
            </div>
          )}

          {/* TASK SUMMARY */}
          <div className="box">
            <h3>Ringkasan Tugas</h3>
            <div className="muted small">Total tugas: {(tasks || []).length}</div>
            <div style={{ marginTop: 8 }}>
              <div className="muted small">Done: {(tasks || []).filter((t) => t.status === "done").length}</div>
              <div className="muted small">In Progress: {(tasks || []).filter((t) => t.status === "inprogress").length}</div>
            </div>
          </div>

          {/* QUICK FILES */}
          <div className="box">
            <h3>Files (quick)</h3>
            {(files || []).length === 0 ? <div className="muted">Belum ada file.</div> : (files || []).slice(0, 6).map((f) => (
              <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>{f.name}</div>
                <a href={f.data} download={f.name}><button className="btn small">D</button></a>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  );
}
