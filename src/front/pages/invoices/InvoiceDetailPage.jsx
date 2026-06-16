// src/front/pages/invoices/InvoiceDetailPage.jsx
// Full invoice view with PDF download, email send, status update

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { invoiceService } from "./invoiceService";
import InvoiceStatusBadge from "./components/InvoiceStatusBadge";
import Swal from "sweetalert2";
import { useReactToPrint } from "react-to-print";

const fmtMoney = (v) => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "$0.00";
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";

const STATUS_TRANSITIONS = {
    draft: ["sent"],
    sent: ["paid", "overdue"],
    overdue: ["paid"],
    paid: [],
};

export default function InvoiceDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const printRef = useRef();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        invoiceService.getById(id)
            .then(d => setInvoice(d.invoice || d))
            .catch(err => { console.error(err); navigate("/providerdashboard/invoices"); })
            .finally(() => setLoading(false));
    }, [id]);

    const handlePrint = () => window.print();

    const handleSend = async () => {
        setSending(true);
        try {
            await invoiceService.sendEmail(id);
            Swal.fire({ icon: "success", title: "Invoice sent!", text: "Email delivered to client.", timer: 2000, showConfirmButton: false });
            setInvoice(prev => ({ ...prev, status: "sent" }));
        } catch (err) {
            Swal.fire({ icon: "error", title: "Failed to send", text: err.message });
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const updated = await invoiceService.updateStatus(id, newStatus);
            setInvoice(prev => ({ ...prev, status: newStatus }));
            Swal.fire({ icon: "success", title: `Marked as ${newStatus}`, timer: 1500, showConfirmButton: false });
        } catch (err) {
            Swal.fire({ icon: "error", title: err.message });
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({ title: "Delete invoice?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#dc2626", confirmButtonText: "Delete" });
        if (!result.isConfirmed) return;
        await invoiceService.delete(id);
        navigate("/providerdashboard/invoices");
    };

    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
            <div style={{ width: 36, height: 36, border: "3px solid #e2e8f0", borderTopColor: "#1e293b", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!invoice) return null;

    const nextStatuses = STATUS_TRANSITIONS[invoice.status] || [];
    const subtotal = invoice.invoice_items?.reduce((s, item) => s + (item.quantity * item.unit_price), 0) || Number(invoice.subtotal) || 0;
    const tax = Number(invoice.tax) || 0;
    const total = Number(invoice.total_amount) || subtotal + tax;

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(16px,3vw,28px)" }}>
            <style>{`
                @keyframes spin{to{transform:rotate(360deg)}}
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff; }
                }
                .inv-detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                @media(max-width:640px) { .inv-detail-grid { grid-template-columns: 1fr; gap: 16px; } }
            `}</style>

            {/* Back + Actions */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
                <button onClick={() => navigate("/providerdashboard/invoices")}
                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
                    ← Back to invoices
                </button>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {nextStatuses.map(s => (
                        <button key={s} onClick={() => handleStatusChange(s)}
                            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1.5px solid #e2e8f0", background: "#fff", color: "#374151", textTransform: "capitalize" }}>
                            Mark as {s}
                        </button>
                    ))}
                    <button onClick={handleSend} disabled={sending}
                        style={{ padding: "8px 16px", background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        {sending ? "Sending…" : "✉ Send email"}
                    </button>
                    <button onClick={handlePrint}
                        style={{ padding: "8px 16px", background: "#f1f5f9", color: "#1e293b", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        🖨 Print / PDF
                    </button>
                    <button onClick={handleDelete}
                        style={{ padding: "8px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        🗑
                    </button>
                </div>
            </div>

            {/* Invoice document */}
            <div ref={printRef} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "clamp(20px,4vw,40px)", boxShadow: "0 2px 12px rgba(0,0,0,.06)" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 32, paddingBottom: 24, borderBottom: "2px solid #f1f5f9" }}>
                    <div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: "#1e293b", marginBottom: 4 }}>INVOICE</div>
                        <div style={{ fontSize: 20, fontWeight: 700, color: "#64748b" }}>#{invoice.invoice_number}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <InvoiceStatusBadge status={invoice.status} />
                        <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                            <div>Issued: <strong>{fmtDate(invoice.issue_date)}</strong></div>
                            <div style={{ color: invoice.status === "overdue" ? "#dc2626" : "#64748b" }}>
                                Due: <strong>{fmtDate(invoice.due_date)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* From / To */}
                <div className="inv-detail-grid" style={{ marginBottom: 32 }}>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#94a3b8", marginBottom: 8 }}>From</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{invoice.contractor_name || "Your Business"}</div>
                        {invoice.contractor_email && <div style={{ fontSize: 13, color: "#64748b" }}>{invoice.contractor_email}</div>}
                        {invoice.contractor_phone && <div style={{ fontSize: 13, color: "#64748b" }}>{invoice.contractor_phone}</div>}
                        {invoice.contractor_address && <div style={{ fontSize: 13, color: "#64748b" }}>{invoice.contractor_address}</div>}
                    </div>
                    <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", color: "#94a3b8", marginBottom: 8 }}>Bill to</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>{invoice.customer_name || "—"}</div>
                        {invoice.customer_email && <div style={{ fontSize: 13, color: "#64748b" }}>{invoice.customer_email}</div>}
                        {invoice.customer_address && <div style={{ fontSize: 13, color: "#64748b" }}>{invoice.customer_address}</div>}
                    </div>
                </div>

                {/* Line items */}
                <div style={{ marginBottom: 24 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "#f8fafc" }}>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8", borderRadius: "8px 0 0 0" }}>Description</th>
                                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" }}>Qty</th>
                                <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8" }}>Unit Price</th>
                                <th style={{ padding: "10px 14px", textAlign: "right", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#94a3b8", borderRadius: "0 8px 0 0" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice.invoice_items || []).map((item, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "12px 14px", fontSize: 13, color: "#374151" }}>{item.description}</td>
                                    <td style={{ padding: "12px 14px", textAlign: "center", fontSize: 13, color: "#64748b" }}>{item.quantity}</td>
                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, color: "#64748b" }}>{fmtMoney(item.unit_price)}</td>
                                    <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{fmtMoney(item.quantity * item.unit_price)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <div style={{ width: "100%", maxWidth: 280 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
                            <span>Subtotal</span><span>{fmtMoney(subtotal)}</span>
                        </div>
                        {tax > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 13, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
                                <span>Tax</span><span>{fmtMoney(tax)}</span>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", fontSize: 18, fontWeight: 900, color: "#1e293b", borderTop: "2px solid #1e293b", marginTop: 4 }}>
                            <span>Total</span><span>{fmtMoney(total)}</span>
                        </div>
                        {invoice.status === "paid" && invoice.paid_at && (
                            <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "8px 12px", marginTop: 8, fontSize: 12, color: "#16a34a", fontWeight: 700 }}>
                                ✓ Paid on {fmtDate(invoice.paid_at)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <div style={{ marginTop: 28, padding: 16, background: "#f8fafc", borderRadius: 8, fontSize: 13, color: "#64748b", borderLeft: "3px solid #e2e8f0" }}>
                        <strong>Notes:</strong> {invoice.notes}
                    </div>
                )}
            </div>
        </div>
    );
}