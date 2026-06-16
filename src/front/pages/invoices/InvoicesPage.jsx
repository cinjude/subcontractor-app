// src/front/pages/invoices/InvoicesPage.jsx
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { invoiceService } from "./invoiceService";
import InvoiceStatusBadge from "./components/InvoiceStatusBadge";
import { generateInvoiceReportPDF } from "./utils/invoicePDF";
import Swal from "sweetalert2";

const STATUSES = ["all", "draft", "sent", "paid", "overdue"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtMoney = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i);

function StatCard({ label, value, sub, color, icon }) {
    return (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "clamp(14px,2vw,20px)", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#94a3b8" }}>{label}</div>
                <div style={{ fontSize: 20 }}>{icon}</div>
            </div>
            <div style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 900, color: color || "#1e293b" }}>{value}</div>
            {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
        </div>
    );
}

export default function InvoicesPage() {
    const navigate = useNavigate();
    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [selected, setSelected] = useState(new Set());

    // ── Filters ──────────────────────────────────────────────────────────────
    const [search, setSearch] = useState("");
    const [statusFilter, setStatus] = useState("all");
    const [yearFilter, setYear] = useState("all");
    const [monthFilter, setMonth] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter !== "all") params.status = statusFilter;
            if (search) params.search = search;
            if (yearFilter !== "all") params.year = yearFilter;
            if (monthFilter !== "all") params.month = monthFilter;
            params.sort = sortBy;
            params.per_page = 200;
            const [invData, statsData] = await Promise.all([
                invoiceService.getAll(params),
                invoiceService.getStats({ year: yearFilter, month: monthFilter }),
            ]);
            setInvoices(invData.invoices || []);
            setStats(statsData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [statusFilter, search, yearFilter, monthFilter, sortBy]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Selection ─────────────────────────────────────────────────────────────
    const toggleSelect = id => setSelected(prev => {
        const s = new Set(prev);
        s.has(id) ? s.delete(id) : s.add(id);
        return s;
    });
    const toggleAll = () => {
        if (selected.size === invoices.length) setSelected(new Set());
        else setSelected(new Set(invoices.map(i => i.id)));
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async id => {
        const r = await Swal.fire({ title: "Delete invoice?", text: "Cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" });
        if (!r.isConfirmed) return;
        try { await invoiceService.delete(id); setInvoices(p => p.filter(i => i.id !== id)); setSelected(p => { const s = new Set(p); s.delete(id); return s; }); }
        catch (err) { Swal.fire({ icon: "error", title: err.message }); }
    };

    const handleDeleteSelected = async () => {
        const r = await Swal.fire({ title: `Delete ${selected.size} invoice${selected.size > 1 ? "s" : ""}?`, icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete all" });
        if (!r.isConfirmed) return;
        await Promise.all([...selected].map(id => invoiceService.delete(id)));
        setInvoices(p => p.filter(i => !selected.has(i.id)));
        setSelected(new Set());
    };

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSend = async id => {
        try { await invoiceService.sendEmail(id); Swal.fire({ icon: "success", title: "Invoice sent!", timer: 1500, showConfirmButton: false }); loadData(); }
        catch (err) { Swal.fire({ icon: "error", title: err.message }); }
    };

    // ── Export PDF ────────────────────────────────────────────────────────────
    const handleExportPDF = async () => {
        setExporting(true);
        try {
            const toExport = selected.size > 0
                ? invoices.filter(i => selected.has(i.id))
                : invoices;
            await generateInvoiceReportPDF({
                invoices: toExport,
                stats,
                filters: { status: statusFilter, year: yearFilter, month: monthFilter, search },
            });
        } catch (err) { Swal.fire({ icon: "error", title: "PDF failed", text: err.message }); }
        finally { setExporting(false); }
    };

    // ── Period label ──────────────────────────────────────────────────────────
    const periodLabel = () => {
        if (yearFilter === "all") return "All time";
        if (monthFilter === "all") return String(yearFilter);
        return `${MONTHS[Number(monthFilter) - 1]} ${yearFilter}`;
    };

    const inp = { padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff", color: "#1e293b", fontFamily: "inherit" };

    return (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(16px,3vw,28px)" }}>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                .inv-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px;}
                .inv-filters{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px;}
                .inv-filter-group{display:flex;gap:8px;flex-wrap:wrap;}
                .inv-table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;}
                .inv-table{width:100%;border-collapse:collapse;}
                .inv-table th{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;padding:10px 14px;text-align:left;border-bottom:1px solid #e2e8f0;white-space:nowrap;background:#f8fafc;}
                .inv-table td{padding:12px 14px;border-bottom:1px solid #f8fafc;font-size:13px;color:#374151;vertical-align:middle;}
                .inv-table tr:last-child td{border-bottom:none;}
                .inv-table tr:hover td{background:#fafbfc;}
                .inv-mobile{display:none;}
                .inv-actions{display:flex;gap:6px;flex-wrap:wrap;}
                @media(max-width:900px){
                    .inv-stats{grid-template-columns:repeat(2,1fr);}
                    .inv-table-wrap{display:none;}
                    .inv-mobile{display:flex;flex-direction:column;gap:12px;}
                }
                @media(max-width:500px){
                    .inv-stats{grid-template-columns:1fr 1fr;}
                    .inv-filters{flex-direction:column;align-items:stretch;}
                    .inv-filter-group{justify-content:flex-start;}
                }
            `}</style>

            {/* ── Header ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: "clamp(20px,3vw,26px)", fontWeight: 800, color: "#1e293b" }}>🧾 Invoices</h1>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                        {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · {periodLabel()}
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selected.size > 0 && (
                        <button onClick={handleDeleteSelected}
                            style={{ padding: "9px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            🗑 Delete ({selected.size})
                        </button>
                    )}
                    <button onClick={handleExportPDF} disabled={exporting}
                        style={{ padding: "9px 16px", background: "#f1f5f9", color: "#1e293b", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        {exporting ? "⏳ Generating…" : "📥 Download PDF report"}
                    </button>
                    <button onClick={() => navigate("/providerdashboard/invoices/new")}
                        style={{ padding: "9px 18px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                        + New Invoice
                    </button>
                </div>
            </div>

            {/* ── Stats ── */}
            {stats && (
                <div className="inv-stats">
                    <StatCard label="Total paid" value={fmtMoney(stats.total_paid)} color="#16a34a" icon="✅" sub={`${stats.count_paid || 0} invoices`} />
                    <StatCard label="Outstanding" value={fmtMoney(stats.total_outstanding)} color="#d97706" icon="⏳" sub={`${stats.count_sent || 0} invoices`} />
                    <StatCard label="Overdue" value={fmtMoney(stats.total_overdue)} color="#dc2626" icon="⚠️" sub={`${stats.count_overdue || 0} invoices`} />
                    <StatCard label="Draft" value={fmtMoney(stats.total_draft)} color="#64748b" icon="📝" sub={`${stats.count_draft || 0} invoices`} />
                </div>
            )}

            {/* ── Filters ── */}
            <div className="inv-filters">
                {/* Search */}
                <input style={{ ...inp, flex: 1, minWidth: 180 }} placeholder="🔍 Search invoice # or client…"
                    value={search} onChange={e => setSearch(e.target.value)} />

                {/* Year */}
                <select style={inp} value={yearFilter} onChange={e => setYear(e.target.value)}>
                    <option value="all">All years</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                {/* Month */}
                <select style={inp} value={monthFilter} onChange={e => setMonth(e.target.value)}>
                    <option value="all">All months</option>
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                </select>

                {/* Sort */}
                <select style={inp} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="newest">Newest first</option>
                    <option value="oldest">Oldest first</option>
                    <option value="amount_desc">Highest amount</option>
                    <option value="amount_asc">Lowest amount</option>
                    <option value="due_soon">Due soonest</option>
                </select>
            </div>

            {/* Status tabs */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                {STATUSES.map(s => (
                    <button key={s} onClick={() => setStatus(s)} style={{
                        padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: "pointer",
                        border: `1.5px solid ${statusFilter === s ? "#1e293b" : "#e2e8f0"}`,
                        background: statusFilter === s ? "#1e293b" : "#fff",
                        color: statusFilter === s ? "#fff" : "#64748b",
                        textTransform: "capitalize",
                    }}>
                        {s === "all" ? "All statuses" : s}
                        {stats && s !== "all" && (
                            <span style={{ marginLeft: 5, fontSize: 10, opacity: .7 }}>
                                ({stats[`count_${s}`] || 0})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ textAlign: "center", padding: 48 }}>
                    <div style={{ width: 32, height: 32, border: "3px solid #e2e8f0", borderTopColor: "#1e293b", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                    <p style={{ color: "#64748b", fontSize: 13 }}>Loading invoices…</p>
                </div>
            )}

            {/* Empty */}
            {!loading && invoices.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 24px", background: "#fff", borderRadius: 14, border: "2px dashed #e2e8f0" }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>🧾</div>
                    <h3 style={{ margin: "0 0 8px", color: "#1e293b" }}>No invoices found</h3>
                    <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 13 }}>Try adjusting your filters or create a new invoice</p>
                    <button onClick={() => navigate("/providerdashboard/invoices/new")}
                        style={{ background: "#1e293b", color: "#fff", border: "none", borderRadius: 9, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        + New Invoice
                    </button>
                </div>
            )}

            {/* ── DESKTOP TABLE ── */}
            {!loading && invoices.length > 0 && (
                <div className="inv-table-wrap">
                    <table className="inv-table">
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}>
                                    <input type="checkbox" checked={selected.size === invoices.length && invoices.length > 0}
                                        onChange={toggleAll} style={{ cursor: "pointer" }} />
                                </th>
                                <th>#</th>
                                <th>Client</th>
                                <th>Amount</th>
                                <th>Issued</th>
                                <th>Due</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoices.map(inv => (
                                <tr key={inv.id} style={{ background: selected.has(inv.id) ? "#f8fafc" : "#fff" }}>
                                    <td>
                                        <input type="checkbox" checked={selected.has(inv.id)}
                                            onChange={() => toggleSelect(inv.id)} style={{ cursor: "pointer" }} />
                                    </td>
                                    <td><span style={{ fontWeight: 700, color: "#1e293b" }}>#{inv.invoice_number}</span></td>
                                    <td>
                                        <div style={{ fontWeight: 600, color: "#1e293b" }}>{inv.customer_name || "—"}</div>
                                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{inv.customer_email}</div>
                                    </td>
                                    <td><span style={{ fontWeight: 800, fontSize: 14, color: "#1e293b" }}>{fmtMoney(inv.total_amount)}</span></td>
                                    <td style={{ color: "#64748b" }}>{fmtDate(inv.issue_date)}</td>
                                    <td style={{ color: inv.status === "overdue" ? "#dc2626" : "#64748b", fontWeight: inv.status === "overdue" ? 700 : 400 }}>
                                        {fmtDate(inv.due_date)}
                                    </td>
                                    <td><InvoiceStatusBadge status={inv.status} /></td>
                                    <td>
                                        <div className="inv-actions">
                                            <Link to={`/providerdashboard/invoices/${inv.id}`}
                                                style={{ padding: "5px 12px", background: "#f1f5f9", color: "#1e293b", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                                View
                                            </Link>
                                            {inv.status !== "paid" && (
                                                <button onClick={() => handleSend(inv.id)}
                                                    style={{ padding: "5px 12px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                                    Send
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(inv.id)}
                                                style={{ padding: "5px 10px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>
                                                🗑
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary footer */}
                    <div style={{ padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#64748b" }}>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · {selected.size > 0 ? `${selected.size} selected` : "Click rows to select"}</span>
                        <div style={{ display: "flex", gap: 16 }}>
                            <span style={{ fontSize: 12, color: "#64748b" }}>Total shown: <strong style={{ color: "#1e293b" }}>{fmtMoney(invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0))}</strong></span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MOBILE CARDS ── */}
            {!loading && invoices.length > 0 && (
                <div className="inv-mobile">
                    {invoices.map(inv => (
                        <div key={inv.id} style={{ background: "#fff", border: `1px solid ${inv.status === "overdue" ? "#fecaca" : "#e2e8f0"}`, borderRadius: 12, padding: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: "#1e293b", fontSize: 14 }}>#{inv.invoice_number}</div>
                                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{inv.customer_name}</div>
                                </div>
                                <InvoiceStatusBadge status={inv.status} />
                            </div>
                            <div style={{ fontSize: 22, fontWeight: 900, color: "#1e293b", marginBottom: 10 }}>{fmtMoney(inv.total_amount)}</div>
                            <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#64748b", marginBottom: 12 }}>
                                <span>Issued: {fmtDate(inv.issue_date)}</span>
                                <span style={{ color: inv.status === "overdue" ? "#dc2626" : "inherit" }}>Due: {fmtDate(inv.due_date)}</span>
                            </div>
                            <div style={{ display: "flex", gap: 8, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
                                <Link to={`/providerdashboard/invoices/${inv.id}`}
                                    style={{ flex: 1, textAlign: "center", padding: "8px", background: "#1e293b", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                    View
                                </Link>
                                {inv.status !== "paid" && (
                                    <button onClick={() => handleSend(inv.id)}
                                        style={{ flex: 1, padding: "8px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                                        Send
                                    </button>
                                )}
                                <button onClick={() => handleDelete(inv.id)}
                                    style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 7, fontSize: 12, cursor: "pointer" }}>
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}