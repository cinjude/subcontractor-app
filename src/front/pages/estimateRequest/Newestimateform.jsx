// src/pages/Estimates/NewEstimateForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";

/* ─── Chip selector — tap to select, no dropdown ────────────────────────── */
function Chips({ options, value, onChange, cols = 2 }) {
    return (
        <div className={`row g-2 row-cols-${cols} row-cols-md-${Math.min(cols + 1, 4)}`}>
            {options.map(o => {
                const sel = value === o.value;
                return (
                    <div key={o.value} className="col">
                        <button
                            type="button"
                            onClick={() => onChange(sel ? null : o.value)}
                            className={`w-100 h-100 btn text-start ${sel ? "btn-dark" : "btn-outline-secondary"}`}
                            style={{ padding: "10px 12px", lineHeight: 1.4, minHeight: 60 }}
                        >
                            {o.emoji && <span className="d-block fs-5 mb-1" aria-hidden="true">{o.emoji}</span>}
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

/* ─── Toggle (Bootstrap switch) ─────────────────────────────────────────── */
function Toggle({ id, label, sub, value, onChange }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <label htmlFor={id} style={{ cursor: "pointer", marginBottom: 0 }}>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </label>
            <div className="form-check form-switch ms-3 mb-0">
                <input className="form-check-input" type="checkbox" role="switch" id={id}
                    checked={value} onChange={e => onChange(e.target.checked)}
                    style={{ width: "2.4em", height: "1.3em", cursor: "pointer" }} />
            </div>
        </div>
    );
}

/* ─── Counter — big tap targets for field use ────────────────────────────── */
function Counter({ label, value, onChange, min = 0 }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <span className="fw-medium" style={{ fontSize: 14 }}>{label}</span>
            <div className="d-flex align-items-center gap-3">
                <button type="button" aria-label="decrease"
                    className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20, lineHeight: 1 }}
                    onClick={() => onChange(Math.max(min, value - 1))}>−</button>
                <span className="fw-semibold" style={{ minWidth: 24, textAlign: "center", fontSize: 16 }}>{value}</span>
                <button type="button" aria-label="increase"
                    className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20, lineHeight: 1 }}
                    onClick={() => onChange(value + 1)}>+</button>
            </div>
        </div>
    );
}

