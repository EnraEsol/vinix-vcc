// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";

// AUTH
import Login from "./pages/Login";
import Register from "./pages/Register";

// MAIN PAGES
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CreateProject from "./pages/CreateProject";
import ProjectDetail from "./pages/ProjectDetail";

// PROFILE SYSTEM
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";

// INVITATIONS PAGE
import Invitations from "./pages/Invitations";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Home / Landing */}
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Projects */}
        <Route path="/explore" element={<Explore />} />
        <Route path="/create" element={<CreateProject />} />
        <Route path="/project/:id" element={<ProjectDetail />} />

        {/* Profile */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/u/:name" element={<PublicProfile />} />

        {/* Invitations */}
        <Route path="/invitations" element={<Invitations />} />
      </Routes>
    </>
  );
}
