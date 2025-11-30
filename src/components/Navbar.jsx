// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/users";
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsReadForUser,
  loadProjects,
} from "../utils/storage";

import SearchModal from "./SearchModal"; // <-- import SearchModal
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  // user sebagai state (tidak dipanggil tiap render)
  const [user, setUser] = useState(() => getCurrentUser());

  const [open, setOpen] = useState(false); // notif dropdown
  const [notifs, setNotifs] = useState([]);
  const [myProjectsCount, setMyProjectsCount] = useState(0);

  // Search modal state
  const [searchOpen, setSearchOpen] = useState(false);

  /* ============================
        LOAD NOTIFICATIONS
     ============================ */
  const loadNotifs = () => {
    if (!user) return setNotifs([]);

    const arr = getNotificationsForUser(user.name);
    setNotifs(
      Array.isArray(arr)
        ? arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        : []
    );
  };

  /* ============================
        LOAD PROJECT COUNT
     ============================ */
  const loadProjectCount = () => {
    if (!user) return setMyProjectsCount(0);

    const projects = loadProjects();
    const count = projects.filter((p) => p.owner === user.name).length;
    setMyProjectsCount(count);
  };

  /* ============================
        INITIAL LOAD
     ============================ */
  useEffect(() => {
    setUser(getCurrentUser()); // sekali di awal
  }, []);

  /* ============================
        LOAD DATA WHEN USER AVAILABLE
     ============================ */
  useEffect(() => {
    if (!user) {
      setNotifs([]);
      setMyProjectsCount(0);
      return;
    }

    loadNotifs();
    loadProjectCount();
  }, [user]);

  /* ============================
        STORAGE LISTENER (SAFE)
     ============================ */
  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || !e.key.startsWith("vcc_")) return;

      loadNotifs();
      loadProjectCount();
      setUser(getCurrentUser()); // refresh user juga
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /* ============================
        KEYBOARD SHORTCUT: "/"
     ============================ */
  useEffect(() => {
    const onKey = (e) => {
      // jika fokus di input/textarea, abaikan
      const tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || (document.activeElement && document.activeElement.isContentEditable)) return;

      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        // ctrl/cmd+k open search (opsional)
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* LEFT - LOGO */}
          <div className="nav-logo">
            <Link to="/" className="logo-img">VCC</Link>
          </div>

          {/* LINKS */}
          <ul className="nav-links">
            <li><Link to="/explore">Explore</Link></li>
            <li><Link to="/create">Create</Link></li>
            <li><Link to="/recommended">Recommended</Link></li>


            <li>
              <Link to="/dashboard">
                Dashboard
                {myProjectsCount > 0 && (
                  <span className="invite-badge">{myProjectsCount}</span>
                )}
              </Link>
            </li>
          </ul>

          {/* RIGHT SIDE */}
          <div className="nav-actions">
            {/* SEARCH ICON */}
            <button
              className="icon-btn"
              title="Search (press / )"
              onClick={() => setSearchOpen(true)}
              style={{ fontSize: 18, padding: "6px 8px", borderRadius: 8, border: "1px solid #eee", background: "transparent", cursor: "pointer" }}
            >
              🔎
            </button>

            {!user ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                {/* NOTIFS */}
                <div className="notif-wrapper" style={{ position: "relative" }}>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      const next = !open;
                      setOpen(next);
                      if (next) loadNotifs();
                    }}
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span className="notif-badge">{unreadCount}</span>
                    )}
                  </button>

                  {open && (
                    <div className="notif-dropdown">
                      <div className="notif-head">
                        <strong>Notifikasi</strong>
                        <button
                          className="ghost small"
                          onClick={() => {
                            markAllNotificationsReadForUser(user.name);
                            loadNotifs();
                          }}
                        >
                          Mark all
                        </button>
                      </div>

                      <div className="notif-list">
                        {notifs.length === 0 && (
                          <div className="muted" style={{ padding: 10 }}>
                            Tidak ada notifikasi.
                          </div>
                        )}

                        {notifs.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`notif-item ${n.read ? "read" : "unread"}`}
                            onClick={() => {
                              markNotificationRead(n.id);
                              if (n.link) navigate(n.link);
                              setOpen(false);
                            }}
                          >
                            <div style={{ fontSize: 13 }}>{n.message}</div>
                            <div className="notif-time">
                              {new Date(n.createdAt).toLocaleString()}
                            </div>
                            {!n.read && <div className="dot-unread" />}
                          </div>
                        ))}
                      </div>

                      <div className="notif-foot">
                        <Link to="/notifications" onClick={() => setOpen(false)}>
                          Lihat semua
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* PROFILE */}
                <Link to={`/u/${user.name}`} className="profile-link">
                  {user.name}
                </Link>

                <button
                  className="btn ghost"
                  onClick={() => {
                    localStorage.removeItem("vcc_current_user");
                    window.location.href = "/";
                  }}
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Search Modal */}
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        navigate={navigate}
      />
    </>
  );
}
