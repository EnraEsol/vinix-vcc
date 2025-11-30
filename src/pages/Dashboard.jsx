// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/users";
import { 
  loadProjects, 
  getNotificationsForUser, 
  getActivitiesForUser 
} from "../utils/storage";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const [myProjects, setMyProjects] = useState([]);
  const [joinedProjects, setJoinedProjects] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [activities, setActivities] = useState([]);

  function loadAll() {
    if (!user) return;

    const all = loadProjects();

    // Projects dibuat
    setMyProjects(all.filter(p => p.owner === user.name));

    // Projects diikuti
    setJoinedProjects(
      all.filter(p => (p.members || []).some(m => m.name === user.name))
    );

    // Assigned tasks
    const tasks = [];
    all.forEach(p => {
      (p.tasks || []).forEach(t => {
        if (t.assignedTo === user.name) {
          tasks.push({
            ...t,
            projectId: p.id,
            projectTitle: p.title,
            projectStatus: p.status
          });
        }
      });
    });
    setAssignedTasks(tasks);

    // Notifications
    const nts = getNotificationsForUser(user.name)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setNotifs(nts);

    // Activities
    const acts = getActivitiesForUser(user.name)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setActivities(acts);
  }

  useEffect(() => {
    loadAll();

    // realtime sync from other tabs
    const onStorage = (e) => {
      if (e.key && e.key.includes("vcc_")) loadAll();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Dashboard</h2>
        <p>Silakan <Link to="/login">login</Link> untuk melihat dashboard.</p>
      </div>
    );
  }

  return (
    <div className="dash-wrap">
      <h1 className="dash-title">Halo, {user.name}</h1>

      <section className="dash-layout">
        <div>
          {/* =========================== */}
          {/* My Projects */}
          {/* =========================== */}
          <div className="box">
            <h3>Proyek yang Kamu Buat ({myProjects.length})</h3>

            {myProjects.length === 0 ? (
              <div className="muted">Belum ada proyek.</div>
            ) : (
              myProjects.map(p => (
                <div 
                  key={p.id} 
                  className="project-card"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <div className="project-title-row">
                    <strong>{p.title}</strong>
                    {p.status === "completed" && (
                      <span className="badge green">Completed</span>
                    )}
                  </div>

                  <div className="muted small">
                    {p.skills?.slice(0, 3).join(", ") || "-"}
                  </div>

                  <ProjectProgress tasks={p.tasks} />
                </div>
              ))
            )}
          </div>

          {/* =========================== */}
          {/* Joined Projects */}
          {/* =========================== */}
          <div className="box" style={{ marginTop: 16 }}>
            <h3>Proyek yang Kamu Ikuti ({joinedProjects.length})</h3>

            {joinedProjects.length === 0 ? (
              <div className="muted">Belum bergabung di proyek.</div>
            ) : (
              joinedProjects.map(p => (
                <div 
                  key={p.id} 
                  className="project-card"
                  onClick={() => navigate(`/project/${p.id}`)}
                >
                  <div className="project-title-row">
                    <strong>{p.title}</strong>
                    {p.status === "completed" && (
                      <span className="badge green">Completed</span>
                    )}
                  </div>

                  <div className="muted small">
                    {p.skills?.slice(0, 3).join(", ") || "-"}
                  </div>

                  <ProjectProgress tasks={p.tasks} />
                </div>
              ))
            )}
          </div>

          {/* =========================== */}
          {/* Assigned Tasks */}
          {/* =========================== */}
          <div className="box" style={{ marginTop: 16 }}>
            <h3>Tugas untuk Kamu ({assignedTasks.length})</h3>

            {assignedTasks.length === 0 ? (
              <div className="muted">Tidak ada tugas.</div>
            ) : (
              assignedTasks.map(t => (
                <div key={t.id} className="task-item-dash">
                  <div className="task-header">
                    <strong>{t.title}</strong>
                    <span className={`badge status-${t.status}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="muted small">{t.description}</div>

                  <div className="muted small" style={{ marginTop: 6 }}>
                    Project:{" "}
                    <Link to={`/project/${t.projectId}`}>
                      {t.projectTitle}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* =========================== */}
          {/* Recent Activities */}
          {/* =========================== */}
          <div className="box" style={{ marginTop: 16 }}>
            <h3>Aktivitas Terbaru</h3>

            {activities.length === 0 ? (
              <div className="muted">Tidak ada aktivitas.</div>
            ) : (
              activities.slice(0, 8).map(a => (
                <div key={a.id} className="activity-item-dash">
                  <div><strong>{a.message}</strong></div>
                  <div className="muted small">
                    {a.type} • {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: 8 }}>
              <Link to="/activity">Lihat semua aktivitas</Link>
            </div>
          </div>
        </div>

        {/* =========================== */}
        {/* Sidebar Notifications */}
        {/* =========================== */}
        <aside className="dash-sidebar">
          <div className="box">
            <h3>Notifikasi Terbaru</h3>

            {notifs.length === 0 ? (
              <div className="muted">Tidak ada notifikasi.</div>
            ) : (
              notifs.slice(0, 6).map(n => (
                <div 
                  key={n.id} 
                  className="notif-item-dash"
                  onClick={() => {
                    if (n.link) navigate(n.link);
                  }}
                >
                  <div className="notif-msg">{n.message}</div>
                  <div className="muted small">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}

            <div style={{ marginTop: 8 }}>
              <Link to="/notifications">Lihat semua notifikasi</Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

/* ============================= */
/* MINI PROGRESS COMPONENT */
/* ============================= */
function ProjectProgress({ tasks }) {
  const total = tasks?.length || 0;
  const done = tasks?.filter(t => t.status === "done").length || 0;

  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="progress-wrap">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: percent + "%" }}></div>
      </div>
      <div className="progress-text">{percent}% selesai</div>
    </div>
  );
}
