// src/utils/users.js

const USERS_KEY = "vcc_users_v1";
const CURRENT_USER_KEY = "vcc_current_user";

/* =====================================================
   BASIC LOCAL STORAGE
===================================================== */
export function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {}
}

/* =====================================================
   USER HELPERS
===================================================== */
export function getUserByEmail(email) {
  if (!email) return null;
  const all = loadUsers();
  return all.find((u) => u.email?.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id) {
  const all = loadUsers();
  return all.find((u) => u.id === id) || null;
}

export function getUserByName(name) {
  if (!name) return null;
  const all = loadUsers();
  return all.find((u) => u.name?.toLowerCase() === name.toLowerCase()) || null;
}

export function createUser(userObj) {
  const all = loadUsers();
  const user = { id: Date.now().toString(), ...userObj };
  saveUsers([user, ...all]);
  return user;
}

export function updateUser(updatedUser) {
  const all = loadUsers();
  const newAll = all.map((u) => (u.id === updatedUser.id ? updatedUser : u));
  saveUsers(newAll);
  return updatedUser;
}

/* =====================================================
   AUTH
===================================================== */
export function registerUser({ name, email, password }) {
  if (!name || !email || !password)
    return { ok: false, message: "Lengkapi semua field" };

  if (getUserByEmail(email))
    return { ok: false, message: "Email sudah terdaftar" };

  const user = createUser({
    name,
    email,
    password, // plaintext — untuk demo
    skills: [],
    badges: [],
    experiences: [],
    bio: "",
    links: [],
    createdAt: new Date().toISOString(),
  });

  setCurrentUser(user);
  return { ok: true, user };
}

export function loginUser(email, password) {
  const u = getUserByEmail(email);
  if (!u) return { ok: false, message: "User tidak ditemukan" };
  if (u.password !== password)
    return { ok: false, message: "Password salah" };
  setCurrentUser(u);
  return { ok: true, user: u };
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}

/* =====================================================
   CURRENT USER
===================================================== */
export function setCurrentUser(user) {
  try {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } catch {}
}

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* =====================================================
   PROFILE HELPERS
===================================================== */
export function updateUserSkills(userId, skills = []) {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser({ ...user, skills });
}

export function updateUserBio(userId, bio = "") {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser({ ...user, bio });
}

export function updateUserExperiences(userId, experiences = []) {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser({ ...user, experiences });
}

export function updateUserBadges(userId, badges = []) {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser({ ...user, badges });
}

export function updateUserLinks(userId, links = []) {
  const user = getUserById(userId);
  if (!user) return null;
  return updateUser({ ...user, links });
}

/* =====================================================
   SEARCH USER
===================================================== */
export function searchUsers(keyword) {
  const all = loadUsers();
  if (!keyword) return all;

  keyword = keyword.toLowerCase();

  return all.filter(
    (u) =>
      u.name?.toLowerCase().includes(keyword) ||
      u.email?.toLowerCase().includes(keyword) ||
      u.skills?.some((s) => s.toLowerCase().includes(keyword))
  );
}

/* =====================================================
   🔥 FIX FOR SEARCH MODAL — GET ALL USERS
===================================================== */
export function getAllUsers() {
  return loadUsers();
}
