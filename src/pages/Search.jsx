// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { loadProjects } from "../utils/storage";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const [results, setResults] = useState([]);

  useEffect(() => {
    const all = loadProjects();

    const keyword = q.toLowerCase();

    const filtered = all.filter((p) => {
      return (
        p.title.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword) ||
        (p.skills || []).some((s) =>
          s.toLowerCase().includes(keyword)
        ) ||
        p.owner.toLowerCase().includes(keyword)
      );
    });

    setResults(filtered);
  }, [q]);

  return (
    <div style={{ maxWidth: 900, margin: "80px auto", padding: 20 }}>
      <h2>Search results for: "{q}"</h2>

      {results.length === 0 ? (
        <div className="muted" style={{ marginTop: 20 }}>
          Tidak ada hasil.
        </div>
      ) : (
        results.map((p) => (
          <Link
            key={p.id}
            to={`/project/${p.id}`}
            className="project-item"
            style={{
              display: "block",
              padding: 16,
              border: "1px solid #eee",
              borderRadius: 10,
              marginTop: 12,
            }}
          >
            <strong>{p.title}</strong>
            <div className="muted small">{p.owner}</div>
            <div className="muted small">
              {(p.skills || []).join(", ")}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
