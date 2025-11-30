// src/pages/Activity.jsx
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/users";
import { getActivitiesForUser } from "../utils/storage"; 
import { useNavigate } from "react-router-dom";
import "./Activity.css";

export default function Activity() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (user) {
      const list = getActivitiesForUser(user.name) || [];
      setActivities(list);
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ marginTop: 80, textAlign: "center" }}>
        Silakan login untuk melihat aktivitas.
      </div>
    );
  }

  const filtered = activities.filter((a) => {
    if (filter === "all") return true;

    if (filter === "project") return a.type?.includes("project");
    if (filter === "task") return a.type?.includes("task");
    if (filter === "member") return a.type?.includes("member");
    if (filter === "file") return a.type?.includes("file");
    if (filter === "chat") return a.type?.includes("chat");
    if (filter === "applicant") return a.type?.includes("applicant");
    if (filter === "invite") return a.type?.includes("invite");

    return true;
  });

  return (
    <div className="activity-page">
      <div className="activity-header">
        <h1>Activity Feed</h1>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="activity-filter"
        >
          <option value="all">Semua</option>
          <option value="project">Project</option>
          <option value="task">Task</option>
          <option value="member">Member</option>
          <option value="file">File</option>
          <option value="chat">Chat</option>
          <option value="invite">Invite</option>
          <option value="applicant">Applicant</option>
        </select>
      </div>

      <div className="activity-list">
        {filtered.length === 0 ? (
          <div className="muted">Tidak ada aktivitas.</div>
        ) : (
          filtered.map((a) => (
            <div
              className="activity-item"
              key={a.id}
              onClick={() => {
                if (a.projectId) navigate(`/project/${a.projectId}`);
              }}
            >
              <div className="activity-msg">{a.message}</div>
              <div className="activity-meta">
                <span>{a.type}</span>
                <span>• {new Date(a.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
