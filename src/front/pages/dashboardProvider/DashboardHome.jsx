// src/pages/dashboardProvider/DashboardHome.jsx
// Clean version — no hardcoded placeholder data

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");

// ── Portfolio Share Card ──────────────────────────────────────────────────────
function PortfolioShareCard({ slug }) {
    const [copied, setCopied] = useState(false);

    if (!slug) {
        return (
            <div style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: 16, padding: "20px 24px", marginBottom: 24,
                display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
            }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                        📸 Set up your public portfolio
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
                        Add a portfolio URL slug so clients can view your work online
                    </p>
                </div>
                <Link to="/providerdashboard/portfolio/settings"
                    style={{
                        background: "#16a34a", color: "#fff", borderRadius: 10,
                        padding: "10px 20px", fontSize: 13, fontWeight: 700,
                        textDecoration: "none", whiteSpace: "nowrap",
                    }}>
                    🎨 Set up portfolio →
                </Link>
            </div>
        );
    }

    const portfolioUrl = `${window.location.origin}/portfolio/${slug}`;

    const copyLink = () => {
        navigator.clipboard.writeText(portfolioUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareVia = (platform) => {
        const text = `Check out my professional work portfolio!`;
        const urls = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + portfolioUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(portfolioUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(portfolioUrl)}`,
            email: `mailto:?subject=${encodeURIComponent("My professional portfolio")}&body=${encodeURIComponent(text + "\n\n" + portfolioUrl)}`,
            sms: `sms:?body=${encodeURIComponent(text + " " + portfolioUrl)}`,
        };
        window.open(urls[platform], "_blank", "noopener");
    };

    const shareButtons = [
        { id: "whatsapp", label: "WhatsApp", bg: "#25D366", emoji: "💬" },
        { id: "facebook", label: "Facebook", bg: "#1877F2", emoji: "📘" },
        { id: "twitter", label: "Twitter", bg: "#1DA1F2", emoji: "🐦" },
        { id: "email", label: "Email", bg: "#374151", emoji: "✉️" },
        { id: "sms", label: "Text/SMS", bg: "#7C3AED", emoji: "📱" },
    ];

    return (
        <div style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: 16, padding: "20px 24px", marginBottom: 24,
        }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div>
                    <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                        📸 Your portfolio is live
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                        Share this link with clients and on social media
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                        style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                        👁 Preview →
                    </a>
                    <Link to="/providerdashboard/portfolio/settings"
                        style={{ background: "rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, textDecoration: "none", border: "1px solid rgba(255,255,255,0.15)" }}>
                        🎨 Edit
                    </Link>
                </div>
            </div>

            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                background: "rgba(255,255,255,0.07)", borderRadius: 10,
                padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)",
            }}>
                <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {portfolioUrl}
                </span>
                <button onClick={copyLink} style={{
                    background: copied ? "#16a34a" : "rgba(255,255,255,0.15)",
                    color: "#fff", border: "none", borderRadius: 7,
                    padding: "5px 14px", fontSize: 12, fontWeight: 700,
                    cursor: "pointer", flexShrink: 0, transition: "background .2s",
                }}>
                    {copied ? "✓ Copied!" : "Copy link"}
                </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {shareButtons.map(btn => (
                    <button key={btn.id} onClick={() => shareVia(btn.id)} style={{
                        background: btn.bg, color: "#fff", border: "none",
                        borderRadius: 8, padding: "7px 14px", fontSize: 12,
                        fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 5,
                    }}>
                        {btn.emoji} {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
export const DashboardHome = () => {
    const { store } = useGlobalReducer();
    const [slug, setSlug] = useState("");

    useEffect(() => {
        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    }, []);

    // Fetch the contractor's portfolio settings to get the actual slug
    // (login only returns user.serialize() which doesn't include website_slug)
    useEffect(() => {
        const tk = token();
        if (!tk) return;
        fetch(`${BASE}/api/portfolio/settings`, {
            headers: { Authorization: `Bearer ${tk}` }
        })
            .then(r => r.json())
            .then(d => {
                if (d.settings?.website_slug) {
                    const s = d.settings.website_slug;
                    if (s && s !== "False" && s !== "None") {
                        setSlug(String(s));
                        // Note: add case "update_provider" to your reducer to sync store
                    }
                }
            })
            .catch(() => { });
    }, []);

    return (
        <>
            <PortfolioShareCard slug={slug} />

            <div className="dashboard-welcome-section">
                <div className="dashboard-welcome-content">
                    <h1 className="dashboard-welcome-title">
                        Welcome back, {store.provider?.name || "Contractor"}!
                    </h1>
                    <p className="dashboard-welcome-subtitle">
                        Here's what's happening with your business today.
                    </p>
                </div>
            </div>

            <div className="row mb-4 mt-3">
                <div className="col-12">
                    <h2 className="dashboard-section-title mb-3">Quick Actions</h2>
                    <div className="dashboard-quick-actions">
                        <Link to="/providerdashboard/estimate/new" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-file-text"></i>
                            </div>
                            <h4>New Estimate</h4>
                            <p>Create estimate for a client</p>
                        </Link>
                        <Link to="/providerdashboard/jobs" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-briefcase"></i>
                            </div>
                            <h4>View Jobs</h4>
                            <p>Manage your active jobs</p>
                        </Link>
                        <Link to="/providerdashboard/customers" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-person-plus"></i>
                            </div>
                            <h4>Customers</h4>
                            <p>View your client list</p>
                        </Link>
                        <Link to="/providerdashboard/portfolio" className="quick-action-card" style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="quick-action-icon">
                                <i className="bi bi-images"></i>
                            </div>
                            <h4>Portfolio</h4>
                            <p>Upload your work photos</p>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
};