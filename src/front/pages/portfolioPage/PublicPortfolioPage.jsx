// src/pages/portfolioPage/PublicPortfolioPage.jsx
import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "";

function fmtBudget(val) {
    const map = {
        under_500: "Under $500", "500_1000": "$500–$1,000",
        "1000_2500": "$1,000–$2,500", "2500_5000": "$2,500–$5,000",
        "5000_10000": "$5,000–$10,000", over_10000: "$10,000+",
    };
    return map[val] || val;
}

function hexToLight(hex) {
    try {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},0.12)`;
    } catch { return "rgba(29,107,62,0.12)"; }
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
        <div ref={containerRef}
            onMouseMove={e => { if (dragging.current) setPos(calcPos(e.clientX)); }}
            onMouseUp={() => { dragging.current = false; }}
            onMouseLeave={() => { dragging.current = false; }}
            onTouchMove={e => setPos(calcPos(e.touches[0].clientX))}
            style={{ position: "relative", width: "100%", aspectRatio: "16/9", overflow: "hidden", borderRadius: 2, cursor: "ew-resize", userSelect: "none", touchAction: "none", background: "#111" }}>
            <img src={afterUrl} alt="after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, width: `${pos}%`, overflow: "hidden" }}>
                <img src={beforeUrl} alt="before" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${10000 / pos}%`, maxWidth: "none", objectFit: "cover" }} />
            </div>
            <span style={{ position: "absolute", top: 16, left: 16, background: "rgba(0,0,0,0.7)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "4px 12px", borderRadius: 0, letterSpacing: ".15em", textTransform: "uppercase" }}>Before</span>
            <span style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "4px 12px", borderRadius: 0, letterSpacing: ".15em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.3)" }}>After</span>
            <div onMouseDown={() => { dragging.current = true; }} onTouchStart={() => { dragging.current = true; }}
                style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, transform: "translateX(-50%)", width: 2, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#111", boxShadow: "0 4px 20px rgba(0,0,0,0.4)", flexShrink: 0, fontWeight: 900 }}>⇔</div>
            </div>
        </div>
    );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onClick, btnColor }) {
    const cover = project.images.find(i => i.is_cover) || project.images[0];
    const hasBefore = project.images.some(i => i.photo_type === "before");
    const hasAfter = project.images.some(i => i.photo_type === "after");
    const [hovered, setHovered] = useState(false);
    return (
        <div onClick={() => onClick(project)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{ position: "relative", overflow: "hidden", cursor: "pointer", background: "#0a0a0a", transition: "transform .3s", transform: hovered ? "scale(1.02)" : "scale(1)" }}>
            <div style={{ aspectRatio: "4/3", overflow: "hidden", position: "relative" }}>
                {cover
                    ? <img src={cover.image_url} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .5s", transform: hovered ? "scale(1.08)" : "scale(1)", filter: hovered ? "brightness(0.5)" : "brightness(0.75)" }} />
                    : <div style={{ width: "100%", height: "100%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>🏠</div>
                }
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)" }} />
                {hasBefore && hasAfter && (
                    <span style={{ position: "absolute", top: 12, left: 12, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 8, fontWeight: 800, padding: "4px 10px", letterSpacing: ".15em", textTransform: "uppercase", border: "1px solid rgba(255,255,255,0.2)" }}>✦ BEFORE / AFTER</span>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 18px" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: "#fff", letterSpacing: "-.01em" }}>{project.title}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: ".05em", textTransform: "uppercase" }}>
                        {project.images.length} photo{project.images.length !== 1 ? "s" : ""}
                        {hasBefore && hasAfter ? " · Before & After" : ""}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
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
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }} />
            <div style={{ position: "relative", zIndex: 1, background: "#0f0f0f", borderRadius: 0, width: "100%", maxWidth: 720, maxHeight: "90vh", overflow: "auto", padding: "36px 32px", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
                    <div>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.3)", letterSpacing: ".15em", textTransform: "uppercase" }}>Project</p>
                        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-.02em" }}>{project.title}</h2>
                    </div>
                    <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", width: 36, height: 36, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
                </div>
                {beforeImg && afterImg && (
                    <div style={{ marginBottom: 24 }}>
                        <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".15em" }}>← Drag to compare →</p>
                        <BeforeAfterSlider beforeUrl={beforeImg.image_url} afterUrl={afterImg.image_url} title={project.title} />
                    </div>
                )}
                {beforeImg && !afterImg && (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".12em" }}>Before</p>
                        <img src={beforeImg.image_url} alt="Before" onClick={() => setSel(beforeImg.image_url)} style={{ width: "100%", maxHeight: 360, objectFit: "cover", cursor: "zoom-in", display: "block" }} />
                    </div>
                )}
                {afterImg && !beforeImg && (
                    <div style={{ marginBottom: 20 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: ".12em" }}>After</p>
                        <img src={afterImg.image_url} alt="After" onClick={() => setSel(afterImg.image_url)} style={{ width: "100%", maxHeight: 360, objectFit: "cover", cursor: "zoom-in", display: "block" }} />
                    </div>
                )}
                {generalImgs.length > 0 && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 4 }}>
                        {generalImgs.map(img => (
                            <img key={img.id} src={img.image_url} alt="" onClick={() => setSel(img.image_url)}
                                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", cursor: "zoom-in", display: "block" }} />
                        ))}
                    </div>
                )}
            </div>
            {sel && (
                <div onClick={() => setSel(null)} style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,0.96)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
                    <img src={sel} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain" }} />
                </div>
            )}
        </div>
    );
}

