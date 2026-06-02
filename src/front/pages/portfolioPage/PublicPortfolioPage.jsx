// src/pages/Portfolio/PublicPortfolioPage.jsx
// PUBLIC — accessible at /portfolio/:slug — no login needed
// Features: custom-color hero, logo, before/after slider, gallery, estimate form

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "";

// ── money helper ──────────────────────────────────────────────────────────────
function fmtBudget(val) {
    const map = {
        under_500: "Under $500", "500_1000": "$500–$1,000",
        "1000_2500": "$1,000–$2,500", "2500_5000": "$2,500–$5,000",
        "5000_10000": "$5,000–$10,000", over_10000: "$10,000+",
    };
    return map[val] || val;
}

// ── Before/After Slider ───────────────────────────────────────────────────────
function BeforeAfterSlider({ beforeUrl, afterUrl, title }) {
    const [pos, setPos] = useState(50);
    const dragging = useRef(false);
    const containerRef = useRef();

    const calcPos = (clientX) => {
        const rect = containerRef.current.getBoundingClientRect();
        return Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={e => { if (dragging.current) setPos(calcPos(e.clientX)); }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={e => setPos(calcPos(e.touches[0].clientX))}
            style={{
                position: "relative", width: "100%", aspectRatio: "4/3",
                overflow: "hidden", borderRadius: 14, cursor: "ew-resize",
                userSelect: "none", touchAction: "none", background: "#111",
            }}
        >
            {/* AFTER — full width */}
            <img src={afterUrl} alt={`${title} — after`}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />

            {/* BEFORE — clipped left */}
            <div style={{ position: "absolute", inset: 0, width: `${pos}%`, overflow: "hidden" }}>
                <img src={beforeUrl} alt={`${title} — before`}
                    style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${10000 / pos}%`, maxWidth: "none", objectFit: "cover" }} />
            </div>

            {/* Labels */}
            <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: ".07em", textTransform: "uppercase" }}>Before</span>
            <span style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, letterSpacing: ".07em", textTransform: "uppercase" }}>After</span>

            {/* Handle */}
            <div
                onMouseDown={() => { dragging.current = true; }}
                onTouchStart={() => { dragging.current = true; }}
                style={{
                    position: "absolute", top: 0, bottom: 0,
                    left: `${pos}%`, transform: "translateX(-50%)",
                    width: 3, background: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "ew-resize",
                }}
            >
                <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: "#fff", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 16, color: "#374151",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.25)", flexShrink: 0,
                }}>⇔</div>
            </div>
        </div>
    );
}

// ── Project Gallery Card ──────────────────────────────────────────────────────
function ProjectCard({ project, onClick, btnColor }) {
    const cover = project.images.find(i => i.is_cover) || project.images[0];
    const hasBefore = project.images.some(i => i.photo_type === "before");
    const hasAfter = project.images.some(i => i.photo_type === "after");
    const [hovered, setHovered] = useState(false);

    return (
        <div
            onClick={() => onClick(project)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                borderRadius: 14, overflow: "hidden", cursor: "pointer",
                background: "#fff", transition: "transform .2s, box-shadow .2s",
                transform: hovered ? "translateY(-4px)" : "none",
                boxShadow: hovered ? "0 12px 36px rgba(0,0,0,0.15)" : "0 2px 12px rgba(0,0,0,0.08)",
            }}
        >
            <div style={{ aspectRatio: "4/3", overflow: "hidden", position: "relative", background: "#f1f5f9" }}>
                {cover
                    ? <img src={cover.image_url} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s", transform: hovered ? "scale(1.04)" : "scale(1)" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48, color: "#cbd5e1" }}>🏠</div>
                }
                {hasBefore && hasAfter && (
                    <span style={{
                        position: "absolute", bottom: 10, right: 10,
                        background: "rgba(0,0,0,0.65)", color: "#fff",
                        fontSize: 10, fontWeight: 700, padding: "3px 9px",
                        borderRadius: 20, letterSpacing: ".06em",
                    }}>✦ BEFORE / AFTER</span>
                )}
            </div>
            <div style={{ padding: "14px 16px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#1e293b" }}>{project.title}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>
                    {project.images.length} photo{project.images.length !== 1 ? "s" : ""}
                    {hasBefore && hasAfter ? " · Before & After" : ""}
                </p>
            </div>
        </div>
    );
}

// ── Project Detail Modal ──────────────────────────────────────────────────────
function ProjectModal({ project, onClose }) {
    const beforeImg = project.images.find(i => i.photo_type === "before");
    const afterImg = project.images.find(i => i.photo_type === "after");
    const generalImgs = project.images.filter(i => i.photo_type === "general");
    const [sel, setSel] = useState(null);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {/* Backdrop */}
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }} />

            {/* Modal */}
            <div style={{
                position: "relative", zIndex: 1, background: "#fff",
                borderRadius: 20, width: "100%", maxWidth: 700,
                maxHeight: "90vh", overflow: "auto", padding: "28px 28px 36px",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1e293b" }}>{project.title}</h2>
                    <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#f1f5f9", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                </div>

                {/* Before/After slider */}
                {beforeImg && afterImg && (
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".06em" }}>← Drag to compare →</p>
                        <BeforeAfterSlider beforeUrl={beforeImg.image_url} afterUrl={afterImg.image_url} title={project.title} />
                    </div>
                )}

                {/* Before only */}
                {beforeImg && !afterImg && (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Before</p>
                        <img src={beforeImg.image_url} alt="Before" onClick={() => setSel(beforeImg.image_url)}
                            style={{ width: "100%", borderRadius: 12, maxHeight: 360, objectFit: "cover", cursor: "zoom-in" }} />
                    </div>
                )}

                {/* After only */}
                {afterImg && !beforeImg && (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>After</p>
                        <img src={afterImg.image_url} alt="After" onClick={() => setSel(afterImg.image_url)}
                            style={{ width: "100%", borderRadius: 12, maxHeight: 360, objectFit: "cover", cursor: "zoom-in" }} />
                    </div>
                )}

                {/* General photos */}
                {generalImgs.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
                        {generalImgs.map(img => (
                            <img key={img.id} src={img.image_url} alt={project.title}
                                onClick={() => setSel(img.image_url)}
                                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 10, cursor: "zoom-in", display: "block" }} />
                        ))}
                    </div>
                )}
            </div>

            {/* Lightbox */}
            {sel && (
                <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
                    <img src={sel} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12 }} />
                </div>
            )}
        </div>
    );
}

// ── Estimate Request Form ─────────────────────────────────────────────────────
function EstimateRequestForm({ slug, contractorName, btnColor }) {
    const [form, setForm] = useState({
        customer_name: "", customer_email: "", customer_phone: "",
        customer_address: "", estimate_type: "painting",
        budget_range: "", description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true); setError("");
        try {
            const res = await fetch(`${BASE}/api/portfolio/${slug}/request-estimate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            setSubmitted(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) return (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <h3 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800, color: "#1e293b" }}>Request sent!</h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: 15 }}>{contractorName} will contact you soon with your estimate.</p>
        </div>
    );

    const inp = {
        width: "100%", padding: "11px 14px",
        border: "1.5px solid #e2e8f0", borderRadius: 10,
        fontSize: 14, fontFamily: "inherit", outline: "none",
        boxSizing: "border-box", background: "#fff", color: "#1e293b",
        transition: "border-color .15s",
    };
    const lbl = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

    const onFocus = e => e.target.style.borderColor = btnColor;
    const onBlur = e => e.target.style.borderColor = "#e2e8f0";

    return (
        <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div><label style={lbl}>Full name *</label>
                    <input style={inp} required placeholder="John Smith"
                        value={form.customer_name} onChange={e => set("customer_name", e.target.value)}
                        onFocus={onFocus} onBlur={onBlur} /></div>
                <div><label style={lbl}>Phone *</label>
                    <input style={inp} type="tel" required placeholder="(555) 000-0000"
                        value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)}
                        onFocus={onFocus} onBlur={onBlur} /></div>
            </div>
            <div style={{ marginTop: 14 }}>
                <label style={lbl}>Email *</label>
                <input style={inp} type="email" required placeholder="john@email.com"
                    value={form.customer_email} onChange={e => set("customer_email", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ marginTop: 14 }}>
                <label style={lbl}>Job address</label>
                <input style={inp} placeholder="123 Main St, Miami, FL"
                    value={form.customer_address} onChange={e => set("customer_address", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur} />
            </div>
            <div style={{ marginTop: 14 }}>
                <label style={lbl}>Type of work *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[
                        { value: "painting", label: "🎨 Painting" },
                        { value: "flooring", label: "🪵 Flooring" },
                        { value: "both", label: "🎨🪵 Both" },
                    ].map(o => (
                        <button key={o.value} type="button" onClick={() => set("estimate_type", o.value)}
                            style={{
                                padding: "10px 6px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                                border: `2px solid ${form.estimate_type === o.value ? btnColor : "#e2e8f0"}`,
                                background: form.estimate_type === o.value ? hexToLight(btnColor) : "#fff",
                                color: form.estimate_type === o.value ? btnColor : "#64748b",
                                cursor: "pointer", transition: "all .15s",
                            }}>{o.label}</button>
                    ))}
                </div>
            </div>
            <div style={{ marginTop: 14 }}>
                <label style={lbl}>Budget range</label>
                <select style={{ ...inp, appearance: "none" }}
                    value={form.budget_range} onChange={e => set("budget_range", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur}>
                    <option value="">Select a range (optional)</option>
                    {["under_500", "500_1000", "1000_2500", "2500_5000", "5000_10000", "over_10000"].map(v => (
                        <option key={v} value={v}>{fmtBudget(v)}</option>
                    ))}
                </select>
            </div>
            <div style={{ marginTop: 14 }}>
                <label style={lbl}>Tell us about your project</label>
                <textarea style={{ ...inp, minHeight: 88, resize: "vertical" }}
                    placeholder="Describe the rooms, current condition, special requests…"
                    value={form.description} onChange={e => set("description", e.target.value)}
                    onFocus={onFocus} onBlur={onBlur} />
            </div>
            {error && <p style={{ color: "#dc2626", fontSize: 13, margin: "10px 0 0" }}>⚠ {error}</p>}
            <button type="submit" disabled={submitting} style={{
                marginTop: 18, width: "100%", padding: "14px",
                background: submitting ? "#94a3b8" : btnColor,
                color: "#fff", border: "none", borderRadius: 12,
                fontSize: 16, fontWeight: 700, cursor: submitting ? "default" : "pointer",
                transition: "background .15s",
            }}>
                {submitting ? "Sending…" : "📋 Request free estimate"}
            </button>
        </form>
    );
}

