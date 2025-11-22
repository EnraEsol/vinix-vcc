// src/pages/Home.jsx
import "./Home.css";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">

      {/* ===== HERO SECTION ===== */}
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

      {/* ===== INTRO SECTION ===== */}
      <div className="main-section">
        <h2 className="main-title">Vinix Co-Create (VCC)</h2>
        <p className="main-desc">
          Platform kolaborasi untuk menemukan partner, membentuk tim, dan membangun proyek
          secara bersama-sama. Cocok untuk mahasiswa, kreator, dan calon founder startup.
        </p>
        <Link to="/explore" className="main-btn">Mulai Cari Kolaborator</Link>
      </div>

      {/* ===== RECOMMENDED SECTION ===== */}
      <section className="recommended-section">
        <div className="recommended-wrapper">
          <h2 className="recommended-title">Proyek yang Sedang Ramai</h2>

          <div className="recommended-grid">
            <div className="recommend-card">
              <h4>Aplikasi Absensi Mahasiswa</h4>
              <p className="recommend-desc">
                Membutuhkan Frontend dan Backend Developer untuk membuat platform absensi digital.
              </p>
              <div className="recommend-tags">
                <span className="recommend-tag">React</span>
                <span className="recommend-tag">Node.js</span>
                <span className="recommend-tag">UI/UX</span>
              </div>
              <Link to="/explore" className="recommend-btn">Lihat Proyek</Link>
            </div>

            <div className="recommend-card">
              <h4>AI Recommendation System</h4>
              <p className="recommend-desc">
                Proyek machine learning untuk memprediksi minat pengguna.
              </p>
              <div className="recommend-tags">
                <span className="recommend-tag">Python</span>
                <span className="recommend-tag">TensorFlow</span>
              </div>
              <Link to="/explore" className="recommend-btn">Lihat Proyek</Link>
            </div>

            <div className="recommend-card">
              <h4>Branding UMKM Kuliner</h4>
              <p className="recommend-desc">
                Mencari kreator konten & graphic designer untuk rebranding bisnis kuliner.
              </p>
              <div className="recommend-tags">
                <span className="recommend-tag">Design</span>
                <span className="recommend-tag">Marketing</span>
              </div>
              <Link to="/explore" className="recommend-btn">Lihat Proyek</Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
