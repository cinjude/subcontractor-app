// src/front/pages/invoices/InvoiceDetailPage.jsx
// FINAL — full breakdown display + real PDF wiring applied (preview/download)

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "./InvoiceContext";
import { useInvoicePDF } from "./utils/useInvoicePDF.js";
import SendEmailModal from "./SendEmailModal.jsx";

const money = v => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

const STATUS_CFG = {
    draft: { cls: "text-bg-secondary", label: "Draft", icon: "📝" },
    sent: { cls: "text-bg-primary", label: "Sent", icon: "✉️" },
    paid: { cls: "text-bg-success", label: "Paid", icon: "✅" },
    overdue: { cls: "text-bg-danger", label: "Overdue", icon: "⚠️" },
};

const NEXT_STATUS = {
    draft: [{ value: "sent", label: "Mark as sent", btn: "btn-primary" }],
    sent: [{ value: "paid", label: "Mark as paid", btn: "btn-success" },
    { value: "overdue", label: "Mark as overdue", btn: "btn-outline-danger" }],
    overdue: [{ value: "paid", label: "Mark as paid", btn: "btn-success" }],
    paid: [],
};

function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (e) { return fallback; }
}

function InfoRow({ label, value, accent, mono }) {
    if (!value && value !== 0) return null;
    return (
        <div className="d-flex justify-content-between align-items-start py-2 border-bottom">
            <span className="text-muted flex-shrink-0 me-3" style={{ fontSize: 13 }}>{label}</span>
            <span className={`text-end fw-medium ${accent || ""} ${mono ? "font-monospace" : ""}`} style={{ fontSize: 13 }}>{value}</span>
        </div>
    );
}

