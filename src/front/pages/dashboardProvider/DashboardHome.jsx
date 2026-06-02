// src/pages/dashboardProvider/DashboardHome.jsx — UPDATED
// Changes:
//   1. Added PortfolioShareCard component at the top of the dashboard
//   2. Uses store.provider.website_slug to build the portfolio URL

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

// ── Portfolio Share Card ───────────────────────────────────────────────────────
// Shows the contractor their public portfolio link + share buttons
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

            {/* URL copy bar */}
            <div style={{
                display: "flex", alignItems: "center", gap: 8, marginBottom: 16,
                background: "rgba(255,255,255,0.07)", borderRadius: 10,
                padding: "10px 14px", border: "1px solid rgba(255,255,255,0.1)",
            }}>
                <span style={{ flex: 1, fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {portfolioUrl}
                </span>
                <button onClick={copyLink}
                    style={{
                        background: copied ? "#16a34a" : "rgba(255,255,255,0.15)",
                        color: "#fff", border: "none", borderRadius: 7,
                        padding: "5px 14px", fontSize: 12, fontWeight: 700,
                        cursor: "pointer", flexShrink: 0, transition: "background .2s",
                    }}>
                    {copied ? "✓ Copied!" : "Copy link"}
                </button>
            </div>

            {/* Share buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {shareButtons.map(btn => (
                    <button key={btn.id} onClick={() => shareVia(btn.id)}
                        style={{
                            background: btn.bg, color: "#fff", border: "none",
                            borderRadius: 8, padding: "7px 14px",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 5,
                            opacity: 0.9, transition: "opacity .15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.9}
                    >
                        {btn.emoji} {btn.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ── MAIN DASHBOARD HOME ────────────────────────────────────────────────────────
export const DashboardHome = () => {
    const { store, dispatch } = useGlobalReducer();

    useEffect(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove());
        document.body.classList.remove('modal-open');
        document.body.style.overflow = 'auto';
        document.body.style.paddingRight = '0';
    }, []);

    // Get the contractor's slug from global store
    const slug = store.provider?.website_slug || "";

    return (
        <>
            {/* ── Portfolio share card — shown at the top of dashboard ── */}
            <PortfolioShareCard slug={slug} />

            <div className="dashboard-welcome-section">
                <div className="dashboard-welcome-content">
                    <h1 className="dashboard-welcome-title">
                        Welcome back, {store.provider?.name || "Contractor"}!
                    </h1>
                    <p className="dashboard-welcome-subtitle">Here's what's happening with your business today.</p>
                </div>
            </div>

            <div className="row dashboard-stats-grid">
                <div className="col-12 col-sm-6 col-lg-3 mb-4">
                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-info">
                                <p className="dashboard-stat-label">Total Revenue</p>
                                <p className="dashboard-stat-value">$12,450</p>
                                <p className="dashboard-stat-change positive">+12% from last month</p>
                            </div>
                            <div className="dashboard-stat-icon revenue">
                                <span className="dashboard-stat-icon-symbol">$</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3 mb-4">
                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-info">
                                <p className="dashboard-stat-label">Active Jobs</p>
                                <p className="dashboard-stat-value">24</p>
                                <p className="dashboard-stat-change neutral">3 new today</p>
                            </div>
                            <div className="dashboard-stat-icon jobs">
                                <span className="dashboard-stat-icon-symbol">📋</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3 mb-4">
                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-info">
                                <p className="dashboard-stat-label">New Customers</p>
                                <p className="dashboard-stat-value">8</p>
                                <p className="dashboard-stat-change positive">+2 from last week</p>
                            </div>
                            <div className="dashboard-stat-icon customers">
                                <span className="dashboard-stat-icon-symbol">👥</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-sm-6 col-lg-3 mb-4">
                    <div className="dashboard-stat-card">
                        <div className="dashboard-stat-content">
                            <div className="dashboard-stat-info">
                                <p className="dashboard-stat-label">Pending Invoices</p>
                                <p className="dashboard-stat-value">$3,200</p>
                                <p className="dashboard-stat-change negative">2 overdue</p>
                            </div>
                            <div className="dashboard-stat-icon invoices">
                                <span className="dashboard-stat-icon-symbol">📄</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4">
                <div className="col-12">
                    <h2 className="dashboard-section-title mb-3">Quick Actions</h2>
                    <div className="dashboard-quick-actions">
                        <div className="quick-action-card">
                            <div className="quick-action-icon">
                                <i className="bi bi-plus-circle"></i>
                            </div>
                            <h4>Create Job</h4>
                            <p>Add a new job or project</p>
                        </div>
                        <div className="quick-action-card">
                            <div className="quick-action-icon">
                                <i className="bi bi-file-text"></i>
                            </div>
                            <h4>New Estimate</h4>
                            <p>Create estimate for customer</p>
                        </div>
                        <div className="quick-action-card">
                            <div className="quick-action-icon">
                                <i className="bi bi-receipt"></i>
                            </div>
                            <h4>Send Invoice</h4>
                            <p>Bill for completed work</p>
                        </div>
                        <div className="quick-action-card">
                            <div className="quick-action-icon">
                                <i className="bi bi-person-plus"></i>
                            </div>
                            <h4>Add Customer</h4>
                            <p>Register new customer</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-lg-8 mb-4">
                    <div className="dashboard-recent-activity">
                        <h2 className="dashboard-section-title mb-3">Recent Activity</h2>
                        <div className="activity-list">
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <i className="bi bi-check-circle text-success"></i>
                                </div>
                                <div className="activity-content">
                                    <h5>Job Completed</h5>
                                    <p>Kitchen Renovation - John Smith</p>
                                    <small className="text-muted">2 hours ago</small>
                                </div>
                                <div className="activity-amount">
                                    <span className="text-success">+$2,500</span>
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <i className="bi bi-file-text text-primary"></i>
                                </div>
                                <div className="activity-content">
                                    <h5>New Estimate Request</h5>
                                    <p>Bathroom Remodel - Sarah Johnson</p>
                                    <small className="text-muted">5 hours ago</small>
                                </div>
                                <div className="activity-amount">
                                    <span className="text-primary">Pending</span>
                                </div>
                            </div>
                            <div className="activity-item">
                                <div className="activity-icon">
                                    <i className="bi bi-receipt text-warning"></i>
                                </div>
                                <div className="activity-content">
                                    <h5>Invoice Sent</h5>
                                    <p>Deck Construction - Mike Wilson</p>
                                    <small className="text-muted">1 day ago</small>
                                </div>
                                <div className="activity-amount">
                                    <span className="text-warning">$1,800</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-4 mb-4">
                    <div className="dashboard-upcoming">
                        <h2 className="dashboard-section-title mb-3">Upcoming Jobs</h2>
                        <div className="upcoming-list">
                            <div className="upcoming-item">
                                <div className="upcoming-date">
                                    <span className="date-day">15</span>
                                    <span className="date-month">MAR</span>
                                </div>
                                <div className="upcoming-content">
                                    <h5>Roof Repair</h5>
                                    <p className="text-muted">Customer: Tom Brown</p>
                                    <span className="badge bg-primary">In Progress</span>
                                </div>
                            </div>
                            <div className="upcoming-item">
                                <div className="upcoming-date">
                                    <span className="date-day">18</span>
                                    <span className="date-month">MAR</span>
                                </div>
                                <div className="upcoming-content">
                                    <h5>Window Installation</h5>
                                    <p className="text-muted">Customer: Lisa Davis</p>
                                    <span className="badge bg-warning">Scheduled</span>
                                </div>
                            </div>
                            <div className="upcoming-item">
                                <div className="upcoming-date">
                                    <span className="date-day">22</span>
                                    <span className="date-month">MAR</span>
                                </div>
                                <div className="upcoming-content">
                                    <h5>Painting Project</h5>
                                    <p className="text-muted">Customer: Robert Lee</p>
                                    <span className="badge bg-info">Estimate</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};