/* ─── Room row ───────────────────────────────────────────────────────────── */
function RoomRow({ room, index, onChange, onRemove }) {
    const sqft = room.length_ft && room.width_ft
        ? (parseFloat(room.length_ft) * parseFloat(room.width_ft)).toFixed(0) : 0;
    const wallSqft = sqft > 0 && room.height_ft
        ? (2 * (parseFloat(room.length_ft) + parseFloat(room.width_ft)) * parseFloat(room.height_ft)).toFixed(0) : 0;

    return (
        <div className="card border bg-light mb-2">
            <div className="card-body py-2 px-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <input value={room.name} onChange={e => onChange(index, "name", e.target.value)}
                        placeholder="Room name (e.g. Living Room)"
                        className="form-control form-control-sm fw-medium border-0 bg-transparent shadow-none"
                        style={{ outline: "none" }} />
                    <button type="button" className="btn-close flex-shrink-0" onClick={() => onRemove(index)} aria-label="Remove room" />
                </div>
                <div className="row g-2">
                    {[["length_ft", "Length (ft)"], ["width_ft", "Width (ft)"], ["height_ft", "Height (ft)"]].map(([k, l]) => (
                        <div key={k} className="col-4">
                            <label className="form-label mb-1 text-muted" style={{ fontSize: 11 }}>{l}</label>
                            <input type="number" inputMode="decimal" className="form-control form-control-sm"
                                value={room[k] || ""} onChange={e => onChange(index, k, e.target.value)} placeholder="0" />
                        </div>
                    ))}
                </div>
                {sqft > 0 && (
                    <div className="d-flex gap-3 mt-2">
                        <span className="text-success fw-semibold" style={{ fontSize: 12 }}>Floor: {sqft} sq ft</span>
                        {wallSqft > 0 && <span className="text-muted" style={{ fontSize: 12 }}>Walls: {wallSqft} sq ft</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Step progress bar ──────────────────────────────────────────────────── */
const STEPS = ["Type", "Client", "Rooms", "Details", "Extras", "Review"];

function StepBar({ step }) {
    return (
        <div className="mb-4">
            {/* Desktop numbered stepper */}
            <div className="d-none d-md-flex justify-content-between align-items-center position-relative mb-3">
                <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-secondary bg-opacity-25"
                    style={{ height: 2, zIndex: 0 }} />
                {STEPS.map((s, i) => (
                    <div key={i} className="d-flex flex-column align-items-center" style={{ position: "relative", zIndex: 1 }}>
                        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold border-2
              ${i < step ? "bg-success text-white border-success"
                                : i === step ? "bg-dark text-white border-dark"
                                    : "bg-white text-muted border-secondary"}`}
                            style={{ width: 38, height: 38, fontSize: 14, border: "2px solid" }}>
                            {i < step ? "✓" : i + 1}
                        </div>
                        <span className={`mt-1 ${i === step ? "fw-semibold text-dark" : "text-muted"}`}
                            style={{ fontSize: 12 }}>{s}</span>
                    </div>
                ))}
            </div>

            {/* Mobile: slim progress bar */}
            <div className="d-md-none">
                <div className="d-flex gap-1 mb-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className="flex-fill rounded"
                            style={{ height: 5, background: i <= step ? "#212529" : "#dee2e6", transition: "background .2s" }} />
                    ))}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                    Step {step + 1} of {STEPS.length} —&nbsp;
                    <strong className="text-dark">{STEPS[step]}</strong>
                </p>
            </div>
        </div>
    );
}

/* ── Section header inside step ─────────────────────────────────────────── */
function SectionTitle({ text }) {
    return (
        <p className="text-uppercase fw-semibold text-muted mb-2"
            style={{ fontSize: 11, letterSpacing: "0.06em" }}>{text}</p>
    );
}

/* ─── OPTIONS CONSTANTS ──────────────────────────────────────────────────── */
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

/* ─── MAIN FORM ──────────────────────────────────────────────────────────── */
export default function NewEstimateForm() {
    const navigate = useNavigate();
    const { createEstimate } = useEstimate();
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const { store } = useGlobalReducer()

    const [form, setForm] = useState({
        estimate_type: "painting",
        customer_name: "", customer_email: "", customer_phone: "", customer_address: "",
        preferred_date: "", budget_range: "", description: "",
        rooms: [{ name: "Living Room", length_ft: "", width_ft: "", height_ft: "" }],
        // paint
        paint_surface_condition: "", paint_coats: "2",
        paint_type: "interior_standard", paint_finish: "eggshell",
        include_ceiling: false, include_trim: false, include_doors: false,
        door_count: 0, window_count: 0, client_provides_paint: false,
        desired_colors: "", repairs_needed: false, repairs_detail: "",
        // flooring
        flooring_material: "", flooring_current: "", include_removal: false,
        subfloor_condition: "unknown", flooring_pattern: "straight",
        include_baseboards: false, transition_strips: 0,
        include_stairs: false, stair_count: 0,
        furniture_rooms: 0,
        furniture_heavy: 0,
        moisture_barrier: false,
        floor_leveling: false,
        floor_leveling_mode: "sqft",
        floor_leveling_bags: 1,
        heavy_demo: false,
        travel_miles: 0,
        use_flat_travel: false,
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isPainting = form.estimate_type === "painting" || form.estimate_type === "both";
    const isFlooring = form.estimate_type === "flooring" || form.estimate_type === "both";

    const updateRoom = (i, k, v) =>
        setForm(f => { const r = [...f.rooms]; r[i] = { ...r[i], [k]: v }; return { ...f, rooms: r }; });
    const addRoom = () =>
        setForm(f => ({ ...f, rooms: [...f.rooms, { name: `Room ${f.rooms.length + 1}`, length_ft: "", width_ft: "", height_ft: "" }] }));
    const removeRoom = (i) =>
        setForm(f => ({ ...f, rooms: f.rooms.filter((_, idx) => idx !== i) }));

    const totalSqft = form.rooms.reduce((acc, r) => {
        const s = parseFloat(r.length_ft || 0) * parseFloat(r.width_ft || 0);
        return acc + (isNaN(s) ? 0 : s);
    }, 0);

    const validate = () => {
        const e = {};
        if (step === 1) {
            if (!form.customer_name.trim()) e.customer_name = "Name is required";
            if (!form.customer_phone.trim()) e.customer_phone = "Phone is required";
        }
        if (step === 3) {
            if (isPainting && !form.paint_surface_condition)
                e.paint_surface_condition = "Please select surface condition — this protects your profit";
            if (isFlooring && !form.flooring_material)
                e.flooring_material = "Please select flooring material";
            if (isFlooring && !form.flooring_current)
                e.flooring_current = "Please select current floor state";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (!validate()) return; setStep(s => s + 1); window.scrollTo(0, 0); };
    const back = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    const handleSubmit = async () => {
        setSubmitting(true);
        const token = localStorage.getItem("token");
        try {
            const est = await createEstimate({ ...form, rooms: form.rooms.filter(r => r.name.trim()) }, token);
            navigate(`/providerdashboard/estimates/${est.id}`);
        } catch (e) {
            alert(e.message || "Failed to create estimate");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const token = store.token || localStorage.getItem("token");
    }, []);

    /* helper to render a review row */
    const RevRow = ({ label, value }) =>
        value ? (
            <div className="d-flex justify-content-between border-bottom py-2">
                <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
                <span className="fw-medium text-end ms-3" style={{ fontSize: 13 }}>{value}</span>
            </div>
        ) : null;

    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>

            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => step === 0 ? navigate("/providerdashboard/estimates") : back()}>← Back</button>
                <div>
                    <h5 className="fw-bold mb-0">New estimate</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>Fill in each step — no hidden cost surprises</p>
                </div>
            </div>

            <StepBar step={step} />

            {/* ── STEP 0 — TYPE ───────────────────────────────────────────────── */}
            {step === 0 && (
                <div>
                    <h6 className="fw-semibold mb-3">What type of work? <span className="text-danger">*</span></h6>
                    <div className="row g-3">
                        {[
                            { value: "painting", label: "Painting", emoji: "🎨", sub: "Interior / exterior walls, ceilings, trim" },
                            { value: "flooring", label: "Flooring", emoji: "🪵", sub: "Hardwood, vinyl, tile, carpet installation" },
                            { value: "both", label: "Painting + Flooring", emoji: "🎨🪵", sub: "Combo project" },
                        ].map(o => (
                            <div key={o.value} className="col-12 col-md-4">
                                <button type="button"
                                    onClick={() => set("estimate_type", o.value)}
                                    className={`w-100 btn text-start p-3 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`}
                                    style={{ minHeight: 110 }}>
                                    <span className="d-block fs-2 mb-1">{o.emoji}</span>
                                    <span className="d-block fw-semibold">{o.label}</span>
                                    <span className="d-block text-muted" style={{ fontSize: 12 }}>{o.sub}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── STEP 1 — CLIENT ─────────────────────────────────────────────── */}
            {step === 1 && (
                <div>
                    <h6 className="fw-semibold mb-3">Client information</h6>
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Full name <span className="text-danger">*</span></label>
                            <input className={`form-control ${errors.customer_name ? "is-invalid" : ""}`}
                                placeholder="John Smith" value={form.customer_name}
                                onChange={e => set("customer_name", e.target.value)} />
                            {errors.customer_name && <div className="invalid-feedback">{errors.customer_name}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Phone <span className="text-danger">*</span></label>
                            <input className={`form-control ${errors.customer_phone ? "is-invalid" : ""}`}
                                type="tel" inputMode="tel" placeholder="(555) 000-0000" value={form.customer_phone}
                                onChange={e => set("customer_phone", e.target.value)} />
                            {errors.customer_phone && <div className="invalid-feedback">{errors.customer_phone}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Email</label>
                            <input className="form-control" type="email" inputMode="email"
                                placeholder="john@email.com" value={form.customer_email}
                                onChange={e => set("customer_email", e.target.value)} />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Job address</label>
                            <input className="form-control" placeholder="123 Main St, Miami, FL"
                                value={form.customer_address} onChange={e => set("customer_address", e.target.value)} />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Preferred start date</label>
                            <input className="form-control" type="date" value={form.preferred_date}
                                onChange={e => set("preferred_date", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                        </div>
                    </div>

                    <h6 className="fw-semibold mb-2">Client's budget range</h6>
                    <Chips options={BUDGETS} value={form.budget_range} onChange={v => set("budget_range", v)} cols={3} />

                    <div className="mt-4">
                        <label className="form-label fw-medium small">Additional notes / special requests</label>
                        <textarea className="form-control" rows={3} placeholder="Access hours, allergies, pets…"
                            value={form.description} onChange={e => set("description", e.target.value)} />
                    </div>
                </div>
            )}

            {/* ── STEP 2 — ROOMS ──────────────────────────────────────────────── */}
            {step === 2 && (
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <div>
                            <h6 className="fw-semibold mb-0">Rooms / areas</h6>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Sq ft calculates automatically — no guessing</p>
                        </div>
                        {totalSqft > 0 && (
                            <span className="badge bg-success fs-6 px-3 py-2">
                                {totalSqft.toFixed(0)} sq ft
                            </span>
                        )}
                    </div>
                    <hr className="mt-2 mb-3" />

                    {form.rooms.map((r, i) => (
                        <RoomRow key={i} room={r} index={i} onChange={updateRoom} onRemove={removeRoom} />
                    ))}

                    <button type="button" onClick={addRoom}
                        className="btn btn-outline-secondary w-100 mt-1" style={{ borderStyle: "dashed" }}>
                        + Add room / area
                    </button>
                </div>
            )}

            {/* ── STEP 3 — DETAILS ────────────────────────────────────────────── */}
            {step === 3 && (
                <div>
                    {/* PAINTING */}
                    {isPainting && (
                        <>
                            <div className="alert alert-warning d-flex gap-2 align-items-start" role="alert">
                                <span className="fs-5 flex-shrink-0">⚠️</span>
                                <div>
                                    <strong>Surface condition is the #1 profit protector.</strong>
                                    <span className="d-block" style={{ fontSize: 13 }}>
                                        Wrong choice = hidden costs. Choose carefully.
                                    </span>
                                </div>
                            </div>

                            <SectionTitle text="Surface condition *" />
                            <Chips options={PAINT_CONDITIONS} value={form.paint_surface_condition}
                                onChange={v => set("paint_surface_condition", v)} cols={2} />
                            {errors.paint_surface_condition && (
                                <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.paint_surface_condition}</p>
                            )}

                            <hr className="my-4" />
                            <SectionTitle text="Paint type" />
                            <Chips options={PAINT_TYPES} value={form.paint_type}
                                onChange={v => set("paint_type", v)} cols={3} />

                            <SectionTitle text="Finish" />
                            <Chips options={PAINT_FINISHES} value={form.paint_finish}
                                onChange={v => set("paint_finish", v)} cols={3} />

                            <SectionTitle text="Number of coats" />
                            <div className="row g-2 row-cols-3 mb-4">
                                {[["1", "1 coat"], ["2", "2 coats ✓"], ["3", "3 coats"]].map(([v, l]) => (
                                    <div key={v} className="col">
                                        <button type="button"
                                            className={`btn w-100 ${form.paint_coats === v ? "btn-dark" : "btn-outline-secondary"}`}
                                            onClick={() => set("paint_coats", v)}>{l}</button>
                                    </div>
                                ))}
                            </div>

                            <hr className="my-3" />
                            <SectionTitle text="What's included?" />
                            <div className="card border bg-light mb-3">
                                <div className="card-body py-1 px-3">
                                    <Toggle id="t_ceiling" label="Ceiling" sub="Adds material + labor" value={form.include_ceiling} onChange={v => set("include_ceiling", v)} />
                                    <Toggle id="t_trim" label="Trim / baseboards" sub="Doors, window frames, crown" value={form.include_trim} onChange={v => set("include_trim", v)} />
                                    <Toggle id="t_doors" label="Doors" value={form.include_doors} onChange={v => set("include_doors", v)} />
                                    <Toggle id="t_cpaint" label="Client provides paint" sub="Reduces your material cost" value={form.client_provides_paint} onChange={v => set("client_provides_paint", v)} />
                                    <Toggle id="t_repairs" label="Repairs / patching needed" sub="Cracks, holes, water damage" value={form.repairs_needed} onChange={v => set("repairs_needed", v)} />
                                    {form.repairs_needed && (
                                        <div className="py-2">
                                            <textarea className="form-control form-control-sm" rows={2}
                                                placeholder="Describe damage: cracks, holes, stains, water marks…"
                                                value={form.repairs_detail} onChange={e => set("repairs_detail", e.target.value)} />
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

                            <label className="form-label fw-medium small">Desired colors (optional)</label>
                            <input className="form-control" placeholder="e.g. White SW7012, navy blue accent wall"
                                value={form.desired_colors} onChange={e => set("desired_colors", e.target.value)} />
                        </>
                    )}

                    {/* FLOORING */}
                    {isFlooring && (
                        <>
                            {isPainting && <hr className="my-4" />}
                            <SectionTitle text="New flooring material *" />
                            <Chips options={FLOOR_MATERIALS} value={form.flooring_material}
                                onChange={v => set("flooring_material", v)} cols={2} />
                            {errors.flooring_material && (
                                <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.flooring_material}</p>
                            )}

                            <hr className="my-3" />
                            <SectionTitle text="Current floor state *" />
                            <Chips options={FLOOR_CURRENT} value={form.flooring_current}
                                onChange={v => set("flooring_current", v)} cols={2} />
                            {errors.flooring_current && (
                                <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.flooring_current}</p>
                            )}

                            <hr className="my-3" />
                            <SectionTitle text="Installation pattern" />
                            <Chips options={FLOOR_PATTERNS} value={form.flooring_pattern}
                                onChange={v => set("flooring_pattern", v)} cols={2} />

                            <hr className="my-3" />
                            <div className="card border bg-light mb-3">
                                <div className="card-body py-1 px-3">
                                    <Toggle id="t_removal" label="Remove old floor" sub="Labor cost for tear out" value={form.include_removal} onChange={v => set("include_removal", v)} />
                                    <Toggle id="t_base" label="Install baseboards" sub="Rod moulding / baseboard" value={form.include_baseboards} onChange={v => set("include_baseboards", v)} />
                                    <Toggle id="t_stairs" label="Includes stairs" sub="Charges per step" value={form.include_stairs} onChange={v => set("include_stairs", v)} />
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
                </div>
            )}

            {step === 4 && (
                <div>
                    <h6 className="fw-semibold mb-1">Job extras</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>
                        These are the details most contractors forget to charge for.
                        Check everything that applies to this job — the price calculator will include them automatically.
                    </p>

                    {/* ── FURNITURE MOVING ── */}
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                            🪑 Furniture moving
                            <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>
                                — workers tire before install even starts
                            </span>
                        </div>
                        <div className="card-body py-1 px-3">
                            <Counter
                                label="Standard rooms"
                                sub="Sofa, bed, dresser — charged per room"
                                value={form.furniture_rooms}
                                onChange={v => set("furniture_rooms", v)}
                            />
                            <Counter
                                label="Heavy items"
                                sub="Refrigerator, piano, pool table, safe — charged per item"
                                value={form.furniture_heavy}
                                onChange={v => set("furniture_heavy", v)}
                            />
                        </div>
                    </div>

                    {/* ── PREP WORK ── */}
                    {isFlooring && (
                        <div className="card border bg-light mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                🔧 Prep work
                                <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>
                                    — where profit is won or lost
                                </span>
                            </div>
                            <div className="card-body py-1 px-3">

                                {/* Heavy demo — only show if removal is selected */}
                                {form.include_removal && (
                                    <Toggle
                                        id="x_heavydemo"
                                        label="Heavy demo"
                                        sub="Tile, glued hardwood, thinset grinding — much harder than carpet tearout"
                                        value={form.heavy_demo}
                                        onChange={v => set("heavy_demo", v)}
                                    />
                                )}

                                {/* Moisture barrier */}
                                <Toggle
                                    id="x_moisture"
                                    label="Moisture barrier needed"
                                    sub="Required for LVP, laminate, engineered on concrete — floor fails without it"
                                    value={form.moisture_barrier}
                                    onChange={v => set("moisture_barrier", v)}
                                />

                                {/* Floor leveling */}
                                <Toggle
                                    id="x_leveling"
                                    label="Floor leveling needed"
                                    sub="Uneven subfloor — self-leveler material + extra labor hours"
                                    value={form.floor_leveling}
                                    onChange={v => set("floor_leveling", v)}
                                />
                                {form.floor_leveling && (
                                    <div className="py-2 ps-2">
                                        <p className="text-muted mb-2" style={{ fontSize: 12 }}>
                                            How do you charge for leveling?
                                        </p>
                                        <div className="d-flex gap-2 mb-2">
                                            {[
                                                { value: "sqft", label: "Per sq ft" },
                                                { value: "bag", label: "Per bag" },
                                            ].map(o => (
                                                <button key={o.value} type="button"
                                                    onClick={() => set("floor_leveling_mode", o.value)}
                                                    className={`btn btn-sm ${form.floor_leveling_mode === o.value ? "btn-dark" : "btn-outline-secondary"}`}>
                                                    {o.label}
                                                </button>
                                            ))}
                                        </div>
                                        {form.floor_leveling_mode === "bag" && (
                                            <Counter
                                                label="Estimated bags"
                                                sub="Each bag of self-leveler covers ~50 sq ft at 1/8 inch depth"
                                                value={form.floor_leveling_bags}
                                                onChange={v => set("floor_leveling_bags", v)}
                                                min={1}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TRAVEL ── */}
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                            🚗 Travel
                            <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>
                                — far jobs become unprofitable without this
                            </span>
                        </div>
                        <div className="card-body py-1 px-3">
                            <Counter
                                label="One-way miles"
                                sub="Leave at 0 for local jobs — enter miles for distant jobs"
                                value={form.travel_miles}
                                onChange={v => set("travel_miles", v)}
                                min={0}
                            />
                            {form.travel_miles > 0 && (
                                <Toggle
                                    id="x_flattravel"
                                    label="Charge flat travel fee instead of per-mile"
                                    sub="Use flat rate if you prefer a fixed trip charge"
                                    value={form.use_flat_travel}
                                    onChange={v => set("use_flat_travel", v)}
                                />
                            )}
                        </div>
                    </div>

                    {/* ── MINIMUM JOB FEE INFO ── */}
                    <div className="alert alert-info d-flex gap-2 align-items-start" style={{ fontSize: 13 }}>
                        <span>🛡️</span>
                        <div>
                            <strong>Minimum job fee</strong> is applied automatically by the calculator
                            if the total falls below your set minimum. You don't need to enter it here —
                            it's set once in <strong>Settings → My rates</strong>.
                        </div>
                    </div>
                </div>
            )}

            {step === 5 && (
                <div>
                    <h6 className="fw-semibold mb-1">Review before creating</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>Double-check everything is correct</p>

                    {/* Type */}
                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <span className="badge bg-dark fs-6 px-3 py-2">
                            {form.estimate_type === "painting" ? "🎨 Painting"
                                : form.estimate_type === "flooring" ? "🪵 Flooring"
                                    : "🎨🪵 Painting + Flooring"}
                        </span>
                        {totalSqft > 0 && (
                            <span className="badge bg-success fs-6 px-3 py-2">📐 {totalSqft.toFixed(0)} sq ft</span>
                        )}
                    </div>

                    {/* Client */}
                    <div className="card border mb-3">
                        <div className="card-header bg-light py-2 fw-semibold small">👤 Client</div>
                        <div className="card-body py-2 px-3">
                            <RevRow label="Name" value={form.customer_name} />
                            <RevRow label="Phone" value={form.customer_phone} />
                            <RevRow label="Email" value={form.customer_email} />
                            <RevRow label="Address" value={form.customer_address} />
                            <RevRow label="Budget" value={form.budget_range?.replace(/_/g, " ")} />
                        </div>
                    </div>

                    {/* Rooms */}
                    {form.rooms.some(r => r.name) && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">📐 Rooms</div>
                            <div className="card-body py-2 px-3">
                                {form.rooms.filter(r => r.name).map((r, i) => {
                                    const s = r.length_ft && r.width_ft
                                        ? (parseFloat(r.length_ft) * parseFloat(r.width_ft)).toFixed(0) : null;
                                    return (
                                        <div key={i} className="d-flex justify-content-between border-bottom py-2">
                                            <span style={{ fontSize: 13 }}>{r.name}</span>
                                            <span className="text-muted" style={{ fontSize: 13 }}>{s ? `${s} sq ft` : "—"}</span>
                                        </div>
                                    );
                                })}
                                <div className="d-flex justify-content-between pt-2 fw-semibold">
                                    <span style={{ fontSize: 13 }}>Total</span>
                                    <span className="text-success" style={{ fontSize: 13 }}>{totalSqft.toFixed(0)} sq ft</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Paint */}
                    {isPainting && form.paint_surface_condition && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">🎨 Painting</div>
                            <div className="card-body py-2 px-3">
                                <RevRow label="Surface" value={form.paint_surface_condition?.replace(/_/g, " ")} />
                                <RevRow label="Type" value={form.paint_type?.replace(/_/g, " ")} />
                                <RevRow label="Finish" value={form.paint_finish} />
                                <RevRow label="Coats" value={form.paint_coats} />
                                <RevRow label="Ceiling" value={form.include_ceiling ? "Yes" : null} />
                                <RevRow label="Trim" value={form.include_trim ? "Yes" : null} />
                                <RevRow label="Doors" value={form.door_count > 0 ? form.door_count : null} />
                                <RevRow label="Repairs" value={form.repairs_needed ? "⚠ Yes — " + (form.repairs_detail || "see notes") : null} />
                                <RevRow label="Colors" value={form.desired_colors} />
                            </div>
                        </div>
                    )}

                    {/* Flooring */}
                    {isFlooring && form.flooring_material && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">🪵 Flooring</div>
                            <div className="card-body py-2 px-3">
                                <RevRow label="Material" value={form.flooring_material?.replace(/_/g, " ")} />
                                <RevRow label="Current" value={form.flooring_current?.replace(/_/g, " ")} />
                                <RevRow label="Pattern" value={form.flooring_pattern} />
                                <RevRow label="Removal" value={form.include_removal ? "Included" : null} />
                                <RevRow label="Baseboards" value={form.include_baseboards ? "Yes" : null} />
                                <RevRow label="Stairs" value={form.include_stairs ? `${form.stair_count} steps` : null} />
                                <RevRow label="Transitions" value={form.transition_strips > 0 ? form.transition_strips : null} />
                            </div>
                        </div>
                    )}
                    {(form.furniture_rooms > 0 || form.furniture_heavy > 0 ||
                        form.moisture_barrier || form.floor_leveling ||
                        form.heavy_demo || form.travel_miles > 0) && (
                            <div className="card border mb-3">
                                <div className="card-header bg-light py-2 fw-semibold small">🔧 Extras</div>
                                <div className="card-body py-2 px-3">
                                    {form.furniture_rooms > 0 && (
                                        <RevRow label="Furniture rooms" value={`${form.furniture_rooms} room${form.furniture_rooms > 1 ? "s" : ""}`} />
                                    )}
                                    {form.furniture_heavy > 0 && (
                                        <RevRow label="Heavy items" value={`${form.furniture_heavy} item${form.furniture_heavy > 1 ? "s" : ""}`} />
                                    )}
                                    {form.moisture_barrier && (
                                        <RevRow label="Moisture barrier" value="Yes — included" />
                                    )}
                                    {form.floor_leveling && (
                                        <RevRow label="Floor leveling" value={
                                            form.floor_leveling_mode === "bag"
                                                ? `Yes — ${form.floor_leveling_bags} bag${form.floor_leveling_bags > 1 ? "s" : ""}`
                                                : "Yes — per sq ft"
                                        } />
                                    )}
                                    {form.heavy_demo && (
                                        <RevRow label="Heavy demo" value="Yes — tile/glued hardwood rate" />
                                    )}
                                    {form.travel_miles > 0 && (
                                        <RevRow label="Travel" value={
                                            form.use_flat_travel
                                                ? `Flat fee — ${form.travel_miles} miles`
                                                : `${form.travel_miles} miles × per-mile rate`
                                        } />
                                    )}
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* ── STICKY BOTTOM NAV ───────────────────────────────────────────── */}
            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                {step > 0 && (
                    <button type="button" onClick={back}
                        className="btn btn-outline-secondary px-4">← Back</button>
                )}
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn btn-dark flex-fill fw-semibold">
                        Continue →
                    </button>
                ) : (
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                        className="btn btn-success flex-fill fw-semibold">
                        {submitting
                            ? <><span className="spinner-border spinner-border-sm me-2" role="status" />Saving…</>
                            : "✓ Create estimate"}
                    </button>
                )}
            </div>
        </div>
    );
}