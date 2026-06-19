// src/front/pages/invoices/EditInvoicePage.jsx
// Mirrors EditEstimatePage.jsx — loads an existing invoice's stored
// rooms_json / materials_json / price_breakdown_json / extras_json,
// lets the contractor adjust everything, then re-saves via updateInvoice().

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useInvoice } from "./InvoiceContext";
import PriceCalculatorModal from "../estimateRequest/PriceCalculatorModal.jsx";
import {
    Chips, Toggle, Counter, SectionTitle,
    RoomMaterialSelector, MaterialsSection,
    PAINT_CONDITIONS, PAINT_TYPES, PAINT_FINISHES, FLOOR_PATTERNS,
    FLOOR_MATERIALS_OPTS, MAT_COLORS,
} from "./InvoiceBuilderShared.jsx";

const money = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

const STEPS = ["Details", "Type", "Materials", "Extras", "Pricing", "Review"];

function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (e) { return fallback; }
}

export default function EditInvoicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchInvoice, updateInvoice } = useInvoice();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [showCalculator, setShowCalculator] = useState(false);
    const [invoiceMeta, setInvoiceMeta] = useState(null); // customer_name etc, read-only display

    const [rooms, setRooms] = useState([]); // snapshot rooms (read-only structure, sqft display)
    const [form, setForm] = useState({
        due_date: "",
        notes: "",
        estimate_type: "painting",
        paint_surface_condition: "", paint_coats: "2",
        paint_type: "interior_standard", paint_finish: "eggshell",
        include_ceiling: false, include_trim: false, include_doors: false,
        door_count: 0, window_count: 0, client_provides_paint: false,
        desired_colors: "", repairs_needed: false, repairs_detail: "",
        flooring_material: "", flooring_pattern: "straight",
        include_removal: false, include_baseboards: false, transition_strips: 0,
        include_stairs: false, stair_count: 0,
        room_materials: {},
        materials: [],
        furniture_rooms: 0, furniture_heavy: 0,
        moisture_barrier: false, floor_leveling: false,
        floor_leveling_mode: "sqft", floor_leveling_bags: 1,
        heavy_demo: false, travel_miles: 0, use_flat_travel: false,
    });

    const [quotedAmount, setQuotedAmount] = useState(null);
    const [priceLines, setPriceLines] = useState([]);
    const [priceNotes, setPriceNotes] = useState("");

    useEffect(() => {
        fetchInvoice(id)
            .then(data => {
                const inv = data.invoice ?? data;
                setInvoiceMeta(inv);

                const loadedRooms = safeParse(inv.rooms_json, []);
                setRooms(loadedRooms);

                const extras = safeParse(inv.extras_json, {});
                const mats = safeParse(inv.materials_json, []);
                const breakdown = safeParse(inv.price_breakdown_json, []);

                // Rebuild room_materials map from description prefix if present
                let roomMats = {};
                if (inv.notes?.includes("Materials:")) {
                    const matLine = inv.notes.split("\n").find(l => l.startsWith("Materials:"));
                    if (matLine) {
                        matLine.replace("Materials: ", "").split(", ").forEach(pair => {
                            const idx = pair.indexOf(": ");
                            if (idx !== -1) {
                                const name = pair.slice(0, idx).trim();
                                const mat = pair.slice(idx + 2).trim().replace(/ /g, "_");
                                if (name && mat) roomMats[name] = { material: mat };
                            }
                        });
                    }
                }

                setForm(f => ({
                    ...f,
                    due_date: inv.due_date ? inv.due_date.split("T")[0] : "",
                    notes: (inv.notes || "").split("\n").filter(l => !l.startsWith("Materials:")).join("\n"),
                    estimate_type: inv.estimate_type || "painting",
                    room_materials: roomMats,
                    materials: mats,
                    furniture_rooms: extras.furniture_rooms || 0,
                    furniture_heavy: extras.furniture_heavy || 0,
                    moisture_barrier: extras.moisture_barrier || false,
                    floor_leveling: extras.floor_leveling || false,
                    floor_leveling_mode: extras.floor_leveling_mode || "sqft",
                    floor_leveling_bags: extras.floor_leveling_bags || 1,
                    heavy_demo: extras.heavy_demo || false,
                    travel_miles: extras.travel_miles || 0,
                    use_flat_travel: extras.use_flat_travel || false,
                }));

                setQuotedAmount(Number(inv.total_amount) || null);
                setPriceLines(breakdown.filter(l => l.section !== "__tax_meta__"));
                setPriceNotes(inv.notes || "");
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isPainting = form.estimate_type === "painting" || form.estimate_type === "both";
    const isFlooring = form.estimate_type === "flooring" || form.estimate_type === "both";
    const updateRoomMaterial = (roomName, field, value) =>
        setForm(f => ({ ...f, room_materials: { ...f.room_materials, [roomName]: { ...(f.room_materials[roomName] || {}), [field]: value } } }));

    const namedRooms = rooms.filter(r => r.name?.trim());
    const materialsCost = (form.materials || []).reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);

    const pseudoEstimate = {
        id: "edit",
        customer_name: invoiceMeta?.customer_name || "Client",
        estimate_type: form.estimate_type,
        computed_sqft: namedRooms.reduce((s, r) => s + (Number(r.floor_sqft) || 0), 0),
        rooms: namedRooms,
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

    const handlePriceSave = async (amount, notes, lines) => {
        setQuotedAmount(amount);
        setPriceNotes(notes);
        setPriceLines(lines.filter(l => l.section !== "__tax_meta__"));
        setShowCalculator(false);
    };

    const validate = () => {
        const e = {};
        if (step === 1 && isPainting && !form.paint_surface_condition) e.paint_surface_condition = "Please select surface condition";
        if (step === 4 && quotedAmount == null) e.pricing = "Confirm a price before continuing";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (!validate()) return; setStep(s => s + 1); window.scrollTo(0, 0); };
    const back = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const roomMatLines = Object.entries(form.room_materials)
                .filter(([, v]) => v.material)
                .map(([name, v]) => `${name}: ${v.material.replace(/_/g, " ")}`)
                .join(", ");

            const baseDesc = form.notes.split("\n").filter(l => !l.startsWith("Materials:")).join("\n").trim();
            const newNotes = roomMatLines ? `Materials: ${roomMatLines}${baseDesc ? "\n" + baseDesc : ""}` : baseDesc;

            await updateInvoice(id, {
                due_date: form.due_date,
                notes: newNotes,
                estimate_type: form.estimate_type,
                subtotal: quotedAmount,
                total_amount: quotedAmount,
                materials_json: form.materials.length > 0 ? JSON.stringify(form.materials.map(({ id: _id, ...rest }) => rest)) : null,
                price_breakdown_json: priceLines.length > 0 ? JSON.stringify(priceLines) : null,
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
            });
            navigate(`/providerdashboard/invoices/${id}`);
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

    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3" onClick={() => step === 0 ? navigate(`/providerdashboard/invoices/${id}`) : back()}>← Back</button>
                <div>
                    <h5 className="fw-bold mb-0">Edit invoice #{invoiceMeta?.invoice_number || id}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>{invoiceMeta?.customer_name}</p>
                </div>
            </div>

            <div className="d-md-none mb-3">
                <div className="d-flex gap-1 mb-2">
                    {STEPS.map((_, i) => <div key={i} className="flex-fill rounded" style={{ height: 5, background: i <= step ? "#212529" : "#dee2e6" }} />)}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>Step {step + 1} of {STEPS.length} — <strong className="text-dark">{STEPS[step]}</strong></p>
            </div>

            {/* ── STEP 0 — Details ── */}
            {step === 0 && (
                <div>
                    <h6 className="fw-semibold mb-3">Invoice details</h6>
                    <div className="row g-3 mb-3">
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Due date</label>
                            <input type="date" className="form-control" value={form.due_date} onChange={e => set("due_date", e.target.value)} />
                        </div>
                    </div>

                    {namedRooms.length > 0 && (
                        <>
                            <SectionTitle text="Rooms (read-only snapshot)" />
                            {namedRooms.map((r, i) => (
                                <div key={i} className="d-flex justify-content-between border-bottom py-2">
                                    <span style={{ fontSize: 13 }}>{r.name}</span>
                                    <span className="text-muted" style={{ fontSize: 12 }}>{Number(r.floor_sqft || 0).toFixed(0)} sq ft</span>
                                </div>
                            ))}
                            <p className="text-muted mt-2" style={{ fontSize: 11 }}>To change room sizes, edit the original estimate and re-convert, or contact support for direct room editing.</p>
                        </>
                    )}

                    <SectionTitle text="Notes for client" />
                    <textarea className="form-control" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Payment terms, instructions…" />
                </div>
            )}

            {/* ── STEP 1 — Type / specs ── */}
            {step === 1 && (
                <div>
                    <SectionTitle text="Type of work" />
                    <div className="row g-3 mb-3">
                        {[
                            { value: "painting", label: "Painting", emoji: "🎨" },
                            { value: "flooring", label: "Flooring", emoji: "🪵" },
                            { value: "both", label: "Both", emoji: "🎨🪵" },
                        ].map(o => (
                            <div key={o.value} className="col-4">
                                <button type="button" onClick={() => set("estimate_type", o.value)}
                                    className={`w-100 btn text-center p-2 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`}>
                                    <span className="d-block fs-4">{o.emoji}</span>
                                    <span className="d-block small">{o.label}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {isPainting && (
                        <>
                            <SectionTitle text="Surface condition *" />
                            <Chips options={PAINT_CONDITIONS} value={form.paint_surface_condition} onChange={v => set("paint_surface_condition", v)} cols={2} />
                            {errors.paint_surface_condition && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.paint_surface_condition}</p>}
                            <SectionTitle text="Paint type" />
                            <Chips options={PAINT_TYPES} value={form.paint_type} onChange={v => set("paint_type", v)} cols={3} />
                            <SectionTitle text="Finish" />
                            <Chips options={PAINT_FINISHES} value={form.paint_finish} onChange={v => set("paint_finish", v)} cols={3} />
                            <div className="card border bg-light mt-3 mb-3">
                                <div className="card-body py-1 px-3">
                                    <Toggle id="e_ceiling" label="Ceiling" value={form.include_ceiling} onChange={v => set("include_ceiling", v)} />
                                    <Toggle id="e_trim" label="Trim / baseboards" value={form.include_trim} onChange={v => set("include_trim", v)} />
                                    <Toggle id="e_doors" label="Doors" value={form.include_doors} onChange={v => set("include_doors", v)} />
                                    <Toggle id="e_cpaint" label="Client provides paint" value={form.client_provides_paint} onChange={v => set("client_provides_paint", v)} />
                                    <Toggle id="e_repairs" label="Repairs needed" value={form.repairs_needed} onChange={v => set("repairs_needed", v)} />
                                </div>
                            </div>
                            <div className="card border bg-light mb-3">
                                <div className="card-body py-1 px-3">
                                    <Counter label="Doors" value={form.door_count} onChange={v => set("door_count", v)} />
                                    <Counter label="Windows" value={form.window_count} onChange={v => set("window_count", v)} />
                                </div>
                            </div>
                        </>
                    )}

                    {isFlooring && namedRooms.length > 0 && (
                        <>
                            <SectionTitle text="Flooring material per room" />
                            <RoomMaterialSelector rooms={namedRooms} roomMaterials={form.room_materials} onChange={updateRoomMaterial} errors={errors} />
                            <SectionTitle text="Pattern" />
                            <Chips options={FLOOR_PATTERNS} value={form.flooring_pattern} onChange={v => set("flooring_pattern", v)} cols={2} />
                        </>
                    )}
                </div>
            )}

            {/* ── STEP 2 — Materials ── */}
            {step === 2 && (
                <MaterialsSection materials={form.materials} onChange={mats => set("materials", mats)} estimateType={form.estimate_type} />
            )}

            {/* ── STEP 3 — Extras ── */}
            {step === 3 && (
                <div>
                    <h6 className="fw-semibold mb-3">Job extras</h6>
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
                                <Toggle id="ed_heavydemo" label="Heavy demo" value={form.heavy_demo} onChange={v => set("heavy_demo", v)} />
                                <Toggle id="ed_moisture" label="Moisture barrier" value={form.moisture_barrier} onChange={v => set("moisture_barrier", v)} />
                                <Toggle id="ed_leveling" label="Floor leveling" value={form.floor_leveling} onChange={v => set("floor_leveling", v)} />
                                {form.floor_leveling && form.floor_leveling_mode === "bag" && (
                                    <Counter label="Estimated bags" value={form.floor_leveling_bags} onChange={v => set("floor_leveling_bags", v)} min={1} />
                                )}
                            </div>
                        </div>
                    )}
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">🚗 Travel</div>
                        <div className="card-body py-1 px-3">
                            <Counter label="One-way miles" value={form.travel_miles} onChange={v => set("travel_miles", v)} min={0} />
                            {form.travel_miles > 0 && <Toggle id="ed_flat" label="Flat travel fee" value={form.use_flat_travel} onChange={v => set("use_flat_travel", v)} />}
                        </div>
                    </div>
                </div>
            )}

            {/* ── STEP 4 — Pricing ── */}
            {step === 4 && (
                <div>
                    <h6 className="fw-semibold mb-1">Update the price</h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>Re-open the calculator to recalculate based on your changes.</p>
                    <div className="rounded-3 p-4 text-center mb-3" style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                        <p className="text-success mb-1 fw-medium small">Current total</p>
                        <p className="fw-bold text-success mb-2" style={{ fontSize: 36 }}>{money(quotedAmount)}</p>
                        <button className="btn btn-outline-success btn-sm" onClick={() => setShowCalculator(true)}>✏️ Recalculate</button>
                    </div>
                    {errors.pricing && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.pricing}</p>}
                </div>
            )}

            {/* ── STEP 5 — Review ── */}
            {step === 5 && (
                <div>
                    <h6 className="fw-semibold mb-1">Review changes</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>Click Save to apply</p>

                    {materialsCost > 0 && (
                        <div className="alert alert-danger d-flex justify-content-between py-2 mb-3" style={{ fontSize: 13 }}>
                            <span>🛒 Materials cost</span><span className="fw-bold">${materialsCost.toFixed(2)}</span>
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
                                    <span>Total</span><span className="text-success">{money(quotedAmount)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                {step > 0 && <button type="button" onClick={back} className="btn btn-outline-secondary px-4">← Back</button>}
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn btn-dark flex-fill fw-semibold">Continue →</button>
                ) : (
                    <button type="button" onClick={handleSave} disabled={saving} className="btn btn-success flex-fill fw-semibold">
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "✓ Save changes"}
                    </button>
                )}
            </div>

            <PriceCalculatorModal show={showCalculator} estimate={pseudoEstimate} onClose={() => setShowCalculator(false)} onSave={handlePriceSave} />
        </div>
    );
}