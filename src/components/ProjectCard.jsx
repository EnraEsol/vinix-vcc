const ProjectCard = ({ project, onClick }) => {
  const thumb = "/default-thumb.png";

  // Compare System
  const compareList = JSON.parse(localStorage.getItem("vcc_compare_projects") || "[]");
  const isCompared = compareList.includes(project.id);

  const toggleCompare = (e) => {
    e.stopPropagation();

    let list = JSON.parse(localStorage.getItem("vcc_compare_projects") || "[]");

    if (list.includes(project.id)) {
      list = list.filter((id) => id !== project.id);
    } else {
      if (list.length >= 4) {
        alert("Maksimal 4 project untuk dibandingkan.");
        return;
      }
      list.push(project.id);
    }

    localStorage.setItem("vcc_compare_projects", JSON.stringify(list));
    window.dispatchEvent(new Event("storage"));
  };

  /* =====================================================
     STATUS + SLOT LOGIC
  ===================================================== */

  const needed = project.rolesNeeded?.length || 0;
  const joined = project.members?.length || 0;
  const remaining = Math.max(needed - joined, 0);

  const status =
    remaining === 0
      ? "closed"
      : project.status || "open";

  return (
    <div className="project-card" onClick={onClick}>
      
      {/* Thumbnail */}
      <div className="card-left">
        <img src={thumb} alt="thumbnail" className="project-thumb" />
      </div>

      {/* Right Content */}
      <div className="card-right">

        {/* Title + Compare */}
        <div className="card-header-row">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 className="project-title">{project.title}</h3>

            {/* Status Badge */}
            <span
              className="status-badge"
              style={{
                background: status === "open" ? "#dcfce7" : "#fee2e2",
                color: status === "open" ? "#166534" : "#991b1b"
              }}
            >
              {status.toUpperCase()}
            </span>
          </div>

          <button
            className={isCompared ? "compare-btn active" : "compare-btn"}
            onClick={toggleCompare}
          >
            {isCompared ? "✓ Compared" : "+ Compare"}
          </button>
        </div>

        {/* Description */}
        <p className="project-desc">
          {project.description
            ? project.description.length > 160
              ? project.description.slice(0, 160) + "..."
              : project.description
            : "Tidak ada deskripsi."}
        </p>

        {/* Slot Info */}
        <div className="slot-info">
          Dibutuhkan: <strong>{needed}</strong> •
          Bergabung: <strong>{joined}</strong> •
          Sisa: <strong>{remaining}</strong>
        </div>

        {/* Skills + Owner */}
        <div className="meta-row">
          <div className="tags">
            {project.skills?.slice(0, 6).map((s) => (
              <span className="tag" key={s}>{s}</span>
            ))}

            {project.skills && project.skills.length > 6 && (
              <span className="tag more">+{project.skills.length - 6}</span>
            )}
          </div>

          <div className="meta-right">
            <small>Owner: {project.owner}</small>
            <small>• {new Date(project.createdAt).toLocaleDateString()}</small>
          </div>
        </div>

      </div>
    </div>
  );
};
