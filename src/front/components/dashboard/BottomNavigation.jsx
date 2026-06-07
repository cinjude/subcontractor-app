// src/components/dashboard/BottomNavigation.jsx — UPDATED
// Change: added Portfolio item (mobile bottom nav has space for it)

import { Link, useLocation } from "react-router-dom";
import {
    BiGridAlt,
    BiFile,
    BiBriefcase,
    BiGroup,
    BiImages,
    BiCog,
} from "react-icons/bi";

export const BottomNavigation = () => {
    const location = useLocation();

    // Keep to 5 items max for mobile bottom nav — most important ones
    const menuItems = [
        { name: "Home", icon: BiGridAlt, path: "/providerdashboard" },
        { name: "Estimates", icon: BiFile, path: "/providerdashboard/estimates" },
        { name: "Services", icon: BiCog, path: "/providerdashboard/services" },
        { name: "Jobs", icon: BiBriefcase, path: "/providerdashboard/jobs" },
        { name: "Clients", icon: BiGroup, path: "/providerdashboard/customers" },
        { name: "Portfolio", icon: BiImages, path: "/providerdashboard/portfolio" },
    ];

    const isActive = (path) =>
        location.pathname === path || location.pathname.startsWith(path + "/");

    return (
        <div className="bottom-nav fixed-bottom d-lg-none">
            <div className="bottom-nav-inner d-flex justify-content-around align-items-center h-100">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`bottom-nav-item d-flex flex-column align-items-center text-decoration-none ${active ? 'active' : ''}`}
                        >
                            <Icon className={`bottom-nav-icon ${active ? 'text-primary' : 'text-secondary'}`} />
                            <span className={`bottom-nav-label ${active ? 'text-primary' : 'text-secondary'}`}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};