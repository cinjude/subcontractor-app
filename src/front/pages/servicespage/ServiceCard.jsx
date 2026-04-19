import React from 'react'
import ServiceFormModal from './ServiceFormModal';

/* ── tiny SVG icons ── */
const IconGrid = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" />
    </svg>
);
const IconLayers = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" />
        <path d="M2 17l10 5 10-5" stroke="currentColor" />
        <path d="M2 12l10 5 10-5" stroke="currentColor" />
    </svg>
);
const IconSun = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" stroke="currentColor" />
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" />
    </svg>
);
const IconHome = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="currentColor" />
        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" />
    </svg>
);
const ICONS = [IconGrid, IconLayers, IconSun, IconHome];
const getIcon = (i) => { const Icon = ICONS[i % ICONS.length]; return <Icon />; };

// card services

export default function ServiceCard({ service, index, onEdit, onDelete, onDetail }) {
    const isActive = service.is_active && !service.is_deleted;
    const materials = service.materials || [];
    const visible = materials.slice(0, 3);
    const hiddenCount = materials.length - 3;

    return (
        <div className={`card border rounded-3 h-100 ${!isActive ? "sv-card-inactive" : ""}`}
            style={{ borderColor: "#e5e7eb" }}>

            <div className="card-body pb-2">

                <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className={`sv-icon ${isActive ? "" : "sv-icon-inactive"}`}>
                        {getIcon(index)}
                    </div>
                    <span className={isActive ? "sv-badge-active" : "sv-badge-inactive"}>
                        {isActive ? "Active" : "Inactive"}
                    </span>
                </div>

                <div className="sv-card-name">{service.name}</div>
                <div className="sv-card-desc">{service.description}</div>
            </div>

            <div className="d-flex align-items-center justify-content-between px-3 py-2
                      border-top border-bottom"
                style={{ borderColor: "#f3f4f6" }}>
                <div className="sv-price">
                    ${service.price ? Number(service.price).toLocaleString() : "—"}
                    <span className="sv-price-unit"> / job</span>
                </div>
                <div className="d-flex gap-2">
                    {service.estimate_hours && (
                        <span className="badge rounded-pill bg-light text-secondary fw-normal">
                            {service.estimate_hours} hrs
                        </span>
                    )}
                    {materials.length > 0 && (
                        <span className="badge rounded-pill bg-light text-secondary fw-normal">
                            {materials.length} material{materials.length !== 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            {visible.length > 0 && (
                <div className="px-3 pt-2 pb-1">
                    {visible.map((mat) => (
                        <div className="sv-mat-row" key={mat.id}>
                            <span className="sv-mat-name">{mat.name}</span>
                            <span className="sv-mat-price">
                                ${mat.unit_cost != null ? Number(mat.unit_cost).toFixed(2) : "—"}/unit
                            </span>
                        </div>
                    ))}
                    {hiddenCount > 0 && (
                        <button className="sv-mat-more" onClick={() => onDetail(service)}>
                            +{hiddenCount} more material{hiddenCount !== 1 ? "s" : ""} — view details
                        </button>
                    )}
                </div>
            )}

            <div className="d-flex gap-2 px-3 py-2 mt-auto border-top"
                style={{ borderColor: "#f3f4f6" }}>
                <button
                    className="btn btn-outline-secondary btn-sm flex-fill sv-btn-detail"
                    onClick={() => onDetail(service)}>
                    Details
                </button>
                <button data-bs-toggle="modal" data-bs-target="#serviceFormModal"
                    className="btn btn-outline-warning btn-sm flex-fill sv-btn-edit"
                    onClick={() => onEdit(service)}>
                    Edit
                </button>
                <button
                    className="btn btn-outline-danger btn-sm flex-fill sv-btn-delete"
                    onClick={() => onDelete(service)}>
                    Delete
                </button>
            </div>

        </div>
    );
}