// lighten a hex color for the selected button background
function hexToLight(hex) {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},0.1)`;
    } catch { return "#f0fdf4"; }
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PublicPortfolioPage() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedProject, setSelectedProject] = useState(null);
    const formRef = useRef();

    useEffect(() => {
        fetch(`${BASE}/api/portfolio/${slug}`)
            .then(r => r.json())
            .then(d => { if (d.error) throw new Error(d.error); setData(d); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

    if (loading) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 44, height: 44, border: "3px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} />
                <p style={{ color: "#64748b", margin: 0 }}>Loading portfolio…</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🏗️</div>
                <h2 style={{ margin: "0 0 8px", color: "#1e293b" }}>Portfolio not found</h2>
                <p style={{ color: "#64748b" }}>This portfolio link may be incorrect.</p>
            </div>
        </div>
    );

    const { contractor, projects } = data;
    const heroColor = contractor.hero_color || "#1e293b";
    const btnColor = contractor.btn_color || "#1d6b3e";
    const heroLight = hexToLight(heroColor);

    // Projects with both before AND after photos — shown in the slider section
    const beforeAfterProjects = projects.filter(p =>
        p.images.some(i => i.photo_type === "before") &&
        p.images.some(i => i.photo_type === "after")
    );

    return (
        <>
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0;transform:translateY(20px); } to { opacity:1;transform:none; } }
            `}</style>

            {/* ── HERO ── */}
            <section style={{ background: heroColor, padding: "64px 24px 56px", position: "relative", overflow: "hidden" }}>
                {/* subtle pattern overlay */}
                <div style={{
                    position: "absolute", inset: 0, opacity: .04,
                    backgroundImage: "radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)"
                }} />

                <div style={{ maxWidth: 860, margin: "0 auto", position: "relative", animation: "fadeUp .5s ease both" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 24, flexWrap: "wrap" }}>
                        {/* Logo */}
                        {contractor.logo_image && (
                            <img src={contractor.logo_image} alt={`${contractor.business_name} logo`}
                                style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.2)", flexShrink: 0 }} />
                        )}

                        <div style={{ flex: 1, minWidth: 280 }}>
                            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(28px,5vw,50px)", fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-.02em" }}>
                                {contractor.business_name}
                            </h1>
                            {contractor.description && (
                                <p style={{ margin: "0 0 20px", fontSize: "clamp(14px,2vw,17px)", color: "rgba(255,255,255,0.65)", maxWidth: 520, lineHeight: 1.65 }}>
                                    {contractor.description}
                                </p>
                            )}

                            {/* Contact pills */}
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 28 }}>
                                {contractor.phone && (
                                    <a href={`tel:${contractor.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 14, textDecoration: "none" }}>
                                        📞 {contractor.phone}
                                    </a>
                                )}
                                {contractor.business_email && (
                                    <a href={`mailto:${contractor.business_email}`} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.75)", fontSize: 14, textDecoration: "none" }}>
                                        ✉️ {contractor.business_email}
                                    </a>
                                )}
                                {contractor.address && (
                                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                                        📍 {contractor.address}
                                    </span>
                                )}
                            </div>

                            <button onClick={scrollToForm} style={{
                                background: btnColor, color: "#fff", border: "none",
                                padding: "14px 30px", borderRadius: 12, fontSize: 15,
                                fontWeight: 700, cursor: "pointer", letterSpacing: ".01em",
                            }}>
                                📋 Get a free estimate
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cover image strip at bottom of hero */}
                {contractor.cover_image && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, overflow: "hidden" }}>
                        <img src={contractor.cover_image} alt="Cover"
                            style={{ width: "100%", height: "100%", objectFit: "cover", opacity: .25 }} />
                        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${heroColor}, transparent)` }} />
                    </div>
                )}
            </section>

            {/* ── ABOUT ── */}
            {contractor.about && (
                <section style={{ background: "#fff", padding: "60px 24px", borderBottom: "1px solid #f1f5f9" }}>
                    <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: btnColor, margin: "0 0 12px" }}>About us</p>
                        <p style={{ fontSize: 17, color: "#374151", lineHeight: 1.85, margin: 0 }}>{contractor.about}</p>
                    </div>
                </section>
            )}

            {/* ── BEFORE / AFTER ── */}
            {beforeAfterProjects.length > 0 && (
                <section style={{ background: "#f8fafc", padding: "72px 24px" }}>
                    <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: btnColor, margin: "0 0 8px" }}>Transformations</p>
                        <h2 style={{ margin: "0 0 6px", fontSize: 30, fontWeight: 800, color: "#1e293b" }}>Before & After</h2>
                        <p style={{ margin: "0 0 36px", color: "#64748b", fontSize: 15 }}>Drag the slider to compare our work</p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 32 }}>
                            {beforeAfterProjects.slice(0, 4).map(project => {
                                const before = project.images.find(i => i.photo_type === "before");
                                const after = project.images.find(i => i.photo_type === "after");
                                return (
                                    <div key={project.id}>
                                        <BeforeAfterSlider beforeUrl={before.image_url} afterUrl={after.image_url} title={project.title} />
                                        <p style={{ margin: "12px 0 0", fontWeight: 700, color: "#1e293b", fontSize: 14 }}>{project.title}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── GALLERY ── */}
            {projects.length > 0 && (
                <section style={{ background: "#fff", padding: "72px 24px" }}>
                    <div style={{ maxWidth: 900, margin: "0 auto" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: btnColor, margin: "0 0 8px" }}>Our work</p>
                        <h2 style={{ margin: "0 0 36px", fontSize: 30, fontWeight: 800, color: "#1e293b" }}>Project gallery</h2>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
                            {projects.map(project => (
                                <ProjectCard key={project.id} project={project} onClick={setSelectedProject} btnColor={btnColor} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── ESTIMATE FORM ── */}
            <section ref={formRef} style={{ background: "#f8fafc", padding: "80px 24px" }}>
                <div style={{ maxWidth: 580, margin: "0 auto" }}>
                    <div style={{ textAlign: "center", marginBottom: 36 }}>
                        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: btnColor, margin: "0 0 8px" }}>Free quote</p>
                        <h2 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 800, color: "#1e293b" }}>Request an estimate</h2>
                        <p style={{ margin: 0, color: "#64748b", fontSize: 15 }}>
                            Tell us about your project and {contractor.business_name} will get back to you with a detailed quote.
                        </p>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 20, padding: "32px", boxShadow: "0 4px 32px rgba(0,0,0,0.07)" }}>
                        <EstimateRequestForm slug={slug} contractorName={contractor.business_name} btnColor={btnColor} />
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: heroColor, padding: "20px 24px", textAlign: "center" }}>
                <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                    © {new Date().getFullYear()} {contractor.business_name} · Powered by TradeQuote
                </p>
            </footer>

            {/* Project modal */}
            {selectedProject && (
                <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
            )}
        </>
    );
}