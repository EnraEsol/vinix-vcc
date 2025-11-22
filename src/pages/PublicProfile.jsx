// src/pages/PublicProfile.jsx
import { useParams } from "react-router-dom";
import { getUserByName } from "../utils/users";

export default function PublicProfile() {
  const { name } = useParams();
  const user = getUserByName(name);

  if (!user) return <div style={{ padding: 20 }}>User tidak ditemukan.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Profil {user.name}</h1>
      <p>Email: {user.email}</p>

      <h3>Skills</h3>
      <ul>
        {(user.skills || []).map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ul>

      <h3>Badges</h3>
      <div>{(user.badges || []).join(", ") || "Tidak ada badge"}</div>
    </div>
  );
}
