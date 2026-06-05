// src/pages/portfolioPage/PublicPortfolioPage.jsx — FULLY RESPONSIVE

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

const BASE = import.meta.env.VITE_BACKEND_URL || "";

function BeforeAfterSlider({ beforeUrl, afterUrl }) {
    const [pos, setPos] = useState(50);
    const dragging = useRef(false);
    const ref = useRef();
    const calc = (x) => { const r = ref.current.getBoundingClientRect(); return Math.max(2, Math.min(98, ((x - r.left) / r.width) * 100)); };
    return (
        <div ref={ref} onMouseMove={e => { if (dragging.current) setPos(calc(e.clientX)); }} onMouseUp={() => { dragging.current = false; }} onMouseLeave={() => { dragging.current = false; }} onTouchMove={e => { e.preventDefault(); setPos(calc(e.touches[0].clientX)); }}
            style={{ position: "relative", width: "100%", aspectRatio: "4/3", overflow: "hidden", borderRadius: 6, cursor: "ew-resize", userSelect: "none", touchAction: "none", background: "#e2e8f0" }}>
            <img src={afterUrl} alt="after" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", inset: 0, width: `${pos}%`, overflow: "hidden" }}><img src={beforeUrl} alt="before" style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${10000 / pos}%`, maxWidth: "none", objectFit: "cover" }} /></div>
            <span style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 3, letterSpacing: ".1em", textTransform: "uppercase" }}>Before</span>
            <span style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.65)", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 8px", borderRadius: 3, letterSpacing: ".1em", textTransform: "uppercase" }}>After</span>
            <div onMouseDown={() => { dragging.current = true; }} onTouchStart={() => { dragging.current = true; }} style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, transform: "translateX(-50%)", width: 2, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "ew-resize" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#374151", boxShadow: "0 2px 10px rgba(0,0,0,0.3)", flexShrink: 0 }}>⇔</div>
            </div>
        </div>
    );
}

function ProjectModal({ project, onClose }) {
    const before = project.images.find(i => i.photo_type === "before");
    const after = project.images.find(i => i.photo_type === "after");
    const general = project.images.filter(i => i.photo_type === "general");
    const [zoom, setZoom] = useState(null);
    useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />
            <div style={{ position: "relative", zIndex: 1, background: "#fff", borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "auto", padding: "clamp(16px,4vw,28px)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ margin: 0, fontSize: "clamp(16px,4vw,20px)", fontWeight: 800, color: "#1e293b" }}>{project.title}</h2>
                    <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: 34, height: 34, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                {before && after && <div style={{ marginBottom: 14 }}><BeforeAfterSlider beforeUrl={before.image_url} afterUrl={after.image_url} /></div>}
                {before && !after && <img src={before.image_url} alt="Before" style={{ width: "100%", borderRadius: 8, maxHeight: 300, objectFit: "cover", display: "block", marginBottom: 10 }} />}
                {after && !before && <img src={after.image_url} alt="After" style={{ width: "100%", borderRadius: 8, maxHeight: 300, objectFit: "cover", display: "block", marginBottom: 10 }} />}
                {general.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 8 }}>{general.map(img => <img key={img.id} src={img.image_url} alt="" onClick={() => setZoom(img.image_url)} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6, cursor: "zoom-in", display: "block" }} />)}</div>}
            </div>
            {zoom && <div onClick={() => setZoom(null)} style={{ position: "fixed", inset: 0, zIndex: 20000, background: "rgba(0,0,0,0.95)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out", padding: 16 }}><img src={zoom} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }} /></div>}
        </div>
    );
}

