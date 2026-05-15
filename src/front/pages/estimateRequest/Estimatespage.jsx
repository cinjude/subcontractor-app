// src/pages/Estimates/EstimatesPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";



const STATUS_CFG = {
    new: { cls: "text-bg-success", label: "New" },
    converted: { cls: "text-bg-primary", label: "Converted" },
    rejected: { cls: "text-bg-danger", label: "Rejected" },
};
const TYPE_EMOJI = { painting: "🎨", flooring: "🪵", both: "🎨🪵" };

/* ── small stat card ─────────────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent }) {
    return (
        <div className="col-6 col-md-3">
            <div className="card h-100 border-0 shadow-sm" style={{ background: "#f8f9fa" }}>
                <div className="card-body py-3 px-3">
                    <div className="d-flex align-items-center gap-2 mb-1">
                        <span style={{ fontSize: 18 }}>{icon}</span>
                        <span className="text-muted" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</span>
                    </div>
                    <div className={`fw-bold ${accent || ""}`} style={{ fontSize: 28 }}>{value}</div>
                </div>
            </div>
        </div>
    );
}

/* ── estimate card ───────────────────────────────────────────────────────── */
function EstimateCard({ estimate, onClick }) {
    const st = STATUS_CFG[estimate.status] || STATUS_CFG.new;
    const type = estimate.estimate_type || "painting";

    return (
        <div
            className="card h-100 border shadow-sm"
            onClick={onClick}
            style={{ cursor: "pointer", transition: "transform .12s ease, box-shadow .12s ease" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.classList.add("shadow"); }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.classList.remove("shadow"); }}
        >
            <div className="card-body pb-2">
                {/* top row */}
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <div style={{ minWidth: 0 }}>
                        <p className="fw-semibold mb-0 text-truncate">
                            {TYPE_EMOJI[type]} {estimate.customer_name}
                        </p>
                        <p className="text-muted mb-0" style={{ fontSize: 13 }}>{estimate.customer_phone}</p>
                    </div>
                    <span className={`badge rounded-pill text-nowrap ${st.cls}`} style={{ fontSize: 11 }}>{st.label}</span>
                </div>

                {/* badges */}
                <div className="d-flex flex-wrap gap-1 mb-2">
                    {estimate.computed_sqft > 0 && (
                        <span className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: 11 }}>
                            📐 {Number(estimate.computed_sqft).toFixed(0)} sq ft
                        </span>
                    )}
                    {estimate.quoted_amount && (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success-subtle fw-semibold" style={{ fontSize: 11 }}>
                            ${Number(estimate.quoted_amount).toLocaleString()}
                        </span>
                    )}
                    {estimate.budget_range && (
                        <span className="badge bg-light text-muted border" style={{ fontSize: 11 }}>
                            {estimate.budget_range.replace(/_/g, " ")}
                        </span>
                    )}
                </div>

                {estimate.customer_address && (
                    <p className="text-muted text-truncate mb-0" style={{ fontSize: 12 }}>
                        📍 {estimate.customer_address}
                    </p>
                )}
            </div>
            <div className="card-footer bg-transparent border-0 pt-0 pb-2 px-3">
                <small className="text-muted">
                    #{estimate.id} · {new Date(estimate.create_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </small>
            </div>
        </div>
    );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function EstimatesPage() {
    const navigate = useNavigate();
    const { estimates, stats, loading, fetchEstimates, fetchStats } = useEstimate();
    const [filters, setFilters] = useState({ status: "all", type: "all", search: "" });
    const [search, setSearch] = useState("");

    useEffect(() => { fetchEstimates(filters); fetchStats(); }, [filters]);

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
    const onSearch = e => { e.preventDefault(); setFilter("search", search); };

    const TABS = [
        { key: "all", label: "All" },
        { key: "new", label: "New", count: stats?.new },
        { key: "converted", label: "Converted", count: stats?.converted },
        { key: "rejected", label: "Rejected", count: stats?.rejected },
    ];

    return (
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-5">

            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold mb-0">Estimates</h4>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>Painting &amp; flooring quotes</p>
                </div>
                <button className="btn btn-dark px-4 fw-semibold" onClick={() => navigate("/estimates/new")}>
                    + New estimate
                </button>
            </div>

            {/* ── Stats ──────────────────────────────────────────────────────── */}
            {stats && (
                <div className="row g-3 mb-4">
                    <StatCard icon="📋" label="Total" value={stats.total} />
                    <StatCard icon="🆕" label="Pending" value={stats.new} accent="text-success" />
                    <StatCard icon="✅" label="Converted" value={stats.converted} accent="text-primary" />
                    <StatCard icon="💰" label="Quoted $" value={`$${Number(stats.total_quoted || 0).toLocaleString()}`} accent="text-success" />
                </div>
            )}

            {/* ── Search + type filter ────────────────────────────────────────── */}
            <div className="d-flex flex-column flex-sm-row gap-2 mb-3">
                <form className="d-flex gap-2 flex-grow-1" onSubmit={onSearch}>
                    <input className="form-control" placeholder="Search name, phone, address…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                    <button className="btn btn-outline-secondary" type="submit">Go</button>
                </form>

                <div className="d-flex gap-2 flex-shrink-0">
                    {["all", "painting", "flooring", "both"].map(t => (
                        <button key={t}
                            onClick={() => setFilter("type", t)}
                            className={`btn btn-sm ${filters.type === t ? "btn-dark" : "btn-outline-secondary"}`}
                            title={t}
                        >
                            {t === "all" ? "All" : TYPE_EMOJI[t]}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Status tabs ────────────────────────────────────────────────── */}
            <ul className="nav nav-tabs border-bottom mb-4">
                {TABS.map(tab => (
                    <li key={tab.key} className="nav-item">
                        <button
                            className={`nav-link px-3 py-2 ${filters.status === tab.key ? "active fw-semibold text-dark" : "text-muted"}`}
                            onClick={() => setFilter("status", tab.key)}
                        >
                            {tab.label}
                            {tab.count != null && (
                                <span className={`ms-1 badge rounded-pill ${tab.key === "new" ? "bg-success" : tab.key === "converted" ? "bg-primary" : "bg-danger"} bg-opacity-75`}
                                    style={{ fontSize: "0.65rem" }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    </li>
                ))}
            </ul>

            {/* ── Grid ───────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" aria-label="Loading" />
                    Loading estimates…
                </div>
            ) : estimates.length === 0 ? (
                <div className="text-center py-5">
                    <div style={{ fontSize: 56 }}>📋</div>
                    <p className="text-muted mt-2 mb-3">No estimates found</p>
                    <button className="btn btn-dark" onClick={() => navigate("/estimates/new")}>
                        Create first estimate
                    </button>
                </div>
            ) : (
                <div className="row g-3">
                    {estimates.map(e => (
                        <div key={e.id} className="col-12 col-sm-6 col-xl-4">
                            <EstimateCard estimate={e} onClick={() => navigate(`/estimates/${e.id}`)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}