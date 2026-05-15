// src/pages/Estimates/EstimateDetailPage.jsx
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";
import { useEstimatePDF } from "./Useestimatepdf.js";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmt = v => (v ? String(v).replace(/_/g, " ") : null);
const money = v => v != null ? `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : null;

const STATUS_CFG = {
    new: { cls: "text-bg-success", label: "New", icon: "🆕" },
    converted: { cls: "text-bg-primary", label: "Converted", icon: "✅" },
    rejected: { cls: "text-bg-danger", label: "Rejected", icon: "✕" },
};

/* ── sub-components ─────────────────────────────────────────────────────── */
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

/* ── Quote modal (offcanvas bottom on mobile, modal on desktop) ──────────── */
function QuoteModal({ show, estimate, onClose, onSave }) {
    const [amount, setAmount] = useState(estimate.quoted_amount || "");
    const [notes, setNotes] = useState(estimate.contractor_notes || "");
    const [saving, setSaving] = useState(false);

    const save = async () => {
        if (!amount) return;
        setSaving(true);
        try { await onSave(parseFloat(amount), notes); onClose(); }
        catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    if (!show) return null;

    return (
        <>
            {/* Backdrop */}
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
                                    style={{ fontSize: 24 }}
                                    value={amount} onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00" autoFocus />
                            </div>
                            <label className="form-label fw-medium small">Notes for client (included in PDF)</label>
                            <textarea className="form-control" rows={3}
                                placeholder="e.g. Includes 2 coats premium paint, labor, cleanup…"
                                value={notes} onChange={e => setNotes(e.target.value)} />
                        </div>
                        <div className="modal-footer border-0 pt-0 gap-2">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                            <button type="button" className="btn btn-success fw-semibold flex-fill" onClick={save} disabled={saving || !amount}>
                                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "Save quote"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── Email send modal ────────────────────────────────────────────────────── */
function SendEmailModal({ show, estimate, contractorInfo, onClose }) {
    const { sendByEmail } = useEstimatePDF();
    const [email, setEmail] = useState(estimate.customer_email || "");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const send = async () => {
        if (!email) return;
        setSending(true);
        try {
            await sendByEmail({ ...estimate, customer_email: email }, contractorInfo);
            setSent(true);
        } catch (e) { alert("Failed to send: " + e.message); }
        finally { setSending(false); }
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
                                    <p className="text-muted">The PDF was sent to <strong>{email}</strong></p>
                                </div>
                            ) : (
                                <>
                                    <p className="text-muted mb-3" style={{ fontSize: 14 }}>
                                        A professional PDF estimate will be generated and emailed directly to your client.
                                    </p>
                                    <label className="form-label fw-medium small">Client email <span className="text-danger">*</span></label>
                                    <input type="email" className="form-control mb-3"
                                        value={email} onChange={e => setEmail(e.target.value)}
                                        placeholder="client@email.com" />

                                    {estimate.quoted_amount && (
                                        <div className="alert alert-success d-flex align-items-center gap-2 py-2">
                                            <span>💰</span>
                                            <span>Quoted amount: <strong>{money(estimate.quoted_amount)}</strong> will be included</span>
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
                                <button type="button" className="btn btn-dark fw-semibold flex-fill" onClick={send} disabled={sending || !email}>
                                    {sending
                                        ? <><span className="spinner-border spinner-border-sm me-2" />Sending…</>
                                        : "📧 Send PDF estimate"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/* ── MAIN PAGE ───────────────────────────────────────────────────────────── */
export default function EstimateDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchEstimate, updateStatus, deleteEstimate, uploadPhoto, deletePhoto, convertToJob } = useEstimate();
    const { downloadPDF, previewPDF } = useEstimatePDF();

    const [estimate, setEstimate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuote, setShowQuote] = useState(false);
    const [showEmail, setShowEmail] = useState(false);
    const [converting, setConverting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    // Contractor info from localStorage (set at login)
    const contractorInfo = JSON.parse(localStorage.getItem("contractorInfo") || "{}");

    useEffect(() => {
        fetchEstimate(id)
            .then(e => { setEstimate(e); setLoading(false); })
            .catch(() => setLoading(false));
    }, [id]);

    const refresh = () => fetchEstimate(id).then(setEstimate);

    const handleQuoteSave = async (amount, notes) => {
        await updateStatus(id, "new", { quoted_amount: amount, contractor_notes: notes });
        await refresh();
    };

    const handleConvert = async () => {
        if (!window.confirm("Convert this estimate into a job?")) return;
        setConverting(true);
        try {
            const data = await convertToJob(id);
            navigate(`/jobs/${data.job_id}`);
        } catch (e) { alert(e.message); }
        finally { setConverting(false); }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this estimate permanently?")) return;
        await deleteEstimate(Number(id));
        navigate("/estimates");
    };

    const handlePhotoUpload = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try { await uploadPhoto(id, file); await refresh(); }
        catch (err) { alert(err.message); }
        finally { setUploading(false); e.target.value = ""; }
    };

    const handleDeletePhoto = async photoId => {
        if (!window.confirm("Delete this photo?")) return;
        await deletePhoto(id, photoId);
        await refresh();
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
            <div className="spinner-border text-secondary" role="status" />
        </div>
    );
    if (!estimate) return (
        <div className="container py-5 text-center">
            <p className="text-muted">Estimate not found</p>
            <button className="btn btn-outline-secondary" onClick={() => navigate("/estimates")}>← Back</button>
        </div>
    );

    const st = STATUS_CFG[estimate.status] || STATUS_CFG.new;
    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);
    const typeLabel = estimate.estimate_type === "painting" ? "🎨 Painting"
        : estimate.estimate_type === "flooring" ? "🪵 Flooring"
            : "🎨🪵 Painting + Flooring";
    const issueDate = estimate.create_at
        ? new Date(estimate.create_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "—";

    return (
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-5" style={{ maxWidth: 960, margin: "0 auto" }}>

            {/* ── Top bar ──────────────────────────────────────────────────────── */}
            <div className="d-flex align-items-center justify-content-between mb-4">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate("/estimates")}>
                    ← Estimates
                </button>

                {/* PDF / action buttons — visible on desktop in top bar, bottom bar on mobile */}
                <div className="d-none d-md-flex gap-2 align-items-center">
                    <button className="btn btn-outline-secondary btn-sm"
                        onClick={() => previewPDF(estimate, contractorInfo)}>
                        👁 Preview PDF
                    </button>
                    <button className="btn btn-outline-secondary btn-sm"
                        onClick={() => downloadPDF(estimate, contractorInfo)}>
                        ⬇ Download PDF
                    </button>
                    <button className="btn btn-dark btn-sm fw-semibold"
                        onClick={() => setShowEmail(true)}>
                        📧 Send to client
                    </button>
                    {/* Dropdown for extra actions */}
                    <div className="dropdown">
                        <button className="btn btn-outline-secondary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                            More
                        </button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li>
                                <button className="dropdown-item" onClick={() => navigate(`/estimates/${id}/edit`)}>
                                    ✏️ Edit estimate
                                </button>
                            </li>
                            <li>
                                <button className="dropdown-item text-danger"
                                    onClick={() => { updateStatus(id, "rejected").then(refresh); }}>
                                    ✕ Mark as rejected
                                </button>
                            </li>
                            <li><hr className="dropdown-divider" /></li>
                            <li>
                                <button className="dropdown-item text-danger" onClick={handleDelete}>
                                    🗑 Delete
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ── Two-column layout on desktop ─────────────────────────────────── */}
            <div className="row g-4">

                {/* LEFT column */}
                <div className="col-12 col-lg-7">

                    {/* Hero card */}
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

                            {/* Sq ft + budget tags */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                                {estimate.computed_sqft > 0 && (
                                    <span className="badge bg-secondary bg-opacity-10 text-secondary border fs-6 px-3 py-2">
                                        📐 {Number(estimate.computed_sqft).toFixed(0)} sq ft
                                    </span>
                                )}
                                {estimate.budget_range && (
                                    <span className="badge bg-light text-muted border fs-6 px-3 py-2">
                                        💰 {estimate.budget_range.replace(/_/g, " ")}
                                    </span>
                                )}
                            </div>

                            {/* Quoted price — big green box */}
                            {estimate.quoted_amount ? (
                                <div className="rounded-3 p-3 text-center"
                                    style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                                    <p className="text-success mb-1 fw-medium small">Quoted price</p>
                                    <p className="fw-bold text-success mb-0" style={{ fontSize: 36, lineHeight: 1 }}>
                                        {money(estimate.quoted_amount)}
                                    </p>
                                    {estimate.contractor_notes && (
                                        <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>{estimate.contractor_notes}</p>
                                    )}
                                </div>
                            ) : (
                                <button className="btn btn-outline-success w-100 py-3 fw-semibold"
                                    onClick={() => setShowQuote(true)}>
                                    💰 Add quoted price
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Client info */}
                    <SectionCard title="Client" icon="👤">
                        <InfoRow label="Phone" value={estimate.customer_phone} />
                        <InfoRow label="Email" value={estimate.customer_email} />
                        <InfoRow label="Address" value={estimate.customer_address} />
                        <InfoRow label="Preferred date" value={
                            estimate.preferred_date
                                ? new Date(estimate.preferred_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                                : null
                        } />
                    </SectionCard>

                    {/* Rooms */}
                    {estimate.rooms?.length > 0 && (
                        <SectionCard title="Rooms / Areas" icon="📐">
                            {estimate.rooms.map(r => (
                                <div key={r.id} className="d-flex justify-content-between border-bottom py-2">
                                    <span className="fw-medium" style={{ fontSize: 13 }}>{r.name}</span>
                                    <span className="text-muted" style={{ fontSize: 13 }}>
                                        {r.floor_sqft > 0 ? `${r.floor_sqft.toFixed(0)} sq ft` : "—"}
                                        {r.wall_sqft > 0 ? ` · ${r.wall_sqft.toFixed(0)} wall` : ""}
                                    </span>
                                </div>
                            ))}
                            <div className="d-flex justify-content-between pt-2 fw-semibold">
                                <span style={{ fontSize: 13 }}>Total floor area</span>
                                <span className="text-success" style={{ fontSize: 13 }}>
                                    {Number(estimate.computed_sqft).toFixed(0)} sq ft
                                </span>
                            </div>
                        </SectionCard>
                    )}

                    {/* Paint */}
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
                            {estimate.repairs_needed && (
                                <div className="alert alert-warning py-2 mt-2 mb-0" style={{ fontSize: 13 }}>
                                    ⚠ <strong>Repairs needed:</strong> {estimate.repairs_detail || "See notes"}
                                </div>
                            )}
                        </SectionCard>
                    )}

                    {/* Flooring */}
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

                    {/* Description */}
                    {estimate.description && (
                        <SectionCard title="Notes / Special instructions" icon="💬">
                            <p className="mb-0" style={{ fontSize: 14, lineHeight: 1.7 }}>{estimate.description}</p>
                        </SectionCard>
                    )}
                </div>

                {/* RIGHT column (sticky sidebar on desktop) */}
                <div className="col-12 col-lg-5">
                    <div style={{ position: "sticky", top: 80 }}>

                        {/* Actions card */}
                        <div className="card border shadow-sm mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small">
                                ⚡ Actions
                            </div>
                            <div className="card-body d-grid gap-2 py-3 px-3">

                                {/* Set / edit quote */}
                                <button className="btn btn-outline-success fw-semibold py-2"
                                    onClick={() => setShowQuote(true)}>
                                    {estimate.quoted_amount ? "✏️ Edit quoted price" : "💰 Set quoted price"}
                                </button>

                                {/* PDF group */}
                                <div className="d-flex gap-2">
                                    <button className="btn btn-outline-secondary flex-fill"
                                        onClick={() => previewPDF(estimate, contractorInfo)}>
                                        👁 Preview PDF
                                    </button>
                                    <button className="btn btn-outline-secondary flex-fill"
                                        onClick={() => downloadPDF(estimate, contractorInfo)}>
                                        ⬇ Download
                                    </button>
                                </div>

                                {/* Send to client — primary CTA */}
                                <button className="btn btn-dark fw-semibold py-2"
                                    onClick={() => setShowEmail(true)}>
                                    📧 Send estimate to client
                                </button>

                                <hr className="my-1" />

                                {/* Convert to job */}
                                {estimate.status !== "converted" ? (
                                    <button className="btn btn-success fw-semibold py-2"
                                        onClick={handleConvert} disabled={converting}>
                                        {converting
                                            ? <><span className="spinner-border spinner-border-sm me-2" />Converting…</>
                                            : "🔄 Convert to job"}
                                    </button>
                                ) : (
                                    <div className="alert alert-success mb-0 text-center py-2">
                                        ✅ Converted to job
                                    </div>
                                )}

                                <hr className="my-1" />

                                {/* Danger zone */}
                                <button className="btn btn-outline-secondary"
                                    onClick={() => navigate(`/estimates/${id}/edit`)}>
                                    ✏️ Edit estimate
                                </button>
                                <button className="btn btn-outline-danger"
                                    onClick={() => { if (window.confirm("Mark as rejected?")) updateStatus(id, "rejected").then(refresh); }}>
                                    ✕ Mark as rejected
                                </button>
                                <button className="btn btn-link text-danger p-0 text-decoration-none"
                                    onClick={handleDelete}>
                                    🗑 Delete estimate
                                </button>
                            </div>
                        </div>

                        {/* Photos */}
                        <SectionCard title="Site photos" icon="📷">
                            <div className="row g-2 mb-2">
                                {estimate.photos?.map(photo => (
                                    <div key={photo.id} className="col-4" style={{ position: "relative" }}>
                                        <img src={photo.image_url} alt={photo.caption || "site photo"}
                                            className="img-fluid rounded"
                                            style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} />
                                        <button
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            className="btn btn-dark btn-sm d-flex align-items-center justify-content-center p-0"
                                            style={{
                                                position: "absolute", top: 6, right: 10, width: 22, height: 22,
                                                borderRadius: "50%", fontSize: 14, background: "rgba(0,0,0,0.65)", border: "none"
                                            }}
                                            aria-label="Delete photo">×</button>
                                    </div>
                                ))}
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="d-none"
                                onChange={handlePhotoUpload} />
                            <button className="btn btn-outline-secondary w-100"
                                style={{ borderStyle: "dashed" }}
                                onClick={() => fileRef.current.click()}
                                disabled={uploading}>
                                {uploading
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</>
                                    : "+ Add photo"}
                            </button>
                        </SectionCard>
                    </div>
                </div>
            </div>

            {/* ── Mobile-only bottom action bar ────────────────────────────────── */}
            <div className="d-md-none">
                <div className="fixed-bottom bg-white border-top px-3 py-2 d-flex gap-2">
                    <button className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => setShowQuote(true)}>
                        💰 Quote
                    </button>
                    <button className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => downloadPDF(estimate, contractorInfo)}>
                        ⬇ PDF
                    </button>
                    <button className="btn btn-dark btn-sm flex-fill fw-semibold"
                        onClick={() => setShowEmail(true)}>
                        📧 Send
                    </button>
                    {estimate.status !== "converted" && (
                        <button className="btn btn-success btn-sm flex-fill fw-semibold"
                            onClick={handleConvert} disabled={converting}>
                            {converting ? "…" : "→ Job"}
                        </button>
                    )}
                </div>
                {/* Spacer so content isn't hidden behind fixed bar */}
                <div style={{ height: 72 }} />
            </div>

            {/* ── Modals ─────────────────────────────────────────────────────────── */}
            <QuoteModal
                show={showQuote}
                estimate={estimate}
                onClose={() => setShowQuote(false)}
                onSave={handleQuoteSave}
            />
            <SendEmailModal
                show={showEmail}
                estimate={estimate}
                contractorInfo={contractorInfo}
                onClose={() => setShowEmail(false)}
            />
        </div>
    );
}