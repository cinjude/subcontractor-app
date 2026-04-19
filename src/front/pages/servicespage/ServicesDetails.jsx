import { useParams, useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import { useEffect, useState } from "react";
import "./servicedetail.css";
import ServiceFormModal from "./ServiceFormModal";
import Swal from "sweetalert2";

const IconGrid = () => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" />
        <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" />
    </svg>
);

const usd = (val) =>
    val != null
        ? `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";

const ServicesDetails = () => {
    const { store } = useGlobalReducer();
    const { id } = useParams();
    const navigate = useNavigate();

    const [service, setService] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingService, setEditingService] = useState(null);

    const getServicesid = async () => {
        setLoading(true);
        const token = store?.token || localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/services/${id}`,
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (res.ok) setService(data.service);
        } catch (err) {
            console.error("Error retrieving service", id, err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { getServicesid(); }, [store?.token]);

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            showLoaderOnConfirm: true, // Muestra un spinner en el botón mientras borra
            preConfirm: async () => {
                try {
                    const token = store?.token || localStorage.getItem("token");
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/delete/services/${id}`,
                        {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (!response.ok) {
                        throw new Error("Could not delete this service");
                    }
                    return response.json();
                } catch (error) {
                    Swal.showValidationMessage(`Request failed: ${error}`);
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: "Deleted!",
                    text: "The services has been removed.",
                    icon: "success"
                }).then(() => {
                    navigate(-1)
                });
            }
        });
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /></div>;
    if (!service) return <div className="text-center py-5 text-muted">Service not found.</div>;

    const isActive = service.is_active && !service.is_deleted;
    const materials = service.materials || [];
    const materialsTotal = service.materials_cost ?? 0;

    const displayedBaseCost =
        service.base_cost != null
            ? service.base_cost
            : service.effective_base_cost;

    const baseCostIsAuto = service.base_cost == null;

    return (
        <div className="sd-page">
            <div className="container-fluid px-3 px-lg-4 pt-3">

                <Link className="sd-back-btn" onClick={() => navigate(-1)}>
                    <svg viewBox="0 0 14 14" fill="none">
                        <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to services
                </Link>

                <div className="sd-layout">

                    <
                        div className="sd-sidebar">
                        <div className="sd-sidebar-card">

                            <div className="sd-sidebar-hero">
                                <div className="sd-sidebar-icon"><IconGrid /></div>
                                <div className="sd-sidebar-name">{service.name}</div>
                                <div style={{ marginBottom: "8px" }}>
                                    <span className={isActive ? "sd-badge-active" : "sd-badge-inactive"}>
                                        {isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>

                            <div className="sd-sidebar-field">
                                <span className="sd-sidebar-field-label">Price</span>
                                <span className="sd-sidebar-field-val" style={{ color: "#1e40af" }}>
                                    {usd(service.price)} / job
                                </span>
                            </div>
                            <div className="sd-sidebar-field">
                                <span className="sd-sidebar-field-label">Est. hours</span>
                                <span className="sd-sidebar-field-val">{service.estimate_hours ?? "—"} hrs</span>
                            </div>
                            <div className="sd-sidebar-field">
                                <span className="sd-sidebar-field-label">Duration</span>
                                <span className="sd-sidebar-field-val">
                                    {service.duration ?? "—"} {service.duration === 1 ? "day" : "days"}
                                </span>
                            </div>
                            <div className="sd-sidebar-field">
                                <span className="sd-sidebar-field-label">Materials</span>
                                <span className="sd-sidebar-field-val">
                                    {materials.length} item{materials.length !== 1 ? "s" : ""}
                                </span>
                            </div>

                            <div className="d-flex flex-column gap-2 p-3" style={{ borderTop: "1px solid #f3f4f6" }}>
                                <button className="sd-btn-edit flex-fill" data-bs-toggle="modal" data-bs-target="#serviceFormModal"
                                    onClick={() => setEditingService(service)}>
                                    Edit</button>
                                <button className="sd-btn-delete w-100"
                                    onClick={() => handleDelete(service.id)}>
                                    Delete service
                                </button>
                            </div>

                        </div>
                    </div>

                    <div className="sd-main-col">

                        <div className="sd-hero sd-hero-mobile">

                            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap">

                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <div className="sd-icon"><IconGrid /></div>
                                    <div>
                                        <div className="sd-name">{service.name}</div>
                                        <div className="sd-sub">Service #{service.id}</div>
                                    </div>
                                    <span className={isActive ? "sd-badge-active" : "sd-badge-inactive"}>
                                        {isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                <div className="sd-hero-actions-tablet gap-2">
                                    <button className="sd-btn-edit flex-fill" data-bs-toggle="modal" data-bs-target="#serviceFormModal"
                                        onClick={() => setEditingService(service)}>
                                        Edit</button>
                                    <button className="sd-btn-delete"
                                        onClick={() => handleDelete(service.id)}>
                                        Delete
                                    </button>
                                </div>

                            </div>

                            <div className="sd-hero-actions-mobile gap-2 mt-3">
                                <button className="sd-btn-edit flex-fill" data-bs-toggle="modal" data-bs-target="#serviceFormModal"
                                    onClick={() => setEditingService(service)}>
                                    Edit</button>
                                <button className="sd-btn-delete flex-fill"
                                    onClick={() => handleDelete(service.id)}>
                                    Delete
                                </button>
                            </div>

                        </div>

                        <div className="sd-metrics">
                            <div className="sd-metric">
                                <div className="sd-metric-label">Price</div>
                                <div className="sd-metric-val blue">{usd(service.price)}</div>
                                <div className="sd-metric-sub">per job</div>
                            </div>
                            <div className="sd-metric">
                                <div className="sd-metric-label">Materials cost</div>
                                <div className="sd-metric-val">{usd(materialsTotal)}</div>
                                <div className="sd-metric-sub">auto-calculated</div>
                            </div>
                            <div className="sd-metric">
                                <div className="sd-metric-label">Base cost</div>
                                <div className="sd-metric-val">{usd(displayedBaseCost)}</div>
                                <div className="sd-metric-sub">{baseCostIsAuto ? "from materials" : "manual override"}</div>
                            </div>
                            <div className="sd-metric">
                                <div className="sd-metric-label">Profit</div>
                                <div className="sd-metric-val green">{usd(service.profit)}</div>
                                <div className="sd-metric-sub">est. margin</div>
                            </div>
                        </div>

                        <div className="sd-card">
                            <div className="sd-card-head">
                                <h3 className="sd-card-title">Service info</h3>
                            </div>

                            <div className="sd-desc-block">{service.description}</div>

                            <div className="row g-0">
                                <div className="col-12 col-sm-6">
                                    <div className="sd-field-row">
                                        <span className="sd-field-label">Est. hours</span>
                                        <span className="sd-field-val">{service.estimate_hours ?? "—"} hrs</span>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="sd-field-row">
                                        <span className="sd-field-label">Duration</span>
                                        <span className="sd-field-val">
                                            {service.duration ?? "—"} {service.duration === 1 ? "day" : "days"}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="sd-field-row">
                                        <span className="sd-field-label">Status</span>
                                        <span className={isActive ? "sd-badge-active" : "sd-badge-inactive"}>
                                            {isActive ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <div className="col-12 col-sm-6">
                                    <div className="sd-field-row">
                                        <span className="sd-field-label">Materials</span>
                                        <span className="sd-field-val">{materials.length} items</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {materials.length > 0 && (
                            <div className="sd-card">
                                <div className="sd-card-head">
                                    <h3 className="sd-card-title">Materials needed</h3>
                                    <span className="sd-card-tag">
                                        {materials.length} items · {usd(materialsTotal)}
                                    </span>
                                </div>

                                <div className="sd-mat-wrap">
                                    <table className="sd-mat-table">
                                        <thead>
                                            <tr>
                                                <th>Material</th>
                                                <th>Qty</th>
                                                <th className="right">Unit cost</th>

                                                <th className="right d-none d-sm-table-cell">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {materials.map((mat) => (
                                                <tr key={mat.id}>
                                                    <td>{mat.name}</td>
                                                    <td>{mat.quantity}</td>
                                                    <td className="right">{usd(mat.unit_cost)}</td>
                                                    <td className="right d-none d-sm-table-cell">{usd(mat.total_cost)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="sd-mat-footer">
                                    <span className="sd-mat-footer-label">Estimated materials total</span>
                                    <span className="sd-mat-footer-val">{usd(materialsTotal)}</span>
                                </div>
                            </div>
                        )}

                        <div className="sd-card">
                            <div className="sd-card-head">
                                <h3 className="sd-card-title">Cost breakdown</h3>
                            </div>
                            <div className="sd-cost-grid">
                                <div className="sd-cost-item">
                                    <div className="sd-cost-label">Materials cost</div>
                                    <div className="sd-cost-val">{usd(materialsTotal)}</div>
                                </div>
                                <div className="sd-cost-item">
                                    <div className="sd-cost-label">
                                        Base cost{" "}
                                        {baseCostIsAuto && (
                                            <span className="text-muted" style={{ fontSize: "10px" }}>(auto)</span>
                                        )}
                                    </div>
                                    <div className="sd-cost-val">{usd(displayedBaseCost)}</div>
                                </div>
                                <div className="sd-cost-item sd-cost-last">
                                    <div className="sd-cost-label">Profit (est.)</div>
                                    <div className="sd-cost-val green">{usd(service.profit)}</div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <ServiceFormModal
                modalId="serviceFormModal"
                service={editingService}
                onSaved={(svc) => getServicesid()}
                onClose={() => setEditingService(null)}
            />
        </div>
    );
};

export default ServicesDetails;