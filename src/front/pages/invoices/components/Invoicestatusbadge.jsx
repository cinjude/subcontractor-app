// src/front/pages/invoices/components/InvoiceStatusBadge.jsx

const STATUS_CONFIG = {
    draft: { label: "Draft", bg: "#f1f5f9", color: "#64748b", dot: "#94a3b8" },
    sent: { label: "Sent", bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
    paid: { label: "Paid", bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
    overdue: { label: "Overdue", bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
};

export default function InvoiceStatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 20,
            textTransform: "uppercase", letterSpacing: ".06em",
            whiteSpace: "nowrap",
        }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}