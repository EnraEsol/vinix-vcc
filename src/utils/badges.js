import { updateUser, getUserByName, setCurrentUser } from "./users";
import { loadProjects } from "./storage";

export function awardBadgesForUser(username) {
  const user = getUserByName(username);
  if (!user) return;

  const badges = new Set(user.badges || []);
  const projects = loadProjects() || [];

  const created = projects.filter(p => p.owner === username);
  const joined = projects.filter(p => (p.members || []).some(m => m.name === username));
  const tasksCompleted = projects
    .flatMap(p => p.tasks || [])
    .filter(t => t.assignedTo === username && t.status === "done");

  if (created.length >= 1) badges.add("Project Creator");
  if (joined.length >= 3) badges.add("Active Collaborator");
  if (tasksCompleted.length >= 3) badges.add("Task Finisher");
  if ((user.skills || []).length >= 5) badges.add("Skilled Member");

  const updatedUser = {
    ...user,
    badges: Array.from(badges),
  };

  updateUser(updatedUser);
  setCurrentUser(updatedUser);
}
