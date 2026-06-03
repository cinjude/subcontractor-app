
import { useState, useEffect } from "react";
import {
    BiSearch, BiBell, BiUser, BiChevronDown,
    BiCreditCard, BiImages, BiCog, BiLogOut, BiFile
} from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");

export const Topbar = ({ isMobile }) => {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [newEstimates, setNewEstimates] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    // ── Poll for new estimates every 30 seconds ──────────────────────────────
    useEffect(() => {
        const fetchCount = () => {
            const tk = token();
            if (!tk) return;
            fetch(`${BASE}/api/portfolio/notifications/count`, {
                headers: { Authorization: `Bearer ${tk}` },
            })
                .then(r => r.json())
                .then(d => { if (d.new_estimates !== undefined) setNewEstimates(d.new_estimates); })
                .catch(() => { });
        };

        fetchCount();
        const interval = setInterval(fetchCount, 30000); // every 30s
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('provider');
        localStorage.removeItem('token');
        dispatch({ type: 'logout' });
        setIsProfileDropdownOpen(false);
        navigate('/?action=login');
    };

    const mobileMenuItems = [
        { name: "Portfolio", icon: BiImages, path: "/providerdashboard/portfolio" },
        { name: "Settings", icon: BiCog, path: "/providerdashboard/settings" },
    ];

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

                    <div className="topbar-right">

                        {/* ── Notification bell with new-estimate badge ── */}
                        <div style={{ position: "relative" }}>
                            <button
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileDropdownOpen(false); }}
                                className="notification-btn btn btn-link position-relative"
                                title={newEstimates > 0 ? `${newEstimates} new estimate request${newEstimates > 1 ? "s" : ""}` : "Notifications"}
                            >
                                <BiBell className="notification-icon" />
                                {newEstimates > 0 && (
                                    <span style={{
                                        position: "absolute", top: 4, right: 4,
                                        background: "#dc2626", color: "#fff",
                                        borderRadius: "50%", width: 18, height: 18,
                                        fontSize: 10, fontWeight: 700,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: "2px solid #fff",
                                    }}>
                                        {newEstimates > 9 ? "9+" : newEstimates}
                                    </span>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            {isNotifOpen && (
                                <div style={{
                                    position: "absolute", right: 0, top: "calc(100% + 8px)",
                                    background: "#fff", borderRadius: 12, minWidth: 280,
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                                    border: "1px solid #f1f5f9", zIndex: 1000,
                                    overflow: "hidden",
                                }}>
                                    <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Notifications</span>
                                        {newEstimates > 0 && (
                                            <span style={{ background: "#dc2626", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                                                {newEstimates} new
                                            </span>
                                        )}
                                    </div>

                                    {newEstimates > 0 ? (
                                        <div style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                                    <BiFile style={{ fontSize: 18, color: "#dc2626" }} />
                                                </div>
                                                <div>
                                                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                                                        {newEstimates} new estimate request{newEstimates > 1 ? "s" : ""}
                                                    </p>
                                                    <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>
                                                        Clients submitted from your portfolio
                                                    </p>
                                                    <Link
                                                        to="/providerdashboard/estimates"
                                                        onClick={() => setIsNotifOpen(false)}
                                                        style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textDecoration: "none" }}
                                                    >
                                                        View all estimates →
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: "24px 16px", textAlign: "center" }}>
                                            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>No new notifications</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Profile dropdown — desktop */}
                        {!isMobile && (
                            <div className="profile-dropdown">
                                <button
                                    onClick={() => { setIsProfileDropdownOpen(!isProfileDropdownOpen); setIsNotifOpen(false); }}
                                    className="profile-btn d-flex align-items-center"
                                >
                                    <div className="profile-avatar"><BiUser className="profile-avatar-icon" /></div>
                                    <span className="profile-name">{store.provider?.name || 'Contractor'}</span>
                                    <BiChevronDown className={`profile-dropdown-icon ${isProfileDropdownOpen ? 'rotate' : ''}`} />
                                </button>

                                {isProfileDropdownOpen && (
                                    <div className="profile-menu">
                                        <Link to="/providerdashboard/portfolio" className="profile-menu-item" onClick={() => setIsProfileDropdownOpen(false)}>
                                            <BiImages className="profile-menu-icon" /> Portfolio
                                        </Link>
                                        <Link to="/providerdashboard/settings" className="profile-menu-item" onClick={() => setIsProfileDropdownOpen(false)}>
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
                            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="mobile-menu-btn btn btn-link">
                                <BiChevronDown className={`mobile-menu-icon ${isMobileMenuOpen ? 'rotate' : ''}`} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Mobile dropdown menu */}
                {isMobile && isMobileMenuOpen && (
                    <div className="mobile-menu">
                        <div className="mobile-menu-inner">
                            {mobileMenuItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.name} to={item.path} className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
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

            {/* Close dropdowns when clicking outside */}
            {(isNotifOpen || isProfileDropdownOpen) && (
                <div onClick={() => { setIsNotifOpen(false); setIsProfileDropdownOpen(false); }}
                    style={{ position: "fixed", inset: 0, zIndex: 999 }} />
            )}
        </header>
    );
};