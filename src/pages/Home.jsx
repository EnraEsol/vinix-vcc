// src/pages/Home.jsx
import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import HeroCard from "../components/HeroCard";
import { loadProjects, onVccUpdate } from "../utils/storage";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  /* ===========================================================
     1) Refresh function (dipakai ulang)
  ============================================================ */
  const refresh = useCallback(() => {
    const all = loadProjects() || [];
    setProjects(all);
  }, []);

  /* ===========================================================
     2) Initial load + realtime listener
  ============================================================ */
  useEffect(() => {
    refresh(); // initial load

    // Listen dari storage system (realtime update)
    const unsub = onVccUpdate(() => refresh());

    // Fallback listener localStorage
    const storageHandler = () => refresh();
    window.addEventListener("storage", storageHandler);

    return () => {
      unsub();
      window.removeEventListener("storage", storageHandler);
    };
  }, [refresh]);

  /* ===========================================================
     3) HOT PROJECTS (3 terbaru)
  ============================================================ */
  const hot = [...projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 3);

  return (
    <div className="home">

      {/* HERO CARD */}
      <HeroCard />

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-content">
          <h1>
            Kolaborasi <span className="gradient-text">Tanpa Batas</span>
          </h1>

          <p>
            Temukan partner, kolaborator, dan tim berbakat dari seluruh peserta Vinix
            untuk membangun proyek, startup, hingga bisnis inovatif bersama.
          </p>

          <div className="hero-buttons">
            <Link to="/explore" className="hero-btn primary">
              Mulai Cari Kolaborator
            </Link>
            <Link to="/create" className="hero-btn secondary">
              Buat Proyek
            </Link>
          </div>
        </div>

        <div className="hero-illustration">
          <img src="/logohero.svg" alt="Hero Illustration" />
        </div>
      </section>

      {/* MAIN SECTION */}
      <div className="main-section">
        <h2 className="main-title">Vinix Co-Create (VCC)</h2>
        <p className="main-desc">
          Platform kolaborasi untuk menemukan partner, membentuk tim, dan membangun proyek
          secara bersama-sama. Cocok untuk mahasiswa, kreator, dan calon founder startup.
        </p>

        <Link to="/explore" className="main-btn">
          Mulai Cari Kolaborator
        </Link>
      </div>

      {/* RECOMMENDED PROJECTS */}
      <section className="recommended-section">
        <div className="recommended-wrapper">
          <h2 className="recommended-title">Proyek yang Sedang Ramai</h2>

          <div className="recommended-grid">
            {hot.length === 0 ? (
              <div style={{ textAlign: "center", width: "100%" }}>
                <p className="muted">Belum ada proyek dibuat.</p>
              </div>
            ) : (
              hot.map((p) => (
                <div className="recommend-card" key={p.id}>
                  <h4>{p.title}</h4>

                  <p className="recommend-desc">
                    {p.description?.slice(0, 120) || "Tidak ada deskripsi."}
                  </p>

                  <div className="recommend-tags">
                    {(p.skills || []).slice(0, 4).map((s, i) => (
                      <span key={i} className="recommend-tag">
                        {s}
                      </span>
                    ))}
                  </div>

                  <button
                    className="recommend-btn"
                    onClick={() => navigate(`/project/${p.id}`)}
                  >
                    Lihat Proyek
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
