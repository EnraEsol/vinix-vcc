// src/utils/recommend.js
// Utility sederhana untuk merekomendasikan proyek berbasis skills & metadata.
// Tidak bergantung pada library eksternal.

import { loadProjects } from "./storage"; // sesuaikan jika utilmu di tempat lain

// Ambil profil user dari localStorage (key: vinix_user_profile)
// Struktur contoh:
// { name: "User Demo", skills: ["React","UI/UX"], interests: ["web","startup"] }
export function getUserProfile() {
  try {
    const raw = localStorage.getItem("vinix_user_profile");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Simpel scoring:
// - skillMatchScore = #matchingSkills / #userSkills (0..1) * 0.7
// - recencyScore = normalized age weight (0..1) * 0.2
// - needScore = normalized (1 - membersCountFactor) * 0.1
// finalScore = weighted sum
function scoreProjectForUser(project, user) {
  const userSkills = Array.isArray(user?.skills) ? user.skills : [];
  const projectSkills = Array.isArray(project?.skills) ? project.skills : [];

  // Skill overlap
  const matches = projectSkills.filter((s) =>
    userSkills.some((us) => us.toLowerCase() === s.toLowerCase())
  ).length;

  const skillMatchRatio = userSkills.length ? matches / userSkills.length : 0;

  // recency: newer projects score higher
  const createdAt = project?.createdAt ? new Date(project.createdAt).getTime() : 0;
  const now = Date.now();
  const ageDays = (now - createdAt) / (1000 * 60 * 60 * 24);
  // convert to recencyScore: less days -> higher score; clamp using exponential-ish
  const recencyScore = Math.max(0, 1 - Math.min(ageDays / 90, 1)); // 0..1 scaled over 90 days

  // needScore: projects with fewer members get slightly higher score
  const membersCount = Array.isArray(project?.members) ? project.members.length : 0;
  // assume typical team size 0..8, normalize
  const needScore = 1 - Math.min(membersCount / 8, 1);

  // weights
  const wSkill = 0.7;
  const wRecency = 0.2;
  const wNeed = 0.1;

  const final =
    skillMatchRatio * wSkill + recencyScore * wRecency + needScore * wNeed;

  return {
    score: final,
    matches,
    skillMatchRatio,
    recencyScore,
    needScore,
  };
}

// Public function
// options: {limit: number, minScore: number, includeOwnProjects: bool}
export function recommendProjectsForUser(options = {}) {
  const { limit = 6, minScore = 0.05, includeOwnProjects = false } = options;
  const user = getUserProfile();
  const projects = Array.isArray(loadProjects()) ? loadProjects() : [];

  if (!user || !user.skills || user.skills.length === 0) {
    // fallback: recommend newest projects
    return projects
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
      .map((p) => ({ project: p, score: 0 }));
  }

  const scored = projects
    .filter((p) => {
      // optionally exclude projects the user already owns or is a member of
      if (!includeOwnProjects) {
        if ((p.owner || "").toLowerCase() === (user.name || "").toLowerCase()) return false;
        if (Array.isArray(p.members) && p.members.some((m) => (m.name || "").toLowerCase() === (user.name || "").toLowerCase())) return false;
      }
      return true;
    })
    .map((p) => {
      const meta = scoreProjectForUser(p, user);
      return { project: p, ...meta };
    })
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