function SectionCard({ title, icon, children, headerExtra }) {
    return (
        <div className="card border shadow-sm mb-3">
            <div className="card-header bg-light py-2 px-3 d-flex align-items-center justify-content-between gap-2">
                <div className="d-flex align-items-center gap-2">
                    <span>{icon}</span>
                    <span className="fw-semibold small text-uppercase" style={{ letterSpacing: "0.05em", fontSize: 11 }}>{title}</span>
                </div>
                {headerExtra}
            </div>
            <div className="card-body py-2 px-3">{children}</div>
        </div>
    );
}

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchInvoice, updateStatus, deleteInvoice, sendEmail } = useInvoice();
    const { downloadPDF, previewPDF } = useInvoicePDF();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false)

    const load = () => fetchInvoice(id)
        .then(data => setInvoice(data.invoice ?? data))
        .catch(() => { })
        .finally(() => setLoading(false));

    useEffect(() => { load(); }, [id]);

    const handleSend = async () => {
        setSending(true);
        try { await sendEmail(id); await load(); }
        catch (e) { alert(e.message); }
        finally { setSending(false); }
    };

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try { await updateStatus(id, newStatus); await load(); }
        catch (e) { alert(e.message); }
        finally { setUpdatingStatus(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this invoice permanently?")) return;
        await deleteInvoice(id);
        navigate("/providerdashboard/invoices");
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
            <div className="spinner-border text-secondary" role="status" />
        </div>
    );

    if (!invoice) return (
        <div className="container py-5 text-center">
            <p className="text-muted">Invoice not found</p>
            <button className="btn btn-outline-secondary" onClick={() => navigate("/providerdashboard/invoices")}>← Back</button>
        </div>
    );

    const st = STATUS_CFG[invoice.status] || STATUS_CFG.draft;
    const nextActions = NEXT_STATUS[invoice.status] || [];
    const issueDate = invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
    const isOverdue = invoice.status === "overdue";

    const rooms = safeParse(invoice.rooms_json, []);
    const mats = safeParse(invoice.materials_json, []);
    const extras = safeParse(invoice.extras_json, {});
    let breakdown = safeParse(invoice.price_breakdown_json, []);
    breakdown = breakdown.filter(l => l.section !== "__tax_meta__");

    const hasDetailedBreakdown = breakdown.length > 0;
    const materialsCost = mats.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);
    const totalSqft = rooms.reduce((s, r) => s + (Number(r.floor_sqft) || 0), 0);

    const typeLabel = invoice.estimate_type === "painting" ? "🎨 Painting"
        : invoice.estimate_type === "flooring" ? "🪵 Flooring"
            : invoice.estimate_type === "both" ? "🎨🪵 Painting + Flooring"
                : null;

    const CAT_BADGE = {
        paint: "#1d4ed8", supplies: "#15803d", flooring: "#92400e",
        adhesive: "#7c3aed", prep: "#c2410c", hardware: "#374151", other: "#6b7280"
    };
    const CAT_LABEL = {
        paint: "Paint", supplies: "Supplies", flooring: "Flooring",
        adhesive: "Adhesive", prep: "Prep", hardware: "Hardware", other: "Other"
    };

    const SECS = ["Materials", "Installation", "Prep & extras", "Protection fees"];
    const ICON = { "Materials": "🛒", "Installation": "🔨", "Prep & extras": "🔧", "Protection fees": "🛡️" };
    const BG = { "Materials": "#fff8f0", "Installation": "#f8f9fa", "Prep & extras": "#f8f9fa", "Protection fees": "#f8f9fa" };
    const COL = { "Materials": "#c2410c", "Installation": "#6c757d", "Prep & extras": "#6c757d", "Protection fees": "#6c757d" };

    const extraTags = [];
    if (extras.furniture_rooms > 0) extraTags.push(`🪑 ${extras.furniture_rooms} room${extras.furniture_rooms > 1 ? "s" : ""} furniture`);
    if (extras.furniture_heavy > 0) extraTags.push(`🛋️ ${extras.furniture_heavy} heavy item${extras.furniture_heavy > 1 ? "s" : ""}`);
    if (extras.moisture_barrier) extraTags.push("💧 Moisture barrier");
    if (extras.floor_leveling) extraTags.push(`📐 Floor leveling${extras.floor_leveling_mode === "bag" ? ` (${extras.floor_leveling_bags} bag${extras.floor_leveling_bags > 1 ? "s" : ""})` : " (per sq ft)"}`);
    if (extras.heavy_demo) extraTags.push("⚒️ Heavy demo");
    if (extras.travel_miles > 0) extraTags.push(`🚗 ${extras.travel_miles} mi${extras.use_flat_travel ? " (flat fee)" : ""}`);

    return (
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-5" style={{ maxWidth: 960, margin: "0 auto" }}>
            <style>{`@media print { .no-print { display: none !important; } }`}</style>

            <div className="no-print d-flex align-items-center justify-content-between mb-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/providerdashboard/invoices")}>
                    ← Invoices
                </button>
                <div className="d-none d-md-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => previewPDF(invoice)}>👁 Preview PDF</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadPDF(invoice)}>⬇ Download PDF</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(`/providerdashboard/invoices/${id}/edit`)}>✏️ Edit invoice</button>
                    {invoice.status !== "paid" && (
                        <button className="btn btn-dark btn-sm fw-semibold" onClick={() => setShowEmailModal(true)} disabled={sending}>
                            {sending ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : "✉️ Send to client"}
                        </button>
                    )}
                    <div className="dropdown">
                        <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">More</button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item text-danger" onClick={handleDelete}>🗑 Delete</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* ── LEFT COLUMN ── */}
                <div className="col-12 col-lg-7">
                    <div className="card border shadow-sm mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1" style={{ fontSize: 12 }}>#{invoice.invoice_number} · Issued {issueDate}</p>
                                    {typeLabel && <h6 className="fw-bold mb-0">{typeLabel}</h6>}
                                    <h4 className="fw-bold mb-0">{invoice.customer_name}</h4>
                                    <p className={`mb-0 ${isOverdue ? "text-danger fw-semibold" : "text-muted"}`} style={{ fontSize: 13 }}>
                                        Due {dueDate}
                                    </p>
                                </div>
                                <span className={`badge fs-6 px-3 py-2 ${st.cls}`}>{st.icon} {st.label}</span>
                            </div>

                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {totalSqft > 0 && <span className="badge bg-secondary bg-opacity-10 text-secondary border fs-6 px-3 py-2">📐 {totalSqft.toFixed(0)} sq ft</span>}
                                {materialsCost > 0 && <span className="badge bg-danger bg-opacity-10 text-danger border border-danger-subtle fs-6 px-3 py-2">🛒 {money(materialsCost)} materials</span>}
                            </div>

                            <div className="rounded-3 p-3 text-center mb-3" style={{ background: "#1e2d4a" }}>
                                <p className="text-white-50 mb-1 small">Total amount</p>
                                <p className="fw-bold text-white mb-0" style={{ fontSize: 38 }}>{money(invoice.total_amount)}</p>
                                {invoice.status === "paid" && invoice.paid_at && (
                                    <p className="text-success mt-2 mb-0 small">✓ Paid on {new Date(invoice.paid_at).toLocaleDateString()}</p>
                                )}
                            </div>

                            {extraTags.length > 0 && (
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {extraTags.map((t, i) => (
                                        <span key={i} className="badge rounded-pill" style={{ background: "#e2e8f0", color: "#374151", fontSize: 12, padding: "4px 10px", fontWeight: 500 }}>{t}</span>
                                    ))}
                                </div>
                            )}

                            {hasDetailedBreakdown ? (
                                <div className="rounded-3 overflow-hidden" style={{ border: "1px solid #dee2e6" }}>
                                    <div className="d-flex px-3 py-2" style={{ background: "#1e2d4a" }}>
                                        <span className="flex-fill fw-semibold text-white" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Item / Service</span>
                                        <span className="fw-semibold text-white" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", minWidth: 80, textAlign: "right" }}>Amount</span>
                                    </div>
                                    {SECS.map(sec => {
                                        const ls = breakdown.filter(l => l.section === sec);
                                        if (!ls.length) return null;
                                        return (
                                            <div key={sec}>
                                                <div className="px-3 py-1" style={{ background: BG[sec] || "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: COL[sec] || "#6c757d" }}>{ICON[sec]} {sec}</span>
                                                </div>
                                                {ls.map((ln, i) => (
                                                    <div key={i} className="d-flex justify-content-between px-3" style={{ padding: "7px 16px", borderBottom: i < ls.length - 1 ? "1px solid #f1f5f9" : "1px solid #dee2e6", fontSize: 13 }}>
                                                        <span className={ln.warn ? "text-warning fw-medium" : "text-muted"}>{ln.warn ? "⚠ " : ""}{ln.description || ln.label}</span>
                                                        <span className={`fw-medium ${ln.amount < 0 ? "text-danger" : "text-dark"}`} style={{ minWidth: 80, textAlign: "right" }}>
                                                            {ln.amount < 0 ? "-" : ""}{money(Math.abs(Number(ln.amount)))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                    {invoice.tax > 0 && (
                                        <div className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                            <span className="text-muted">Tax</span>
                                            <span className="fw-medium">{money(invoice.tax)}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between px-3 py-3" style={{ background: "#f0fdf4" }}>
                                        <span className="fw-bold" style={{ fontSize: 14 }}>Total</span>
                                        <span className="fw-bold text-success" style={{ fontSize: 16 }}>{money(invoice.total_amount)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-3 overflow-hidden" style={{ border: "1px solid #dee2e6" }}>
                                    <div className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                        <span className="text-muted">Subtotal</span>
                                        <span className="fw-medium">{money(invoice.subtotal)}</span>
                                    </div>
                                    {invoice.tax > 0 && (
                                        <div className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                            <span className="text-muted">Tax</span>
                                            <span className="fw-medium">{money(invoice.tax)}</span>
                                        </div>
                                    )}
                                    <div className="d-flex justify-content-between px-3 py-3" style={{ background: "#f0fdf4" }}>
                                        <span className="fw-bold" style={{ fontSize: 14 }}>Total</span>
                                        <span className="fw-bold text-success" style={{ fontSize: 16 }}>{money(invoice.total_amount)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <SectionCard title="Client" icon="👤">
                        <InfoRow label="Name" value={invoice.customer_name} />
                        <InfoRow label="Email" value={invoice.customer_email} />
                        <InfoRow label="Address" value={invoice.customer_address} />
                    </SectionCard>

                    <SectionCard title="From" icon="🏢">
                        <InfoRow label="Business" value={invoice.contractor_name} />
                        <InfoRow label="Email" value={invoice.contractor_email} />
                        <InfoRow label="Phone" value={invoice.contractor_phone} />
                        <InfoRow label="Address" value={invoice.contractor_address} />
                    </SectionCard>

                    {rooms.length > 0 && (
                        <SectionCard title="Rooms / Areas" icon="📐">
                            {rooms.map((r, i) => (
                                <div key={i} className="d-flex justify-content-between border-bottom py-2">
                                    <span className="fw-medium" style={{ fontSize: 13 }}>{r.name}</span>
                                    {r.floor_sqft > 0 && <span className="text-muted" style={{ fontSize: 12 }}>{Number(r.floor_sqft).toFixed(0)} sq ft</span>}
                                </div>
                            ))}
                            <div className="d-flex justify-content-between pt-2 fw-semibold border-top mt-1">
                                <span style={{ fontSize: 13 }}>Total floor area</span>
                                <span className="text-success" style={{ fontSize: 13 }}>{totalSqft.toFixed(0)} sq ft</span>
                            </div>
                        </SectionCard>
                    )}

                    {mats.length > 0 && (
                        <SectionCard title="Materials to purchase" icon="🛒">
                            <div className="mb-2">
                                {mats.map((m, i) => {
                                    const rowTotal = (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0);
                                    const badge = CAT_BADGE[m.category] || CAT_BADGE.other;
                                    const label = CAT_LABEL[m.category] || "Other";
                                    return (
                                        <div key={i} className="d-flex justify-content-between align-items-start border-bottom py-2">
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div className="d-flex align-items-center gap-1 flex-wrap mb-1">
                                                    <span className="badge rounded-pill" style={{ background: badge, color: "#fff", fontSize: 9 }}>{label}</span>
                                                    <span className="fw-medium" style={{ fontSize: 13 }}>{m.name || "—"}</span>
                                                </div>
                                                <span className="text-muted" style={{ fontSize: 12 }}>
                                                    {m.quantity} {m.unit} × ${parseFloat(m.unit_cost || 0).toFixed(2)}{m.notes ? ` · ${m.notes}` : ""}
                                                </span>
                                            </div>
                                            <span className="fw-semibold text-danger ms-3 flex-shrink-0" style={{ fontSize: 13 }}>${rowTotal.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="d-flex justify-content-between pt-2 border-top">
                                <span className="fw-semibold text-muted" style={{ fontSize: 13 }}>Total materials cost</span>
                                <span className="fw-bold text-danger" style={{ fontSize: 14 }}>${materialsCost.toFixed(2)}</span>
                            </div>
                        </SectionCard>
                    )}

                    {!hasDetailedBreakdown && invoice.invoice_items?.length > 0 && (
                        <SectionCard title="Line items" icon="📋">
                            <div className="table-responsive">
                                <table className="table table-sm mb-0">
                                    <thead>
                                        <tr style={{ fontSize: 11 }} className="text-muted text-uppercase">
                                            <th>Description</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-end">Price</th>
                                            <th className="text-end">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.invoice_items.map((item, i) => (
                                            <tr key={i} style={{ fontSize: 13 }}>
                                                <td>{item.description}</td>
                                                <td className="text-center text-muted">{item.quantity}</td>
                                                <td className="text-end text-muted">{money(item.unit_price)}</td>
                                                <td className="text-end fw-semibold">{money(item.row_total ?? (item.quantity * item.unit_price))}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </SectionCard>
                    )}

                    {invoice.notes && (
                        <SectionCard title="Notes" icon="💬">
                            <p className="mb-0" style={{ fontSize: 14, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{invoice.notes}</p>
                        </SectionCard>
                    )}
                </div>

                {/* ── RIGHT SIDEBAR ── */}
                <div className="col-12 col-lg-5 no-print">
                    <div style={{ position: "sticky", top: 80 }}>
                        <div className="card border shadow-sm mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small">⚡ Actions</div>
                            <div className="card-body d-grid gap-2 py-3 px-3">

                                {invoice.status !== "paid" && (
                                    <button className="btn btn-dark fw-semibold py-2" onClick={() => setShowEmailModal(true)} disabled={sending}>
                                        {sending ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : "✉️ Send to client"}
                                    </button>
                                )}

                                <button className="btn btn-outline-secondary" onClick={() => previewPDF(invoice)}>👁 Preview PDF</button>
                                <button className="btn btn-outline-secondary" onClick={() => downloadPDF(invoice)}>⬇ Download PDF</button>
                                <button className="btn btn-outline-secondary" onClick={() => navigate(`/providerdashboard/invoices/${id}/edit`)}>✏️ Edit invoice</button>

                                {nextActions.length > 0 && <hr className="my-1" />}

                                {nextActions.map(action => (
                                    <button key={action.value} className={`btn fw-semibold ${action.btn}`}
                                        disabled={updatingStatus}
                                        onClick={() => handleStatusChange(action.value)}>
                                        {updatingStatus ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                        {action.label}
                                    </button>
                                ))}

                                {invoice.status === "paid" && (
                                    <div className="alert alert-success mb-0 text-center py-2">✅ Paid in full</div>
                                )}

                                <hr className="my-1" />
                                <button className="btn btn-link text-danger p-0 text-decoration-none" onClick={handleDelete}>
                                    🗑 Delete invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="d-md-none no-print">
                <div className="fixed-bottom bg-white border-top px-3 py-2 d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={() => downloadPDF(invoice)}>⬇ PDF</button>
                    <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={() => navigate(`/providerdashboard/invoices/${id}/edit`)}>✏️ Edit</button>
                    {invoice.status !== "paid" ? (
                        <button className="btn btn-dark btn-sm flex-fill fw-semibold" onClick={() => setShowEmailModal(true)}>✉️ Send</button>
                    ) : (
                        <span className="btn btn-success btn-sm flex-fill fw-semibold disabled">✅ Paid</span>
                    )}
                    {nextActions[0] && (
                        <button className={`btn btn-sm flex-fill fw-semibold ${nextActions[0].btn}`}
                            onClick={() => handleStatusChange(nextActions[0].value)} disabled={updatingStatus}>
                            {nextActions[0].label.replace("Mark as ", "→ ")}
                        </button>
                    )}
                </div>
                <div style={{ height: 64 }} />
            </div>
            <SendEmailModal
                show={showEmailModal}
                invoice={invoice}
                onClose={() => setShowEmailModal(false)}
                onSent={load}
            />
        </div>
    );
}