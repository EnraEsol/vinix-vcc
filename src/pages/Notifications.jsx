// src/pages/Notifications.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/users";
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsReadForUser,
} from "../utils/storage";
import "./Notifications.css";

export default function Notifications() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [notifs, setNotifs] = useState([]);
  const [filter, setFilter] = useState("all");

  /* ======================================
        LOAD NOTIFS
  ====================================== */
  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = () => {
    if (!user) return setNotifs([]);

    const list = getNotificationsForUser(user.name)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setNotifs(list);
  };

  /* ======================================
        MARK ONE READ
  ====================================== */
  const onMarkRead = (notif) => {
    markNotificationRead(notif.id);
    load();

    if (notif.link) navigate(notif.link);
  };

  /* ======================================
        MARK ALL READ
  ====================================== */
  const onMarkAll = () => {
    markAllNotificationsReadForUser(user.name);
    load();
  };

  /* ======================================
        FILTER LOGIC
  ====================================== */
  const filtered = notifs.filter((n) => {
    if (filter === "all") return true;

    switch (filter) {
      case "project":
        return (
          n.type?.includes("project") ||
          ["invite_sent", "invite_accepted"].includes(n.type)
        );
      case "task":
        return n.type?.includes("task");
      case "member":
        return (
          n.type?.includes("member") ||
          n.type?.includes("applicant")
        );
      case "file":
        return n.type?.includes("file");
      case "chat":
        return n.type?.includes("chat");
      default:
        return true;
    }
  });

  /* ======================================
        IF NOT LOGGED IN
  ====================================== */
  if (!user)
    return (
      <div style={{ marginTop: 80, textAlign: "center" }}>
        Silakan login untuk melihat notifikasi.
      </div>
    );

  /* ======================================
        RENDER UI
  ====================================== */
  return (
    <div className="notif-container">
      <div className="notif-header">
        <h1>Notifikasi</h1>

        <div className="notif-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Semua</option>
            <option value="project">Proyek</option>
            <option value="task">Tugas</option>
            <option value="member">Anggota</option>
            <option value="file">File</option>
            <option value="chat">Chat</option>
          </select>

          <button className="btn small" onClick={onMarkAll}>
            Tandai semua
          </button>
        </div>
      </div>

      <div className="notif-list">
        {filtered.length === 0 ? (
          <div className="muted">Tidak ada notifikasi.</div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`notif-item ${n.read ? "read" : "unread"}`}
              onClick={() => onMarkRead(n)}
            >
              <div className="notif-content">
                <div className="notif-title">{n.message}</div>
                <div className="notif-date">
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>

              <div
                className="notif-actions"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className={`btn small ${n.read ? "ghost" : ""}`}
                  onClick={() => onMarkRead(n)}
                >
                  {n.link ? "Open" : "Mark"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
