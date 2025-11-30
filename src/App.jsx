// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

// AUTH
import Login from "./pages/Login";
import Register from "./pages/Register";
import Activity from "./pages/Activity";

// MAIN PAGES
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";
import EditProject from "./pages/EditProject";
import Compare from "./pages/Compare";
import Saved from "./pages/Saved";
import EditProfile from "./pages/EditProfile";

// NOTIFICATIONS
import Notifications from "./pages/Notifications";

// PROFILE
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

// INVITATIONS
import Invitations from "./pages/Invitations";

// Dashboard
import Dashboard from "./pages/Dashboard";
import RecommendedProjects from "./pages/RecommendedProjects";
import Search from "./pages/Search";

import "./Ads.css"; // ⭐🏻 File CSS banner iklan


export default function App() {
  return (
    <>
      {/* GLOBAL NAVBAR */}
      <Navbar />

      {/* ⭐ IKLAN KIRI */}
      <div className="vcc-ad-banner vcc-left">
        <a href="https://vinix7.id" target="_blank" rel="noreferrer">
          <div className="ad-inner">
            <h3>VINIX7</h3>
            <p>Platform Kolaborasi Modern</p>
            <span>Mulai Sekarang →</span>
          </div>
        </a>
      </div>

      {/* ⭐ IKLAN KANAN */}
      <div className="vcc-ad-banner vcc-right">
        <a href="https://vinix7.id" target="_blank" rel="noreferrer">
          <div className="ad-inner">
            <h3>Bangun Tim Kamu</h3>
            <p>Kolaborasi cepat & efisien.</p>
            <span>Buka Vinix7 →</span>
          </div>
        </a>
      </div>

      {/* HALAMAN */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/recommended" element={<RecommendedProjects />} />

          {/* AUTH */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* PROJECTS */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/edit-project/:id" element={<EditProject />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />

          {/* PROFILE */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/u/:name" element={<PublicProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/activity" element={<Activity />} />

          {/* COMPARE */}
          <Route path="/compare" element={<Compare />} />

          {/* SAVED */}
          <Route path="/saved" element={<Saved />} />

          {/* INVITATIONS */}
          <Route path="/invitations" element={<Invitations />} />
        </Routes>
      </div>
    </>
  );
}
