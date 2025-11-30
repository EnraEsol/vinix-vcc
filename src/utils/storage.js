// src/utils/storage.js
// STORAGE SYSTEM VCC (FINAL, COMPACT BUT COMPLETE)

// MAIN KEYS
const STORAGE_KEY = "projects_vcc_v1";
const NOTIF_KEY = "vcc_notifications_v1";
const ACTIVITY_KEY = "vcc_activities_v1";

// Optional badges integration (may be noop if not implemented)
import { awardBadgesForUser } from "./badges";

/* ===========================
   Helper: localStorage wrappers
   =========================== */
function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* ===========================
   Event / pubsub helpers
   =========================== */
function emitUpdate(type = "projects", payload = null) {
  try {
    const ev = new CustomEvent("vcc_update", { detail: { type, payload, ts: Date.now() } });
    window.dispatchEvent(ev);
  } catch {
    // fallback
    try { window.dispatchEvent(new Event("vcc_update")); } catch {}
  }
}

/**
 * Subscribe to storage events.
 * cb receives the CustomEvent (event.detail available)
 * Returns unsubscribe function.
 */
export function onVccUpdate(cb) {
  const handler = (e) => cb(e);
  window.addEventListener("vcc_update", handler);
  return () => window.removeEventListener("vcc_update", handler);
}

/* =====================================================
   PROJECT STORAGE: load/save
===================================================== */
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
    // notify listeners: projects changed
    emitUpdate("projects", { count: Array.isArray(projects) ? projects.length : 0 });
  } catch {}
}

/* =====================================================
   NOTIFICATIONS STORAGE
===================================================== */
export function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIF_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveNotifications(notifs) {
  try {
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs));
    emitUpdate("notifications", { count: Array.isArray(notifs) ? notifs.length : 0 });
  } catch {}
}

export function addNotification(notif) {
  const all = loadNotifications();
  saveNotifications([notif, ...all]);
  return true;
}

export function getNotificationsForUser(userName) {
  if (!userName) return [];
  return loadNotifications()
    .filter((n) => n.toName === userName)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function markNotificationRead(notificationId) {
  const all = loadNotifications();
  const updated = all.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  saveNotifications(updated);
  return true;
}

export function markAllNotificationsReadForUser(userName) {
  const all = loadNotifications();
  const updated = all.map((n) => (n.toName === userName ? { ...n, read: true } : n));
  saveNotifications(updated);
  return true;
}

/* =====================================================
   ACTIVITY SYSTEM
===================================================== */
export function loadActivities() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveActivities(acts) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(acts));
    emitUpdate("activities", { count: Array.isArray(acts) ? acts.length : 0 });
  } catch {}
}

export function addActivity(act) {
  const all = loadActivities();
  const withDefaults = {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    projectId: act.projectId || null,
    type: act.type || "generic",
    message: act.message || "",
    actor: act.actor || null,
    meta: act.meta || null,
    createdAt: act.createdAt || new Date().toISOString(),
  };
  saveActivities([withDefaults, ...all]);
  return true;
}

