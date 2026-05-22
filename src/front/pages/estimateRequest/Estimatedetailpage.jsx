// src/pages/Estimates/EstimateDetailPage.jsx
// FINAL VERSION — all three files wired together
// Only changes from previous version:
//   1. Destructures convertToInvoice from useEstimate()
//   2. handleConvertConfirm invoice path calls convertToInvoice() for real
//   3. navigate paths use your actual route structure

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";
import { useEstimatePDF } from "./Useestimatepdf.js";
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";

const fmt   = v => (v ? String(v).replace(/_/g, " ") : null);
const money = v => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null;

const STATUS_CFG = {
    new:       { cls: "text-bg-success", label: "New",       icon: "🆕" },
    converted: { cls: "text-bg-primary", label: "Converted", icon: "✅" },
    rejected:  { cls: "text-bg-danger",  label: "Rejected",  icon: "✕"  },
};

function InfoRow({ label, value, accent, mono }) {
    if (!value && value !== 0) return null;
    return (
        <div className="d-flex justify-content-between align-items-start py-2 border-bottom">
            <span className="text-muted flex-shrink-0 me-3" style={{ fontSize: 13 }}>{label}</span>
            <span className={`text-end fw-medium ${accent || ""} ${mono ? "font-monospace" : ""}`}
                  style={{ fontSize: 13 }}>{value}</span>
        </div>
    );
}

function SectionCard({ title, icon, children, className = "" }) {
    return (
        <div className={`card border shadow-sm mb-3 ${className}`}>
            <div className="card-header bg-light py-2 px-3 d-flex align-items-center gap-2">
                <span>{icon}</span>
                <span className="fw-semibold small text-uppercase"
                      style={{ letterSpacing: "0.05em", fontSize: 11 }}>{title}</span>
            </div>
            <div className="card-body py-2 px-3">{children}</div>
        </div>
    );
}