// ── Estimate Form ─────────────────────────────────────────────────────────────
function EstimateRequestForm({ slug, contractorName, btnColor }) {
    const [form, setForm] = useState({
        customer_name: "", customer_email: "", customer_phone: "",
        customer_address: "", estimate_type: "painting", budget_range: "", description: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setError("");
        try {
            const res = await fetch(`${BASE}/api/portfolio/${slug}/request-estimate`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to submit");
            setSubmitted(true);
        } catch (err) { setError(err.message); } finally { setSubmitting(false); }
    };

    if (submitted) return (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>✓</div>
            <h3 style={{ margin: "0 0 10px", fontSize: 24, fontWeight: 900, color: "#fff", letterSpacing: "-.02em" }}>Request sent.</h3>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{contractorName} will be in touch shortly.</p>
        </div>
    );

    const inp = { width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 0, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#fff", transition: "border-color .15s" };
    const lbl = { fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", letterSpacing: ".15em", textTransform: "uppercase", marginBottom: 8, display: "block" };
    const onFocus = e => e.target.style.borderColor = btnColor;
    const onBlur = e => e.target.style.borderColor = "rgba(255,255,255,0.12)";

    return (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={lbl}>Full name *</label>
                    <input style={inp} required placeholder="John Smith" value={form.customer_name} onChange={e => set("customer_name", e.target.value)} onFocus={onFocus} onBlur={onBlur} /></div>
                <div><label style={lbl}>Phone *</label>
                    <input style={inp} type="tel" required placeholder="(555) 000-0000" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} onFocus={onFocus} onBlur={onBlur} /></div>
            </div>
            <div><label style={lbl}>Email *</label>
                <input style={inp} type="email" required placeholder="john@email.com" value={form.customer_email} onChange={e => set("customer_email", e.target.value)} onFocus={onFocus} onBlur={onBlur} /></div>
            <div><label style={lbl}>Job address</label>
                <input style={inp} placeholder="123 Main St" value={form.customer_address} onChange={e => set("customer_address", e.target.value)} onFocus={onFocus} onBlur={onBlur} /></div>
            <div>
                <label style={lbl}>Type of work *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                    {[{ value: "painting", label: "🎨 Painting" }, { value: "flooring", label: "🪵 Flooring" }, { value: "both", label: "Both" }].map(o => (
                        <button key={o.value} type="button" onClick={() => set("estimate_type", o.value)} style={{
                            padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s",
                            border: `1px solid ${form.estimate_type === o.value ? btnColor : "rgba(255,255,255,0.12)"}`,
                            background: form.estimate_type === o.value ? hexToLight(btnColor) : "transparent",
                            color: form.estimate_type === o.value ? btnColor : "rgba(255,255,255,0.5)",
                        }}>{o.label}</button>
                    ))}
                </div>
            </div>
            <div><label style={lbl}>Budget range</label>
                <select style={{ ...inp, appearance: "none" }} value={form.budget_range} onChange={e => set("budget_range", e.target.value)} onFocus={onFocus} onBlur={onBlur}>
                    <option value="" style={{ background: "#111" }}>Select a range (optional)</option>
                    {["under_500", "500_1000", "1000_2500", "2500_5000", "5000_10000", "over_10000"].map(v => (
                        <option key={v} value={v} style={{ background: "#111" }}>{fmtBudget(v)}</option>
                    ))}
                </select></div>
            <div><label style={lbl}>Tell us about your project</label>
                <textarea style={{ ...inp, minHeight: 100, resize: "vertical" }}
                    placeholder="Describe the rooms, current condition, special requests…"
                    value={form.description} onChange={e => set("description", e.target.value)} onFocus={onFocus} onBlur={onBlur} /></div>
            {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>⚠ {error}</p>}
            <button type="submit" disabled={submitting} style={{
                padding: "16px", background: submitting ? "rgba(255,255,255,0.1)" : btnColor,
                color: "#fff", border: "none", fontSize: 13, fontWeight: 800, cursor: submitting ? "default" : "pointer",
                letterSpacing: ".1em", textTransform: "uppercase", transition: "opacity .15s",
                opacity: submitting ? 0.6 : 1,
            }}>
                {submitting ? "Sending…" : "→ Request free estimate"}
            </button>
        </form>
    );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export default function PublicPortfolioPage() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedProject, setSelectedProject] = useState(null);
    const [scrolled, setScrolled] = useState(false);
    const formRef = useRef();

    useEffect(() => {
        fetch(`${BASE}/api/portfolio/${slug}`)
            .then(r => r.json())
            .then(d => { if (d.error) throw new Error(d.error); setData(d); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [slug]);

    useEffect(() => {
        const el = document.getElementById("pf-scroll");
        if (!el) return;
        const handler = () => setScrolled(el.scrollTop > 60);
        el.addEventListener("scroll", handler);
        return () => el.removeEventListener("scroll", handler);
    }, [data]);

    const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

    if (loading) return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ width: 40, height: 40, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 20px" }} />
                <p style={{ color: "rgba(255,255,255,0.3)", margin: 0, fontSize: 11, letterSpacing: ".15em", textTransform: "uppercase" }}>Loading</p>
            </div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#050505", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <p style={{ margin: "0 0 8px", fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: ".15em", textTransform: "uppercase" }}>404</p>
                <h2 style={{ margin: "0 0 12px", color: "#fff", fontWeight: 900, fontSize: 28 }}>Portfolio not found</h2>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>This portfolio link may be incorrect.</p>
            </div>
        </div>
    );

    const { contractor, projects } = data;
    const heroColor = contractor.hero_color || "#0a0a0a";
    const btnColor = contractor.btn_color || "#1d6b3e";

    const beforeAfterProjects = projects.filter(p =>
        p.images.some(i => i.photo_type === "before") &&
        p.images.some(i => i.photo_type === "after")
    );

    return (
        <div id="pf-scroll" style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "#050505", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            <style>{`
                * { box-sizing: border-box; }
                body { margin: 0; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:none; } }
                @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
                ::placeholder { color: rgba(255,255,255,0.2) !important; }
                option { background: #111 !important; }
                ::-webkit-scrollbar { width: 4px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); }
            `}</style>

            {/* ── TOPBAR ── */}
            <header style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                padding: "0 40px", height: 64,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: scrolled ? "rgba(5,5,5,0.95)" : "transparent",
                backdropFilter: scrolled ? "blur(12px)" : "none",
                borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
                transition: "all .3s",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {contractor.logo_image && (
                        <img src={contractor.logo_image} alt="logo"
                            style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.15)" }} />
                    )}
                    <span style={{ color: "#fff", fontWeight: 900, fontSize: 14, letterSpacing: ".06em", textTransform: "uppercase" }}>
                        {contractor.business_name}
                    </span>
                </div>
                <button onClick={scrollToForm} style={{
                    background: btnColor, color: "#fff", border: "none",
                    padding: "10px 24px", fontSize: 11, fontWeight: 800,
                    cursor: "pointer", letterSpacing: ".12em", textTransform: "uppercase",
                }}>
                    Free estimate
                </button>
            </header>

            {/* ── HERO — full screen with cover as background ── */}
            <section style={{ position: "relative", height: "100vh", minHeight: 600, overflow: "hidden", background: heroColor }}>
                {/* Cover image as hero background */}
                {contractor.cover_image && (
                    <img src={contractor.cover_image} alt="cover"
                        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.45, animation: "fadeIn 1.2s ease both" }} />
                )}

                {/* Dark overlay gradient */}
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right, ${heroColor} 0%, ${heroColor}cc 40%, transparent 100%), linear-gradient(to top, ${heroColor} 0%, transparent 50%)` }} />

                {/* Noise texture overlay */}
                <div style={{
                    position: "absolute", inset: 0, opacity: .03,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
                }} />

                {/* Content */}
                <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 48px 80px", maxWidth: 900 }}>
                    <div style={{ animation: "fadeUp .8s ease both" }}>
                        {/* Label */}
                        <p style={{ margin: "0 0 24px", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: ".2em", textTransform: "uppercase" }}>
                            Professional Contractor
                        </p>

                        {/* Business name — huge */}
                        <h1 style={{ margin: "0 0 20px", fontSize: "clamp(48px, 8vw, 96px)", fontWeight: 900, color: "#fff", lineHeight: .95, letterSpacing: "-.04em", textTransform: "uppercase" }}>
                            {contractor.business_name}
                        </h1>

                        {/* Tagline */}
                        {contractor.description && (
                            <p style={{ margin: "0 0 40px", fontSize: "clamp(14px, 1.8vw, 18px)", color: "rgba(255,255,255,0.55)", maxWidth: 480, lineHeight: 1.7, fontWeight: 400 }}>
                                {contractor.description}
                            </p>
                        )}

                        {/* Contact row */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, marginBottom: 48 }}>
                            {contractor.phone && (
                                <a href={`tel:${contractor.phone}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>
                                    <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Phone</span>
                                    <span>{contractor.phone}</span>
                                </a>
                            )}
                            {contractor.business_email && (
                                <a href={`mailto:${contractor.business_email}`} style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 13, textDecoration: "none" }}>
                                    <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Email</span>
                                    <span>{contractor.business_email}</span>
                                </a>
                            )}
                            {contractor.address && (
                                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                                    <span style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Location</span>
                                    <span>{contractor.address}</span>
                                </span>
                            )}
                        </div>

                        {/* CTAs */}
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                            <button onClick={scrollToForm} style={{
                                background: btnColor, color: "#fff", border: "none",
                                padding: "16px 36px", fontSize: 12, fontWeight: 800,
                                cursor: "pointer", letterSpacing: ".12em", textTransform: "uppercase",
                            }}>
                                → Get a free estimate
                            </button>
                            {projects.length > 0 && (
                                <button onClick={() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })}
                                    style={{ background: "transparent", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.2)", padding: "16px 36px", fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: ".12em", textTransform: "uppercase" }}>
                                    View work
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll indicator */}
                <div style={{ position: "absolute", bottom: 32, right: 48, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, letterSpacing: ".2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", writingMode: "vertical-rl" }}>Scroll</span>
                    <div style={{ width: 1, height: 60, background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }} />
                </div>
            </section>

            {/* ── ABOUT ── */}
            {contractor.about && (
                <section style={{ background: "#0a0a0a", padding: "120px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80, alignItems: "start" }}>
                        <div>
                            <p style={{ margin: "0 0 16px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: ".2em", textTransform: "uppercase" }}>01 — About</p>
                            <div style={{ width: 40, height: 1, background: "rgba(255,255,255,0.2)" }} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: "clamp(16px, 2vw, 22px)", color: "rgba(255,255,255,0.75)", lineHeight: 1.85, fontWeight: 300 }}>{contractor.about}</p>
                        </div>
                    </div>
                </section>
            )}

            {/* ── BEFORE / AFTER ── */}
            {beforeAfterProjects.length > 0 && (
                <section style={{ background: "#050505", padding: "120px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 60, flexWrap: "wrap", gap: 20 }}>
                            <div>
                                <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: ".2em", textTransform: "uppercase" }}>02 — Transformations</p>
                                <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", textTransform: "uppercase" }}>Before & After</h2>
                            </div>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 12, maxWidth: 260, lineHeight: 1.7 }}>Drag the handle to compare before and after each project.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: 4 }}>
                            {beforeAfterProjects.slice(0, 4).map(project => {
                                const before = project.images.find(i => i.photo_type === "before");
                                const after = project.images.find(i => i.photo_type === "after");
                                return (
                                    <div key={project.id}>
                                        <BeforeAfterSlider beforeUrl={before.image_url} afterUrl={after.image_url} title={project.title} />
                                        <p style={{ margin: "12px 0 0", fontWeight: 700, color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: ".05em", textTransform: "uppercase" }}>{project.title}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* ── GALLERY ── */}
            {projects.length > 0 && (
                <section id="gallery" style={{ background: "#0a0a0a", padding: "120px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ maxWidth: 960, margin: "0 auto" }}>
                        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 60, flexWrap: "wrap", gap: 20 }}>
                            <div>
                                <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: ".2em", textTransform: "uppercase" }}>03 — Portfolio</p>
                                <h2 style={{ margin: 0, fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", textTransform: "uppercase" }}>Our Work</h2>
                            </div>
                            <p style={{ margin: 0, color: "rgba(255,255,255,0.3)", fontSize: 12, maxWidth: 260, lineHeight: 1.7 }}>Click any project to view full photos.</p>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 4 }}>
                            {projects.map(project => (
                                <ProjectCard key={project.id} project={project} onClick={setSelectedProject} btnColor={btnColor} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── ESTIMATE FORM ── */}
            <section ref={formRef} style={{ background: "#050505", padding: "120px 48px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
                    {/* Left */}
                    <div>
                        <p style={{ margin: "0 0 12px", fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.25)", letterSpacing: ".2em", textTransform: "uppercase" }}>04 — Contact</p>
                        <h2 style={{ margin: "0 0 24px", fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", textTransform: "uppercase", lineHeight: .95 }}>
                            Request<br />an estimate
                        </h2>
                        <p style={{ margin: "0 0 48px", color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.8, maxWidth: 320 }}>
                            Tell us about your project and {contractor.business_name} will get back to you with a detailed, transparent quote.
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {contractor.phone && (
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: 9, letterSpacing: ".15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Phone</p>
                                    <a href={`tel:${contractor.phone}`} style={{ color: "#fff", textDecoration: "none", fontSize: 16, fontWeight: 700 }}>{contractor.phone}</a>
                                </div>
                            )}
                            {contractor.business_email && (
                                <div>
                                    <p style={{ margin: "0 0 4px", fontSize: 9, letterSpacing: ".15em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>Email</p>
                                    <a href={`mailto:${contractor.business_email}`} style={{ color: "#fff", textDecoration: "none", fontSize: 15 }}>{contractor.business_email}</a>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Right — Form */}
                    <div>
                        <EstimateRequestForm slug={slug} contractorName={contractor.business_name} btnColor={btnColor} />
                    </div>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ background: "#0a0a0a", padding: "32px 48px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {contractor.logo_image && <img src={contractor.logo_image} alt="logo" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />}
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{contractor.business_name}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: ".06em" }}>
                    © {new Date().getFullYear()} · Powered by TradeQuote
                </p>
            </footer>

            {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
        </div>
    );
}