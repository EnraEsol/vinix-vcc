// src/utils/storage.js
const STORAGE_KEY = "projects_vcc_v1";

/* ---------- basic persistence ---------- */
export function loadProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {}
}

/* ---------- helpers ---------- */
export function getProjectById(id) {
  const all = loadProjects();
  return all.find((p) => p.id === id);
}

export function createProject(project) {
  const all = loadProjects();
  const updated = [project, ...all];
  saveProjects(updated);
  return project.id;
}

export function updateProject(updatedProject) {
  const all = loadProjects();
  const newAll = all.map((p) => (p.id === updatedProject.id ? updatedProject : p));
  saveProjects(newAll);
  return newAll;
}

/* ---------- applicants (apply) ---------- */
export function addApplicant(projectId, applicant) {
  const p = getProjectById(projectId);
  if (!p) return false;
  const applicants = Array.isArray(p.applicants) ? [...p.applicants, applicant] : [applicant];
  const updated = { ...p, applicants };
  updateProject(updated);
  return true;
}

export function acceptApplicant(projectId, applicantId) {
  const p = getProjectById(projectId);
  if (!p) return false;
  const applicants = Array.isArray(p.applicants) ? p.applicants.slice() : [];
  const idx = applicants.findIndex((a) => a.id === applicantId);
  if (idx === -1) return false;

  const applicant = { ...applicants[idx], status: "accepted", acceptedAt: new Date().toISOString() };

  const memberObj = {
    name: applicant.name,
    joinedAt: new Date().toISOString(),
    portfolio: applicant.portfolio || [],
    files: applicant.files || [],
  };

  const members = Array.isArray(p.members) ? [...p.members, memberObj] : [memberObj];

  applicants.splice(idx, 1);

  const updated = { ...p, applicants, members };
  updateProject(updated);
  return true;
}

export function rejectApplicant(projectId, applicantId) {
  const p = getProjectById(projectId);
  if (!p) return false;
  const applicants = Array.isArray(p.applicants)
    ? p.applicants.filter((a) => a.id !== applicantId)
    : [];
  const updated = { ...p, applicants };
  updateProject(updated);
  return true;
}

/* ---------- chat ---------- */
export function addMessage(projectId, message) {
  const p = getProjectById(projectId);
  if (!p) return false;
  const messages = Array.isArray(p.messages) ? [...p.messages, message] : [message];
  const updated = { ...p, messages };
  updateProject(updated);
  return true;
}

/* ---------- INVITE SYSTEM ---------- */
export function sendInvite(projectId, inviteObj) {
  const p = getProjectById(projectId);
  if (!p) return false;
  const invites = Array.isArray(p.invites) ? [...p.invites, inviteObj] : [inviteObj];
  const updated = { ...p, invites };
  updateProject(updated);
  return true;
}

export function acceptInvite(projectId, inviteId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const invites = Array.isArray(p.invites) ? [...p.invites] : [];
  const idx = invites.findIndex((inv) => inv.id === inviteId);
  if (idx === -1) return false;

  invites[idx] = { ...invites[idx], status: "accepted", respondedAt: new Date().toISOString() };

  const memberObj = {
    name: invites[idx].toName,
    joinedAt: new Date().toISOString(),
    portfolio: invites[idx].portfolio || [],
    files: invites[idx].files || [],
  };

  const members = Array.isArray(p.members) ? [...p.members, memberObj] : [memberObj];

  const updated = { ...p, invites, members };
  updateProject(updated);
  return true;
}

export function rejectInvite(projectId, inviteId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const invites = Array.isArray(p.invites) ? [...p.invites] : [];
  const idx = invites.findIndex((inv) => inv.id === inviteId);

  if (idx === -1) return false;

  invites[idx] = { ...invites[idx], status: "rejected", respondedAt: new Date().toISOString() };

  const updated = { ...p, invites };
  updateProject(updated);
  return true;
}

export function getInvitationsForUser(userName) {
  const all = loadProjects();
  const out = [];

  all.forEach((p) => {
    (p.invites || []).forEach((inv) => {
      if (inv.toName === userName) {
        out.push({
          ...inv,
          projectTitle: p.title,
          projectId: p.id,
          projectOwner: p.owner,
        });
      }
    });
  });

  return out;
}

/* =====================================================
                TASK SYSTEM (NEW)
===================================================== */

export function addTask(projectId, taskObj) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = Array.isArray(p.tasks) ? [...p.tasks, taskObj] : [taskObj];
  const updated = { ...p, tasks };
  updateProject(updated);
  return true;
}

export function updateTask(projectId, updatedTask) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = Array.isArray(p.tasks) ? p.tasks.slice() : [];
  const newTasks = tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));

  const updated = { ...p, tasks: newTasks };
  updateProject(updated);
  return true;
}

export function deleteTask(projectId, taskId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).filter((t) => t.id !== taskId);
  const updated = { ...p, tasks };
  updateProject(updated);
  return true;
}

export function changeTaskStatus(projectId, taskId, newStatus) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).map((t) =>
    t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
  );

  const updated = { ...p, tasks };
  updateProject(updated);
  return true;
}

export function assignTask(projectId, taskId, memberName) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).map((t) =>
    t.id === taskId ? { ...t, assignedTo: memberName, updatedAt: new Date().toISOString() } : t
  );

  const updated = { ...p, tasks };
  updateProject(updated);
  return true;
}

/* =====================================================
                FILE SHARING SYSTEM (NEW)
===================================================== */

export function addProjectFile(projectId, fileObj) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const files = Array.isArray(p.files) ? [...p.files, fileObj] : [fileObj];
  const updated = { ...p, files };
  updateProject(updated);
  return true;
}

export function deleteProjectFile(projectId, fileId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const files = (p.files || []).filter((f) => f.id !== fileId);
  const updated = { ...p, files };
  updateProject(updated);
  return true;
}

export function getProjectFiles(projectId) {
  const p = getProjectById(projectId);
  return p?.files || [];
}
