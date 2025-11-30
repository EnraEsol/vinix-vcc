// src/components/SearchModal.jsx
import { useEffect, useState } from "react";
import { loadProjects } from "../utils/storage";
import { getAllUsers } from "../utils/users"; // pastikan ada
import "./SearchModal.css";

export default function SearchModal({ open, onClose, navigate }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  /* LOAD DATA ONCE */
  useEffect(() => {
    setProjects(loadProjects());
    setUsers(getAllUsers());
  }, []);

  /* CLOSE ON ESC */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* SEARCH LOGIC */
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();

    const projectMatches = projects
      .filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      )
      .map((p) => ({
        type: "project",
        id: p.id,
        title: p.title,
        desc: p.description,
      }));

    const userMatches = users
      .filter((u) => u.name.toLowerCase().includes(q))
      .map((u) => ({
        type: "user",
        name: u.name,
      }));

    setResults([...projectMatches, ...userMatches]);
  }, [query]);

  if (!open) return null;

  return (
    <div className="search-overlay">
      <div className="search-box">
        <input
          autoFocus
          type="text"
          value={query}
          placeholder="Search projects, users..."
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="search-results">
          {results.length === 0 ? (
            <div className="empty">No results...</div>
          ) : (
            results.map((r, i) => (
              <div
                key={i}
                className="search-item"
                onClick={() => {
                  if (r.type === "project") navigate(`/project/${r.id}`);
                  if (r.type === "user") navigate(`/u/${r.name}`);
                  onClose();
                }}
              >
                <div className="item-type">{r.type}</div>
                <div className="item-main">{r.title || r.name}</div>
                {r.desc && (
                  <div className="item-sub">
                    {r.desc.length > 120 ? r.desc.slice(0, 120) + "..." : r.desc}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
