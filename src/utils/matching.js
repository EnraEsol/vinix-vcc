// src/utils/matching.js
// Skill Matching Engine (Upgraded Version)
// Lebih akurat, scalable, dan siap dipakai untuk AI-invite-system.

import { loadUsers } from "./users";
import { getProjectById } from "./storage";

/* ============================================================
   MAIN FUNCTION: matchCandidates()
   ============================================================ */
export function matchCandidates(projectOrId, options = {}) {
  const minScore = typeof options.minScore === "number" ? options.minScore : 1;
  let project = null;

  if (!projectOrId) return [];
  project =
    typeof projectOrId === "string"
      ? getProjectById(projectOrId)
      : projectOrId;

  if (!project) return [];

  const requiredSkills = Array.isArray(project.skills)
    ? project.skills
    : [];

  const allUsers = loadUsers();

  const candidates = allUsers
    .filter((u) => {
      if (!u) return false;
      if (u.name === project.owner) return false;
      if (u.email === project.ownerEmail) return false;
      return true;
    })
    .map((u) => scoreUserForProject(u, requiredSkills, project))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return candidates;
}

/* ============================================================
   SCORE CALCULATION WRAPPER
   ============================================================ */
function scoreUserForProject(user, requiredSkills, project) {
  const userSkills = user.skills || [];
  const userBadges = user.badges || [];
  const userExps = user.experiences || [];

  const {
    score,
    matchedSkills,
    matchedBadges,
    matchedExperience,
    relevanceWeight,
  } = calculateMatchScore(requiredSkills, userSkills, userBadges, userExps);

  const reasons = buildReasons(
    matchedSkills,
    matchedBadges,
    matchedExperience,
    score,
    relevanceWeight
  );

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    user,
    score,
    matchedSkills,
    matchedBadges,
    matchedExperience,
    reasons,
  };
}

/* ============================================================
   SCORE CALCULATION ENGINE (IMPROVED)
   ============================================================ */
/**
 * Weight:
 *  Skill = +12
 *  Badge = +6
 *  Experience = +4
 *  Skill-Level Multiplier (future-ready)
 *  Bonus multi-skill = +4
 */
export function calculateMatchScore(
  requiredSkills = [],
  userSkills = [],
  userBadges = [],
  userExps = []
) {
  let score = 0;

  const matchedSkills = [];
  const matchedBadges = [];
  const matchedExperience = [];

  const reqLow = requiredSkills.map((s) =>
    s.toString().toLowerCase().trim()
  );

  // --- SKILL MATCH ---
  for (const skill of userSkills) {
    const sLow = skill.toString().toLowerCase().trim();
    if (reqLow.includes(sLow)) {
      matchedSkills.push(skill);
      score += 12;
    }
  }

  // --- BADGE MATCH ---
  for (const badge of userBadges) {
    const bLow = badge.toString().toLowerCase();

    for (const r of reqLow) {
      if (bLow.includes(r) || r.includes(bLow)) {
        if (!matchedBadges.includes(badge)) {
          matchedBadges.push(badge);
          score += 6;
        }
      }
    }
  }

  // --- EXPERIENCE MATCH ---
  for (const exp of userExps) {
    const text = `${exp.title || ""} ${exp.role || ""}`.toLowerCase();
    for (const r of reqLow) {
      if (r && text.includes(r)) {
        matchedExperience.push(exp);
        score += 4;
        break;
      }
    }
  }

  // --- ADDITIONAL RELEVANCE MULTIPLIER ---
  const relevanceWeight = 1 + matchedSkills.length * 0.1;
  score *= relevanceWeight;

  // --- BONUS multi-skill ---
  const totalMatchCount =
    matchedSkills.length +
    matchedBadges.length +
    matchedExperience.length;

  if (totalMatchCount >= 3) {
    score += 4;
  }

  return {
    score,
    matchedSkills,
    matchedBadges,
    matchedExperience,
    relevanceWeight,
  };
}

/* ============================================================
   REASONS BUILDER
   ============================================================ */
function buildReasons(
  matchedSkills,
  matchedBadges,
  matchedExperience,
  score,
  relevanceWeight
) {
  const reasons = [];

  if (matchedSkills.length)
    reasons.push(
      `Skill cocok: ${matchedSkills.slice(0, 5).join(", ")}`
    );

  if (matchedBadges.length)
    reasons.push(
      `Badge relevan: ${matchedBadges.slice(0, 5).join(", ")}`
    );

  if (matchedExperience.length) {
    const summarised = matchedExperience
      .map((e) => e.title || e.role || "pengalaman")
      .slice(0, 3)
      .join("; ");
    reasons.push(`Pengalaman terkait: ${summarised}`);
  }

  reasons.push(`Relevansi +${((relevanceWeight - 1) * 100).toFixed(0)}%`);
  reasons.push(`Total Score: ${Math.round(score)}`);

  return reasons;
}

/* ============================================================
   TOP N CANDIDATES
   ============================================================ */
export function topCandidates(projectOrId, n = 5, options = {}) {
  return matchCandidates(projectOrId, options).slice(0, n);
}

/* ============================================================
   NEW: matchUserToProject
   - Mengembalikan object terstruktur untuk user tertentu:
     { scoreRaw, scorePercent, category, matchedSkills, matchedBadges, matchedExperience, reasons }
   - Normalisasi: karena `score` bersifat relatif (bergantung jumlah skill dan badge),
     kita melakukan perkiraan maximum score untuk normalisasi agar menghasilkan 0-100%.
   - Pendekatan normalisasi bersifat heuristik (praktis & cukup akurat untuk UI).
   ============================================================ */
export function matchUserToProject(projectOrId, user) {
  if (!projectOrId || !user) return null;
  const project =
    typeof projectOrId === "string" ? getProjectById(projectOrId) : projectOrId;
  if (!project) return null;

  const requiredSkills = Array.isArray(project.skills) ? project.skills : [];
  const userSkills = user.skills || [];
  const userBadges = user.badges || [];
  const userExps = user.experiences || [];

  const calc = calculateMatchScore(requiredSkills, userSkills, userBadges, userExps);
  const scoreRaw = calc.score || 0;

  // Heuristic for normalization:
  // - maxSkillScore = requiredSkills.length * 12
  // - potential badge + exp bonus approx = requiredSkills.length * (6 + 4) but cap reasonably
  // - relevance multiplier can increase score, so we multiply base possible by 1.5
  const maxSkillScore = Math.max(requiredSkills.length * 12, 1);
  const estBonus = Math.min(requiredSkills.length * 10, 40); // caps bonus influence
  const theoreticalMax = (maxSkillScore + estBonus) * 1.5 + 4; // +4 for multi-skill bonus
  const scorePercent = Math.min(100, Math.round((scoreRaw / theoreticalMax) * 100));

  // category
  let category = "Kurang Cocok";
  if (scorePercent >= 80) category = "Sangat Cocok";
  else if (scorePercent >= 50) category = "Cocok";

  // reasons (reuse builder but make copy)
  const reasons = buildReasons(calc.matchedSkills, calc.matchedBadges, calc.matchedExperience, scoreRaw, calc.relevanceWeight);

  return {
    scoreRaw,
    scorePercent,
    category,
    matchedSkills: calc.matchedSkills,
    matchedBadges: calc.matchedBadges,
    matchedExperience: calc.matchedExperience,
    reasons,
  };
}
