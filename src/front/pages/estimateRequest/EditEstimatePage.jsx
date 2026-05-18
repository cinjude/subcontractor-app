// src/pages/estimateRequest/EditEstimatePage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";

// ── Reusable chips ────────────────────────────────────────────────────────────
function Chips({ options, value, onChange, cols = 2 }) {
    return (
        <div className={`row g-2 row-cols-${cols} row-cols-md-${Math.min(cols + 1, 4)}`}>
            {options.map(o => {
                const sel = value === o.value;
                return (
                    <div key={o.value} className="col">
                        <button type="button"
                            onClick={() => onChange(sel ? null : o.value)}
                            className={`w-100 h-100 btn text-start ${sel ? "btn-dark" : "btn-outline-secondary"}`}
                            style={{ padding: "10px 12px", lineHeight: 1.4, minHeight: 56 }}>
                            {o.emoji && <span className="d-block fs-5 mb-1">{o.emoji}</span>}
                            <span className="d-block fw-medium" style={{ fontSize: 13 }}>{o.label}</span>
                            {o.sub && <span className="d-block text-muted" style={{ fontSize: 11 }}>{o.sub}</span>}
                            {o.warning && sel && (
                                <span className="d-block mt-1 fw-medium" style={{ fontSize: 11, color: "#b45309" }}>⚠ {o.warning}</span>
                            )}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

function Toggle({ id, label, sub, value, onChange }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <label htmlFor={id} style={{ cursor: "pointer", marginBottom: 0 }}>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </label>
            <div className="form-check form-switch ms-3 mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id={id}
                    checked={!!value} onChange={e => onChange(e.target.checked)}
                    style={{ width: "2.4em", height: "1.3em", cursor: "pointer" }} />
            </div>
        </div>
    );
}

function Counter({ label, value, onChange, min = 0 }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <span className="fw-medium" style={{ fontSize: 14 }}>{label}</span>
            <div className="d-flex align-items-center gap-3">
                <button type="button" className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20, lineHeight: 1 }}
                    onClick={() => onChange(Math.max(min, value - 1))}>−</button>
                <span className="fw-semibold" style={{ minWidth: 24, textAlign: "center", fontSize: 16 }}>{value}</span>
                <button type="button" className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20, lineHeight: 1 }}
                    onClick={() => onChange(value + 1)}>+</button>
            </div>
        </div>
    );
}

function SectionTitle({ text }) {
    return <p className="text-uppercase fw-semibold text-muted mb-2 mt-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>{text}</p>;
}

// ── Options (same as NewEstimateForm) ─────────────────────────────────────────
const PAINT_CONDITIONS = [
    { value: "new_drywall", label: "New drywall", emoji: "🆕", sub: "Never painted", warning: null },
    { value: "same_color", label: "Same color", emoji: "🔄", sub: "Repaint same shade", warning: null },
    { value: "color_change", label: "Color change", emoji: "🎨", sub: "Different color", warning: "Extra coat" },
    { value: "dark_to_light", label: "Dark → Light", emoji: "☀️", sub: "Big contrast", warning: "Primer + extra coats" },
    { value: "damaged", label: "Needs repairs", emoji: "🔧", sub: "Cracks, holes…", warning: "Extra labor cost" },
];
const PAINT_TYPES = [
    { value: "interior_standard", label: "Interior standard", emoji: "🏠" },
    { value: "interior_premium", label: "Interior premium", emoji: "⭐" },
    { value: "exterior_standard", label: "Exterior standard", emoji: "🌤" },
    { value: "exterior_premium", label: "Exterior premium", emoji: "🌟" },
    { value: "primer_only", label: "Primer only", emoji: "🔳" },
];
const PAINT_FINISHES = [
    { value: "flat", label: "Flat / Matte", emoji: "▫️", sub: "Ceilings" },
    { value: "eggshell", label: "Eggshell", emoji: "🥚", sub: "Living rooms" },
    { value: "satin", label: "Satin", emoji: "✨", sub: "Kitchens" },
    { value: "semi_gloss", label: "Semi-gloss", emoji: "💧", sub: "Trim, doors" },
    { value: "gloss", label: "Gloss", emoji: "💎", sub: "Cabinets" },
];
const FLOOR_MATERIALS = [
    { value: "hardwood", label: "Hardwood", emoji: "🪵" },
    { value: "engineered_wood", label: "Engineered Wood", emoji: "🪵" },
    { value: "laminate", label: "Laminate", emoji: "📋" },
    { value: "vinyl_plank", label: "Vinyl / LVP", emoji: "🟫" },
    { value: "tile_ceramic", label: "Ceramic Tile", emoji: "🟦" },
    { value: "tile_porcelain", label: "Porcelain Tile", emoji: "⬜" },
    { value: "carpet", label: "Carpet", emoji: "🟩" },
    { value: "concrete", label: "Concrete", emoji: "⬛" },
];
const FLOOR_CURRENT = [
    { value: "bare_concrete", label: "Bare concrete", emoji: "⬛" },
    { value: "old_carpet", label: "Old carpet", emoji: "🟩" },
    { value: "old_hardwood", label: "Old hardwood", emoji: "🪵" },
    { value: "old_tile", label: "Old tile", emoji: "🟦" },
    { value: "old_vinyl", label: "Old vinyl", emoji: "🟫" },
    { value: "already_removed", label: "Already removed", emoji: "✅" },
];
const FLOOR_PATTERNS = [
    { value: "straight", label: "Straight", emoji: "➡️" },
    { value: "diagonal_45", label: "Diagonal 45°", emoji: "↗️" },
    { value: "herringbone", label: "Herringbone", emoji: "〽️" },
    { value: "chevron", label: "Chevron", emoji: "⌄" },
];
const BUDGETS = [
    { value: "under_500", label: "Under $500" },
    { value: "500_1000", label: "$500 – $1k" },
    { value: "1000_2500", label: "$1k – $2.5k" },
    { value: "2500_5000", label: "$2.5k – $5k" },
    { value: "5000_10000", label: "$5k – $10k" },
    { value: "over_10000", label: "$10k+" },
];

