// src/pages/Portfolio/PortfolioDashboard.jsx — RESPONSIVE VERSION
// Works on mobile (375px) and desktop. Touch-friendly upload zones.

import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");

async function apiFetch(path, opts = {}) {
    const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { Authorization: `Bearer ${token()}`, ...(opts.headers || {}) },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

const TYPE = {
    before: { label: "Before", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
    after: { label: "After", color: "#16a34a", bg: "#f0fdf4", border: "#86efac" },
    general: { label: "Photo", color: "#64748b", bg: "#f8fafc", border: "#e2e8f0" },
};

function TypeBadge({ type }) {
    const t = TYPE[type] || TYPE.general;
    return (
        <span style={{
            background: t.bg, color: t.color, border: `1px solid ${t.border}`,
            fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: ".05em", whiteSpace: "nowrap",
        }}>{t.label}</span>
    );
}

function PhotoThumb({ img, onDelete, onSetCover }) {
    const [hov, setHov] = useState(false);
    return (
        <div
            onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
            style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: "#f1f5f9" }}
        >
            <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {img.is_cover && (
                <div style={{ position: "absolute", top: 4, left: 4, background: "#f59e0b", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>⭐</div>
            )}
            <div style={{ position: "absolute", top: 4, right: 4 }}>
                <TypeBadge type={img.photo_type} />
            </div>
            {/* Mobile: always show buttons. Desktop: show on hover */}
            <div style={{
                position: "absolute", inset: 0,
                background: hov ? "rgba(0,0,0,0.55)" : "transparent",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-end",
                padding: 6, gap: 4, transition: "background .15s",
                // On mobile, always show buttons via touch
            }}>
                {(hov) && !img.is_cover && (
                    <button onClick={() => onSetCover(img.id)}
                        style={{ width: "100%", background: "rgba(255,255,255,0.92)", border: "none", borderRadius: 6, padding: "5px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                        ⭐ Set cover
                    </button>
                )}
                {(hov) && (
                    <button onClick={() => onDelete(img.id)}
                        style={{ width: "100%", background: "rgba(220,38,38,0.92)", color: "#fff", border: "none", borderRadius: 6, padding: "5px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                        🗑 Delete
                    </button>
                )}
            </div>
            {/* Mobile delete button — always visible small X */}
            <button
                onClick={() => { if (window.confirm("Delete this photo?")) onDelete(img.id); }}
                style={{
                    position: "absolute", bottom: 4, right: 4,
                    background: "rgba(220,38,38,0.85)", color: "#fff",
                    border: "none", borderRadius: 6, padding: "3px 6px",
                    fontSize: 10, cursor: "pointer", fontWeight: 700,
                    display: hov ? "none" : "flex",
                }}
                className="d-lg-none"
            >🗑</button>
        </div>
    );
}

function ProjectCard({ project, onDelete, onUpload, onDeletePhoto, onSetCover, onRename }) {
    const [uploading, setUploading] = useState(false);
    const [photoType, setPhotoType] = useState("general");
    const [renaming, setRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(project.title);
    const [dragOver, setDragOver] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const fileRef = useRef();

    const cover = project.images.find(i => i.is_cover) || project.images[0];
    const hasBefore = project.images.some(i => i.photo_type === "before");
    const hasAfter = project.images.some(i => i.photo_type === "after");

    const doUpload = async (file) => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("photo_type", photoType);
            const res = await fetch(`${BASE}/api/portfolio/projects/${project.id}/photos`, {
                method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onUpload(project.id, data.image);
        } catch (err) { alert(err.message); }
        finally { setUploading(false); }
    };

    const handleFile = (e) => { const f = e.target.files?.[0]; if (f) doUpload(f); e.target.value = ""; };
    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) doUpload(f); };

    const handleRename = async () => {
        if (!newTitle.trim()) return;
        await onRename(project.id, newTitle.trim());
        setRenaming(false);
    };

    return (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderBottom: expanded ? "1px solid #f8fafc" : "none" }}>
                {cover
                    ? <img src={cover.image_url} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 40, height: 40, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🏠</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                    {renaming ? (
                        <div style={{ display: "flex", gap: 6 }}>
                            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") setRenaming(false); }}
                                autoFocus
                                style={{ flex: 1, padding: "4px 8px", border: "1.5px solid #16a34a", borderRadius: 7, fontSize: 13, outline: "none", minWidth: 0 }} />
                            <button onClick={handleRename} style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 7, padding: "4px 10px", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>✓</button>
                            <button onClick={() => setRenaming(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 7, padding: "4px 8px", cursor: "pointer", fontSize: 12, flexShrink: 0 }}>✕</button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.title}</p>
                            <button onClick={() => setRenaming(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 13, padding: 0, flexShrink: 0 }}>✏️</button>
                        </div>
                    )}
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {project.images.length} photo{project.images.length !== 1 ? "s" : ""}
                        {hasBefore && hasAfter && " · ✦ Slider ready"}
                        {(hasBefore || hasAfter) && !(hasBefore && hasAfter) && " · ⚠ Need both Before & After"}
                    </p>
                </div>
                {/* Collapse toggle for mobile */}
                <button onClick={() => setExpanded(v => !v)}
                    style={{ background: "#f8fafc", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 14, color: "#64748b", flexShrink: 0 }}>
                    {expanded ? "▲" : "▼"}
                </button>
                <button onClick={() => { if (window.confirm(`Delete "${project.title}"?`)) onDelete(project.id); }}
                    style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                    🗑
                </button>
            </div>

            {/* Expandable body */}
            {expanded && (
                <div style={{ padding: 14 }}>
                    {/* Type selector — FIRST on mobile so contractor picks type before uploading */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, whiteSpace: "nowrap" }}>Upload as:</span>
                        {["before", "after", "general"].map(t => {
                            const cfg = TYPE[t];
                            return (
                                <button key={t} onClick={() => setPhotoType(t)} style={{
                                    padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                                    border: `1.5px solid ${photoType === t ? cfg.color : "#e2e8f0"}`,
                                    background: photoType === t ? cfg.bg : "#fff",
                                    color: photoType === t ? cfg.color : "#94a3b8",
                                    cursor: "pointer",
                                }}>{cfg.label}</button>
                            );
                        })}
                    </div>

                    {/* Upload button — big and easy to tap on mobile */}
                    <button
                        onClick={() => fileRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        disabled={uploading}
                        style={{
                            width: "100%", padding: "14px", marginBottom: 12,
                            borderRadius: 10, border: `2px dashed ${dragOver ? "#16a34a" : TYPE[photoType].color}`,
                            background: dragOver ? "#f0fdf4" : TYPE[photoType].bg,
                            color: TYPE[photoType].color, cursor: "pointer",
                            fontSize: 14, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                        {uploading ? "⏳ Uploading…" : `📸 Upload ${TYPE[photoType].label} photo`}
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />

                    {/* Photos grid */}
                    {project.images.length > 0 && (
                        <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                            gap: 8,
                        }}>
                            {project.images.map(img => (
                                <PhotoThumb key={img.id} img={img}
                                    onDelete={id => onDeletePhoto(project.id, id)}
                                    onSetCover={id => onSetCover(project.id, id)} />
                            ))}
                        </div>
                    )}

                    {project.images.length === 0 && (
                        <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "16px 0" }}>
                            No photos yet — upload a Before and After to enable the slider
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

export default function PortfolioDashboard() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        Promise.all([
            apiFetch("/api/portfolio/projects"),
            apiFetch("/api/portfolio/settings"),
        ]).then(([proj, sett]) => {
            setProjects(proj.projects);
            setSlug(sett.settings.website_slug || "");
        }).catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const portfolioUrl = slug ? `${window.location.origin}/portfolio/${slug}` : null;

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        try {
            const d = await apiFetch("/api/portfolio/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: newTitle.trim() }),
            });
            setProjects(p => [{ ...d.project, images: [] }, ...p]);
            setNewTitle(""); setShowNewForm(false);
        } catch (err) { alert(err.message); }
        finally { setCreating(false); }
    };

    const handleDelete = async (id) => { await apiFetch(`/api/portfolio/projects/${id}`, { method: "DELETE" }); setProjects(p => p.filter(x => x.id !== id)); };
    const handleRename = async (id, title) => { await apiFetch(`/api/portfolio/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title }) }); setProjects(p => p.map(x => x.id === id ? { ...x, title } : x)); };
    const handleUpload = (pid, image) => setProjects(p => p.map(x => x.id === pid ? { ...x, images: [...x.images, image] } : x));
    const handleDeletePhoto = async (pid, iid) => { await apiFetch(`/api/portfolio/projects/${pid}/photos/${iid}`, { method: "DELETE" }); setProjects(p => p.map(x => x.id === pid ? { ...x, images: x.images.filter(i => i.id !== iid) } : x)); };
    const handleSetCover = async (pid, iid) => { await apiFetch(`/api/portfolio/projects/${pid}/photos/${iid}/cover`, { method: "PATCH" }); setProjects(p => p.map(x => x.id === pid ? { ...x, images: x.images.map(i => ({ ...i, is_cover: i.id === iid })) } : x)); };

    return (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "16px" }}>

            {/* Header */}
            <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                    <div>
                        <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 800, color: "#1e293b" }}>📸 My portfolio</h2>
                        <p style={{ margin: 0, color: "#64748b", fontSize: 12 }}>Upload projects · share with clients</p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <Link to="/providerdashboard/portfolio/settings"
                            style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "#f8fafc", color: "#374151", border: "1px solid #e2e8f0", textDecoration: "none" }}>
                            🎨 Design
                        </Link>
                        {portfolioUrl && (
                            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                                style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #86efac", textDecoration: "none" }}>
                                👁 View
                            </a>
                        )}
                        <button onClick={() => setShowNewForm(v => !v)}
                            style={{ padding: "8px 16px", borderRadius: 9, fontSize: 13, fontWeight: 700, background: "#1e293b", color: "#fff", border: "none", cursor: "pointer" }}>
                            + New
                        </button>
                    </div>
                </div>
            </div>

            {/* Portfolio URL */}
            {portfolioUrl ? (
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Your link:</span>
                        <code style={{ fontSize: 11, color: "#1e293b", flex: 1, wordBreak: "break-all" }}>{portfolioUrl}</code>
                        <button onClick={() => { navigator.clipboard.writeText(portfolioUrl); alert("Copied!"); }}
                            style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 7, padding: "5px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                            Copy
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#92400e" }}>
                        ⚠ <strong>No portfolio URL yet.</strong>{" "}
                        <Link to="/providerdashboard/portfolio/settings" style={{ color: "#92400e", fontWeight: 700 }}>Settings →</Link>
                    </p>
                </div>
            )}

            {/* New project form */}
            {showNewForm && (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px", marginBottom: 14 }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 700, fontSize: 14, color: "#1e293b" }}>New project name</p>
                    <div style={{ display: "flex", gap: 8 }}>
                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleCreate(); }}
                            placeholder="e.g. Kitchen renovation"
                            autoFocus
                            style={{ flex: 1, padding: "10px 12px", border: "1.5px solid #e2e8f0", borderRadius: 9, fontSize: 14, outline: "none", minWidth: 0 }} />
                        <button onClick={handleCreate} disabled={creating || !newTitle.trim()}
                            style={{ background: "#16a34a", color: "#fff", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
                            {creating ? "…" : "Create"}
                        </button>
                        <button onClick={() => setShowNewForm(false)}
                            style={{ background: "#f1f5f9", border: "none", borderRadius: 9, padding: "10px 12px", cursor: "pointer", color: "#64748b", flexShrink: 0 }}>✕</button>
                    </div>
                </div>
            )}

            {/* Tip */}
            <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", gap: 8 }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
                <p style={{ margin: 0, fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                    <strong>How it works:</strong> Create a project → select <strong>Before</strong> → upload the photo → select <strong>After</strong> → upload the after photo.
                    Clients will see a drag slider to compare. Add <strong>General</strong> photos for extra shots.
                </p>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: "center", padding: 40 }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
                </div>
            )}

            {/* Empty state */}
            {!loading && projects.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px 24px", background: "#fff", borderRadius: 14, border: "2px dashed #e2e8f0" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📸</div>
                    <h3 style={{ margin: "0 0 6px", color: "#1e293b", fontSize: 18 }}>No projects yet</h3>
                    <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>
                        Create your first project and upload Before & After photos
                    </p>
                    <button onClick={() => setShowNewForm(true)}
                        style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        + Create first project
                    </button>
                </div>
            )}

            {/* Project list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {projects.map(project => (
                    <ProjectCard
                        key={project.id} project={project}
                        onDelete={handleDelete} onUpload={handleUpload}
                        onDeletePhoto={handleDeletePhoto} onSetCover={handleSetCover}
                        onRename={handleRename}
                    />
                ))}
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}