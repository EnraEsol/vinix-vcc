// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logovinix.png";
import "./Navbar.css";
import { getCurrentUser, logoutUser } from "../utils/users";
import { getInvitationsForUser } from "../utils/storage";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [user, setUser] = useState(getCurrentUser());
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setUser(getCurrentUser());
    const u = getCurrentUser();
    if (u) {
      const invites = getInvitationsForUser(u.name);
      setPendingCount(invites.filter((i) => i.status === "pending").length);
    } else {
      setPendingCount(0);
    }
  }, []);

  const doLogout = () => {
    logoutUser();
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <img src={logo} alt="logo" className="logo-img" />
        </Link>

        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/explore">Explore</Link></li>
          <li><Link to="/create">Create Project</Link></li>
          <li>
            <Link to="/invitations">
              Invitations {pendingCount > 0 && <span className="invite-badge">{pendingCount}</span>}
            </Link>
          </li>
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              <Link to="/profile" className="profile-link">{user.name}</Link>
              <button className="btn ghost small" onClick={doLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn ghost small">Login</Link>
              <Link to="/register" className="btn small">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
