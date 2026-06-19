// src/front/pages/invoices/CreateInvoicePage.jsx
// Full detailed invoice builder — mirrors NewEstimateForm.jsx exactly.
// Reuses Chips/Toggle/Counter/RoomMaterialSelector/MaterialsSection from
// InvoiceBuilderShared.jsx, and your existing PriceCalculatorModal for pricing.

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useInvoice } from "./InvoiceContext";
import PriceCalculatorModal from "../estimateRequest/PriceCalculatorModal.jsx";
import {
    Chips, Toggle, Counter, SectionTitle, RoomRow,
    RoomMaterialSelector, MaterialsSection,
    PAINT_CONDITIONS, PAINT_TYPES, PAINT_FINISHES, FLOOR_PATTERNS,
    FLOOR_MATERIALS_OPTS, MAT_COLORS, CATEGORY_COLORS,
} from "./InvoiceBuilderShared.jsx";

const BASE = import.meta.env.VITE_BACKEND_URL || "";
const authH = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` });
const money = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const STEPS = ["Client/Job", "Type", "Rooms", "Details", "Materials", "Extras", "Pricing", "Review"];

export default function CreateInvoicePage() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const jobIdParam = params.get("job_id");

    const { createInvoice } = useInvoice();

    const [step, setStep] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [showCalculator, setShowCalculator] = useState(false);

    const [form, setForm] = useState({
        customer_id: "",
        job_id: jobIdParam || "",
        due_date: "",
        notes: "",

        estimate_type: "painting", // painting | flooring | both
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
        room_materials: {},

        materials: [],

        // extras
        furniture_rooms: 0, furniture_heavy: 0,
        moisture_barrier: false, floor_leveling: false,
        floor_leveling_mode: "sqft", floor_leveling_bags: 1,
        heavy_demo: false, travel_miles: 0, use_flat_travel: false,
    });

    // ── Pricing — populated after the PriceCalculatorModal is used ─────────
    const [quotedAmount, setQuotedAmount] = useState(null);
    const [priceLines, setPriceLines] = useState([]);
    const [priceNotes, setPriceNotes] = useState("");

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isPainting = form.estimate_type === "painting" || form.estimate_type === "both";
    const isFlooring = form.estimate_type === "flooring" || form.estimate_type === "both";

    // ── Load customers & jobs ────────────────────────────────────────────────
    useEffect(() => {
        fetch(`${BASE}/api/customers`, { headers: authH() }).then(r => r.json()).then(d => setCustomers(d.customers || d || [])).catch(() => { });
        fetch(`${BASE}/api/jobs`, { headers: authH() }).then(r => r.json()).then(d => setJobs(d.jobs || [])).catch(() => { });
    }, []);

    useEffect(() => {
        if (!jobIdParam) return;
        fetch(`${BASE}/api/jobs/${jobIdParam}`, { headers: authH() })
            .then(r => r.json())
            .then(job => { if (job.customer_id) setForm(f => ({ ...f, customer_id: job.customer_id, job_id: jobIdParam })); })
            .catch(() => { });
    }, [jobIdParam]);

    // ── Room helpers ─────────────────────────────────────────────────────────
    const updateRoom = (i, k, v) => setForm(f => { const r = [...f.rooms]; r[i] = { ...r[i], [k]: v }; return { ...f, rooms: r }; });
    const addRoom = () => setForm(f => ({ ...f, rooms: [...f.rooms, { name: `Room ${f.rooms.length + 1}`, length_ft: "", width_ft: "", height_ft: "" }] }));
    const removeRoom = i => setForm(f => ({ ...f, rooms: f.rooms.filter((_, idx) => idx !== i) }));
    const updateRoomMaterial = (roomName, field, value) =>
        setForm(f => ({ ...f, room_materials: { ...f.room_materials, [roomName]: { ...(f.room_materials[roomName] || {}), [field]: value } } }));

    const namedRooms = form.rooms.filter(r => r.name.trim());
    const totalSqft = form.rooms.reduce((acc, r) => {
        const s = parseFloat(r.length_ft || 0) * parseFloat(r.width_ft || 0);
        return acc + (isNaN(s) ? 0 : s);
    }, 0);
    const materialsCost = form.materials.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);

    // Build a fake "estimate" object so we can reuse PriceCalculatorModal as-is
    const pseudoEstimate = {
        id: "new",
        customer_name: customers.find(c => c.id === Number(form.customer_id))?.name || "Client",
        estimate_type: form.estimate_type,
        computed_sqft: totalSqft,
        rooms: namedRooms.map(r => ({
            ...r,
            floor_sqft: (parseFloat(r.length_ft) || 0) * (parseFloat(r.width_ft) || 0),
        })),
        paint_surface_condition: form.paint_surface_condition,
        paint_coats: form.paint_coats,
        include_ceiling: form.include_ceiling,
        include_trim: form.include_trim,
        include_doors: form.include_doors,
        door_count: form.door_count,
        window_count: form.window_count,
        client_provides_paint: form.client_provides_paint,
        repairs_needed: form.repairs_needed,
        flooring_material: form.flooring_material,
        flooring_pattern: form.flooring_pattern,
        include_removal: form.include_removal,
        include_baseboards: form.include_baseboards,
        transition_strips: form.transition_strips,
        include_stairs: form.include_stairs,
        stair_count: form.stair_count,
        materials_json: form.materials.length > 0 ? JSON.stringify(form.materials.map(({ id: _id, ...rest }) => rest)) : null,
        furniture_rooms: form.furniture_rooms,
        furniture_heavy: form.furniture_heavy,
        moisture_barrier: form.moisture_barrier,
        floor_leveling: form.floor_leveling,
        floor_leveling_mode: form.floor_leveling_mode,
        floor_leveling_bags: form.floor_leveling_bags,
        heavy_demo: form.heavy_demo,
        travel_miles: form.travel_miles,
        use_flat_travel: form.use_flat_travel,
        quoted_amount: quotedAmount,
        contractor_notes: priceNotes,
    };

    // PriceCalculatorModal calls onSave(amount, notes, lines, extras, pricingMeta)
    const handlePriceSave = async (amount, notes, lines) => {
        setQuotedAmount(amount);
        setPriceNotes(notes);
        setPriceLines(lines.filter(l => l.section !== "__tax_meta__"));
        setShowCalculator(false);
    };

    // ── Validation per step ──────────────────────────────────────────────────
    const validate = () => {
        const e = {};
        if (step === 0) {
            if (!form.customer_id) e.customer_id = "Select a client";
            if (!form.job_id) e.job_id = "Select a job";
            if (!form.due_date) e.due_date = "Due date is required";
        }
        if (step === 3) {
            if (isPainting && !form.paint_surface_condition) e.paint_surface_condition = "Please select surface condition";
            if (isFlooring) {
                const allSet = namedRooms.length > 0 && namedRooms.every(r => form.room_materials[r.name]?.material);
                if (!allSet) e.room_materials = "Please set flooring material for every room";
            }
        }
        if (step === 6) {
            if (quotedAmount == null) e.pricing = "Open the price calculator and confirm a price before continuing";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (step === 2) setForm(f => ({ ...f, rooms: f.rooms.filter(r => r.name.trim()) }));
        if (!validate()) return;
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    };
    const back = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const roomMatLines = Object.entries(form.room_materials)
                .filter(([, v]) => v.material)
                .map(([name, v]) => `${name}: ${v.material.replace(/_/g, " ")}`)
                .join(", ");

            const notesParts = [];
            if (roomMatLines) notesParts.push("Materials: " + roomMatLines);
            if (form.notes) notesParts.push(form.notes);

            const subtotal = quotedAmount; // PriceCalculatorModal already returns full price (pre-tax subtotal logic handled there)
            const payload = {
                customer_id: form.customer_id,
                job_id: form.job_id,
                due_date: form.due_date,
                notes: notesParts.join("\n"),
                estimate_type: form.estimate_type,
                subtotal: subtotal,
                apply_tax: false, // tax already included in calculator total if contractor set tax_rate there
                total_amount: subtotal,
                materials_json: form.materials.length > 0 ? JSON.stringify(form.materials.map(({ id: _id, ...rest }) => rest)) : null,
                price_breakdown_json: priceLines.length > 0 ? JSON.stringify(priceLines) : null,
                rooms_json: namedRooms.length > 0 ? JSON.stringify(namedRooms.map(r => ({
                    name: r.name,
                    length_ft: parseFloat(r.length_ft) || null,
                    width_ft: parseFloat(r.width_ft) || null,
                    height_ft: parseFloat(r.height_ft) || null,
                    floor_sqft: (parseFloat(r.length_ft) || 0) * (parseFloat(r.width_ft) || 0),
                }))) : null,
                extras_json: JSON.stringify({
                    furniture_rooms: form.furniture_rooms,
                    furniture_heavy: form.furniture_heavy,
                    moisture_barrier: form.moisture_barrier,
                    floor_leveling: form.floor_leveling,
                    floor_leveling_mode: form.floor_leveling_mode,
                    floor_leveling_bags: form.floor_leveling_bags,
                    heavy_demo: form.heavy_demo,
                    travel_miles: form.travel_miles,
                    use_flat_travel: form.use_flat_travel,
                }),
                items: [], // detailed mode uses price_breakdown_json instead of items
            };

            const invoice = await createInvoice(payload);
            navigate(`/providerdashboard/invoices/${invoice.id}`);
        } catch (err) {
            alert(err.message || "Failed to create invoice");
        } finally {
            setSaving(false);
        }
    };

    const RevRow = ({ label, value }) => value ? (
        <div className="d-flex justify-content-between border-bottom py-2">
            <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
            <span className="fw-medium text-end ms-3" style={{ fontSize: 13 }}>{value}</span>
        </div>
    ) : null;

    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3" onClick={() => step === 0 ? navigate("/providerdashboard/invoices") : back()}>← Back</button>
                <div>
                    <h5 className="fw-bold mb-0">🧾 New invoice</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>Build a detailed invoice your client will understand</p>
                </div>
            </div>

            {/* Step progress */}
            <div className="d-md-none mb-3">
                <div className="d-flex gap-1 mb-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className="flex-fill rounded" style={{ height: 5, background: i <= step ? "#212529" : "#dee2e6" }} />
                    ))}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>Step {step + 1} of {STEPS.length} — <strong className="text-dark">{STEPS[step]}</strong></p>
            </div>
            <div className="d-none d-md-block mb-4">
                <div className="d-flex justify-content-between">
                    {STEPS.map((s, i) => (
                        <span key={i} className={i === step ? "fw-semibold text-dark" : "text-muted"} style={{ fontSize: 12 }}>{s}</span>
                    ))}
                </div>
                <div className="progress mt-1" style={{ height: 4 }}>
                    <div className="progress-bar bg-dark" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                </div>
            </div>

            {/* ── STEP 0 — Client & Job ── */}
            {step === 0 && (
                <div>
                    <h6 className="fw-semibold mb-3">Client &amp; job</h6>
                    <div className="row g-3">
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Client *</label>
                            <select className={`form-select ${errors.customer_id ? "is-invalid" : ""}`} value={form.customer_id} onChange={e => set("customer_id", e.target.value)}>
                                <option value="">Select client…</option>
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.customer_id && <div className="invalid-feedback">{errors.customer_id}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Job *</label>
                            <select className={`form-select ${errors.job_id ? "is-invalid" : ""}`} value={form.job_id} onChange={e => set("job_id", e.target.value)}>
                                <option value="">Select job…</option>
                                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                            </select>
                            {errors.job_id && <div className="invalid-feedback">{errors.job_id}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Due date *</label>
                            <input type="date" className={`form-control ${errors.due_date ? "is-invalid" : ""}`} value={form.due_date} onChange={e => set("due_date", e.target.value)} />
                            {errors.due_date && <div className="invalid-feedback">{errors.due_date}</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 1 — Type ── */}
            {step === 1 && (
                <div>
                    <h6 className="fw-semibold mb-3">What type of work? <span className="text-danger">*</span></h6>
                    <div className="row g-3">
                        {[
                            { value: "painting", label: "Painting", emoji: "🎨", sub: "Interior / exterior walls, ceilings, trim" },
                            { value: "flooring", label: "Flooring", emoji: "🪵", sub: "Hardwood, vinyl, tile, carpet installation" },
                            { value: "both", label: "Painting + Flooring", emoji: "🎨🪵", sub: "Combo project" },
                        ].map(o => (
                            <div key={o.value} className="col-12 col-md-4">
                                <button type="button" onClick={() => set("estimate_type", o.value)}
                                    className={`w-100 btn text-start p-3 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`} style={{ minHeight: 110 }}>
                                    <span className="d-block fs-2 mb-1">{o.emoji}</span>
                                    <span className="d-block fw-semibold">{o.label}</span>
                                    <span className="d-block text-muted" style={{ fontSize: 12 }}>{o.sub}</span>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── STEP 2 — Rooms ── */}
            {step === 2 && (
                <div>
                    <div className="d-flex align-items-center justify-content-between mb-1">
                        <div>
                            <h6 className="fw-semibold mb-0">Rooms / areas</h6>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>Sq ft calculates automatically</p>
                        </div>
                        {totalSqft > 0 && <span className="badge bg-success fs-6 px-3 py-2">{totalSqft.toFixed(0)} sq ft</span>}
                    </div>
                    <hr className="mt-2 mb-3" />
                    {form.rooms.map((r, i) => <RoomRow key={i} room={r} index={i} onChange={updateRoom} onRemove={removeRoom} />)}
                    <button type="button" onClick={addRoom} className="btn btn-outline-secondary w-100 mt-1" style={{ borderStyle: "dashed" }}>+ Add room / area</button>
                </div>
            )}

            {/* ── STEP 3 — Details ── */}
            {step === 3 && (
                <div>
                    {isPainting && (
                        <>
                            <SectionTitle text="Surface condition *" />
                            <Chips options={PAINT_CONDITIONS} value={form.paint_surface_condition} onChange={v => set("paint_surface_condition", v)} cols={2} />
                            {errors.paint_surface_condition && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.paint_surface_condition}</p>}
                            <SectionTitle text="Paint type" />
                            <Chips options={PAINT_TYPES} value={form.paint_type} onChange={v => set("paint_type", v)} cols={3} />
                            <SectionTitle text="Finish" />
                            <Chips options={PAINT_FINISHES} value={form.paint_finish} onChange={v => set("paint_finish", v)} cols={3} />
                            <SectionTitle text="Number of coats" />
                            <div className="row g-2 row-cols-3 mb-3">
                                {[["1", "1 coat"], ["2", "2 coats ✓"], ["3", "3 coats"]].map(([v, l]) => (
                                    <div key={v} className="col">
                                        <button type="button" className={`btn w-100 ${form.paint_coats === v ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => set("paint_coats", v)}>{l}</button>
                                    </div>
                                ))}
                            </div>
                            <div className="card border bg-light mb-3">
                                <div className="card-body py-1 px-3">
                                    <Toggle id="ceiling" label="Ceiling" sub="Adds material + labor" value={form.include_ceiling} onChange={v => set("include_ceiling", v)} />
                                    <Toggle id="trim" label="Trim / baseboards" value={form.include_trim} onChange={v => set("include_trim", v)} />
                                    <Toggle id="doors" label="Doors" value={form.include_doors} onChange={v => set("include_doors", v)} />
                                    <Toggle id="cpaint" label="Client provides paint" sub="Reduces material cost" value={form.client_provides_paint} onChange={v => set("client_provides_paint", v)} />
                                    <Toggle id="repairs" label="Repairs / patching needed" sub="Cracks, holes, water damage" value={form.repairs_needed} onChange={v => set("repairs_needed", v)} />
                                    {form.repairs_needed && (
                                        <div className="py-2">
                                            <textarea className="form-control form-control-sm" rows={2} placeholder="Describe damage…" value={form.repairs_detail} onChange={e => set("repairs_detail", e.target.value)} />
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
                            <input className="form-control" placeholder="e.g. White SW7012" value={form.desired_colors} onChange={e => set("desired_colors", e.target.value)} />
                        </>
                    )}

                    {isFlooring && (
                        <>
                            {isPainting && <hr className="my-4" />}
                            <SectionTitle text="Flooring material per room *" />
                            {namedRooms.length === 0 ? (
                                <div className="alert alert-warning" style={{ fontSize: 13 }}>⚠ Go back to Rooms step and add rooms first</div>
                            ) : (
                                <RoomMaterialSelector rooms={namedRooms} roomMaterials={form.room_materials} onChange={updateRoomMaterial} errors={errors} />
                            )}
                            <SectionTitle text="Installation pattern" />
                            <Chips options={FLOOR_PATTERNS} value={form.flooring_pattern} onChange={v => set("flooring_pattern", v)} cols={2} />
                            <div className="card border bg-light mt-3 mb-3">
                                <div className="card-body py-1 px-3">
                                    <Toggle id="removal" label="Remove old floor" value={form.include_removal} onChange={v => set("include_removal", v)} />
                                    <Toggle id="baseb" label="Install baseboards" value={form.include_baseboards} onChange={v => set("include_baseboards", v)} />
                                    <Toggle id="stairs" label="Includes stairs" value={form.include_stairs} onChange={v => set("include_stairs", v)} />
                                </div>
                            </div>
                            <div className="card border bg-light mb-3">
                                <div className="card-body py-1 px-3">
                                    {form.include_stairs && <Counter label="Number of steps" value={form.stair_count} onChange={v => set("stair_count", v)} />}
                                    <Counter label="Transition strips" value={form.transition_strips} onChange={v => set("transition_strips", v)} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── STEP 4 — Materials ── */}
            {step === 4 && (
                <MaterialsSection materials={form.materials} onChange={mats => set("materials", mats)} estimateType={form.estimate_type} />
            )}

            {/* ── STEP 5 — Extras ── */}
            {step === 5 && (
                <div>
                    <h6 className="fw-semibold mb-1">Job extras</h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>These get included automatically in the price calculator next.</p>
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">🪑 Furniture moving</div>
                        <div className="card-body py-1 px-3">
                            <Counter label="Standard rooms" value={form.furniture_rooms} onChange={v => set("furniture_rooms", v)} />
                            <Counter label="Heavy items" value={form.furniture_heavy} onChange={v => set("furniture_heavy", v)} />
                        </div>
                    </div>
                    {isFlooring && (
                        <div className="card border bg-light mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">🔧 Prep work</div>
                            <div className="card-body py-1 px-3">
                                {form.include_removal && <Toggle id="heavydemo" label="Heavy demo" value={form.heavy_demo} onChange={v => set("heavy_demo", v)} />}
                                <Toggle id="moisture" label="Moisture barrier needed" value={form.moisture_barrier} onChange={v => set("moisture_barrier", v)} />
                                <Toggle id="leveling" label="Floor leveling needed" value={form.floor_leveling} onChange={v => set("floor_leveling", v)} />
                                {form.floor_leveling && (
                                    <div className="py-2 ps-2">
                                        <div className="d-flex gap-2 mb-2">
                                            {[{ value: "sqft", label: "Per sq ft" }, { value: "bag", label: "Per bag" }].map(o => (
                                                <button key={o.value} type="button" onClick={() => set("floor_leveling_mode", o.value)}
                                                    className={`btn btn-sm ${form.floor_leveling_mode === o.value ? "btn-dark" : "btn-outline-secondary"}`}>{o.label}</button>
                                            ))}
                                        </div>
                                        {form.floor_leveling_mode === "bag" && <Counter label="Estimated bags" value={form.floor_leveling_bags} onChange={v => set("floor_leveling_bags", v)} min={1} />}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">🚗 Travel</div>
                        <div className="card-body py-1 px-3">
                            <Counter label="One-way miles" value={form.travel_miles} onChange={v => set("travel_miles", v)} min={0} />
                            {form.travel_miles > 0 && <Toggle id="flattravel" label="Flat travel fee instead of per-mile" value={form.use_flat_travel} onChange={v => set("use_flat_travel", v)} />}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 6 — Pricing (reuses PriceCalculatorModal) ── */}
            {step === 6 && (
                <div>
                    <h6 className="fw-semibold mb-1">Set the price</h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>Open the calculator to generate a full itemized breakdown your client will see on the invoice.</p>

                    {quotedAmount != null ? (
                        <div className="rounded-3 p-4 text-center mb-3" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                            <p className="text-success mb-1 fw-medium small">Invoice total</p>
                            <p className="fw-bold text-success mb-2" style={{ fontSize: 36 }}>{money(quotedAmount)}</p>
                            <button className="btn btn-outline-success btn-sm" onClick={() => setShowCalculator(true)}>✏️ Edit price</button>
                        </div>
                    ) : (
                        <button className="btn btn-success w-100 py-3 fw-semibold" onClick={() => setShowCalculator(true)}>💰 Open price calculator</button>
                    )}
                    {errors.pricing && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.pricing}</p>}
                </div>
            )}

            {/* ── STEP 7 — Review ── */}
            {step === 7 && (
                <div>
                    <h6 className="fw-semibold mb-1">Review before creating</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>This is what your client will see on the invoice</p>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className="badge bg-dark fs-6 px-3 py-2">{form.estimate_type === "painting" ? "🎨 Painting" : form.estimate_type === "flooring" ? "🪵 Flooring" : "🎨🪵 Painting + Flooring"}</span>
                        {totalSqft > 0 && <span className="badge bg-success fs-6 px-3 py-2">📐 {totalSqft.toFixed(0)} sq ft</span>}
                        {materialsCost > 0 && <span className="badge bg-danger fs-6 px-3 py-2">🛒 ${materialsCost.toFixed(2)} materials</span>}
                    </div>

                    <div className="card border mb-3">
                        <div className="card-header bg-light py-2 fw-semibold small">👤 Client &amp; job</div>
                        <div className="card-body py-2 px-3">
                            <RevRow label="Client" value={customers.find(c => c.id === Number(form.customer_id))?.name} />
                            <RevRow label="Job" value={jobs.find(j => j.id === Number(form.job_id))?.title} />
                            <RevRow label="Due date" value={form.due_date} />
                        </div>
                    </div>

                    {namedRooms.length > 0 && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">📐 Rooms</div>
                            <div className="card-body py-2 px-3">
                                {namedRooms.map((r, i) => {
                                    const s = r.length_ft && r.width_ft ? (parseFloat(r.length_ft) * parseFloat(r.width_ft)).toFixed(0) : null;
                                    const mat = form.room_materials[r.name];
                                    return (
                                        <div key={i} className="d-flex justify-content-between border-bottom py-2">
                                            <span style={{ fontSize: 13 }}>{r.name}</span>
                                            <div className="text-end">
                                                {s && <span className="text-muted me-2" style={{ fontSize: 12 }}>{s} sq ft</span>}
                                                {mat?.material && (
                                                    <span className="badge rounded-pill" style={{ fontSize: 11, background: MAT_COLORS[mat.material] || "#374151", color: "#fff" }}>
                                                        {FLOOR_MATERIALS_OPTS.find(m => m.value === mat.material)?.label || mat.material}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {priceLines.length > 0 && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">🧮 Price breakdown</div>
                            <div className="card-body py-2 px-3">
                                {priceLines.map((l, i) => (
                                    <div key={i} className="d-flex justify-content-between border-bottom py-1" style={{ fontSize: 13 }}>
                                        <span className="text-muted">{l.label || l.description}</span>
                                        <span className="fw-medium">${Number(l.amount).toFixed(2)}</span>
                                    </div>
                                ))}
                                <div className="d-flex justify-content-between pt-2 fw-bold">
                                    <span>Total</span>
                                    <span className="text-success">{money(quotedAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label fw-medium small">Additional notes for client (optional)</label>
                        <textarea className="form-control" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Payment terms, instructions…" />
                    </div>
                </div>
            )}

            {/* ── STICKY NAV ── */}
            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                {step > 0 && <button type="button" onClick={back} className="btn btn-outline-secondary px-4">← Back</button>}
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn btn-dark flex-fill fw-semibold">Continue →</button>
                ) : (
                    <button type="button" onClick={handleSubmit} disabled={saving} className="btn btn-success flex-fill fw-semibold">
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : "✓ Create invoice"}
                    </button>
                )}
            </div>

            <PriceCalculatorModal
                show={showCalculator}
                estimate={pseudoEstimate}
                onClose={() => setShowCalculator(false)}
                onSave={handlePriceSave}
            />
        </div>
    );
}