function EstimateForm({ slug, contractorName, accent }) {
    const [form, setForm] = useState({ customer_name: "", customer_email: "", customer_phone: "", customer_address: "", description: "" });
    const [state, setState] = useState("idle"); // idle | loading | done | error
    const [errMsg, setErrMsg] = useState("");
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const submit = async (e) => {
        e.preventDefault(); setState("loading");
        try {
            const r = await fetch(`${BASE}/api/portfolio/${slug}/request-estimate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, estimate_type: "painting" }) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error || "Failed");
            setState("done");
        } catch (err) { setErrMsg(err.message); setState("error"); }
    };
    if (state === "done") return <div style={{ textAlign: "center", padding: "32px 0", color: "#fff" }}><div style={{ fontSize: 48, marginBottom: 12 }}>✅</div><h3 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 800 }}>Request sent!</h3><p style={{ opacity: .7, margin: 0 }}>{contractorName} will contact you shortly.</p></div>;
    const inp = { width: "100%", padding: "12px 14px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box", color: "#111" };
    return (
        <form onSubmit={submit}>
            <div className="pf-form2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <input style={inp} required placeholder="Full Name" value={form.customer_name} onChange={e => set("customer_name", e.target.value)} />
                <input style={inp} type="email" required placeholder="Email Address" value={form.customer_email} onChange={e => set("customer_email", e.target.value)} />
            </div>
            <div className="pf-form2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <input style={inp} type="tel" required placeholder="Phone Number" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} />
                <input style={inp} placeholder="Project Address" value={form.customer_address} onChange={e => set("customer_address", e.target.value)} />
            </div>
            <textarea style={{ ...inp, minHeight: 80, resize: "vertical", marginBottom: 12 }} placeholder="Tell us about your project…" value={form.description} onChange={e => set("description", e.target.value)} />
            {state === "error" && <p style={{ color: "#fca5a5", fontSize: 13, margin: "0 0 10px" }}>⚠ {errMsg}</p>}
            <button type="submit" disabled={state === "loading"} style={{ width: "100%", padding: "14px", background: state === "loading" ? "#94a3b8" : accent, color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 800, cursor: state === "loading" ? "default" : "pointer", letterSpacing: ".06em", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {state === "loading" ? "Sending…" : <>SEND REQUEST <span style={{ fontSize: 16 }}>→</span></>}
            </button>
        </form>
    );
}

function GalleryCard({ project, onClick }) {
    const cover = project.images.find(i => i.is_cover) || project.images[0];
    const [hov, setHov] = useState(false);
    return (
        <div onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ cursor: "pointer", borderRadius: 8, overflow: "hidden", background: "#fff", boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.13)" : "0 2px 8px rgba(0,0,0,0.07)", transition: "all .2s", transform: hov ? "translateY(-2px)" : "none" }}>
            <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#f1f5f9" }}>
                {cover ? <img src={cover.image_url} alt={project.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s", transform: hov ? "scale(1.05)" : "scale(1)" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏠</div>}
            </div>
            <div style={{ padding: "10px 12px" }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#1e293b" }}>{project.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8" }}>{project.images.length} photo{project.images.length !== 1 ? "s" : ""}</p>
            </div>
        </div>
    );
}

export default function PublicPortfolioPage() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modal, setModal] = useState(null);
    const [menuOpen, setMenu] = useState(false);
    const formRef = useRef();

    useEffect(() => {
        fetch(`${BASE}/api/portfolio/${slug}`).then(r => r.json()).then(d => { if (d.error) throw new Error(d.error); setData(d); }).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, [slug]);

    const scrollToForm = () => { setMenu(false); formRef.current?.scrollIntoView({ behavior: "smooth" }); };

    if (loading) return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#1e3a5f", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 14px" }} /><p style={{ color: "#64748b", margin: 0, fontSize: 13 }}>Loading…</p></div><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
    if (error) return <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ textAlign: "center" }}><div style={{ fontSize: 52, marginBottom: 14 }}>🏗️</div><h2 style={{ margin: "0 0 8px", color: "#1e293b" }}>Portfolio not found</h2><p style={{ color: "#64748b" }}>This link may be incorrect.</p></div></div>;

    const { contractor, projects } = data;
    const navy = contractor.hero_color || "#1e3a5f";
    const accent = contractor.btn_color || "#2563eb";

    // Partition projects by section — strict, no fallback
    const getSection = (p) => p.section || "gallery";
    const baProjects = projects.filter(p => p.images.some(i => i.photo_type === "before") && p.images.some(i => i.photo_type === "after"));
    const featuredProjects = projects.filter(p => getSection(p) === "featured" && p.images.length > 0);
    const galleryProjects = projects.filter(p => getSection(p) === "gallery" && p.images.length > 0);

    // Featured: ONLY explicitly marked as featured — no fallback to gallery
    const featProj = featuredProjects.length > 0 ? featuredProjects[0] : null;
    // Show max 3 images in the mosaic, rest hidden (visible in modal)
    const featImgs = featProj ? featProj.images.filter(i => i.photo_type === "general" || i.is_cover).slice(0, 3) : [];

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflowY: "auto", background: "#fff", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", color: "#111" }}>
            <style>{`
                *{box-sizing:border-box;}body{margin:0;}
                @keyframes spin{to{transform:rotate(360deg)}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
                @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
                .pf-nav-d{display:flex;align-items:center;gap:20px;}
                .pf-hbg{display:none!important;}
                .pf-mob{display:none;}
                .pf-hero{position:relative;min-height:520px;display:flex;align-items:flex-end;}
                .pf-hc{position:relative;z-index:2;padding:clamp(40px,6vw,80px) clamp(20px,5vw,72px);max-width:580px;animation:fadeUp .7s ease both;}
                .pf-sec{padding:clamp(36px,6vw,72px) clamp(20px,5vw,72px);}
                .pf-max{max-width:1100px;margin:0 auto;}
                .pf-ba{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;}
                .pf-feat{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;}
                .pf-fp{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:8px;height:360px;}
                .pf-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;}
                .pf-cta{display:grid;grid-template-columns:auto 1fr;gap:56px;align-items:start;}
                .pf-form2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
                .pf-fi{display:flex;align-items:center;gap:10;flex-shrink:0;}
                @media(max-width:860px){
                    .pf-nav-d{display:none!important;}
                    .pf-hbg{display:flex!important;}
                    .pf-mob{display:flex;flex-direction:column;position:absolute;top:60px;left:0;right:0;background:var(--pf-n);z-index:300;border-top:1px solid rgba(255,255,255,0.1);animation:slideDown .2s ease;}
                    .pf-ba{grid-template-columns:1fr 1fr;}
                    .pf-feat{grid-template-columns:1fr;gap:28px;}
                    .pf-fp{height:240px;}
                    .pf-gal{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));}
                    .pf-cta{grid-template-columns:1fr;gap:32px;}
                    .pf-hero{min-height:400px;}
                }
                @media(max-width:560px){
                    .pf-ba{grid-template-columns:1fr;}
                    .pf-fp{grid-template-columns:1fr;grid-template-rows:auto;height:auto;}
                    .pf-fp>div{grid-row:auto!important;grid-column:auto!important;aspect-ratio:4/3;height:auto;}
                    .pf-gal{grid-template-columns:repeat(2,1fr);gap:10px;}
                    .pf-form2{grid-template-columns:1fr!important;}
                    .pf-hero{min-height:320px;}
                    .pf-fi-inner{flex-direction:column;text-align:center;gap:10px;}
                }
            `}</style>

            {/* NAV */}
            <nav style={{ "--pf-n": navy, background: navy, height: 60, padding: "0 clamp(16px,4vw,48px)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 200, gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    {contractor.logo_image ? <img src={contractor.logo_image} alt="logo" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.2)" }} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🏠</div>}
                    <div><p style={{ margin: 0, fontWeight: 800, fontSize: 13, color: "#fff", textTransform: "uppercase", letterSpacing: ".05em", lineHeight: 1.2 }}>{contractor.business_name}</p>{contractor.description && <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".1em" }}>{contractor.description}</p>}</div>
                </div>
                <div className="pf-nav-d">
                    {["Home", "About", "Services", "Projects", "Reviews", "Contact"].map(item => (
                        <a key={item} href={`#${item.toLowerCase()}`} onClick={item === "Contact" ? e => { e.preventDefault(); scrollToForm(); } : undefined} style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, textDecoration: "none", fontWeight: 600, letterSpacing: ".03em", whiteSpace: "nowrap" }}>{item}</a>
                    ))}
                    <button onClick={scrollToForm} style={{ background: accent, color: "#fff", border: "none", padding: "9px 18px", borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Request Estimate</button>
                </div>
                <button className="pf-hbg" onClick={() => setMenu(v => !v)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 38, height: 38, borderRadius: 6, fontSize: 18, cursor: "pointer", alignItems: "center", justifyContent: "center" }}>{menuOpen ? "✕" : "☰"}</button>
                {menuOpen && (
                    <div className="pf-mob">
                        {["Home", "About", "Projects", "Contact"].map(item => (
                            <a key={item} href={`#${item.toLowerCase()}`} onClick={e => { if (item === "Contact") { e.preventDefault(); scrollToForm(); } else setMenu(false); }} style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, fontWeight: 600, padding: "14px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", textDecoration: "none" }}>{item}</a>
                        ))}
                        <div style={{ padding: "14px 24px" }}><button onClick={scrollToForm} style={{ width: "100%", background: accent, color: "#fff", border: "none", padding: "12px", borderRadius: 6, fontSize: 14, fontWeight: 800, cursor: "pointer", textTransform: "uppercase" }}>Request Estimate</button></div>
                    </div>
                )}
            </nav>

            {/* HERO */}
            <section id="home" className="pf-hero" style={{ background: navy }}>
                {contractor.cover_image && (<><img src={contractor.cover_image} alt="hero" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} /><div style={{ position: "absolute", inset: 0, background: `linear-gradient(to right,${navy}ee 0%,${navy}99 50%,${navy}44 100%),linear-gradient(to top,${navy}cc 0%,transparent 60%)` }} /></>)}
                <div className="pf-hc">
                    {contractor.logo_image && (<div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><img src={contractor.logo_image} alt="logo" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.25)" }} /><div><p style={{ margin: 0, fontWeight: 900, fontSize: 16, color: "#fff", textTransform: "uppercase", letterSpacing: ".04em" }}>{contractor.business_name}</p>{contractor.description && <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: ".1em" }}>{contractor.description}</p>}</div></div>)}
                    <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px,5.5vw,56px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, letterSpacing: "-.02em", textTransform: "uppercase" }}>We bring<br />color to life.</h1>
                    <p style={{ margin: "0 0 28px", fontSize: "clamp(13px,1.8vw,16px)", color: "rgba(255,255,255,0.7)", lineHeight: 1.7, maxWidth: 380 }}>{contractor.about ? contractor.about.slice(0, 140) + (contractor.about.length > 140 ? "…" : "") : "Professional contractor services for beautiful results that last."}</p>
                    <button onClick={scrollToForm} style={{ background: accent, color: "#fff", border: "none", padding: "13px clamp(20px,3vw,28px)", borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8 }}>REQUEST ESTIMATE <span style={{ fontSize: 14 }}>→</span></button>
                </div>
            </section>

            {/* TRUST */}
            <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0", padding: "16px clamp(16px,5vw,60px)" }}>
                <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "center", gap: "clamp(20px,5vw,56px)", flexWrap: "wrap" }}>
                    {["🆓 Free Estimates", "⭐ Quality Work", "🛡️ Fully Insured", "✅ Satisfaction Guaranteed"].map(t => <span key={t} style={{ fontSize: "clamp(11px,1.5vw,13px)", fontWeight: 700, color: "#374151" }}>{t}</span>)}
                </div>
            </div>

            {/* ABOUT */}
            {contractor.about && (
                <section id="about" className="pf-sec" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="pf-max" style={{ textAlign: "center", maxWidth: 760 }}>
                        <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: accent }}>About Us</p>
                        <h2 style={{ margin: "0 0 16px", fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, color: "#1e293b" }}>{contractor.business_name}</h2>
                        <p style={{ margin: 0, fontSize: "clamp(14px,1.8vw,17px)", color: "#374151", lineHeight: 1.85 }}>{contractor.about}</p>
                    </div>
                </section>
            )}

            {/* BEFORE & AFTER */}
            {baProjects.length > 0 && (
                <section className="pf-sec" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="pf-max">
                        <div style={{ textAlign: "center", marginBottom: "clamp(24px,4vw,48px)" }}>
                            <h2 style={{ margin: "0 0 8px", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: "#1e293b", textTransform: "uppercase", letterSpacing: "-.01em" }}>Before & After</h2>
                            <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>See the difference a fresh coat of paint can make.</p>
                        </div>
                        <div className="pf-ba">
                            {baProjects.slice(0, 3).map(p => {
                                const b = p.images.find(i => i.photo_type === "before"); const a = p.images.find(i => i.photo_type === "after");
                                return <div key={p.id}><BeforeAfterSlider beforeUrl={b.image_url} afterUrl={a.image_url} /><p style={{ margin: "8px 0 0", fontWeight: 700, color: "#1e293b", fontSize: 12, textAlign: "center" }}>{p.title}</p></div>;
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* FULL PROJECT (featured section) */}
            {featProj && featImgs.length > 0 && (
                <section className="pf-sec" style={{ background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="pf-max">
                        <div className="pf-feat">
                            <div>
                                <p style={{ margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: accent }}>Full Project</p>
                                <h2 style={{ margin: "0 0 14px", fontSize: "clamp(20px,3vw,32px)", fontWeight: 900, color: "#1e293b" }}>{featProj.title}</h2>
                                <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: "clamp(13px,1.6vw,15px)", lineHeight: 1.8 }}>From preparation to the final coat, we take pride in every detail. Check out this complete exterior painting project.</p>
                                <button onClick={() => setModal(featProj)} style={{ background: "transparent", color: navy, border: `2px solid ${navy}`, padding: "11px 24px", borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: "pointer", letterSpacing: ".08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8 }}>VIEW PROJECT →</button>
                            </div>
                            {/* Max 3 images: 1 large left + 2 stacked right */}
                            <div className="pf-fp">
                                {featImgs.slice(0, 3).map((img, idx) => (
                                    <div key={img.id} style={{ overflow: "hidden", borderRadius: 6, gridRow: idx === 0 ? "1/3" : "auto", gridColumn: idx === 0 ? "1" : "2", minHeight: 80 }}>
                                        <img src={img.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .3s" }} onMouseEnter={e => e.target.style.transform = "scale(1.05)"} onMouseLeave={e => e.target.style.transform = "scale(1)"} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* OUR WORK / GALLERY */}
            {galleryProjects.length > 0 && (
                <section id="projects" className="pf-sec" style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <div className="pf-max">
                        <div style={{ textAlign: "center", marginBottom: "clamp(24px,4vw,44px)" }}>
                            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".15em", color: accent }}>Our Work</p>
                            <h2 style={{ margin: 0, fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, color: "#1e293b" }}>Project Gallery</h2>
                        </div>
                        <div className="pf-gal">
                            {galleryProjects.map(p => <GalleryCard key={p.id} project={p} onClick={() => setModal(p)} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* REQUEST ESTIMATE */}
            <section ref={formRef} id="contact" className="pf-sec" style={{ background: navy }}>
                <div className="pf-max">
                    <div className="pf-cta">
                        <div style={{ minWidth: 200 }}>
                            <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.1)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 20 }}>📋</div>
                            <h2 style={{ margin: "0 0 12px", fontSize: "clamp(22px,3vw,36px)", fontWeight: 900, color: "#fff", lineHeight: 1.05, textTransform: "uppercase" }}>Request<br />an Estimate</h2>
                            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.6)", fontSize: "clamp(12px,1.4vw,14px)", lineHeight: 1.75 }}>Fill out the form and we'll get back to you within 24 hours with a free, no-obligation estimate.</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                                {["🆓 Free Estimates", "⭐ Quality Work", "✅ Satisfaction Guaranteed"].map(t => <span key={t} style={{ fontSize: "clamp(11px,1.3vw,13px)", color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>{t}</span>)}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                {contractor.phone && <a href={`tel:${contractor.phone}`} style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>📞 {contractor.phone}</a>}
                                {contractor.business_email && <a href={`mailto:${contractor.business_email}`} style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, textDecoration: "none" }}>✉️ {contractor.business_email}</a>}
                                {contractor.address && <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>📍 {contractor.address}</span>}
                            </div>
                        </div>
                        <div><EstimateForm slug={slug} contractorName={contractor.business_name} accent={accent} /></div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer style={{ background: "#0f172a", padding: "18px clamp(16px,4vw,60px)" }}>
                <div className="pf-fi-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {contractor.logo_image && <img src={contractor.logo_image} alt="logo" style={{ width: 26, height: 26, borderRadius: "50%", objectFit: "cover" }} />}
                        <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700 }}>{contractor.business_name}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>© {new Date().getFullYear()} {contractor.business_name}. All rights reserved. · Powered by TradeQuote</p>
                    <div style={{ display: "flex", gap: 12 }}>
                        {contractor.phone && <a href={`tel:${contractor.phone}`} style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>📞</a>}
                        {contractor.business_email && <a href={`mailto:${contractor.business_email}`} style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, textDecoration: "none" }}>✉️</a>}
                    </div>
                </div>
            </footer>

            {modal && <ProjectModal project={modal} onClose={() => setModal(null)} />}
        </div>
    );
}