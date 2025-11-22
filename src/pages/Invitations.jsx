// src/pages/Invitations.jsx
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/users";
import {
  getInvitationsForUser,
  acceptInvite,
  rejectInvite,
} from "../utils/storage";
import { Link } from "react-router-dom";

export default function Invitations() {
  const user = getCurrentUser();
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    if (user) {
      const list = getInvitationsForUser(user.name);
      setInvites(list);
    }
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Kamu belum login</h2>
      </div>
    );
  }

  const handleAccept = (inv) => {
    const ok = acceptInvite(inv.projectId, inv.id);
    if (ok) {
      alert("Kamu berhasil bergabung ke project!");
      setInvites((s) =>
        s.map((x) => (x.id === inv.id ? { ...x, status: "accepted" } : x))
      );
    } else alert("Gagal menerima undangan.");
  };

  const handleReject = (inv) => {
    const ok = rejectInvite(inv.projectId, inv.id);
    if (ok) {
      setInvites((s) =>
        s.map((x) => (x.id === inv.id ? { ...x, status: "rejected" } : x))
      );
    } else alert("Gagal menolak undangan.");
  };

  return (
    <div style={{ padding: 20, maxWidth: 700, margin: "0 auto" }}>
      <h1>Undangan Masuk</h1>

      {invites.length === 0 && <div className="muted">Tidak ada undangan.</div>}

      {invites.map((inv) => (
        <div
          key={inv.id}
          style={{
            padding: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Undangan ke proyek:{" "}
            <Link to={`/project/${inv.projectId}`}>{inv.projectTitle}</Link>
          </h3>

          <div style={{ marginTop: 6 }}>
            <strong>Role:</strong> {inv.role}
          </div>

          <div style={{ marginTop: 4 }}>
            <strong>Pesan:</strong> {inv.message}
          </div>

          <div style={{ marginTop: 6, fontSize: 13, color: "#6b7280" }}>
            Dari: {inv.invitedBy}
          </div>

          <div style={{ marginTop: 10 }}>
            {inv.status === "pending" ? (
              <>
                <button
                  className="btn small"
                  onClick={() => handleAccept(inv)}
                  style={{ marginRight: 8 }}
                >
                  Terima
                </button>
                <button
                  className="btn small ghost"
                  onClick={() => handleReject(inv)}
                >
                  Tolak
                </button>
              </>
            ) : (
              <span
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  background:
                    inv.status === "accepted" ? "#10b981" : "#ef4444",
                  color: "white",
                  fontSize: 13,
                }}
              >
                {inv.status.toUpperCase()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
