// src/front/pages/invoices/CreateInvoicePage.jsx
// Create new invoice with line items, tax, due date

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { invoiceService } from "./invoiceService";
import Swal from "sweetalert2";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const token = () => localStorage.getItem("token");
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });
const fmtMoney = (v) => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const emptyItem = () => ({ description: "", quantity: 1, unit_price: 0 });

export default function CreateInvoicePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const jobId = params.get("job_id");

    const [customers, setCustomers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        customer_id: "",
        job_id: jobId || "",
        due_date: "",
        notes: "",
        tax: 0,
        payment_link: "",
    });
    const [items, setItems] = useState([emptyItem()]);

    // Load customers and jobs
    useEffect(() => {
        fetch(`${BASE}/api/customers`, { headers: authH() })
            .then(r => r.json()).then(d => setCustomers(d.customers || d || [])).catch(() => { });
        fetch(`${BASE}/api/jobs`, { headers: authH() })
            .then(r => r.json()).then(d => setJobs(d.jobs || [])).catch(() => { });
    }, []);

    // Pre-fill from job
    useEffect(() => {
        if (!jobId) return;
        fetch(`${BASE}/api/jobs/${jobId}`, { headers: authH() })
            .then(r => r.json())
            .then(job => {
                setForm(f => ({ ...f, customer_id: job.customer_id || "", job_id: jobId }));
                if (job.title) {
                    setItems([{ description: job.title, quantity: 1, unit_price: job.estimate_total || 0 }]);
                }
            }).catch(() => { });
    }, [jobId]);

    const setFld = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const updateItem = (i, k, v) => {
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
    };
    const addItem = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const subtotal = items.reduce((s, it) => s + (Number(it.quantity) * Number(it.unit_price)), 0);
    const taxAmt = subtotal * (Number(form.tax) / 100);
    const total = subtotal + taxAmt;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.customer_id) { Swal.fire({ icon: "warning", title: "Select a customer" }); return; }
        if (!form.job_id) { Swal.fire({ icon: "warning", title: "Select a job" }); return; }
        if (items.length === 0) { Swal.fire({ icon: "warning", title: "Add at least one item" }); return; }

        setSaving(true);
        try {
            const payload = {
                ...form,
                subtotal: subtotal.toFixed(2),
                tax: taxAmt.toFixed(2),
                total_amount: total.toFixed(2),
                items,
            };
            const result = await invoiceService.create(payload);
            Swal.fire({ icon: "success", title: "Invoice created!", timer: 1500, showConfirmButton: false });
            navigate(`/providerdashboard/invoices/${result.invoice?.id || result.id}`);
        } catch (err) {
            Swal.fire({ icon: "error", title: "Error", text: err.message });
        } finally {
            setSaving(false);
        }
    };

    const inp = {
        width: "100%", padding: "10px 14px",
        border: "1.5px solid #e2e8f0", borderRadius: 8,
        fontSize: 14, fontFamily: "inherit", outline: "none",
        boxSizing: "border-box", color: "#1e293b", background: "#fff",
    };

    return (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "clamp(16px,3vw,28px)" }}>
            <style>{`
                .ci-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                @media(max-width:600px) { .ci-grid2 { grid-template-columns: 1fr; } }
                .ci-item-row { display: grid; grid-template-columns: 1fr 80px 110px 36px; gap: 8px; align-items: center; }
                @media(max-width:520px) { .ci-item-row { grid-template-columns: 1fr; } }
            `}</style>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
                <div>
                    <button onClick={() => navigate("/providerdashboard/invoices")}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", padding: 0, marginBottom: 6 }}>
                        ← Back to invoices
                    </button>
                    <h1 style={{ margin: 0, fontSize: "clamp(18px,3vw,24px)", fontWeight: 800, color: "#1e293b" }}>🧾 Create Invoice</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Client & Job */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "clamp(16px,2vw,24px)", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 14 }}>Client & Job</div>
                    <div className="ci-grid2">
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Client *</label>
                            <select style={inp} value={form.customer_id} onChange={e => setFld("customer_id", e.target.value)} required>
                                <option value="">Select client…</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Job *</label>
                            <select style={inp} value={form.job_id} onChange={e => setFld("job_id", e.target.value)} required>
                                <option value="">Select job…</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Dates */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "clamp(16px,2vw,24px)", marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b", marginBottom: 14 }}>Details</div>
                    <div className="ci-grid2">
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Due Date *</label>
                            <input type="date" style={inp} value={form.due_date} onChange={e => setFld("due_date", e.target.value)} required />
                        </div>
                        <div>
                            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Tax %</label>
                            <input type="number" style={inp} min="0" max="100" step="0.1" value={form.tax} onChange={e => setFld("tax", e.target.value)} placeholder="0" />
                        </div>
                    </div>
                    <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notes</label>
                        <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={form.notes} onChange={e => setFld("notes", e.target.value)} placeholder="Payment terms, instructions…" />
                    </div>
                </div>

                {/* Line Items */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "clamp(16px,2vw,24px)", marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#64748b" }}>Line Items</div>
                        <button type="button" onClick={addItem}
                            style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 7, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#374151" }}>
                            + Add item
                        </button>
                    </div>

                    {/* Column headers */}
                    <div className="ci-item-row" style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em" }}>Description</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "center" }}>Qty</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", textAlign: "right" }}>Unit price</div>
                        <div />
                    </div>

                    {items.map((item, i) => (
                        <div key={i} className="ci-item-row" style={{ marginBottom: 8 }}>
                            <input style={inp} placeholder="Service or description" value={item.description}
                                onChange={e => updateItem(i, "description", e.target.value)} required />
                            <input style={{ ...inp, textAlign: "center" }} type="number" min="1" value={item.quantity}
                                onChange={e => updateItem(i, "quantity", e.target.value)} />
                            <input style={{ ...inp, textAlign: "right" }} type="number" min="0" step="0.01" value={item.unit_price}
                                onChange={e => updateItem(i, "unit_price", e.target.value)} placeholder="0.00" />
                            <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                                style={{ background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: 7, width: 32, height: 36, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                ×
                            </button>
                        </div>
                    ))}

                    {/* Totals */}
                    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, maxWidth: 260, marginLeft: "auto" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 13, color: "#64748b" }}>
                                <span>Subtotal</span><span>{fmtMoney(subtotal)}</span>
                            </div>
                            {Number(form.tax) > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 13, color: "#64748b" }}>
                                    <span>Tax ({form.tax}%)</span><span>{fmtMoney(taxAmt)}</span>
                                </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: 18, fontWeight: 900, color: "#1e293b", borderTop: "2px solid #1e293b", paddingTop: 8 }}>
                                <span>Total</span><span>{fmtMoney(total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    <button type="button" onClick={() => navigate("/providerdashboard/invoices")}
                        style={{ padding: "12px 24px", background: "#f1f5f9", color: "#374151", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={saving}
                        style={{ padding: "12px 28px", background: saving ? "#94a3b8" : "#1e293b", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? "default" : "pointer" }}>
                        {saving ? "Creating…" : "✓ Create Invoice"}
                    </button>
                </div>
            </form>
        </div>
    );
}