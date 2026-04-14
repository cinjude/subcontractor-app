import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../../hooks/useGlobalReducer";
import "./services.css";
import ServiceCard from "./ServiceCard";
import ServiceFormModal from "./ServiceFormModal";



export default function ServicesP() {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const [editingService, setEditingService] = useState(null);

    const fetchServicesStats = async () => {
        const token = store.token || localStorage.getItem("token");
        const baseUrl = import.meta.env.VITE_BACKEND_URL;

        try {
            const [resStats, resServices] = await Promise.all([
                fetch(`${baseUrl}/api/services/stats`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }),
                fetch(`${baseUrl}/api/services`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (!resStats.ok || !resServices.ok) throw new Error("Failed to fetch");

            const statsData = await resStats.json();
            const servicesData = await resServices.json();

            dispatch({ type: "set-services-stats", payload: statsData });
            dispatch({ type: "set-services", payload: servicesData.services });
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchServicesStats(); }, [store.token]);

    const allServices = store.services || [];
    const { activeServices, inactiveServices } = allServices.reduce((acc, s) => {
        if (s.is_deleted) return acc;

        if (s.is_active) {
            acc.activeServices.push(s);
        } else {
            acc.inactiveServices.push(s);
        }
        return acc;
    }, { activeServices: [], inactiveServices: [] });
    // const activeServices = allServices.filter((s) => s.is_active && !s.is_deleted);
    // const inactiveServices = allServices.filter((s) => !s.is_active && !s.is_deleted);
    const stats = store.servicesStats || {};

    const handleDetail = (svc) => navigate(`/services/${svc.id}`);
    const handleEdit = (svc) => navigate(`/services/${svc.id}/edit`);
    const handleDelete = (svc) => {
        if (window.confirm(`Delete "${svc.name}"?`)) {
            /* dispatch delete */
        }
    };

    const EmptyState = () => (
        <div className="col-12">
            <div className="sv-empty">
                <div className="sv-empty-icon">🔧</div>
                <p className="fw-500 mb-1">No services yet</p>
                <p className="text-muted small">Click "+ New service" to add your first one.</p>
            </div>
        </div>
    );

    return (
        <div className="sv-page">
            <div className="container-fluid px-3 px-md-4 pt-3">

                <div className="d-flex align-items-start justify-content-between mb-3 gap-2 flex-wrap">
                    <div>
                        <h2 className="fw-semibold mb-0" style={{ fontSize: "22px" }}>Services</h2>
                        <p className="text-muted mb-0 d-md-none" style={{ fontSize: "13px" }}>
                            {stats.total_services ?? allServices.length} services ·{" "}
                            {stats.active_services ?? activeServices.length} active
                        </p>

                        <p className="text-muted mb-0 d-none d-md-block">
                            Manage your service catalog and materials
                        </p>
                    </div>

                    <button type="button" className="sv-btn-new btn-primary" data-bs-toggle="modal" data-bs-target="#serviceFormModal"
                        onClick={() => setEditingService(null)}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        New service
                    </button>
                </div>

                <div className="row g-2 mb-4">
                    <div className="col-sm-4 sv-stat-total">
                        <div className="card border rounded-3 h-100" style={{ borderColor: "#e5e7eb" }}>
                            <div className="card-body py-3">
                                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Total services</p>
                                <div className="sv-stat-val">{stats.total_services ?? allServices.length}</div>
                                <p className="text-muted mb-0 small">
                                    {stats.active_services ?? activeServices.length} active
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-sm-4">
                        <div className="card border rounded-3 h-100" style={{ borderColor: "#e5e7eb" }}>
                            <div className="card-body py-3">
                                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Avg. price</p>
                                <div className="sv-stat-val">
                                    ${stats.avg_price ? Number(stats.avg_price).toFixed(0) : "—"}
                                </div>
                                <p className="text-muted mb-0 small">per service</p>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-sm-4">
                        <div className="card border rounded-3 h-100" style={{ borderColor: "#e5e7eb" }}>
                            <div className="card-body py-3">
                                <p className="text-muted mb-1" style={{ fontSize: "13px" }}>Materials</p>
                                <div className="sv-stat-val">{stats.materials_tracked ?? 0}</div>
                                <p className="text-muted mb-0 small">tracked items</p>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-semibold" style={{ fontSize: "15px" }}>Active services</span>
                    <span className="text-muted small">{activeServices.length} services</span>
                </div>

                <div className="row g-3 mb-4">
                    {activeServices.length === 0 ? (
                        <EmptyState />
                    ) : (
                        activeServices.map((svc, i) => (
                            <div className="col-12 col-sm-6" key={svc.id}>
                                <ServiceCard
                                    service={svc}
                                    index={i}
                                    onDetail={handleDetail}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        ))
                    )}
                </div>

                {inactiveServices.length > 0 && (
                    <>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                            <span className="fw-semibold" style={{ fontSize: "15px" }}>Inactive services</span>
                            <span className="text-muted small">{inactiveServices.length} services</span>
                        </div>
                        <div className="row g-3 mb-4">
                            {inactiveServices.map((svc, i) => (
                                <div className="col-12 col-sm-6" key={svc.id}>
                                    <ServiceCard
                                        service={svc}
                                        index={activeServices.length + i}
                                        onDetail={handleDetail}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

            </div>

            <ServiceFormModal
                modalId="serviceFormModal"
                service={editingService}
                onSaved={(svc) => fetchServicesStats()}
                onClose={() => setEditingService(null)}
            />
        </div>
    );
}