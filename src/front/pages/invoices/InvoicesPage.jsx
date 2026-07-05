
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useInvoice } from "./InvoiceContext";
import { generateInvoiceReportPDF } from "./utils/invoicePDF";
import StatCard from "./StatCard";

const STATUS_CFG = {
    draft: { cls: "text-bg-secondary", label: "Draft", icon: "📝" },
    sent: { cls: "text-bg-primary", label: "Sent", icon: "✉️" },
    paid: { cls: "text-bg-success", label: "Paid", icon: "✅" },
    overdue: { cls: "text-bg-danger", label: "Overdue", icon: "⚠️" },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const money = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function InvoicesPage() {
    const navigate = useNavigate();
    const { invoices, stats, loading, fetchInvoices, fetchStats, deleteInvoice, sendEmail } = useInvoice();

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [year, setYear] = useState("all");
    const [month, setMonth] = useState("all");
    const [sort, setSort] = useState("newest");
    const [exporting, setExporting] = useState(false);

    const load = useCallback(() => {
        const filters = { status, search, year, month, sort, per_page: 100 };
        fetchInvoices(filters);
        fetchStats({ year, month });
    }, [status, search, year, month, sort]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this invoice permanently?")) return;
        await deleteInvoice(id);
    };

    const handleSend = async (id, e) => {
        e.stopPropagation();
        try {
            await sendEmail(id);
        } catch (err) { alert(err.message); }
    };

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            await generateInvoiceReportPDF({
                invoices,
                stats,
                filters: { status, year, month, search },
            });
        } catch (err) {
            alert("Failed to generate PDF: " + err.message);
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-4" style={{ maxWidth: 1100, margin: "0 auto" }}>

            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <div>
                    <h5 className="fw-bold mb-0">🧾 Invoices</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>Track payments and manage billing</p>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-secondary fw-semibold" onClick={handleExportPDF} disabled={exporting || invoices.length === 0}>
                        {exporting ? <><span className="spinner-border spinner-border-sm me-2" />Generating…</> : "📥 Download PDF report"}
                    </button>
                    <button className="btn btn-dark fw-semibold" onClick={() => navigate("/providerdashboard/invoices/new")}>
                        + New invoice
                    </button>
                </div>
            </div>

            {stats && (
                <div className="row g-2 g-md-3 mb-4">
                    <StatCard label="Paid" value={money(stats.total_paid)} icon="✅" accent="text-success" />
                    <StatCard label="Outstanding" value={money(stats.total_outstanding)} icon="⏳" accent="text-primary" />
                    <StatCard label="Overdue" value={money(stats.total_overdue)} icon="⚠️" accent="text-danger" />
                    <StatCard label="Draft" value={money(stats.total_draft)} icon="📝" accent="text-secondary" />
                </div>
            )}

            <div className="row g-2 mb-3">
                <div className="col-12 col-md-4">
                    <input className="form-control" placeholder="🔍 Search by invoice # or client…"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="col-4 col-md-2">
                    <select className="form-select" value={year} onChange={e => setYear(e.target.value)}>
                        <option value="all">All years</option>
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
                <div className="col-4 col-md-2">
                    <select className="form-select" value={month} onChange={e => setMonth(e.target.value)}>
                        <option value="all">All months</option>
                        {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                    </select>
                </div>
                <div className="col-4 col-md-4">
                    <select className="form-select" value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="amount_desc">Highest amount</option>
                        <option value="amount_asc">Lowest amount</option>
                        <option value="due_soon">Due soonest</option>
                    </select>
                </div>
            </div>

            <ul className="nav nav-pills mb-4 flex-wrap gap-2">
                {["all", "draft", "sent", "paid", "overdue"].map(s => (
                    <li className="nav-item" key={s}>
                        <button
                            className={`nav-link ${status === s ? "active bg-dark" : "text-muted border"}`}
                            onClick={() => setStatus(s)}
                            style={{ fontSize: 13, textTransform: "capitalize" }}>
                            {s === "all" ? "All" : `${STATUS_CFG[s]?.icon || ""} ${s}`}
                            {stats && s !== "all" && <span className="ms-1 opacity-75">({stats[`count_${s}`] || 0})</span>}
                        </button>
                    </li>
                ))}
            </ul>

            {loading && (
                <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-secondary" role="status" />
                </div>
            )}

            {!loading && invoices.length === 0 && (
                <div className="text-center py-5">
                    <div style={{ fontSize: 48 }} className="mb-2">🧾</div>
                    <p className="text-muted mb-3">No invoices found</p>
                    <button className="btn btn-dark" onClick={() => navigate("/providerdashboard/invoices/new")}>
                        + Create your first invoice
                    </button>
                </div>
            )}

            {!loading && invoices.length > 0 && (
                <div className="row g-3">
                    {invoices.map(inv => {
                        const st = STATUS_CFG[inv.status] || STATUS_CFG.draft;
                        const isOverdue = inv.status === "overdue";
                        return (
                            <div key={inv.id} className="col-12 col-md-6 col-lg-4">
                                <div
                                    className={`card border h-100 ${isOverdue ? "border-danger-subtle" : ""}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => navigate(`/providerdashboard/invoices/${inv.id}`)}
                                >
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <p className="text-muted mb-0" style={{ fontSize: 11 }}>#{inv.invoice_number}</p>
                                                <h6 className="fw-bold mb-0">{inv.customer_name || "—"}</h6>
                                            </div>
                                            <span className={`badge ${st.cls}`}>{st.icon} {st.label}</span>
                                        </div>

                                        <p className="fw-bold text-dark mb-2" style={{ fontSize: 24 }}>{money(inv.total_amount)}</p>

                                        <div className="d-flex justify-content-between small text-muted mb-3">
                                            <span>Issued {fmtDate(inv.issue_date)}</span>
                                            <span className={isOverdue ? "text-danger fw-semibold" : ""}>Due {fmtDate(inv.due_date)}</span>
                                        </div>

                                        <div className="d-flex gap-2">
                                            {inv.status !== "paid" && (
                                                <button className="btn btn-sm btn-outline-primary flex-fill"
                                                    onClick={(e) => handleSend(inv.id, e)}>
                                                    ✉️ Send
                                                </button>
                                            )}
                                            <button className="btn btn-sm btn-outline-danger"
                                                onClick={(e) => handleDelete(inv.id, e)}>
                                                🗑
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}