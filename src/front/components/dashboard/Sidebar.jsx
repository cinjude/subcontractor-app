// src/components/dashboard/Sidebar.jsx — UPDATED
// Change: added Portfolio link with BiImages icon

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    BiGridAlt,
    BiFile,
    BiBriefcase,
    BiGroup,
    BiReceipt,
    BiCreditCard,
    BiCog,
    BiImages,   // ← Portfolio icon
    BiMenu,
    BiX
} from "react-icons/bi";

export const Sidebar = ({ isCollapsed, toggleCollapse, isMobile, isMobileOpen, toggleMobile }) => {
    const location = useLocation();

    const menuItems = [
        { name: "Dashboard", icon: BiGridAlt, path: "/providerdashboard" },
        { name: "Estimate Requests", icon: BiFile, path: "/providerdashboard/estimates" },
        { name: "Jobs", icon: BiBriefcase, path: "/providerdashboard/jobs" },
        { name: "Customers", icon: BiGroup, path: "/providerdashboard/customers" },
        { name: "Invoices", icon: BiReceipt, path: "/providerdashboard/invoices" },
        { name: "Payments", icon: BiCreditCard, path: "/providerdashboard/payments" },
        { name: "Services", icon: BiCog, path: "/providerdashboard/services" },
        { name: "Portfolio", icon: BiImages, path: "/providerdashboard/portfolio" }, // ← NEW
        { name: "Settings", icon: BiCog, path: "/providerdashboard/settings" },
        { name: "Payment Methods", icon: BiCreditCard, path: "/providerdashboard/payment-methods" },
    ];

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <>
            {isMobile && isMobileOpen && (
                <div className="sidebar-overlay d-lg-none" onClick={toggleMobile} />
            )}

            <div className={`sidebar d-flex flex-column ${isCollapsed ? 'collapsed' : ''} ${isMobile ? (isMobileOpen ? 'mobile-open' : 'mobile-closed') : ''}`}>
                {/* Logo/Header */}
                <div className="sidebar-header d-flex align-items-center justify-content-between p-3 border-bottom">
                    {!isCollapsed && (
                        <div className="d-flex align-items-center">
                            <div className="sidebar-logo me-3">
                                <BiBriefcase className="sidebar-logo-icon" />
                            </div>
                            <span className="sidebar-title">Dashboard</span>
                        </div>
                    )}
                    <button
                        onClick={isMobile ? toggleMobile : toggleCollapse}
                        className="sidebar-toggle btn btn-link text-white"
                    >
                        {isMobile ? <BiX className="sidebar-toggle-icon" /> : <BiMenu className="sidebar-toggle-icon" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="sidebar-nav flex-grow-1 p-3">
                    <ul className="list-unstyled">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.name} className="mb-2">
                                    <Link
                                        to={item.path}
                                        className={`sidebar-link d-flex align-items-center text-decoration-none ${isActive(item.path) ? 'active' : ''}`}
                                        onClick={isMobile ? toggleMobile : undefined}
                                    >
                                        <Icon className={`sidebar-link-icon ${isActive(item.path) ? 'active' : ''}`} />
                                        {!isCollapsed && (
                                            <span className="sidebar-link-text">{item.name}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User section */}
                {!isCollapsed && (
                    <div className="sidebar-user p-3 border-top">
                        <div className="d-flex align-items-center">
                            <div className="sidebar-user-avatar me-3">
                                <span className="sidebar-user-initials">JD</span>
                            </div>
                            <div className="flex-grow-1">
                                <p className="sidebar-user-name mb-0">John Doe</p>
                                <p className="sidebar-user-role mb-0">Provider</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};