export function getActivitiesForProject(projectId) {
  if (!projectId) return [];
  return loadActivities().filter((a) => a.projectId === projectId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getActivitiesForUser(userName) {
  if (!userName) return [];
  return loadActivities()
    .filter((a) => a.actor === userName || (a.meta && (a.meta.target === userName || a.meta.toName === userName)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// compatibility helper (some older imports expect this)
export function getAllActivities() {
  return loadActivities();
}

/* =====================================================
   PROJECT HELPERS
===================================================== */
export function getProjectById(id) {
  return loadProjects().find((p) => p.id === id);
}

export function createProject(project) {
  const all = loadProjects();
  saveProjects([project, ...all]);

  // notify owner
  addNotification({
    id: Date.now().toString(),
    toName: project.owner,
    fromName: project.owner,
    projectId: project.id,
    type: "project_created",
    message: `Proyek "${project.title}" berhasil dibuat.`,
    link: `/project/${project.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: project.id,
    type: "project.created",
    message: `Project "${project.title}" created by ${project.owner}`,
    actor: project.owner,
  });

  try { awardBadgesForUser(project.owner, "project_creator"); } catch {}

  return project.id;
}

export function updateProject(updatedProject) {
  const all = loadProjects();
  const newAll = all.map((p) => (p.id === updatedProject.id ? updatedProject : p));
  saveProjects(newAll);

  // notify members (except owner may be notified separately)
  (updatedProject.members || []).forEach((m) => {
    addNotification({
      id: Date.now().toString(),
      toName: m.name,
      fromName: updatedProject.owner,
      projectId: updatedProject.id,
      type: "project_updated",
      message: `Proyek "${updatedProject.title}" diperbarui.`,
      link: `/project/${updatedProject.id}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  addActivity({
    projectId: updatedProject.id,
    type: "project.updated",
    message: `Project "${updatedProject.title}" updated by ${updatedProject.owner}`,
    actor: updatedProject.owner,
  });

  return true;
}

/* =====================================================
   APPLICANTS SYSTEM
   - addApplicant, acceptApplicant, rejectApplicant
===================================================== */
export function addApplicant(projectId, applicant) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const applicants = [...(p.applicants || []), applicant];
  updateProject({ ...p, applicants });

  addNotification({
    id: Date.now().toString(),
    toName: p.owner,
    fromName: applicant.name,
    projectId: p.id,
    type: "new_applicant",
    message: `${applicant.name} melamar di proyek "${p.title}".`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "applicant.added",
    message: `${applicant.name} applied to "${p.title}"`,
    actor: applicant.name,
    meta: { applicantId: applicant.id },
  });

  return true;
}

export function acceptApplicant(projectId, applicantId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const applicants = [...(p.applicants || [])];
  const idx = applicants.findIndex((a) => a.id === applicantId);
  if (idx === -1) return false;

  const applicant = applicants[idx];
  applicants.splice(idx, 1);

  const member = {
    name: applicant.name,
    role: "member",
    joinedAt: new Date().toISOString(),
  };

  updateProject({ ...p, applicants, members: [...(p.members || []), member] });

  addNotification({
    id: Date.now().toString(),
    toName: applicant.name,
    fromName: p.owner,
    projectId: p.id,
    type: "applicant_accepted",
    message: `Lamaran Anda diterima di proyek "${p.title}".`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "applicant.accepted",
    message: `${applicant.name} accepted to project "${p.title}" by ${p.owner}`,
    actor: p.owner,
    meta: { applicantId: applicant.id, memberName: applicant.name },
  });

  return true;
}

export function rejectApplicant(projectId, applicantId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const applicants = (p.applicants || []).filter((a) => a.id !== applicantId);
  updateProject({ ...p, applicants });

  addActivity({
    projectId: p.id,
    type: "applicant.rejected",
    message: `Applicant ${applicantId} rejected in "${p.title}"`,
    actor: p.owner,
    meta: { applicantId },
  });

  return true;
}

/* =====================================================
   CHAT SYSTEM
===================================================== */
export function addMessage(projectId, message) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const messages = [...(p.messages || []), message];
  updateProject({ ...p, messages });

  // notify members except sender
  (p.members || []).forEach((m) => {
    if (m.name !== message.sender) {
      addNotification({
        id: Date.now().toString(),
        toName: m.name,
        fromName: message.sender,
        projectId: p.id,
        type: "chat_message",
        message: `${message.sender} mengirim pesan baru.`,
        link: `/project/${p.id}`,
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
  });

  addActivity({
    projectId: p.id,
    type: "chat.message",
    message: `${message.sender} sent a message in "${p.title}"`,
    actor: message.sender,
    meta: { messageId: message.id },
  });

  return true;
}

/* =====================================================
   INVITATION SYSTEM
===================================================== */
export function sendInvite(projectId, inviteObj) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const invites = [...(p.invites || []), inviteObj];
  updateProject({ ...p, invites });

  addNotification({
    id: Date.now().toString(),
    toName: inviteObj.toName,
    fromName: inviteObj.invitedBy,
    projectId: p.id,
    type: "invite_sent",
    message: `Anda diundang ke proyek "${p.title}".`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "invite.sent",
    message: `${inviteObj.invitedBy} invited ${inviteObj.toName} to "${p.title}"`,
    actor: inviteObj.invitedBy,
    meta: { toName: inviteObj.toName, inviteId: inviteObj.id },
  });

  return true;
}

export function acceptInvite(projectId, inviteId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const invites = [...(p.invites || [])];
  const idx = invites.findIndex((inv) => inv.id === inviteId);
  if (idx === -1) return false;

  const inv = invites[idx];
  invites[idx] = { ...inv, status: "accepted" };

  const newMember = { name: inv.toName, role: "member", joinedAt: new Date().toISOString() };

  updateProject({ ...p, invites, members: [...(p.members || []), newMember] });

  addNotification({
    id: Date.now().toString(),
    toName: p.owner,
    fromName: inv.toName,
    projectId: p.id,
    type: "invite_accepted",
    message: `${inv.toName} menerima undangan proyek "${p.title}".`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "invite.accepted",
    message: `${inv.toName} accepted invite to "${p.title}"`,
    actor: inv.toName,
    meta: { inviteId },
  });

  return true;
}

export function rejectInvite(projectId, inviteId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const invites = (p.invites || []).map((inv) => (inv.id === inviteId ? { ...inv, status: "rejected" } : inv));
  updateProject({ ...p, invites });

  addActivity({
    projectId: p.id,
    type: "invite.rejected",
    message: `Invite ${inviteId} rejected in "${p.title}"`,
    actor: p.owner,
    meta: { inviteId },
  });

  return true;
}

export function getInvitationsForUser(userName) {
  const out = [];
  loadProjects().forEach((p) => {
    (p.invites || []).forEach((inv) => {
      if (inv.toName === userName) {
        out.push({ ...inv, projectId: p.id, projectTitle: p.title, projectOwner: p.owner });
      }
    });
  });
  return out;
}

/* =====================================================
   TASK SYSTEM
===================================================== */
export function addTask(projectId, taskObj) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = [...(p.tasks || []), taskObj];
  updateProject({ ...p, tasks });

  addActivity({
    projectId: p.id,
    type: "task.added",
    message: `${taskObj.title} added to "${p.title}"`,
    actor: taskObj.createdBy || null,
    meta: { taskId: taskObj.id },
  });

  return true;
}

export function updateTask(projectId, updatedTask) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).map((t) => (t.id === updatedTask.id ? updatedTask : t));
  updateProject({ ...p, tasks });

  addActivity({
    projectId: p.id,
    type: "task.updated",
    message: `${updatedTask.title} updated in "${p.title}"`,
    actor: updatedTask.updatedBy || null,
    meta: { taskId: updatedTask.id },
  });

  return true;
}

export function deleteTask(projectId, taskId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).filter((t) => t.id !== taskId);
  updateProject({ ...p, tasks });

  addActivity({
    projectId: p.id,
    type: "task.deleted",
    message: `Task ${taskId} removed from "${p.title}"`,
    actor: null,
    meta: { taskId },
  });

  return true;
}

export function changeTaskStatus(projectId, taskId, newStatus) {
  const p = getProjectById(projectId);
  if (!p) return false;

  let changed = null;
  const tasks = (p.tasks || []).map((t) => {
    if (t.id === taskId) {
      changed = { ...t, status: newStatus };
      return changed;
    }
    return t;
  });

  updateProject({ ...p, tasks });

  if (newStatus === "done" && changed?.assignedTo) {
    try { awardBadgesForUser(changed.assignedTo, "task_finisher"); } catch {}
  }

  addActivity({
    projectId: p.id,
    type: "task.status_changed",
    message: `Task ${taskId} status changed to ${newStatus} in "${p.title}"`,
    actor: changed?.assignedTo || null,
    meta: { taskId, newStatus },
  });

  return true;
}

export function assignTask(projectId, taskId, memberName) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const tasks = (p.tasks || []).map((t) => (t.id === taskId ? { ...t, assignedTo: memberName } : t));
  updateProject({ ...p, tasks });

  addActivity({
    projectId: p.id,
    type: "task.assigned",
    message: `Task ${taskId} assigned to ${memberName} in "${p.title}"`,
    actor: null,
    meta: { taskId, memberName },
  });

  return true;
}

/* =====================================================
   FILE SHARING SYSTEM
===================================================== */
export function addProjectFile(projectId, fileObj) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const files = [...(p.files || []), fileObj];
  updateProject({ ...p, files });

  addActivity({
    projectId: p.id,
    type: "file.added",
    message: `${fileObj.name} uploaded to "${p.title}" by ${fileObj.uploadedBy || "unknown"}`,
    actor: fileObj.uploadedBy || null,
    meta: { fileId: fileObj.id },
  });

  return true;
}

export function deleteProjectFile(projectId, fileId) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const files = (p.files || []).filter((f) => f.id !== fileId);
  updateProject({ ...p, files });

  addActivity({
    projectId: p.id,
    type: "file.deleted",
    message: `File ${fileId} removed from "${p.title}"`,
    actor: null,
    meta: { fileId },
  });

  return true;
}

