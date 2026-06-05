// src/components/dashboard/Topbar.jsx — UPDATED
// Changes: rich notification panel with client info + portfolio share fixed

import { useState, useEffect } from "react";
import {
    BiSearch, BiBell, BiUser, BiChevronDown,
    BiCreditCard, BiImages, BiCog, BiLogOut, BiFile, BiEnvelope, BiPhone, BiMap
} from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");

export const Topbar = ({ isMobile }) => {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenu] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [newEstimates, setNewEstimates] = useState(0);
    const [recentEstimates, setRecentEstimates] = useState([]);

    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    // ── Poll every 30s ──────────────────────────────────────────────────────
    useEffect(() => {
        const fetchNotifs = async () => {
            const tk = token();
            if (!tk) return;
            try {
                // Count
                const r1 = await fetch(`${BASE}/api/portfolio/notifications/count`, { headers: { Authorization: `Bearer ${tk}` } });
                const d1 = await r1.json();
                if (d1.new_estimates !== undefined) setNewEstimates(d1.new_estimates);

                // Recent estimates (last 5 new ones)
                const r2 = await fetch(`${BASE}/api/estimates?status=new&per_page=5`, { headers: { Authorization: `Bearer ${tk}` } });
                const d2 = await r2.json();
                if (d2.estimates) setRecentEstimates(d2.estimates);
            } catch { }
        };
        fetchNotifs();
        const iv = setInterval(fetchNotifs, 30000);
        return () => clearInterval(iv);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('provider');
        localStorage.removeItem('token');
        dispatch({ type: 'logout' });
        setIsProfileOpen(false);
        navigate('/?action=login');
    };

    const [portfolioSlug, setPortfolioSlug] = useState("");

    // Fetch slug directly — login response doesn't include website_slug
    useEffect(() => {
        const tk = token();
        if (!tk) return;
        fetch(`${BASE}/api/portfolio/settings`, { headers: { Authorization: `Bearer ${tk}` } })
            .then(r => r.json())
            .then(d => {
                const s = d.settings?.website_slug;
                if (s && s !== "False" && s !== "None") setPortfolioSlug(String(s));
            })
            .catch(() => { });
    }, []);

    const portfolioUrl = portfolioSlug ? `${window.location.origin}/portfolio/${portfolioSlug}` : null;

    return (
        <header className="topbar">
            <div className="container-fluid">
                <div className="topbar-inner">
                    {/* Search */}
                    <div className="topbar-left">
                        <div className="search-container">
                            <div className="search-input-wrapper">
                                <BiSearch className="search-icon" />
                                <input type="text" placeholder="Search..." className="search-input form-control" />
                            </div>
                        </div>
                    </div>

                    <div className="topbar-right" style={{ display: "flex", alignItems: "center", gap: 8 }}>

                        {/* ── Share portfolio quick link ── */}
                        {portfolioUrl && (
                            <a href={portfolioUrl} target="_blank" rel="noopener noreferrer"
                                style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", borderRadius: 8, padding: "6px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap" }}>
                                🌐 My Portfolio
                            </a>
                        )}

                        {/* ── Notification Bell ── */}
                        <div style={{ position: "relative" }}>
                            <button onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                                className="notification-btn btn btn-link position-relative"
                                title={newEstimates > 0 ? `${newEstimates} new estimate request${newEstimates > 1 ? "s" : ""}` : "Notifications"}>
                                <BiBell className="notification-icon" />
                                {newEstimates > 0 && (
                                    <span style={{ position: "absolute", top: 4, right: 4, background: "#dc2626", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff" }}>
                                        {newEstimates > 9 ? "9+" : newEstimates}
                                    </span>
                                )}
                            </button>

                            {/* Notification panel */}
                            {isNotifOpen && (
                                <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", background: "#fff", borderRadius: 12, width: 340, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #f1f5f9", zIndex: 1000, overflow: "hidden" }}>
                                    {/* Header */}
                                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Notifications</span>
                                        {newEstimates > 0 && <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{newEstimates} new</span>}
                                    </div>

                                    {recentEstimates.length > 0 ? (
                                        <div style={{ maxHeight: 320, overflowY: "auto" }}>
                                            {recentEstimates.map(est => (
                                                <div key={est.id} style={{ padding: "12px 16px", borderBottom: "1px solid #f8fafc", transition: "background .15s" }}
                                                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"} onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                                                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                            <BiFile style={{ fontSize: 18, color: "#dc2626" }} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                                                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{est.customer_name}</p>
                                                                <span style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                                                    {est.estimate_type?.charAt(0).toUpperCase() + est.estimate_type?.slice(1)}
                                                                </span>
                                                            </div>
                                                            {/* Client contact info */}
                                                            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 6 }}>
                                                                {est.customer_email && (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                                        <BiEnvelope style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }} />
                                                                        <a href={`mailto:${est.customer_email}`} style={{ fontSize: 11, color: "#64748b", textDecoration: "none" }}>{est.customer_email}</a>
                                                                    </div>
                                                                )}
                                                                {est.customer_phone && (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                                        <BiPhone style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }} />
                                                                        <a href={`tel:${est.customer_phone}`} style={{ fontSize: 11, color: "#64748b", textDecoration: "none" }}>{est.customer_phone}</a>
                                                                    </div>
                                                                )}
                                                                {est.customer_address && (
                                                                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                                                        <BiMap style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }} />
                                                                        <span style={{ fontSize: 11, color: "#64748b" }}>{est.customer_address}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {est.description && (
                                                                <p style={{ margin: "0 0 6px", fontSize: 11, color: "#64748b", lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                                                    "{est.description}"
                                                                </p>
                                                            )}
                                                            <Link to={`/providerdashboard/estimates/${est.id}`} onClick={() => setIsNotifOpen(false)}
                                                                style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textDecoration: "none" }}>
                                                                View estimate →
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9", textAlign: "center" }}>
                                                <Link to="/providerdashboard/estimates" onClick={() => setIsNotifOpen(false)}
                                                    style={{ fontSize: 12, fontWeight: 700, color: "#1e293b", textDecoration: "none" }}>
                                                    View all estimates →
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: "32px 16px", textAlign: "center" }}>
                                            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
                                            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No new notifications</p>
                                            <p style={{ margin: "4px 0 0", fontSize: 11, color: "#cbd5e1" }}>New estimate requests will appear here</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile dropdown — desktop */}
                        {!isMobile && (
                            <div className="profile-dropdown">
                                <button onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }} className="profile-btn d-flex align-items-center">
                                    <div className="profile-avatar"><BiUser className="profile-avatar-icon" /></div>
                                    <span className="profile-name">{store.provider?.name || 'Contractor'}</span>
                                    <BiChevronDown className={`profile-dropdown-icon ${isProfileOpen ? 'rotate' : ''}`} />
                                </button>
                                {isProfileOpen && (
                                    <div className="profile-menu">
                                        <Link to="/providerdashboard/portfolio" className="profile-menu-item" onClick={() => setIsProfileOpen(false)}>
                                            <BiImages className="profile-menu-icon" /> Portfolio
                                        </Link>
                                        <Link to="/providerdashboard/settings" className="profile-menu-item" onClick={() => setIsProfileOpen(false)}>
                                            <BiCog className="profile-menu-icon" /> Settings
                                        </Link>
                                        <hr className="profile-menu-divider" />
                                        <button onClick={handleLogout} className="profile-menu-item profile-menu-logout">
                                            <BiLogOut className="profile-menu-icon" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile menu button */}
                        {isMobile && (
                            <button onClick={() => setMobileMenu(!isMobileMenuOpen)} className="mobile-menu-btn btn btn-link">
                                <BiChevronDown className={`mobile-menu-icon ${isMobileMenuOpen ? 'rotate' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown */}
                {isMobile && isMobileMenuOpen && (
                    <div className="mobile-menu">
                        <div className="mobile-menu-inner">
                            {[
                                { name: "Portfolio", icon: BiImages, path: "/providerdashboard/portfolio" },
                                { name: "Settings", icon: BiCog, path: "/providerdashboard/settings" },
                            ].map(item => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.name} to={item.path} className="mobile-menu-item" onClick={() => setMobileMenu(false)}>
                                        <Icon className="mobile-menu-icon" />{item.name}
                                    </Link>
                                );
                            })}
                            <hr className="mobile-menu-divider" />
                            <button onClick={handleLogout} className="mobile-menu-item mobile-menu-logout">
                                <BiLogOut className="mobile-menu-icon" /> Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Close on outside click */}
            {(isNotifOpen || isProfileOpen) && (
                <div onClick={() => { setIsNotifOpen(false); setIsProfileOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 999 }} />
            )}
        </header>
    );
};