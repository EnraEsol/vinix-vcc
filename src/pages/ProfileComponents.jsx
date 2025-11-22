import React, { useEffect, useState } from "react";
if (!id) return;
// try get by id from loadUsers
const all = loadUsers();
const u = all.find(x => x.id === id);
setUser(u || null);
}, [id]);


if (!user) return (
<div className="profile-page"><div className="profile-card"><div className="muted">Public profile tidak ditemukan.</div></div></div>
);


return (
<div className="profile-page">
<div className="profile-card">
<div className="profile-header">
<div className="avatar">
{user.avatar ? <img src={user.avatar} alt="avatar" /> : <div className="avatar-placeholder">{(user.name||'U').slice(0,1)}</div>}
</div>
<div style={{ flex: 1 }}>
<h2>{user.name}</h2>
<div className="muted">{user.title || ''}</div>
<div className="muted">{user.location || ''}</div>
</div>
</div>


<div className="box-inline">
<h4>About</h4>
<p>{user.bio || 'Tidak ada bio.'}</p>
</div>


<div className="box-inline">
<h4>Skills</h4>
<div className="chips">{(user.skills||[]).map(s => <span key={s} className="chip">{s}</span>)}</div>
</div>


<div className="box-inline">
<h4>Experience</h4>
{(user.experiences||[]).map((ex,i)=> (
<div key={i} className="exp-row">
<strong>{ex.title}</strong>
<div className="muted small">{ex.role}</div>
</div>
))}
</div>


<div style={{ marginTop: 12 }}>
<a className="btn" href={`mailto:${user.email}`}>Contact</a>
{user.github && <a className="btn ghost" style={{ marginLeft: 8 }} href={user.github} target="_blank">GitHub</a>}
{user.linkedin && <a className="btn ghost" style={{ marginLeft: 8 }} href={user.linkedin} target="_blank">LinkedIn</a>}
</div>
</div>
</div>
);
}