export function getProjectFiles(projectId) {
  const p = getProjectById(projectId);
  return p?.files || [];
}

/* =====================================================
   MEMBER MANAGEMENT
===================================================== */
export function kickMember(projectId, memberName) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const updatedMembers = (p.members || []).filter((m) => m.name !== memberName);
  updateProject({ ...p, members: updatedMembers });

  addNotification({
    id: Date.now().toString(),
    toName: memberName,
    fromName: p.owner,
    projectId: p.id,
    type: "member_kicked",
    message: `Anda telah dikeluarkan dari proyek "${p.title}" oleh ${p.owner}.`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "member.kicked",
    message: `${memberName} was kicked from "${p.title}" by ${p.owner}`,
    actor: p.owner,
    meta: { memberName },
  });

  return true;
}

export function promoteMember(projectId, memberName) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const updatedMembers = (p.members || []).map((m) => (m.name === memberName ? { ...m, role: "co-owner" } : m));
  updateProject({ ...p, members: updatedMembers });

  updatedMembers.forEach((m) => {
    addNotification({
      id: Date.now().toString(),
      toName: m.name,
      fromName: p.owner,
      projectId: p.id,
      type: "member_promoted",
      message: `${memberName} dipromosikan sebagai Co-Owner di proyek "${p.title}".`,
      link: `/project/${p.id}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  addActivity({
    projectId: p.id,
    type: "member.promoted",
    message: `${memberName} promoted to co-owner in "${p.title}" by ${p.owner}`,
    actor: p.owner,
    meta: { memberName },
  });

  return true;
}

export function setMemberRole(projectId, memberName, role) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const updatedMembers = (p.members || []).map((m) => (m.name === memberName ? { ...m, role } : m));
  updateProject({ ...p, members: updatedMembers });

  addActivity({
    projectId: p.id,
    type: "member.role_changed",
    message: `${memberName} role changed to ${role} in "${p.title}"`,
    actor: p.owner,
    meta: { memberName, role },
  });

  return true;
}

/* =====================================================
   PROJECT COMPLETION
===================================================== */
export function completeProject(projectId, actor) {
  const p = getProjectById(projectId);
  if (!p) return false;

  const updated = { ...p, status: "completed", completedAt: new Date().toISOString() };
  updateProject(updated);

  (updated.members || []).forEach((m) => {
    addNotification({
      id: Date.now().toString(),
      toName: m.name,
      fromName: actor,
      projectId: p.id,
      type: "project_completed",
      message: `Proyek "${p.title}" telah selesai.`,
      link: `/project/${p.id}`,
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  addNotification({
    id: Date.now().toString(),
    toName: updated.owner,
    fromName: actor,
    projectId: p.id,
    type: "project_completed",
    message: `Anda menandai proyek "${p.title}" sebagai selesai.`,
    link: `/project/${p.id}`,
    createdAt: new Date().toISOString(),
    read: false,
  });

  addActivity({
    projectId: p.id,
    type: "project.completed",
    message: `Project "${p.title}" completed by ${actor}`,
    actor,
  });

  return true;
}
