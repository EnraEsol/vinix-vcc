// src/utils/recommend.js
// ============================================================
// PROJECT RECOMMENDATION ENGINE (Enhanced Version)
// Menggunakan skill match, recency, dan team-size need scoring
// ============================================================

import { loadProjects } from "./storage";

/* ------------------------------------------------------------
   GET USER PROFILE
   Format tersimpan:
   {
     name: "User Demo",
     skills: ["React", "UI/UX"],
     interests: ["web", "startup"]
   }
------------------------------------------------------------ */
export function getUserProfile() {
  try {
    const raw = localStorage.getItem("vinix_user_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------
   SCORING FUNCTION (Skill + Recency + Need)
   WEIGHTS:
   - Skills 70%
   - Recency 20%
   - Member-need 10%
------------------------------------------------------------ */
function scoreProjectForUser(project, user) {
  const userSkills = Array.isArray(user?.skills) ? user.skills : [];
  const projectSkills = Array.isArray(project?.skills) ? project.skills : [];

  /* -----------------------------
     1. SKILL MATCH (0..1)
  ------------------------------ */
  const matches = projectSkills.filter((s) =>
    userSkills.some((us) => us.toLowerCase().trim() === s.toLowerCase().trim())
  ).length;

  const skillMatchRatio =
    userSkills.length > 0 ? matches / userSkills.length : 0;

  /* -----------------------------
     2. RECENCY SCORE (freshness)
     New = score tinggi
     Old = score turun
  ------------------------------ */
  const createdAt = project?.createdAt
    ? new Date(project.createdAt).getTime()
    : 0;
  const ageDays = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);

  // Normalize: 0 days → 1.0 | > 90 days → 0
  const recencyScore = Math.max(0, 1 - Math.min(ageDays / 90, 1));

  /* -----------------------------
     3. NEED SCORE (0..1)
     Semakin sedikit member → score makin tinggi
  ------------------------------ */
  const membersCount = Array.isArray(project?.members)
    ? project.members.length
    : 0;

  // Normalisasi: typical 0..8
  const needScore = 1 - Math.min(membersCount / 8, 1);

  /* -----------------------------
     FINAL WEIGHT
  ------------------------------ */
  const finalScore =
    skillMatchRatio * 0.7 + recencyScore * 0.2 + needScore * 0.1;

  return {
    score: finalScore,
    matches,
    skillMatchRatio,
    recencyScore,
    needScore,
  };
}

/* ------------------------------------------------------------
   MAIN RECOMMENDER FUNCTION
------------------------------------------------------------ */
export function recommendProjectsForUser(options = {}) {
  const {
    limit = 6,
    minScore = 0.05,
    includeOwnProjects = false,
  } = options;

  const user = getUserProfile();
  const allProjects = loadProjects() || [];

  /* ------------------------------------------------------------
     FALLBACK → Jika user belum punya skill
     Tampilkan proyek terbaru (bukan random)
  ------------------------------------------------------------ */
  if (!user?.skills || user.skills.length === 0) {
    return allProjects
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, limit)
      .map((p) => ({
        project: p,
        score: 0,
        matches: 0,
        skillMatchRatio: 0,
        recencyScore: 0,
        needScore: 0,
      }));
  }

  /* ------------------------------------------------------------
     MAIN SCORING PIPELINE
  ------------------------------------------------------------ */
  const userLower = user.name?.toLowerCase() || "";

  const scored = allProjects
    .filter((p) => {
      if (!includeOwnProjects) {
        // tidak rekomendasikan proyek sendiri
        if ((p.owner || "").toLowerCase() === userLower) return false;

        // tidak rekomendasikan proyek yg sudah diikuti
        if (
          Array.isArray(p.members) &&
          p.members.some(
            (m) => (m.name || "").toLowerCase() === userLower
          )
        )
          return false;
      }
      return true;
    })
    .map((p) => {
      const meta = scoreProjectForUser(p, user);
      return {
        project: p,
        ...meta,
      };
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
}