function ConvertModal({ show, type, estimate, onClose, onConfirm }) {
    const [jobName,          setJobName]          = useState("");
    const [startDate,        setStartDate]        = useState("");
    const [crew,             setCrew]             = useState("");
    const [dueDate,          setDueDate]          = useState("");
    const [terms,            setTerms]            = useState("net_30");
    const [sendConfirmation, setSendConfirmation] = useState(true);
    const [autoInvoice,      setAutoInvoice]      = useState(false);
    const [saving,           setSaving]           = useState(false);

    useEffect(() => {
        if (!estimate) return;
        const typeLabel =
            estimate.estimate_type === "painting" ? "Painting"
            : estimate.estimate_type === "flooring" ? "Flooring"
            : "Painting + Flooring";
        setJobName(`${typeLabel} — ${estimate.customer_name}`);
        const d = new Date(); d.setDate(d.getDate() + 30);
        setDueDate(d.toISOString().split("T")[0]);
    }, [estimate, type]);

    if (!show) return null;

    const isJob    = type === "job";
    const hasQuote = estimate?.quoted_amount != null;

    const handleConfirm = async () => {
        setSaving(true);
        try {
            await onConfirm({ type, jobName, startDate, crew, dueDate, terms,
                              sendConfirmation, autoInvoice });
            onClose();
        } catch (e) {
            alert(e.message || "Something went wrong");
        } finally { setSaving(false); }
    };

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <style>{`
                @media (max-width: 767px) {
                    .convert-dialog { margin:0!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;max-width:100%!important; }
                    .convert-dialog .modal-content { border-radius:20px 20px 0 0!important;border-bottom:none!important; }
                }
            `}</style>
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered convert-dialog" style={{ maxWidth: 520 }}>
                    <div className="modal-content">
                        <div className="d-flex justify-content-center pt-3 d-md-none">
                            <div style={{ width: 40, height: 4, background: "#dee2e6", borderRadius: 2 }} />
                        </div>
                        <div className="modal-header border-0 pb-1">
                            <div>
                                <h5 className="modal-title fw-bold mb-1">
                                    {isJob ? "🔄 Convert to job" : "🧾 Convert to invoice"}
                                </h5>
                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                    #{estimate?.id} · {estimate?.customer_name}
                                </p>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body pt-2">
                            <div className="rounded-3 p-3 mb-3"
                                 style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}>
                                {estimate?.computed_sqft > 0 && (
                                    <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                                        <span className="text-muted">Area</span>
                                        <span className="fw-medium">{Number(estimate.computed_sqft).toFixed(0)} sq ft</span>
                                    </div>
                                )}
                                {estimate?.estimate_type && (
                                    <div className="d-flex justify-content-between" style={{ fontSize: 13 }}>
                                        <span className="text-muted">Type</span>
                                        <span className="fw-medium">{fmt(estimate.estimate_type)}</span>
                                    </div>
                                )}
                                <div className="d-flex justify-content-between mt-2 pt-2"
                                     style={{ borderTop: "1px solid #dee2e6" }}>
                                    <span className="fw-semibold" style={{ fontSize: 14 }}>Total quoted</span>
                                    <span className="fw-bold text-success" style={{ fontSize: 16 }}>
                                        {hasQuote ? money(estimate.quoted_amount) : "— (not set)"}
                                    </span>
                                </div>
                            </div>
                            {!isJob && (
                                <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                    <span>⚠️</span>
                                    <span>A job will also be created automatically (required for invoicing). Both will be linked to this estimate.</span>
                                </div>
                            )}
                            {isJob && (
                                <>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium small">Job name</label>
                                        <input className="form-control" value={jobName}
                                               onChange={e => setJobName(e.target.value)}
                                               placeholder="e.g. Painting — Maria Garcia" />
                                    </div>
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-medium small">Scheduled start</label>
                                            <input type="date" className="form-control" value={startDate}
                                                   onChange={e => setStartDate(e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-medium small">Assign crew (optional)</label>
                                            <input className="form-control" value={crew}
                                                   onChange={e => setCrew(e.target.value)} placeholder="Team A" />
                                        </div>
                                    </div>
                                </>
                            )}
                            {!isJob && (
                                <>
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="form-label fw-medium small">Invoice date</label>
                                            <input type="date" className="form-control"
                                                   defaultValue={new Date().toISOString().split("T")[0]} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-medium small">Due date</label>
                                            <input type="date" className="form-control" value={dueDate}
                                                   onChange={e => setDueDate(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label fw-medium small">Payment terms</label>
                                        <select className="form-select" value={terms}
                                                onChange={e => setTerms(e.target.value)}>
                                            <option value="net_30">Net 30</option>
                                            <option value="net_15">Net 15</option>
                                            <option value="due_on_receipt">Due on receipt</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <div className="card border bg-light">
                                <div className="card-body py-1 px-3">
                                    <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
                                        <label htmlFor="tog_confirm" style={{ cursor: "pointer", marginBottom: 0 }}>
                                            <span className="fw-medium d-block" style={{ fontSize: 14 }}>
                                                {isJob ? "Send job confirmation to client" : "Send invoice to client immediately"}
                                            </span>
                                        </label>
                                        <div className="form-check form-switch ms-3 mb-0">
                                            <input className="form-check-input" type="checkbox" role="switch"
                                                   id="tog_confirm" checked={sendConfirmation}
                                                   onChange={e => setSendConfirmation(e.target.checked)}
                                                   style={{ width: "2.4em", height: "1.3em", cursor: "pointer" }} />
                                        </div>
                                    </div>
                                    {isJob && (
                                        <div className="d-flex justify-content-between align-items-center py-2">
                                            <label htmlFor="tog_autoinv" style={{ cursor: "pointer", marginBottom: 0 }}>
                                                <span className="fw-medium d-block" style={{ fontSize: 14 }}>Auto-create invoice when job is complete</span>
                                                <span className="text-muted d-block" style={{ fontSize: 12 }}>Invoice generates automatically on completion</span>
                                            </label>
                                            <div className="form-check form-switch ms-3 mb-0">
                                                <input className="form-check-input" type="checkbox" role="switch"
                                                       id="tog_autoinv" checked={autoInvoice}
                                                       onChange={e => setAutoInvoice(e.target.checked)}
                                                       style={{ width: "2.4em", height: "1.3em", cursor: "pointer" }} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer border-0 pt-0 gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                            <button type="button" disabled={saving} onClick={handleConfirm}
                                    className={`btn fw-semibold flex-fill ${isJob ? "btn-success" : "btn-primary"}`}>
                                {saving
                                    ? <><span className="spinner-border spinner-border-sm me-2" />{isJob ? "Creating job…" : "Creating invoice…"}</>
                                    : isJob ? "✓ Create job" : "✓ Create invoice"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function QuoteModal({ show, estimate, onClose, onSave }) {
    const [amount, setAmount] = useState(estimate.quoted_amount || "");
    const [notes,  setNotes]  = useState(estimate.contractor_notes || "");
    const [saving, setSaving] = useState(false);
    const save = async () => {
        if (!amount) return; setSaving(true);
        try { await onSave(parseFloat(amount), notes); onClose(); }
        catch (e) { alert(e.message); } finally { setSaving(false); }
    };
    if (!show) return null;
    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">💰 Set quoted price</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            <label className="form-label fw-medium small">Amount ($)</label>
                            <div className="input-group input-group-lg mb-3">
                                <span className="input-group-text">$</span>
                                <input type="number" inputMode="decimal" className="form-control fw-bold text-success"
                                       style={{ fontSize: 24 }} value={amount}
                                       onChange={e => setAmount(e.target.value)} placeholder="0.00" autoFocus />
                            </div>
                            <label className="form-label fw-medium small">Notes for client (included in PDF)</label>
                            <textarea className="form-control" rows={3}
                                      placeholder="e.g. Includes 2 coats premium paint, labor, cleanup…"
                                      value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                        <div className="modal-footer border-0 pt-0 gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                            <button type="button" className="btn btn-success fw-semibold flex-fill"
                                    onClick={save} disabled={saving || !amount}>
                                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "Save quote"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function SendEmailModal({ show, estimate, contractorInfo, onClose }) {
    const { sendByEmail } = useEstimatePDF();
    const [email,   setEmail]   = useState(estimate.customer_email || "");
    const [sending, setSending] = useState(false);
    const [sent,    setSent]    = useState(false);
    const send = async () => {
        if (!email) return; setSending(true);
        try { await sendByEmail({ ...estimate, customer_email: email }, contractorInfo); setSent(true); }
        catch (e) { alert("Failed to send: " + e.message); } finally { setSending(false); }
    };
    if (!show) return null;
    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header border-0 pb-0">
                            <h5 className="modal-title fw-bold">📧 Send estimate to client</h5>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>
                        <div className="modal-body">
                            {sent ? (
                                <div className="text-center py-4">
                                    <div style={{ fontSize: 56 }}>✅</div>
                                    <h6 className="fw-bold mt-3">Estimate sent!</h6>
                                    <p className="text-muted">PDF sent to <strong>{email}</strong></p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>A professional PDF will be generated and emailed to your client.</p>
                                    <label className="form-label fw-medium small">Client email <span className="text-danger">*</span></label>
                                    <input type="email" className="form-control mb-3" value={email}
                                           onChange={e => setEmail(e.target.value)} placeholder="client@email.com" />
                                    {estimate.quoted_amount && (
                                        <div className="alert alert-success d-flex align-items-center gap-2 py-2">
                                            <span>💰</span><span>Quoted: <strong>{money(estimate.quoted_amount)}</strong> included</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="modal-footer border-0 pt-0 gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                                {sent ? "Close" : "Cancel"}
                            </button>
                            {!sent && (
                                <button type="button" className="btn btn-dark fw-semibold flex-fill"
                                        onClick={send} disabled={sending || !email}>
                                    {sending ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</> : "📧 Send PDF estimate"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function RoomRow({ room, estimateId, onUpdate }) {
    const { deleteRoom } = useEstimate();
    const [editing, setEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ name: room.name, length_ft: room.length_ft || "", width_ft: room.width_ft || "", height_ft: room.height_ft || "" });
    const sqft = form.length_ft && form.width_ft ? (parseFloat(form.length_ft) * parseFloat(form.width_ft)).toFixed(0) : null;
    const handleDelete = async () => {
        if (!window.confirm(`Delete "${room.name}"?`)) return;
        setDeleting(true);
        try { await deleteRoom(estimateId, room.id); await onUpdate(); }
        catch (e) { alert(e.message); } finally { setDeleting(false); }
    };
    const handleSave = async () => {
        if (!form.name.trim()) return; setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const BASE = import.meta.env.VITE_BACKEND_URL || "";
            const res = await fetch(`${BASE}/api/estimates/${estimateId}/rooms/${room.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");
            await onUpdate(); setEditing(false);
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };
    if (editing) return (
        <div className="border rounded-3 p-2 mb-2 bg-light">
            <input className="form-control form-control-sm mb-2 fw-medium" value={form.name}
                   onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Room name" />
            <div className="row g-2 mb-2">
                {[["length_ft","Length (ft)"],["width_ft","Width (ft)"],["height_ft","Height (ft)"]].map(([k,l]) => (
                    <div key={k} className="col-4">
                        <input type="number" inputMode="decimal" className="form-control form-control-sm"
                               placeholder={l} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                    </div>
                ))}
            </div>
            {sqft && <p className="text-success mb-2" style={{ fontSize: 12 }}>≈ {sqft} sq ft</p>}
            <div className="d-flex gap-2">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn btn-dark btn-sm flex-fill fw-semibold" onClick={handleSave} disabled={saving}>
                    {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "✓ Save"}
                </button>
            </div>
        </div>
    );
    return (
        <div className="d-flex align-items-center justify-content-between border-bottom py-2 gap-2">
            <div>
                <span className="fw-medium" style={{ fontSize: 13 }}>{room.name}</span>
                {room.floor_sqft > 0 && (
                    <span className="text-muted ms-2" style={{ fontSize: 12 }}>
                        {room.floor_sqft.toFixed(0)} sq ft{room.wall_sqft > 0 ? ` · ${room.wall_sqft.toFixed(0)} wall` : ""}
                    </span>
                )}
            </div>
            <div className="d-flex gap-1 flex-shrink-0">
                <button className="btn btn-outline-secondary btn-sm px-2 py-1" style={{ fontSize: 12 }} onClick={() => setEditing(true)}>✏️</button>
                <button className="btn btn-outline-danger btn-sm px-2 py-1" style={{ fontSize: 12 }} onClick={handleDelete} disabled={deleting}>
                    {deleting ? <span className="spinner-border spinner-border-sm" /> : "🗑"}
                </button>
            </div>
        </div>
    );
}

export default function EstimateDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { store } = useGlobalReducer();

    // convertToInvoice is now real — comes from updated Estimatecontext.jsx
    const { fetchEstimate, updateStatus, deleteEstimate, uploadPhoto, deletePhoto,
            convertToJob, convertToInvoice, addRoom } = useEstimate();
    const { downloadPDF, previewPDF } = useEstimatePDF();

    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuote, setShowQuote] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [showConvert, setShowConvert] = useState(false);
    const [convertType, setConvertType] = useState("job");
    const [showAddRoom, setShowAddRoom] = useState(false);
    const [newRoom, setNewRoom] = useState({ name: "", length_ft: "", width_ft: "", height_ft: "" });
    const [addingRoom, setAddingRoom] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    const contractorInfo = {
        businessName: store.provider?.businessName || store.provider?.name || "",
        email: store.provider?.email || "",
        phone: store.provider?.phone || "",
        address: store.provider?.address || "",
    };

    useEffect(() => {
        fetchEstimate(id)
            .then(data => { setEstimate(data.estimate ?? data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    const refresh = () => fetchEstimate(id).then(data => { setEstimate(data.estimate ?? data); });

    const handleQuoteSave = async (amount, notes) => {
        await updateStatus(id, "new", { quoted_amount: amount, contractor_notes: notes });
        await refresh();
    };

    const openConvert = (type = "job") => { setConvertType(type); setShowConvert(true); };

    const handleConvertConfirm = async ({ type, jobName, startDate, crew, dueDate, terms }) => {
        if (type === "job") {
            const data = await convertToJob(id, { job_name: jobName, start_date: startDate, crew });
            // ↓ Change this path to match YOUR router — e.g. "/jobs/<id>" or "/providerdashboard/jobs/<id>"
            navigate(`/providerdashboard/jobs/${data.job_id}`);
        } else {
            const data = await convertToInvoice(id, { due_date: dueDate, terms });
            // ↓ Change this path to match YOUR router — e.g. "/invoices/<id>"
            navigate(`/providerdashboard/invoices/${data.invoice_id}`);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this estimate permanently?")) return;
        await deleteEstimate(Number(id));
        navigate("/providerdashboard/estimates");
    };

    const handleAddRoom = async () => {
        if (!newRoom.name.trim()) return;
        setAddingRoom(true);
        try { await addRoom(id, newRoom); await refresh(); setNewRoom({ name: "", length_ft: "", width_ft: "", height_ft: "" }); setShowAddRoom(false); }
        catch (err) { alert(err.message); } finally { setAddingRoom(false); }
    };

    const handlePhotoUpload = async e => {
        const file = e.target.files?.[0]; if (!file) return;
        setUploading(true);
        try { await uploadPhoto(id, file); await refresh(); }
        catch (err) { alert(err.message); } finally { setUploading(false); e.target.value = ""; }
    };

    const handleDeletePhoto = async photoId => {
        if (!window.confirm("Delete this photo?")) return;
        await deletePhoto(id, photoId); await refresh();
    };

    if (loading) return <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}><div className="spinner-border text-secondary" role="status" /></div>;
    if (!estimate) return <div className="container py-5 text-center"><p className="text-muted">Estimate not found</p><button className="btn btn-outline-secondary" onClick={() => navigate("/providerdashboard/estimates")}>← Back</button></div>;

    const st = STATUS_CFG[estimate.status] || STATUS_CFG.new;
    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);
    const typeLabel = estimate.estimate_type === "painting" ? "🎨 Painting" : estimate.estimate_type === "flooring" ? "🪵 Flooring" : "🎨🪵 Painting + Flooring";
    const issueDate = estimate.create_at ? new Date(estimate.create_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
    const canConvert = !!estimate.quoted_amount;
    const isConverted = estimate.status === "converted";

    return (
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-5" style={{ maxWidth: 960, margin: "0 auto" }}>
            <div className="d-flex align-items-center justify-content-between mb-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/providerdashboard/estimates")}>← Estimates</button>
                <div className="d-none d-md-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => previewPDF(estimate, contractorInfo)}>👁 Preview PDF</button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadPDF(estimate, contractorInfo)}>⬇ Download PDF</button>
                    <button className="btn btn-dark btn-sm fw-semibold" onClick={() => setShowEmail(true)}>📧 Send to client</button>
                    <div className="dropdown">
                        <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">More</button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item" onClick={() => navigate(`/providerdashboard/estimates/${id}/edit`)}>✏️ Edit estimate</button></li>
                            <li><button className="dropdown-item text-danger" onClick={() => { updateStatus(id, "rejected").then(refresh); }}>✕ Mark as rejected</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger" onClick={handleDelete}>🗑 Delete</button></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-7">
                    <div className="card border shadow-sm mb-3">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <p className="text-muted mb-1" style={{ fontSize: 12 }}>#{estimate.id} · {issueDate}</p>
                                    <h4 className="fw-bold mb-0">{typeLabel}</h4>
                                    <h5 className="fw-semibold text-dark mb-0">{estimate.customer_name}</h5>
                                </div>
                                <span className={`badge fs-6 px-3 py-2 ${st.cls}`}>{st.icon} {st.label}</span>
                            </div>
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {estimate.computed_sqft > 0 && <span className="badge bg-secondary bg-opacity-10 text-secondary border fs-6 px-3 py-2">📐 {Number(estimate.computed_sqft).toFixed(0)} sq ft</span>}
                                {estimate.budget_range && <span className="badge bg-light text-muted border fs-6 px-3 py-2">💰 {estimate.budget_range.replace(/_/g, " ")}</span>}
                            </div>
                            {estimate.quoted_amount ? (
                                <div className="rounded-3 p-3 text-center" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                                    <p className="text-success mb-1 fw-medium small">Quoted price</p>
                                    <p className="fw-bold text-success mb-0" style={{ fontSize: 36, lineHeight: 1 }}>{money(estimate.quoted_amount)}</p>
                                    {estimate.contractor_notes && <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>{estimate.contractor_notes}</p>}
                                </div>
                            ) : (
                                <div>
                                    <button className="btn btn-outline-success w-100 py-3 fw-semibold" onClick={() => setShowQuote(true)}>💰 Add quoted price</button>
                                    <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: 12 }}>⚠ A quoted price is required before converting</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <SectionCard title="Client" icon="👤">
                        <InfoRow label="Phone" value={estimate.customer_phone} />
                        <InfoRow label="Email" value={estimate.customer_email} />
                        <InfoRow label="Address" value={estimate.customer_address} />
                        <InfoRow label="Preferred date" value={estimate.preferred_date ? new Date(estimate.preferred_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null} />
                    </SectionCard>

                    <SectionCard title="Rooms / Areas" icon="📐">
                        {estimate.rooms?.length === 0 && <p className="text-muted mb-2" style={{ fontSize: 13 }}>No rooms added yet.</p>}
                        {estimate.rooms?.map(r => <RoomRow key={r.id} room={r} estimateId={id} onUpdate={refresh} />)}
                        {estimate.rooms?.length > 0 && (
                            <div className="d-flex justify-content-between pt-2 fw-semibold border-top mt-1">
                                <span style={{ fontSize: 13 }}>Total floor area</span>
                                <span className="text-success" style={{ fontSize: 13 }}>{Number(estimate.computed_sqft).toFixed(0)} sq ft</span>
                            </div>
                        )}
                        {showAddRoom ? (
                            <div className="mt-3 p-3 border rounded-3 bg-light">
                                <p className="fw-semibold mb-2" style={{ fontSize: 13 }}>New room</p>
                                <input className="form-control form-control-sm mb-2" placeholder="Room name (e.g. Kitchen)" value={newRoom.name} onChange={e => setNewRoom(r => ({ ...r, name: e.target.value }))} />
                                <div className="row g-2 mb-2">
                                    {[["length_ft","Length (ft)"],["width_ft","Width (ft)"],["height_ft","Height (ft)"]].map(([k,l]) => (
                                        <div key={k} className="col-4">
                                            <input type="number" inputMode="decimal" className="form-control form-control-sm" placeholder={l} value={newRoom[k]} onChange={e => setNewRoom(r => ({ ...r, [k]: e.target.value }))} />
                                        </div>
                                    ))}
                                </div>
                                {newRoom.length_ft && newRoom.width_ft && <p className="text-success mb-2" style={{ fontSize: 12 }}>≈ {(parseFloat(newRoom.length_ft) * parseFloat(newRoom.width_ft)).toFixed(0)} sq ft</p>}
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary btn-sm" onClick={() => { setShowAddRoom(false); setNewRoom({ name: "", length_ft: "", width_ft: "", height_ft: "" }); }}>Cancel</button>
                                    <button className="btn btn-success btn-sm flex-fill fw-semibold" onClick={handleAddRoom} disabled={addingRoom || !newRoom.name.trim()}>
                                        {addingRoom ? <><span className="spinner-border spinner-border-sm me-2" />Adding…</> : "✓ Add room"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button className="btn btn-outline-secondary w-100 mt-2" style={{ borderStyle: "dashed" }} onClick={() => setShowAddRoom(true)}>+ Add room</button>
                        )}
                    </SectionCard>

                    {isPainting && (
                        <SectionCard title="Painting specifications" icon="🎨">
                            <InfoRow label="Surface condition" value={fmt(estimate.paint_surface_condition)} />
                            <InfoRow label="Paint type" value={fmt(estimate.paint_type)} />
                            <InfoRow label="Finish" value={fmt(estimate.paint_finish)} />
                            <InfoRow label="Coats" value={estimate.paint_coats} />
                            <InfoRow label="Ceiling" value={estimate.include_ceiling ? "Included" : null} />
                            <InfoRow label="Trim" value={estimate.include_trim ? "Included" : null} />
                            <InfoRow label="Doors" value={estimate.include_doors ? `${estimate.door_count} doors` : null} />
                            <InfoRow label="Windows" value={estimate.window_count > 0 ? `${estimate.window_count}` : null} />
                            <InfoRow label="Client provides paint" value={estimate.client_provides_paint ? "Yes — material excluded" : null} />
                            <InfoRow label="Desired colors" value={estimate.desired_colors} />
                            {estimate.repairs_needed && <div className="alert alert-warning py-2 mt-2 mb-0" style={{ fontSize: 13 }}>⚠ <strong>Repairs needed:</strong> {estimate.repairs_detail || "See notes"}</div>}
                        </SectionCard>
                    )}

                    {isFlooring && (
                        <SectionCard title="Flooring specifications" icon="🪵">
                            <InfoRow label="New material" value={fmt(estimate.flooring_material)} />
                            <InfoRow label="Current state" value={fmt(estimate.flooring_current)} />
                            <InfoRow label="Pattern" value={fmt(estimate.flooring_pattern)} />
                            <InfoRow label="Subfloor" value={fmt(estimate.subfloor_condition)} />
                            <InfoRow label="Old floor removal" value={estimate.include_removal ? "Included" : null} />
                            <InfoRow label="Baseboards" value={estimate.include_baseboards ? "Yes" : null} />
                            <InfoRow label="Transition strips" value={estimate.transition_strips > 0 ? `${estimate.transition_strips}` : null} />
                            <InfoRow label="Stairs" value={estimate.include_stairs ? `${estimate.stair_count} steps` : null} />
                        </SectionCard>
                    )}

                    {estimate.description && (
                        <SectionCard title="Notes / Special instructions" icon="💬">
                            <p className="mb-0" style={{ fontSize: 14, lineHeight: 1.7 }}>{estimate.description}</p>
                        </SectionCard>
                    )}
                </div>

                <div className="col-12 col-lg-5">
                    <div style={{ position: "sticky", top: 80 }}>
                        <div className="card border shadow-sm mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small">⚡ Actions</div>
                            <div className="card-body d-grid gap-2 py-3 px-3">
                                <button className="btn btn-outline-success fw-semibold py-2" onClick={() => setShowQuote(true)}>
                                    {estimate.quoted_amount ? "✏️ Edit quoted price" : "💰 Set quoted price"}
                                </button>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary flex-fill" onClick={() => previewPDF(estimate, contractorInfo)}>👁 Preview PDF</button>
                                    <button className="btn btn-outline-secondary flex-fill" onClick={() => downloadPDF(estimate, contractorInfo)}>⬇ Download</button>
                                </div>
                                <button className="btn btn-dark fw-semibold py-2" onClick={() => setShowEmail(true)}>📧 Send estimate to client</button>
                                <hr className="my-1" />
                                {isConverted ? (
                                    <div className="alert alert-success mb-0 text-center py-2">✅ Already converted</div>
                                ) : (
                                    <div className="rounded-3 p-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                                        <p className="fw-semibold mb-2" style={{ fontSize: 12, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.05em" }}>Convert estimate</p>
                                        {!canConvert && <div className="alert alert-warning py-2 mb-2" style={{ fontSize: 12 }}>⚠ Set a quoted price first before converting</div>}
                                        <button className="btn btn-success fw-semibold w-100 mb-2" disabled={!canConvert} onClick={() => openConvert("job")}>🔄 Convert to job</button>
                                        <button className="btn btn-primary fw-semibold w-100" disabled={!canConvert} onClick={() => openConvert("invoice")}>🧾 Convert to invoice</button>
                                        <p className="text-muted text-center mb-0 mt-2" style={{ fontSize: 11 }}>Estimate will be marked as Converted</p>
                                    </div>
                                )}
                                <hr className="my-1" />
                                <button className="btn btn-outline-secondary" onClick={() => navigate(`/providerdashboard/estimates/${id}/edit`)}>✏️ Edit estimate</button>
                                <button className="btn btn-outline-danger" onClick={() => { if (window.confirm("Mark as rejected?")) updateStatus(id, "rejected").then(refresh); }}>✕ Mark as rejected</button>
                                <button className="btn btn-link text-danger p-0 text-decoration-none" onClick={handleDelete}>🗑 Delete estimate</button>
                            </div>
                        </div>

                        <SectionCard title="Site photos" icon="📷">
                            <div className="row g-2 mb-2">
                                {estimate.photos?.map(photo => (
                                    <div key={photo.id} className="col-4" style={{ position: "relative" }}>
                                        <img src={photo.image_url} alt={photo.caption || "site photo"} className="img-fluid rounded" style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                                        <button onClick={() => handleDeletePhoto(photo.id)} className="btn btn-dark btn-sm d-flex align-items-center justify-content-center p-0"
                                                style={{ position: "absolute", top: 6, right: 10, width: 22, height: 22, borderRadius: "50%", fontSize: 14, background: "rgba(0,0,0,0.65)", border: "none" }}
                                                aria-label="Delete photo">×</button>
                                    </div>
                                ))}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="d-none" onChange={handlePhotoUpload} />
                            <button className="btn btn-outline-secondary w-100" style={{ borderStyle: "dashed" }} onClick={() => fileRef.current.click()} disabled={uploading}>
                                {uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</> : "+ Add photo"}
                            </button>
                        </SectionCard>
                    </div>
                </div>
            </div>

            <div className="d-md-none">
                <div className="fixed-bottom bg-white border-top px-3 py-2 d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={() => setShowQuote(true)}>💰 Quote</button>
                    <button className="btn btn-outline-secondary btn-sm flex-fill" onClick={() => downloadPDF(estimate, contractorInfo)}>⬇ PDF</button>
                    <button className="btn btn-dark btn-sm flex-fill fw-semibold" onClick={() => setShowEmail(true)}>📧 Send</button>
                    {!isConverted && <button className="btn btn-success btn-sm flex-fill fw-semibold" disabled={!canConvert} onClick={() => openConvert("job")} title={canConvert ? "Convert to job" : "Set a quoted price first"}>→ Job</button>}
                </div>
                <div style={{ height: 72 }} />
            </div>

            <QuoteModal show={showQuote} estimate={estimate} onClose={() => setShowQuote(false)} onSave={handleQuoteSave} />
            <SendEmailModal show={showEmail} estimate={estimate} contractorInfo={contractorInfo} onClose={() => setShowEmail(false)} />
            <ConvertModal show={showConvert} type={convertType} estimate={estimate} onClose={() => setShowConvert(false)} onConfirm={handleConvertConfirm} />
        </div>
    );
}