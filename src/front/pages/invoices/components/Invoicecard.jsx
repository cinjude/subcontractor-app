// src/front/pages/invoices/components/InvoiceCard.jsx

import { Link } from "react-router-dom";
import InvoiceStatusBadge from "./Invoicestatusbadge";

export default function InvoiceCard({ invoice, onDelete, onSend }) {
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const fmtMoney = (v) => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";
    const isOverdue = invoice.status === "overdue";

    return (
        <div style={{
            background: "#fff",
            border: `1px solid ${isOverdue ? "#fecaca" : "#e2e8f0"}`,
            borderRadius: 12,
            padding: "clamp(14px,2vw,20px)",
            display: "flex", flexDirection: "column", gap: 12,
            boxShadow: "0 1px 6px rgba(0,0,0,.05)",
            transition: "box-shadow .2s",
        }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.1)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,.05)"}
        >
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#1e293b" }}>
                        #{invoice.invoice_number}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                        {invoice.customer_name || "—"}
                    </div>
                </div>
                <InvoiceStatusBadge status={invoice.status} />
            </div>

            {/* Amount */}
            <div style={{ fontSize: "clamp(20px,3vw,26px)", fontWeight: 900, color: "#1e293b" }}>
                {fmtMoney(invoice.total_amount)}
            </div>

            {/* Dates */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Issued</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{fmtDate(invoice.issue_date)}</div>
                </div>
                <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".06em" }}>Due</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: isOverdue ? "#dc2626" : "#374151" }}>{fmtDate(invoice.due_date)}</div>
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
                <Link to={`/providerdashboard/invoices/${invoice.id}`}
                    style={{ flex: 1, minWidth: 80, textAlign: "center", padding: "8px 12px", background: "#1e293b", color: "#fff", borderRadius: 7, fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    View
                </Link>
                {invoice.status !== "paid" && (
                    <button onClick={() => onSend(invoice.id)}
                        style={{ flex: 1, minWidth: 80, padding: "8px 12px", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        Send
                    </button>
                )}
                <button onClick={() => onDelete(invoice.id)}
                    style={{ padding: "8px 12px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    🗑
                </button>
            </div>
        </div>
    );
}