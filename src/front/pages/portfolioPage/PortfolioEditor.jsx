// src/pages/Portfolio/PortfolioEditor.jsx
// Contractor settings page — edit hero color, button color, logo, cover, about, slug
// Route: /providerdashboard/portfolio/settings

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

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

// ── Live preview hero ─────────────────────────────────────────────────────────
function HeroPreview({ settings }) {
    const { hero_color, btn_color, business_name, description, phone, business_email, address, logo_image, cover_image } = settings;
    return (
        <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #e2e8f0" }}>
            {/* Hero */}
            <div style={{ background: hero_color || "#1e293b", padding: "28px 24px 24px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                    {logo_image
                        ? <img src={logo_image} alt="Logo" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.25)", flexShrink: 0 }} />
                        : (
                            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px dashed rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏠</div>
                        )
                    }
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 800, color: "#fff", lineHeight: 1.2 }}>{business_name || "Your Business Name"}</p>
                        <p style={{ margin: "0 0 12px", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{description || "Your tagline appears here"}</p>
                        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                            {phone && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>📞 {phone}</span>}
                            {business_email && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>✉️ {business_email}</span>}
                            {address && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>📍 {address}</span>}
                        </div>
                        <button style={{ background: btn_color || "#1d6b3e", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "default" }}>
                            📋 Get a free estimate
                        </button>
                    </div>
                </div>
            </div>
            {/* Cover image below hero */}
            {cover_image && (
                <div style={{ width: "100%", height: 100, overflow: "hidden", position: "relative" }}>
                    <img src={cover_image} alt="Cover"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${hero_color || "#1e293b"} 0%, transparent 40%)` }} />
                </div>
            )}
            {/* Footer strip */}
            <div style={{ background: hero_color || "#1e293b", padding: "8px 16px", borderTop: cover_image ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                    © {new Date().getFullYear()} {business_name || "Your Business"} · Powered by TradeQuote
                </p>
            </div>
        </div>
    );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({ label, hint, children }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>{label}</label>
            {hint && <p style={{ margin: "0 0 6px", fontSize: 12, color: "#94a3b8" }}>{hint}</p>}
            {children}
        </div>
    );
}

const inp = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #e2e8f0", borderRadius: 10,
    fontSize: 14, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", color: "#1e293b",
};

// ── Image Upload Button ───────────────────────────────────────────────────────
function ImageUploadField({ label, hint, imageType, currentUrl, onUploaded }) {
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("image_type", imageType);
            const res = await fetch(`${BASE}/api/portfolio/settings/logo`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token()}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onUploaded(data.url);
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <Field label={label} hint={hint}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {currentUrl && (
                    imageType === "logo"
                        ? <img src={currentUrl} alt="Logo" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #e2e8f0", flexShrink: 0 }} />
                        : <img src={currentUrl} alt="Cover" style={{ width: 80, height: 44, borderRadius: 8, objectFit: "cover", border: "1.5px solid #e2e8f0", flexShrink: 0 }} />
                )}
                <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                        style={{ padding: "8px 16px", border: "1.5px solid #e2e8f0", borderRadius: 8, background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                        {uploading ? "Uploading…" : `⬆ ${currentUrl ? "Change" : "Upload"}`}
                    </button>
                    {currentUrl && (
                        <button type="button" onClick={() => onUploaded("")}
                            style={{ padding: "8px 12px", border: "1.5px solid #fecaca", borderRadius: 8, background: "#fff", fontSize: 13, color: "#dc2626", cursor: "pointer" }}>
                            Remove
                        </button>
                    )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
            </div>
        </Field>
    );
}

// ── MAIN EDITOR PAGE ──────────────────────────────────────────────────────────
export default function PortfolioEditor() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState({
        business_name: "", description: "", about: "",
        phone: "", business_email: "", address: "",
        logo_image: "", cover_image: "", website_slug: "",
        hero_color: "#1e293b", btn_color: "#1d6b3e",
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch("/api/portfolio/settings")
            .then(d => { setSettings(d.settings); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));

    const handleSave = async () => {
        setSaving(true); setError("");
        try {
            await apiFetch("/api/portfolio/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const portfolioUrl = settings.website_slug
        ? `${window.location.origin}/portfolio/${settings.website_slug}`
        : null;

    if (loading) return (
        <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ width: 36, height: 36, border: "3px solid #16a34a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    return (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px,3vw,24px) clamp(12px,3vw,16px)" }}>
            <style>{`
                .pf-editor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
                .pf-editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
                .pf-color-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .pf-phone-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                @media (max-width: 700px) {
                    .pf-editor-grid { grid-template-columns: 1fr; }
                    .pf-color-grid { grid-template-columns: 1fr; }
                    .pf-phone-grid { grid-template-columns: 1fr; }
                    .pf-editor-header { flex-direction: column; align-items: flex-start; }
                }
            `}</style>
            {/* Header */}
            <div className="pf-editor-header">
                <div>
                    <button onClick={() => navigate("/providerdashboard/portfolio")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: 0, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                        ← Back to portfolio
                    </button>
                    <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#1e293b" }}>🎨 Portfolio settings</h2>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>Customize how your public portfolio looks to clients</p>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                    {portfolioUrl && (
                        <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                            style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "#f0fdf4", color: "#16a34a", border: "1.5px solid #86efac", textDecoration: "none" }}>
                            👁 Preview →
                        </a>
                    )}
                    <button onClick={handleSave} disabled={saving}
                        style={{ padding: "10px 24px", borderRadius: 10, fontSize: 14, fontWeight: 700, background: saving ? "#94a3b8" : "#1e293b", color: "#fff", border: "none", cursor: saving ? "default" : "pointer" }}>
                        {saving ? "Saving…" : saved ? "✓ Saved!" : "Save changes"}
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 10, padding: "12px 16px", marginBottom: 20, color: "#dc2626", fontSize: 14 }}>
                    ⚠ {error}
                </div>
            )}

            <div className="pf-editor-grid">

                {/* ── LEFT: Form ── */}
                <div>

                    {/* Section: Business info */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: "24px", marginBottom: 16 }}>
                        <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: ".05em" }}>Business info</p>

                        <Field label="Business name" hint="Shown in the hero and footer">
                            <input style={inp} value={settings.business_name} onChange={e => set("business_name", e.target.value)} placeholder="Avila Pro Contractors" />
                        </Field>

                        <Field label="Tagline / description" hint="One sentence under your name">
                            <input style={inp} value={settings.description} onChange={e => set("description", e.target.value)} placeholder="Professional painting & flooring in Miami, FL" />
                        </Field>

                        <Field label="About us" hint="2–3 sentences shown in the About section">
                            <textarea style={{ ...inp, minHeight: 80, resize: "vertical" }}
                                value={settings.about} onChange={e => set("about", e.target.value)}
                                placeholder="Family-owned business with 12+ years of experience…" />
                        </Field>

                        <div className="pf-phone-grid">
                            <Field label="Phone">
                                <input style={inp} value={settings.phone} onChange={e => set("phone", e.target.value)} placeholder="(305) 555-0142" />
                            </Field>
                            <Field label="Email">
                                <input style={inp} type="email" value={settings.business_email} onChange={e => set("business_email", e.target.value)} placeholder="hello@company.com" />
                            </Field>
                        </div>

                        <Field label="Address / City">
                            <input style={inp} value={settings.address} onChange={e => set("address", e.target.value)} placeholder="Miami, FL" />
                        </Field>

                        <Field label="Portfolio URL slug" hint={`Your public page: /portfolio/{slug}`}>
                            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid #e2e8f0", borderRadius: 10, overflow: "hidden" }}>
                                <span style={{ padding: "10px 12px", background: "#f8fafc", color: "#94a3b8", fontSize: 13, borderRight: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>/portfolio/</span>
                                <input style={{ ...inp, border: "none", borderRadius: 0 }}
                                    value={settings.website_slug} onChange={e => set("website_slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                    placeholder="avila-pro" />
                            </div>
                            {portfolioUrl && (
                                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                                    <code style={{ fontSize: 11, color: "#64748b", flex: 1 }}>{portfolioUrl}</code>
                                    <button type="button" onClick={() => { navigator.clipboard.writeText(portfolioUrl); }}
                                        style={{ fontSize: 11, padding: "3px 10px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: "pointer", color: "#374151" }}>Copy</button>
                                </div>
                            )}
                        </Field>
                    </div>

                    {/* Section: Colors */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: "24px", marginBottom: 16 }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: ".05em" }}>Hero colors</p>
                        <p style={{ margin: "0 0 18px", fontSize: 12, color: "#94a3b8" }}>Pick colors that match your brand — any combination works</p>

                        <div className="pf-color-grid">
                            <Field label="Hero background color" hint="Dark colors work best with any logo">
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <input type="color" value={settings.hero_color} onChange={e => set("hero_color", e.target.value)}
                                        style={{ width: 40, height: 36, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 2, cursor: "pointer" }} />
                                    <input style={{ ...inp, flex: 1 }}
                                        value={settings.hero_color}
                                        onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) set("hero_color", e.target.value); }}
                                        placeholder="#1e293b" maxLength={7} />
                                </div>
                                {/* Color presets */}
                                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                    {["#0f172a", "#1e293b", "#1c1917", "#292524", "#111827", "#1e1b4b", "#14532d", "#422006"].map(c => (
                                        <div key={c} onClick={() => set("hero_color", c)}
                                            style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: "pointer", border: settings.hero_color === c ? "2px solid #60a5fa" : "2px solid transparent" }} />
                                    ))}
                                </div>
                            </Field>

                            <Field label="Button / accent color" hint="CTA button and section labels">
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                    <input type="color" value={settings.btn_color} onChange={e => set("btn_color", e.target.value)}
                                        style={{ width: 40, height: 36, border: "1.5px solid #e2e8f0", borderRadius: 8, padding: 2, cursor: "pointer" }} />
                                    <input style={{ ...inp, flex: 1 }}
                                        value={settings.btn_color}
                                        onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) set("btn_color", e.target.value); }}
                                        placeholder="#1d6b3e" maxLength={7} />
                                </div>
                                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                                    {["#1d6b3e", "#0369a1", "#7c3aed", "#b45309", "#be123c", "#0891b2", "#15803d", "#c2410c"].map(c => (
                                        <div key={c} onClick={() => set("btn_color", c)}
                                            style={{ width: 24, height: 24, borderRadius: 6, background: c, cursor: "pointer", border: settings.btn_color === c ? "2px solid #60a5fa" : "2px solid transparent" }} />
                                    ))}
                                </div>
                            </Field>
                        </div>
                    </div>

                    {/* Section: Images */}
                    <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", padding: "24px" }}>
                        <p style={{ margin: "0 0 18px", fontSize: 13, fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: ".05em" }}>Images</p>

                        <ImageUploadField
                            label="Logo"
                            hint="PNG or SVG with transparent background recommended. Shown as a circle in the hero."
                            imageType="logo"
                            currentUrl={settings.logo_image}
                            onUploaded={url => set("logo_image", url)}
                        />

                        <ImageUploadField
                            label="Cover image"
                            hint="Wide banner photo shown at the bottom of the hero. Your best project photo works great here."
                            imageType="cover"
                            currentUrl={settings.cover_image}
                            onUploaded={url => set("cover_image", url)}
                        />
                    </div>
                </div>

                {/* ── RIGHT: Live Preview ── */}
                <div style={{ position: "sticky", top: 24 }}>
                    <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Live preview</p>
                    <HeroPreview settings={settings} />

                    <div style={{ marginTop: 16, background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 12, padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 700, color: "#15803d" }}>💡 Logo tip</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#166534", lineHeight: 1.6 }}>
                            Your logo will be placed on the hero background color you choose. If your logo is green, pick a dark navy or charcoal hero — they never clash because you control both colors.
                        </p>
                    </div>

                    <div style={{ marginTop: 12, background: "#fff", border: "1px solid #f1f5f9", borderRadius: 12, padding: "14px 16px" }}>
                        <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: ".05em" }}>What your clients see</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {[
                                "Hero with your logo, name, contacts, and CTA button",
                                "About section with your bio",
                                "Before/After drag slider for projects that have both photos",
                                "Project gallery grid — click to open full photos",
                                "Estimate request form that lands in your dashboard",
                            ].map((item, i) => (
                                <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "#374151" }}>
                                    <span style={{ color: "#16a34a", flexShrink: 0 }}>✓</span>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSave} disabled={saving}
                        style={{ marginTop: 16, width: "100%", padding: "12px", borderRadius: 12, fontSize: 15, fontWeight: 700, background: saving ? "#94a3b8" : "#1e293b", color: "#fff", border: "none", cursor: saving ? "default" : "pointer" }}>
                        {saving ? "Saving…" : saved ? "✓ Saved!" : "💾 Save changes"}
                    </button>
                </div>
            </div>

            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
}