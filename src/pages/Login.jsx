// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, getCurrentUser } from "../utils/users";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e?.preventDefault();
    const r = loginUser(email.trim(), password);
    if (!r.ok) {
      setErr(r.message);
      return;
    }
    // success
    navigate("/");
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {err && <div className="auth-error">{err}</div>}
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="btn primary" type="submit">Login</button>
        <div className="auth-foot">
          Belum punya akun? <Link to="/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
