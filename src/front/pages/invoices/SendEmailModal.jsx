import { useState } from "react";
import { useInvoice } from "./InvoiceContext"
import { buildInvoicePDF } from "./utils/useInvoicePDF.js"



const money = v => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

export default function SendEmailModal({ show, invoice, onClose, onSent }) {

    const [email, setEmail] = useState(invoice.customer_email || "");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false)

    const handleSend = async () => {
        if (!email) return;
        setSending(true);
        try {
            const doc = buildInvoicePDF(invoice)
            const base64 = doc.output('datauristring').split(',')[1];

            const token = localStorage.getItem('token');
            const BASE = import.meta.env.VITE_BACKEND_URL || '';
            const res = await fetch(`${BASE}/api/invoices/${invoice.id}/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipient_email: email,
                    pdf_base64: base64,
                    filename: `invoice-${invoice.invoice_number}.pdf`
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failled to send.')
            setSent(true);
            onSent();
        } catch (e) {
            alert('Failed to send: ' + e.message);
        } finally {
            setSending(false)
        }
    }

    if (!show) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">✉️ Send invoice to client</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            {sent ? (
                                <div className="text-center py-4">
                                    <div style={{ fontSize: 56 }}>✅</div>
                                    <h6 className="fw-bold mt-3">Invoice sent!</h6>
                                    <p className="text-muted">Sent to <strong>{email}</strong></p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                                        The invoice will be emailed to your client. You can change the address below if needed.
                                    </p>
                                    <label className="form-label fw-medium small">
                                        Recipient email <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control mb-3"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="client@email.com"
                                    />
                                    <div className="alert alert-success d-flex align-items-center gap-2 py-2">
                                        <span>💰</span>
                                        <span>Total: <strong>{money(invoice.total_amount)}</strong></span>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer border-0 pt-0 gap-2">
                            <button className="btn btn-outline-secondary" onClick={onClose}>
                                {sent ? "Close" : "Cancel"}
                            </button>
                            {!sent && (
                                <button className="btn btn-dark fw-semibold flex-fill"
                                    onClick={handleSend} disabled={sending || !email}>
                                    {sending
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</>
                                        : "✉️ Send invoice"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )}