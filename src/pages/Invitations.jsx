// src/pages/Invitations.jsx
import { useEffect, useState } from "react";
import { getCurrentUser } from "../utils/users";
import {
  getInvitationsForUser,
  acceptInvite,
  rejectInvite,
  loadProjects,
  acceptApplicant,
  rejectApplicant
} from "../utils/storage";
import { Link } from "react-router-dom";
import "./Invitations.css";

export default function Invitations() {
  const user = getCurrentUser();
  const [invites, setInvites] = useState([]);
  const [ownedProjects, setOwnedProjects] = useState([]); // untuk pelamar

  useEffect(() => {
    if (!user) return;

    // 1. Ambil undangan masuk
    setInvites(getInvitationsForUser(user.name));

    // 2. Ambil project yang user miliki untuk melihat pelamar
    const allProjects = loadProjects();
    setOwnedProjects(allProjects.filter((p) => p.owner === user.name));
  }, [user]);

  if (!user) {
    return (
      <div className="inv-container">
        <h2>Kamu belum login</h2>
      </div>
    );
  }

  // ======================
  // FUNGSI UNDANGAN MASUK
  // ======================
  const handleAccept = (inv) => {
    const ok = acceptInvite(inv.projectId, inv.id);
    if (!ok) return alert("Gagal menerima undangan.");

    alert("Kamu berhasil bergabung ke project!");
    setInvites((s) =>
      s.map((x) =>
        x.id === inv.id ? { ...x, status: "accepted" } : x
      )
    );
  };

  const handleReject = (inv) => {
    const ok = rejectInvite(inv.projectId, inv.id);
    if (!ok) return alert("Gagal menolak undangan.");

    setInvites((s) =>
      s.map((x) =>
        x.id === inv.id ? { ...x, status: "rejected" } : x
      )
    );
  };

  // ======================
  // FUNGSI PELAMAR PROJECT KITA
  // ======================
  const handleApplicant = (projectId, applicant, decision) => {
    if (decision === "accept") {
      acceptApplicant(projectId, applicant.name);
    } else {
      rejectApplicant(projectId, applicant.name);
    }

    // refresh project owner
    const all = loadProjects();
    setOwnedProjects(all.filter((p) => p.owner === user.name));
  };

  return (
    <div className="inv-container">
      <h1>Invitations & Applicants</h1>

      {/* =============================================================
          A. UNDANGAN MASUK (untuk user ini)
      ============================================================= */}
      <section className="inv-section">
        <h2>Undangan Masuk</h2>

        {invites.length === 0 && (
          <div className="empty">Tidak ada undangan.</div>
        )}

        {invites.map((inv) => (
          <div key={inv.id} className="inv-card">
            <div className="inv-left">
              <h3>
                Undangan ke proyek:{" "}
                <Link to={`/project/${inv.projectId}`}>
                  {inv.projectTitle || "Project"}
                </Link>
              </h3>

              <div className="info">
                <strong>Role:</strong> {inv.role}
              </div>

              <div className="info">
                <strong>Pesan:</strong> {inv.message}
              </div>

              <div className="meta">
                Dari: {inv.invitedBy}
              </div>
            </div>

            <div className="inv-right">
              {inv.status === "pending" ? (
                <>
                  <button
                    className="btn small"
                    onClick={() => handleAccept(inv)}
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
                <span className={`badge ${inv.status}`}>
                  {inv.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* =============================================================
          B. LAMARAN MASUK (khusus owner project)
      ============================================================= */}
      <section className="inv-section">
        <h2>Lamaran Masuk ke Proyek Kamu</h2>

        {ownedProjects.length === 0 && (
          <div className="empty">Kamu tidak memiliki proyek.</div>
        )}

        {ownedProjects.map((p) => (
          <div key={p.id} className="owner-project">
            <h3>{p.title}</h3>

            {(p.applicants || []).length === 0 ? (
              <div className="empty small">Belum ada pelamar.</div>
            ) : (
              p.applicants.map((ap) => (
                <div key={ap.id} className="app-card">
                  <div className="app-left">
                    <strong>{ap.name}</strong>
                    <p>{ap.message}</p>
                    <span className="meta">
                      {new Date(ap.date).toLocaleString()}
                    </span>
                  </div>

                  <div className="app-right">
                    {ap.status === "pending" ? (
                      <>
                        <button
                          className="btn small"
                          onClick={() =>
                            handleApplicant(p.id, ap, "accept")
                          }
                        >
                          ✔ Terima
                        </button>
                        <button
                          className="btn small ghost"
                          onClick={() =>
                            handleApplicant(p.id, ap, "reject")
                          }
                        >
                          ✖ Tolak
                        </button>
                      </>
                    ) : (
                      <span className={`badge ${ap.status}`}>
                        {ap.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