// ── MAIN EDIT PAGE ────────────────────────────────────────────────────────────
export default function EditEstimatePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchEstimate, updateEstimate } = useEstimate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(null);

    // Load existing estimate and pre-fill the form
    useEffect(() => {
        fetchEstimate(id)
            .then(data => {
                const est = data?.estimate ?? data;
                setForm({
                    estimate_type: est.estimate_type || "painting",
                    customer_name: est.customer_name || "",
                    customer_email: est.customer_email || "",
                    customer_phone: est.customer_phone || "",
                    customer_address: est.customer_address || "",
                    preferred_date: est.preferred_date || "",
                    budget_range: est.budget_range || "",
                    description: est.description || "",
                    // paint
                    paint_surface_condition: est.paint_surface_condition || "",
                    paint_coats: est.paint_coats || "2",
                    paint_type: est.paint_type || "interior_standard",
                    paint_finish: est.paint_finish || "eggshell",
                    include_ceiling: est.include_ceiling ?? false,
                    include_trim: est.include_trim ?? false,
                    include_doors: est.include_doors ?? false,
                    door_count: est.door_count ?? 0,
                    window_count: est.window_count ?? 0,
                    client_provides_paint: est.client_provides_paint ?? false,
                    desired_colors: est.desired_colors || "",
                    repairs_needed: est.repairs_needed ?? false,
                    repairs_detail: est.repairs_detail || "",
                    // flooring
                    flooring_material: est.flooring_material || "",
                    flooring_current: est.flooring_current || "",
                    include_removal: est.include_removal ?? false,
                    subfloor_condition: est.subfloor_condition || "unknown",
                    flooring_pattern: est.flooring_pattern || "straight",
                    include_baseboards: est.include_baseboards ?? false,
                    transition_strips: est.transition_strips ?? 0,
                    include_stairs: est.include_stairs ?? false,
                    stair_count: est.stair_count ?? 0,
                });
                setLoading(false);
            })
            .catch(() => { setLoading(false); });
    }, [id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const isPainting = form?.estimate_type === "painting" || form?.estimate_type === "both";
    const isFlooring = form?.estimate_type === "flooring" || form?.estimate_type === "both";

    const validate = () => {
        const e = {};
        if (!form.customer_name.trim()) e.customer_name = "Name is required";
        if (!form.customer_phone.trim()) e.customer_phone = "Phone is required";
        if (isPainting && !form.paint_surface_condition)
            e.paint_surface_condition = "Please select surface condition";
        if (isFlooring && !form.flooring_material)
            e.flooring_material = "Please select flooring material";
        if (isFlooring && !form.flooring_current)
            e.flooring_current = "Please select current floor state";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            await updateEstimate(id, form);
            navigate(`/providerdashboard/estimates/${id}`);
        } catch (e) {
            alert(e.message || "Failed to save");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="d-flex align-items-center justify-content-center" style={{ minHeight: 300 }}>
            <div className="spinner-border text-secondary" role="status" />
        </div>
    );

    if (!form) return (
        <div className="container py-5 text-center">
            <p className="text-muted">Estimate not found</p>
            <button className="btn btn-outline-secondary" onClick={() => navigate("/providerdashboard/estimates")}>← Back</button>
        </div>
    );

    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>

            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => navigate(`/providerdashboard/estimates/${id}`)}>← Back</button>
                <div>
                    <h5 className="fw-bold mb-0">Edit estimate #{id}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>Changes are saved when you click Save</p>
                </div>
            </div>

            {/* Type selector */}
            <h6 className="fw-semibold mb-2">Type of work</h6>
            <div className="row g-3 mb-4">
                {[
                    { value: "painting", label: "Painting", emoji: "🎨" },
                    { value: "flooring", label: "Flooring", emoji: "🪵" },
                    { value: "both", label: "Painting + Flooring", emoji: "🎨🪵" },
                ].map(o => (
                    <div key={o.value} className="col-12 col-md-4">
                        <button type="button"
                            onClick={() => set("estimate_type", o.value)}
                            className={`w-100 btn text-start p-3 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`}
                            style={{ minHeight: 80 }}>
                            <span className="d-block fs-3 mb-1">{o.emoji}</span>
                            <span className="d-block fw-semibold">{o.label}</span>
                        </button>
                    </div>
                ))}
            </div>

            {/* Client info */}
            <h6 className="fw-semibold mb-3">Client information</h6>
            <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                    <label className="form-label fw-medium small">Full name <span className="text-danger">*</span></label>
                    <input className={`form-control ${errors.customer_name ? "is-invalid" : ""}`}
                        value={form.customer_name} onChange={e => set("customer_name", e.target.value)} placeholder="John Smith" />
                    {errors.customer_name && <div className="invalid-feedback">{errors.customer_name}</div>}
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label fw-medium small">Phone <span className="text-danger">*</span></label>
                    <input className={`form-control ${errors.customer_phone ? "is-invalid" : ""}`}
                        type="tel" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} placeholder="(555) 000-0000" />
                    {errors.customer_phone && <div className="invalid-feedback">{errors.customer_phone}</div>}
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label fw-medium small">Email</label>
                    <input className="form-control" type="email" value={form.customer_email}
                        onChange={e => set("customer_email", e.target.value)} placeholder="john@email.com" />
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label fw-medium small">Job address</label>
                    <input className="form-control" value={form.customer_address}
                        onChange={e => set("customer_address", e.target.value)} placeholder="123 Main St, Miami, FL" />
                </div>
                <div className="col-12 col-md-6">
                    <label className="form-label fw-medium small">Preferred start date</label>
                    <input className="form-control" type="date"
                        value={form.preferred_date ? form.preferred_date.split("T")[0] : ""}
                        onChange={e => set("preferred_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                </div>
            </div>

            <h6 className="fw-semibold mb-2">Budget range</h6>
            <Chips options={BUDGETS} value={form.budget_range} onChange={v => set("budget_range", v)} cols={3} />

            <div className="mt-3 mb-4">
                <label className="form-label fw-medium small">Notes / special requests</label>
                <textarea className="form-control" rows={3} value={form.description}
                    onChange={e => set("description", e.target.value)} placeholder="Access hours, special instructions…" />
            </div>

            {/* PAINTING */}
            {isPainting && (
                <>
                    <hr className="my-4" />
                    <h6 className="fw-semibold mb-3">🎨 Painting details</h6>

                    <div className="alert alert-warning d-flex gap-2 align-items-start">
                        <span className="fs-5 flex-shrink-0">⚠️</span>
                        <div>
                            <strong>Surface condition = #1 profit protector</strong>
                            <span className="d-block" style={{ fontSize: 13 }}>Wrong choice = hidden costs.</span>
                        </div>
                    </div>

                    <SectionTitle text="Surface condition *" />
                    <Chips options={PAINT_CONDITIONS} value={form.paint_surface_condition}
                        onChange={v => set("paint_surface_condition", v)} cols={2} />
                    {errors.paint_surface_condition && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.paint_surface_condition}</p>}

                    <SectionTitle text="Paint type" />
                    <Chips options={PAINT_TYPES} value={form.paint_type} onChange={v => set("paint_type", v)} cols={3} />

                    <SectionTitle text="Finish" />
                    <Chips options={PAINT_FINISHES} value={form.paint_finish} onChange={v => set("paint_finish", v)} cols={3} />

                    <SectionTitle text="Number of coats" />
                    <div className="row g-2 row-cols-3 mb-3">
                        {[["1", "1 coat"], ["2", "2 coats ✓"], ["3", "3 coats"]].map(([v, l]) => (
                            <div key={v} className="col">
                                <button type="button"
                                    className={`btn w-100 ${form.paint_coats === v ? "btn-dark" : "btn-outline-secondary"}`}
                                    onClick={() => set("paint_coats", v)}>{l}</button>
                            </div>
                        ))}
                    </div>

                    <SectionTitle text="Included" />
                    <div className="card border bg-light mb-3">
                        <div className="card-body py-1 px-3">
                            <Toggle id="e_ceiling" label="Ceiling" sub="Adds material + labor" value={form.include_ceiling} onChange={v => set("include_ceiling", v)} />
                            <Toggle id="e_trim" label="Trim / baseboards" sub="Doors, window frames, crown" value={form.include_trim} onChange={v => set("include_trim", v)} />
                            <Toggle id="e_doors" label="Doors" value={form.include_doors} onChange={v => set("include_doors", v)} />
                            <Toggle id="e_cpaint" label="Client provides paint" sub="Reduces material cost" value={form.client_provides_paint} onChange={v => set("client_provides_paint", v)} />
                            <Toggle id="e_repairs" label="Repairs needed" sub="Cracks, holes, water damage" value={form.repairs_needed} onChange={v => set("repairs_needed", v)} />
                            {form.repairs_needed && (
                                <div className="py-2">
                                    <textarea className="form-control form-control-sm" rows={2}
                                        value={form.repairs_detail} onChange={e => set("repairs_detail", e.target.value)}
                                        placeholder="Describe damage…" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card border bg-light mb-3">
                        <div className="card-body py-1 px-3">
                            <Counter label="Number of doors" value={form.door_count} onChange={v => set("door_count", v)} />
                            <Counter label="Number of windows" value={form.window_count} onChange={v => set("window_count", v)} />
                        </div>
                    </div>

                    <label className="form-label fw-medium small">Desired colors</label>
                    <input className="form-control mb-3" value={form.desired_colors}
                        onChange={e => set("desired_colors", e.target.value)}
                        placeholder="e.g. White SW7012, navy blue accent wall" />
                </>
            )}

            {/* FLOORING */}
            {isFlooring && (
                <>
                    <hr className="my-4" />
                    <h6 className="fw-semibold mb-3">🪵 Flooring details</h6>

                    <SectionTitle text="New flooring material *" />
                    <Chips options={FLOOR_MATERIALS} value={form.flooring_material} onChange={v => set("flooring_material", v)} cols={2} />
                    {errors.flooring_material && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.flooring_material}</p>}

                    <SectionTitle text="Current floor state *" />
                    <Chips options={FLOOR_CURRENT} value={form.flooring_current} onChange={v => set("flooring_current", v)} cols={2} />
                    {errors.flooring_current && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.flooring_current}</p>}

                    <SectionTitle text="Installation pattern" />
                    <Chips options={FLOOR_PATTERNS} value={form.flooring_pattern} onChange={v => set("flooring_pattern", v)} cols={2} />

                    <div className="card border bg-light mt-3 mb-3">
                        <div className="card-body py-1 px-3">
                            <Toggle id="e_removal" label="Remove old floor" sub="Labor for tear out" value={form.include_removal} onChange={v => set("include_removal", v)} />
                            <Toggle id="e_base" label="Install baseboards" sub="Rod moulding" value={form.include_baseboards} onChange={v => set("include_baseboards", v)} />
                            <Toggle id="e_stairs" label="Includes stairs" sub="Charges per step" value={form.include_stairs} onChange={v => set("include_stairs", v)} />
                        </div>
                    </div>

                    <div className="card border bg-light mb-3">
                        <div className="card-body py-1 px-3">
                            {form.include_stairs && (
                                <Counter label="Number of steps" value={form.stair_count} onChange={v => set("stair_count", v)} />
                            )}
                            <Counter label="Transition strips" value={form.transition_strips} onChange={v => set("transition_strips", v)} />
                        </div>
                    </div>
                </>
            )}

            {/* Save button */}
            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                <button type="button" onClick={() => navigate(`/providerdashboard/estimates/${id}`)}
                    className="btn btn-outline-secondary px-4">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving}
                    className="btn btn-success flex-fill fw-semibold">
                    {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : "✓ Save changes"}
                </button>
            </div>
        </div>
    );
}