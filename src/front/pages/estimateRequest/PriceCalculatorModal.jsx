// src/pages/Estimates/PriceCalculatorModal.jsx — VERSION 4
// FIXES:
//   1. Modal backdrop closes properly — style tag moved outside modal wrapper
//   2. Tabs work correctly — modal-dialog-scrollable added so content scrolls inside
//   3. All rates visible in My rates tab for painting jobs
//   4. Calculator pre-fills from stored estimate extras
//   5. Furniture moving shown for all job types

import { useEffect, useState, useCallback } from "react";

const DEFAULTS = {
    tax_rate: 0,  // overridden by contractor's profile tax_rate from /api/contractor/rates
    paint_base_per_sqft: 2.50, paint_extra_coat_sqft: 0.50,
    paint_ceiling_sqft: 0.75, paint_trim_sqft: 0.60,
    paint_door_each: 45.00, paint_window_each: 25.00,
    paint_repair_surcharge: 25.00, paint_color_change_pct: 20.00,
    paint_dark_to_light_pct: 35.00,
    floor_hardwood_sqft: 8.00, floor_engineered_sqft: 6.50,
    floor_laminate_sqft: 4.50, floor_vinyl_sqft: 4.00,
    floor_tile_ceramic_sqft: 7.00, floor_tile_porcelain_sqft: 9.00,
    floor_carpet_sqft: 3.50, floor_concrete_sqft: 5.00,
    floor_removal_sqft: 1.50, floor_baseboard_lft: 3.00,
    floor_stair_each: 35.00, floor_transition_each: 20.00,
    floor_diagonal_pct: 15.00, floor_herringbone_pct: 25.00,
    minimum_job_fee: 250.00, travel_fee_per_mile: 1.50,
    travel_fee_flat: 75.00, furniture_moving_room: 75.00,
    furniture_moving_heavy: 150.00, moisture_barrier_sqft: 0.65,
    floor_leveling_sqft: 2.00, floor_leveling_bag: 65.00,
    heavy_demo_sqft: 3.50, backsplash_tile_sqft: 15.00,
    shower_tile_sqft: 25.00, shower_pan_each: 900.00,
};

function getFloorRate(material, rates) {
    const map = {
        hardwood: rates.floor_hardwood_sqft, engineered_wood: rates.floor_engineered_sqft,
        laminate: rates.floor_laminate_sqft, vinyl_plank: rates.floor_vinyl_sqft,
        tile_ceramic: rates.floor_tile_ceramic_sqft, tile_porcelain: rates.floor_tile_porcelain_sqft,
        carpet: rates.floor_carpet_sqft, concrete: rates.floor_concrete_sqft,
    };
    return map[material] || rates.floor_hardwood_sqft;
}

function calculate(estimate, rates, extras, materialsJson = null) {
    const sqft = estimate.computed_sqft || 0;
    const coats = parseInt(estimate.paint_coats || "1");
    const lines = [];
    let total = 0;

    // ── MATERIALS the contractor buys — added FIRST so they appear at top of breakdown
    // and are included in the total. This is what makes "costs included automatically" true.
    if (materialsJson) {
        let mats = [];
        try { mats = typeof materialsJson === "string" ? JSON.parse(materialsJson) : (Array.isArray(materialsJson) ? materialsJson : []); } catch (e) { }
        mats.forEach(m => {
            const rowCost = (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0);
            if (rowCost > 0) {
                const label = m.name ? `${m.name} — ${m.quantity} ${m.unit} × $${parseFloat(m.unit_cost || 0).toFixed(2)}` : `Material — ${m.quantity} ${m.unit}`;
                lines.push({ section: "Materials", label, amount: rowCost });
                total += rowCost;
            }
        });
    }

    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    if (isPainting && sqft > 0) {
        const base = sqft * rates.paint_base_per_sqft;
        lines.push({ section: "Installation", label: `Base labor (${sqft} sq ft × $${rates.paint_base_per_sqft.toFixed(2)})`, amount: base });
        total += base;

        if (coats > 1) {
            const c = sqft * rates.paint_extra_coat_sqft * (coats - 1);
            lines.push({ section: "Installation", label: `Extra coats ×${coats - 1} (${sqft} sq ft × $${rates.paint_extra_coat_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_ceiling) {
            const c = sqft * rates.paint_ceiling_sqft;
            lines.push({ section: "Installation", label: `Ceiling (${sqft} sq ft × $${rates.paint_ceiling_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_trim) {
            const c = sqft * rates.paint_trim_sqft;
            lines.push({ section: "Installation", label: `Trim / baseboards (${sqft} sq ft × $${rates.paint_trim_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_doors && estimate.door_count > 0) {
            const c = estimate.door_count * rates.paint_door_each;
            lines.push({ section: "Installation", label: `${estimate.door_count} door${estimate.door_count > 1 ? "s" : ""} × $${rates.paint_door_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.window_count > 0) {
            const c = estimate.window_count * rates.paint_window_each;
            lines.push({ section: "Installation", label: `${estimate.window_count} window${estimate.window_count > 1 ? "s" : ""} × $${rates.paint_window_each.toFixed(2)}`, amount: c });
            total += c;
        }
        const cond = estimate.paint_surface_condition;
        if (cond === "color_change") {
            const s = total * (rates.paint_color_change_pct / 100);
            lines.push({ section: "Installation", label: `Color change surcharge (${rates.paint_color_change_pct}%)`, amount: s, warn: true });
            total += s;
        } else if (cond === "dark_to_light") {
            const s = total * (rates.paint_dark_to_light_pct / 100);
            lines.push({ section: "Installation", label: `Dark→light surcharge (${rates.paint_dark_to_light_pct}%)`, amount: s, warn: true });
            total += s;
        } else if (cond === "damaged" && estimate.repairs_needed) {
            const s = total * (rates.paint_repair_surcharge / 100);
            lines.push({ section: "Installation", label: `Repair surcharge (${rates.paint_repair_surcharge}%)`, amount: s, warn: true });
            total += s;
        }
        if (estimate.client_provides_paint) {
            const d = -(total * 0.10);
            lines.push({ section: "Installation", label: "Client provides paint (−10% material)", amount: d });
            total += d;
        }
    }

    if (isFlooring && sqft > 0) {
        const material = estimate.flooring_material;
        const floorRate = getFloorRate(material, rates);
        const matLabel = (material || "").replace(/_/g, " ");
        const floorBase = sqft * floorRate;
        lines.push({ section: "Installation", label: `${matLabel} install (${sqft} sq ft × $${floorRate.toFixed(2)})`, amount: floorBase });
        total += floorBase;

        const pattern = estimate.flooring_pattern;
        if (pattern === "herringbone" || pattern === "chevron") {
            const up = floorBase * (rates.floor_herringbone_pct / 100);
            lines.push({ section: "Installation", label: `${pattern.replace(/_/g, " ")} pattern upcharge (${rates.floor_herringbone_pct}%)`, amount: up, warn: true });
            total += up;
        } else if (pattern === "diagonal_45") {
            const up = floorBase * (rates.floor_diagonal_pct / 100);
            lines.push({ section: "Installation", label: `Diagonal pattern upcharge (${rates.floor_diagonal_pct}%)`, amount: up, warn: true });
            total += up;
        }
        if (estimate.include_stairs && estimate.stair_count > 0) {
            const c = estimate.stair_count * rates.floor_stair_each;
            lines.push({ section: "Installation", label: `${estimate.stair_count} stairs × $${rates.floor_stair_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.transition_strips > 0) {
            const c = estimate.transition_strips * rates.floor_transition_each;
            lines.push({ section: "Installation", label: `${estimate.transition_strips} transition strip${estimate.transition_strips > 1 ? "s" : ""} × $${rates.floor_transition_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.include_baseboards) {
            const perim = Math.round(Math.sqrt(sqft) * 4);
            const c = perim * rates.floor_baseboard_lft;
            lines.push({ section: "Installation", label: `Baseboards (~${perim} lf × $${rates.floor_baseboard_lft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_removal) {
            const rate = extras.heavyDemo ? rates.heavy_demo_sqft : rates.floor_removal_sqft;
            const c = sqft * rate;
            lines.push({ section: "Prep & extras", label: extras.heavyDemo ? `Heavy demo (${sqft} sq ft × $${rate.toFixed(2)})` : `Floor removal (${sqft} sq ft × $${rate.toFixed(2)})`, amount: c, warn: extras.heavyDemo });
            total += c;
        }
        if (extras.moistureBarrier) {
            const c = sqft * rates.moisture_barrier_sqft;
            lines.push({ section: "Prep & extras", label: `Moisture barrier (${sqft} sq ft × $${rates.moisture_barrier_sqft.toFixed(2)})`, amount: c, warn: true });
            total += c;
        }
        if (extras.floorLeveling) {
            if (extras.levelingMode === "bag") {
                const bags = extras.levelingBags || 1;
                const c = bags * rates.floor_leveling_bag;
                lines.push({ section: "Prep & extras", label: `Floor leveling (${bags} bag${bags > 1 ? "s" : ""} × $${rates.floor_leveling_bag.toFixed(2)})`, amount: c, warn: true });
                total += c;
            } else {
                const c = sqft * rates.floor_leveling_sqft;
                lines.push({ section: "Prep & extras", label: `Floor leveling (${sqft} sq ft × $${rates.floor_leveling_sqft.toFixed(2)})`, amount: c, warn: true });
                total += c;
            }
        }
    }

    // Furniture moving — ALL job types
    if (extras.furnitureRooms > 0) {
        const c = extras.furnitureRooms * rates.furniture_moving_room;
        lines.push({ section: "Protection fees", label: `Furniture moving — ${extras.furnitureRooms} room${extras.furnitureRooms > 1 ? "s" : ""} × $${rates.furniture_moving_room.toFixed(2)}`, amount: c });
        total += c;
    }
    if (extras.furnitureHeavy > 0) {
        const c = extras.furnitureHeavy * rates.furniture_moving_heavy;
        lines.push({ section: "Protection fees", label: `Heavy items ×${extras.furnitureHeavy} × $${rates.furniture_moving_heavy.toFixed(2)}`, amount: c, warn: true });
        total += c;
    }
    if (extras.travelMiles > 0) {
        if (extras.useFlatTravel) {
            lines.push({ section: "Protection fees", label: `Travel flat fee`, amount: rates.travel_fee_flat });
            total += rates.travel_fee_flat;
        } else {
            const c = extras.travelMiles * rates.travel_fee_per_mile;
            lines.push({ section: "Protection fees", label: `Travel (${extras.travelMiles} miles × $${rates.travel_fee_per_mile.toFixed(2)})`, amount: c });
            total += c;
        }
    }
    if (total > 0 && total < rates.minimum_job_fee && rates.minimum_job_fee > 0) {
        const diff = rates.minimum_job_fee - total;
        lines.push({ section: "Protection fees", label: `Minimum job fee (job $${Math.round(total)} is below your $${Math.round(rates.minimum_job_fee)} minimum)`, amount: diff });
        total = rates.minimum_job_fee;
    }

    return { lines, total: Math.round(total * 100) / 100 };
}

function SliderRow({ label, field, rates, onChange, min, max, step, prefix = "$", suffix = "" }) {
    const val = rates[field] ?? DEFAULTS[field];
    const dec = step < 1 ? 2 : 0;
    const display = prefix + (dec > 0 ? Number(val).toFixed(dec) : Math.round(val)) + suffix;
    return (
        <div className="d-flex align-items-center gap-3 py-2 border-bottom">
            <span className="text-muted flex-shrink-0" style={{ fontSize: 13, minWidth: 180 }}>{label}</span>
            <input type="range" className="flex-fill" min={min} max={max} step={step} value={val}
                onChange={e => onChange(field, parseFloat(e.target.value))}
                style={{ accentColor: "#212529" }} />
            <span className="fw-medium flex-shrink-0 font-monospace" style={{ fontSize: 13, minWidth: 52, textAlign: "right" }}>
                {display}
            </span>
        </div>
    );
}

function CounterRow({ label, sub, value, onChange, min = 0, max = 200 }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </div>
            <div className="d-flex align-items-center gap-3">
                <button type="button" className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20 }}
                    onClick={() => onChange(Math.max(min, value - 1))}>−</button>
                <span className="fw-semibold" style={{ minWidth: 28, textAlign: "center", fontSize: 16 }}>{value}</span>
                <button type="button" className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20 }}
                    onClick={() => onChange(Math.min(max, value + 1))}>+</button>
            </div>
        </div>
    );
}

function ToggleRow({ label, sub, value, onChange }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <label style={{ cursor: "pointer", marginBottom: 0 }}>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </label>
            <div className="form-check form-switch ms-3 mb-0">
                <input className="form-check-input" type="checkbox" role="switch"
                    checked={value} onChange={e => onChange(e.target.checked)}
                    style={{ width: "2.4em", height: "1.3em", cursor: "pointer" }} />
            </div>
        </div>
    );
}

function RateCard({ title, children }) {
    return (
        <div className="mb-3">
            <p className="fw-semibold mb-1" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>{title}</p>
            <div className="card border bg-light">
                <div className="card-body py-1 px-3">{children}</div>
            </div>
        </div>
    );
}

function BkSection({ label, lines }) {
    if (!lines.length) return null;
    return (
        <>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", margin: "8px 0 2px" }}>{label}</p>
            {lines.map((l, i) => (
                <div key={i} className="d-flex justify-content-between py-1" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                    <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                    <span className={`fw-medium ${l.amount < 0 ? "text-danger" : "text-dark"}`}>
                        {l.amount < 0 ? "-" : ""}${Math.abs(Number(l.amount)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            ))}
        </>
    );
}

export default function PriceCalculatorModal({ show, estimate, onClose, onSave }) {
    const [rates, setRates] = useState({ ...DEFAULTS });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingRates, setSavingRates] = useState(false);
    const [savedRates, setSavedRates] = useState(false);
    const [activeTab, setActiveTab] = useState("calculator");
    const [notes, setNotes] = useState("");
    const [result, setResult] = useState({ lines: [], total: 0 });
    const [manualTotal, setManualTotal] = useState(null);
    const [extras, setExtras] = useState({
        moistureBarrier: false, floorLeveling: false,
        levelingMode: "sqft", levelingBags: 1, heavyDemo: false,
        furnitureRooms: 0, furnitureHeavy: 0,
        travelMiles: 0, useFlatTravel: false,
    });

    const setExtra = (key, val) => setExtras(prev => ({ ...prev, [key]: val }));
    const isPainting = ["painting", "both"].includes(estimate?.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate?.estimate_type);

    useEffect(() => {
        if (!show || !estimate) return;
        setActiveTab("calculator");
        setManualTotal(null);
        setNotes(estimate.contractor_notes || "");
        setExtras({
            moistureBarrier: estimate.moisture_barrier || false,
            floorLeveling: estimate.floor_leveling || false,
            levelingMode: estimate.floor_leveling_mode || "sqft",
            levelingBags: estimate.floor_leveling_bags || 1,
            heavyDemo: estimate.heavy_demo || false,
            furnitureRooms: estimate.furniture_rooms || 0,
            furnitureHeavy: estimate.furniture_heavy || 0,
            travelMiles: estimate.travel_miles || 0,
            useFlatTravel: estimate.use_flat_travel || false,
        });
        setLoading(true);
        const token = localStorage.getItem("token");
        const BASE = import.meta.env.VITE_BACKEND_URL || "";
        fetch(`${BASE}/api/contractor/rates`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.rates) setRates({ ...DEFAULTS, ...data.rates }); setLoading(false); })
            .catch(() => setLoading(false));
    }, [show, estimate]);

    useEffect(() => {
        if (!estimate) return;
        setResult(calculate(estimate, rates, extras, estimate?.materials_json));
    }, [rates, estimate, extras]);

    const updateRate = useCallback((field, value) => setRates(prev => ({ ...prev, [field]: value })), []);

    const handleSaveRates = async () => {
        setSavingRates(true);
        const token = localStorage.getItem("token");
        const BASE = import.meta.env.VITE_BACKEND_URL || "";
        try {
            await fetch(`${BASE}/api/contractor/rates`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(rates),
            });
            setSavedRates(true);
            setTimeout(() => setSavedRates(false), 2500);
        } catch (e) { alert("Failed to save: " + e.message); }
        finally { setSavingRates(false); }
    };

    // Tax comes from the contractor's saved tax_rate (loaded from /api/contractor/rates)
    const subtotalCalc = manualTotal !== null ? manualTotal : result.total;
    const taxRate = rates.tax_rate || 0;
    const taxAmount = Math.round(subtotalCalc * (taxRate / 100) * 100) / 100;
    const displayTotal = Math.round((subtotalCalc + taxAmount) * 100) / 100;

    // Line filters must be defined before the early return so they're always in scope
    const materialLines = result.lines.filter(l => l.section === "Materials");
    const installLines = result.lines.filter(l => l.section === "Installation");
    const prepLines = result.lines.filter(l => l.section === "Prep & extras");
    const protectionLines = result.lines.filter(l => l.section === "Protection fees");

    const handleApply = async () => {
        const finalAmount = displayTotal || subtotalCalc;
        if (!finalAmount) return;
        setSaving(true);
        try {
            // Build lines WITH tax metadata appended so it's stored in price_breakdown_json
            // This allows the detail page and PDF to read actual taxRate/taxAmount from storage
            const linesWithTax = [
                ...result.lines,
                // Sentinel row — not displayed as a line item, just stores tax metadata
                // section "__tax_meta__" is filtered out from display everywhere
                { section: "__tax_meta__", label: "__tax__", amount: taxAmount, taxRate, subtotal: subtotalCalc },
            ];
            await onSave(
                finalAmount,
                notes,
                linesWithTax,
                extras,
                { taxRate, taxAmount, subtotal: subtotalCalc }
            );
            onClose();
        }
        catch (e) { alert(e.message); }
        finally { setSaving(false); }
    };

    if (!show) return null;

    const money = v => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const moneyDec = v => `$${Number(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const perSqft = estimate?.computed_sqft > 0 ? displayTotal / estimate.computed_sqft : 0;
    const minRate = isFlooring
        ? ({ hardwood: 6, engineered_wood: 5, laminate: 3, vinyl_plank: 3, tile_ceramic: 5, tile_porcelain: 7, carpet: 2.5, concrete: 4 }[estimate?.flooring_material] || 3)
        : 2.00;
    const priceDanger = perSqft > 0 && perSqft < minRate;
    const priceWarning = perSqft > 0 && !priceDanger && perSqft < minRate * 1.4;

    // ── IMPORTANT: style tag is OUTSIDE the modal wrapper so it doesn't break event bubbling
    return (
        <>
            {/* ── CRITICAL: style tag here, not inside modal ── */}
            <style>{`
                .calc-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1040; }
                .calc-modal-wrap { position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center;padding:16px; }
                .calc-modal { background:#fff;border-radius:12px;width:100%;max-width:720px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden; }
                .calc-modal-body { overflow-y:auto;flex:1;padding:16px 20px; }
                .calc-modal-footer { padding:12px 20px;border-top:1px solid #dee2e6;display:flex;gap:8px; }
                @media(max-width:767px){
                    .calc-modal-wrap{align-items:flex-end;padding:0;}
                    .calc-modal{border-radius:20px 20px 0 0;max-height:92vh;}
                }
            `}</style>

            {/* Backdrop — clicking closes the modal */}
            <div className="calc-backdrop" onClick={onClose} />

            {/* Modal wrapper — stopPropagation prevents backdrop click from firing when clicking modal */}
            <div className="calc-modal-wrap" onClick={onClose}>
                <div className="calc-modal" onClick={e => e.stopPropagation()}>

                    {/* Drag handle mobile */}
                    <div className="d-flex justify-content-center pt-3 d-md-none">
                        <div style={{ width: 40, height: 4, background: "#dee2e6", borderRadius: 2 }} />
                    </div>

                    {/* Header */}
                    <div className="d-flex align-items-start justify-content-between px-4 pt-3 pb-2">
                        <div>
                            <h5 className="fw-bold mb-1">💰 Price calculator</h5>
                            <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                #{estimate?.id} · {estimate?.customer_name}
                                {estimate?.computed_sqft > 0 ? ` · ${Number(estimate.computed_sqft).toFixed(0)} sq ft` : " · no rooms yet"}
                            </p>
                        </div>
                        <button type="button" className="btn-close ms-3 flex-shrink-0" onClick={onClose} />
                    </div>

                    {/* Tabs — sticky at top of modal */}
                    <div className="px-4 border-bottom">
                        <ul className="nav nav-tabs border-0">
                            <li className="nav-item">
                                <button
                                    className={`nav-link px-3 py-2 ${activeTab === "calculator" ? "active fw-semibold text-dark" : "text-muted"}`}
                                    onClick={() => setActiveTab("calculator")}
                                >📊 Calculator</button>
                            </li>
                            <li className="nav-item">
                                <button
                                    className={`nav-link px-3 py-2 ${activeTab === "rates" ? "active fw-semibold text-dark" : "text-muted"}`}
                                    onClick={() => setActiveTab("rates")}
                                >⚙️ My rates</button>
                            </li>
                        </ul>
                    </div>

                    {/* Scrollable body */}
                    <div className="calc-modal-body">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-secondary" role="status" />
                                <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>Loading your rates…</p>
                            </div>

                        ) : activeTab === "calculator" ? (
                            /* ════════════ CALCULATOR TAB ════════════ */
                            <>
                                {/* Price hero */}
                                <div className="rounded-3 p-3 text-center mb-3"
                                    style={{ background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", border: "1.5px solid #86efac" }}>
                                    <p className="text-success mb-1 fw-medium small">Suggested quote</p>
                                    <p className="fw-bold text-success mb-0" style={{ fontSize: 40, lineHeight: 1 }}>
                                        {money(displayTotal)}
                                    </p>
                                    {estimate?.computed_sqft > 0 && (
                                        <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>
                                            ${perSqft.toFixed(2)} per sq ft
                                        </p>
                                    )}
                                </div>

                                {/* Materials cost note */}
                                {materialLines.length > 0 && (
                                    <div className="d-flex justify-content-between align-items-center px-3 py-2 mb-3 rounded-3"
                                        style={{ background: "#fff5f5", border: "1px solid #fecaca", fontSize: 13 }}>
                                        <span className="text-danger fw-medium">🛒 Materials cost included</span>
                                        <span className="fw-bold text-danger">${materialLines.reduce((s, l) => s + l.amount, 0).toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Sync notice */}
                                {estimate?.quoted_amount && Math.round(estimate.quoted_amount) !== Math.round(displayTotal) && (
                                    <div className="alert alert-info d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                        <span>ℹ️</span>
                                        <span>Stored quote is <strong>${Number(estimate.quoted_amount).toLocaleString()}</strong>. Adjust rates or click "Use this price" to update.</span>
                                    </div>
                                )}

                                {!(estimate?.computed_sqft > 0) && (
                                    <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                        <span>⚠️</span><span>No rooms added — add rooms for accurate calculation. You can still set a manual price below.</span>
                                    </div>
                                )}
                                {priceDanger && (
                                    <div className="alert alert-danger d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                        <span>🚨</span>
                                        <div><strong>Price too low — you will lose money</strong>
                                            <div style={{ fontSize: 12, marginTop: 2 }}>${perSqft.toFixed(2)}/sq ft is below minimum. Raise your base rate in My Rates tab.</div>
                                        </div>
                                    </div>
                                )}
                                {priceWarning && (
                                    <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                        <span>⚠️</span>
                                        <div><strong>Thin margin</strong>
                                            <div style={{ fontSize: 12, marginTop: 2 }}>${perSqft.toFixed(2)}/sq ft leaves little buffer for surprises.</div>
                                        </div>
                                    </div>
                                )}

                                {/* Furniture moving — ALL job types */}
                                <div className="card border bg-light mb-3">
                                    <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                        🪑 Furniture moving
                                        <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— workers tire before install starts</span>
                                    </div>
                                    <div className="card-body py-1 px-3">
                                        <CounterRow label="Standard rooms" sub={`Sofa, bed, dresser — $${rates.furniture_moving_room.toFixed(2)} each`} value={extras.furnitureRooms} onChange={v => setExtra("furnitureRooms", v)} />
                                        <CounterRow label="Heavy items" sub={`Fridge, piano, pool table — $${rates.furniture_moving_heavy.toFixed(2)} each`} value={extras.furnitureHeavy} onChange={v => setExtra("furnitureHeavy", v)} />
                                    </div>
                                </div>

                                {/* Flooring prep */}
                                {isFlooring && (
                                    <div className="card border bg-light mb-3">
                                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                            🔧 Prep work <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— where profit is won or lost</span>
                                        </div>
                                        <div className="card-body py-1 px-3">
                                            {estimate.include_removal && (
                                                <ToggleRow label="Heavy demo (tile / glued hardwood)" sub={`$${rates.heavy_demo_sqft.toFixed(2)}/sq ft instead of $${rates.floor_removal_sqft.toFixed(2)} light removal`} value={extras.heavyDemo} onChange={v => setExtra("heavyDemo", v)} />
                                            )}
                                            <ToggleRow label="Moisture barrier" sub={`Required for LVP, laminate, engineered — $${rates.moisture_barrier_sqft.toFixed(2)}/sq ft`} value={extras.moistureBarrier} onChange={v => setExtra("moistureBarrier", v)} />
                                            <ToggleRow label="Floor leveling needed" sub="Uneven subfloor — biggest hidden cost" value={extras.floorLeveling} onChange={v => setExtra("floorLeveling", v)} />
                                            {extras.floorLeveling && (
                                                <div className="py-2 ps-2">
                                                    <div className="d-flex gap-2 mb-2">
                                                        {[{ value: "sqft", label: `Per sq ft ($${rates.floor_leveling_sqft.toFixed(2)})` }, { value: "bag", label: `Per bag ($${rates.floor_leveling_bag.toFixed(2)})` }].map(o => (
                                                            <button key={o.value} type="button" onClick={() => setExtra("levelingMode", o.value)}
                                                                className={`btn btn-sm ${extras.levelingMode === o.value ? "btn-dark" : "btn-outline-secondary"}`}>{o.label}</button>
                                                        ))}
                                                    </div>
                                                    {extras.levelingMode === "bag" && (
                                                        <CounterRow label="Number of bags" value={extras.levelingBags} onChange={v => setExtra("levelingBags", v)} min={1} max={30} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Travel */}
                                <div className="card border bg-light mb-3">
                                    <div className="card-body py-1 px-3">
                                        <CounterRow label="Travel miles (one way)" sub={`$${rates.travel_fee_per_mile.toFixed(2)}/mile — leave at 0 if local`} value={extras.travelMiles} onChange={v => setExtra("travelMiles", v)} min={0} max={300} />
                                        {extras.travelMiles > 0 && (
                                            <ToggleRow label="Use flat travel fee instead" sub={`Flat $${rates.travel_fee_flat.toFixed(2)} per trip`} value={extras.useFlatTravel} onChange={v => setExtra("useFlatTravel", v)} />
                                        )}
                                    </div>
                                </div>

                                {/* ── PROFESSIONAL INVOICE TABLE ── */}
                                {result.lines.length > 0 && (
                                    <div className="rounded-3 overflow-hidden mb-3" style={{ border: "1px solid #dee2e6" }}>
                                        {/* Line items header */}
                                        <div className="d-flex px-3 py-2" style={{ background: "#1e2d4a", color: "#fff" }}>
                                            <span className="fw-semibold flex-fill" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em" }}>Item / Service</span>
                                            <span className="fw-semibold text-end" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", minWidth: 80 }}>Amount</span>
                                        </div>

                                        {/* Materials section */}
                                        {materialLines.length > 0 && (
                                            <>
                                                <div className="px-3 py-1" style={{ background: "#fff8f0", borderBottom: "1px solid #dee2e6" }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#c2410c" }}>🛒 Materials</span>
                                                </div>
                                                {materialLines.map((l, i) => (
                                                    <div key={i} className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                        <span className="text-muted">{l.label}</span>
                                                        <span className="fw-medium text-danger" style={{ minWidth: 80, textAlign: "right" }}>${Number(l.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Installation section */}
                                        {installLines.length > 0 && (
                                            <>
                                                <div className="px-3 py-1" style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#6c757d" }}>🔨 Installation</span>
                                                </div>
                                                {installLines.map((l, i) => (
                                                    <div key={i} className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                        <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                                                        <span className={`fw-medium ${l.amount < 0 ? "text-danger" : "text-dark"}`} style={{ minWidth: 80, textAlign: "right" }}>
                                                            {l.amount < 0 ? "-" : ""}${Math.abs(Number(l.amount)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Prep & extras */}
                                        {prepLines.length > 0 && (
                                            <>
                                                <div className="px-3 py-1" style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#6c757d" }}>🔧 Prep & extras</span>
                                                </div>
                                                {prepLines.map((l, i) => (
                                                    <div key={i} className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                        <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                                                        <span className="fw-medium text-dark" style={{ minWidth: 80, textAlign: "right" }}>${Number(l.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Protection fees */}
                                        {protectionLines.length > 0 && (
                                            <>
                                                <div className="px-3 py-1" style={{ background: "#f8f9fa", borderBottom: "1px solid #dee2e6" }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#6c757d" }}>🛡️ Protection fees</span>
                                                </div>
                                                {protectionLines.map((l, i) => (
                                                    <div key={i} className="d-flex justify-content-between px-3 py-2" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                        <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                                                        <span className="fw-medium text-dark" style={{ minWidth: 80, textAlign: "right" }}>${Number(l.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </>
                                        )}

                                        {/* Subtotal / Markup / Tax / Total */}
                                        <div style={{ borderTop: "2px solid #dee2e6", background: "#f8f9fa" }}>
                                            <div className="d-flex justify-content-between px-3 py-2 border-bottom" style={{ fontSize: 13 }}>
                                                <span className="text-muted">Subtotal</span>
                                                <span className="fw-medium">{moneyDec(subtotalCalc)}</span>
                                            </div>

                                            {/* Tax row — from contractor's saved tax_rate in Settings */}
                                            {taxRate > 0 && (
                                                <div className="d-flex justify-content-between px-3 py-2 border-bottom" style={{ fontSize: 13 }}>
                                                    <span className="text-muted">Tax ({taxRate}%)</span>
                                                    <span className="fw-medium text-dark">+{moneyDec(taxAmount)}</span>
                                                </div>
                                            )}

                                            {/* TOTAL row */}
                                            <div className="d-flex justify-content-between align-items-center px-3 py-3"
                                                style={{ background: "#1e2d4a" }}>
                                                <span className="fw-bold text-white" style={{ fontSize: 14 }}>TOTAL</span>
                                                <span className="fw-bold text-white" style={{ fontSize: 18 }}>{moneyDec(displayTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Override for no-room estimates */}
                                {result.lines.length === 0 && (
                                    <div className="mb-3">
                                        <label className="form-label fw-medium small">Manual amount</label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text">$</span>
                                            <input type="number" inputMode="decimal" className="form-control fw-bold text-success" style={{ fontSize: 22 }}
                                                value={manualTotal !== null ? manualTotal : ""}
                                                onChange={e => { const v = parseFloat(e.target.value); setManualTotal(isNaN(v) ? null : v); }}
                                                placeholder="0.00" />
                                        </div>
                                        <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>Enter amount manually — add rooms for automatic calculation.</p>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="form-label fw-medium small">Notes for client (shown on PDF)</label>
                                    <textarea className="form-control" rows={2}
                                        placeholder="e.g. Includes 2 coats premium paint, labor, cleanup…"
                                        value={notes} onChange={e => setNotes(e.target.value)} />
                                </div>
                            </>

                        ) : (
                            /* ════════════ MY RATES TAB ════════════ */
                            <>
                                <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                                    Drag sliders to set your rates. Saved to your account and used on every estimate.
                                </p>

                                {isPainting && (
                                    <RateCard title="🎨 Painting rates">
                                        <SliderRow label="Base labor / sq ft" field="paint_base_per_sqft" rates={rates} onChange={updateRate} min={0.5} max={8} step={0.25} />
                                        <SliderRow label="Extra coat / sq ft" field="paint_extra_coat_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                        <SliderRow label="Ceiling / sq ft" field="paint_ceiling_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                        <SliderRow label="Trim / sq ft" field="paint_trim_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                        <SliderRow label="Per door" field="paint_door_each" rates={rates} onChange={updateRate} min={10} max={150} step={5} />
                                        <SliderRow label="Per window" field="paint_window_each" rates={rates} onChange={updateRate} min={10} max={100} step={5} />
                                        <SliderRow label="Color change %" field="paint_color_change_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
                                        <SliderRow label="Dark → light %" field="paint_dark_to_light_pct" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
                                        <SliderRow label="Repair surcharge %" field="paint_repair_surcharge" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
                                    </RateCard>
                                )}

                                {isFlooring && (
                                    <>
                                        <RateCard title="🪵 Flooring — base install / sq ft">
                                            <SliderRow label="Hardwood" field="floor_hardwood_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                                            <SliderRow label="Engineered wood" field="floor_engineered_sqft" rates={rates} onChange={updateRate} min={2} max={15} step={0.5} />
                                            <SliderRow label="Laminate" field="floor_laminate_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                            <SliderRow label="Vinyl LVP" field="floor_vinyl_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                            <SliderRow label="Ceramic tile" field="floor_tile_ceramic_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                                            <SliderRow label="Porcelain tile" field="floor_tile_porcelain_sqft" rates={rates} onChange={updateRate} min={2} max={25} step={0.5} />
                                            <SliderRow label="Carpet" field="floor_carpet_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.5} />
                                        </RateCard>
                                        <RateCard title="🔧 Prep fees">
                                            <SliderRow label="Light removal / sq ft" field="floor_removal_sqft" rates={rates} onChange={updateRate} min={0} max={5} step={0.25} />
                                            <SliderRow label="Heavy demo / sq ft" field="heavy_demo_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.25} />
                                            <SliderRow label="Moisture barrier / sq ft" field="moisture_barrier_sqft" rates={rates} onChange={updateRate} min={0.25} max={2} step={0.25} />
                                            <SliderRow label="Floor leveling / sq ft" field="floor_leveling_sqft" rates={rates} onChange={updateRate} min={0.5} max={6} step={0.25} />
                                            <SliderRow label="Floor leveling / bag" field="floor_leveling_bag" rates={rates} onChange={updateRate} min={20} max={150} step={5} />
                                            <SliderRow label="Baseboard / lin ft" field="floor_baseboard_lft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                            <SliderRow label="Per stair" field="floor_stair_each" rates={rates} onChange={updateRate} min={10} max={120} step={5} />
                                            <SliderRow label="Per transition strip" field="floor_transition_each" rates={rates} onChange={updateRate} min={5} max={60} step={5} />
                                        </RateCard>
                                        <RateCard title="💎 Premium labor">
                                            <SliderRow label="Backsplash tile / sq ft" field="backsplash_tile_sqft" rates={rates} onChange={updateRate} min={8} max={40} step={1} />
                                            <SliderRow label="Shower tile / sq ft" field="shower_tile_sqft" rates={rates} onChange={updateRate} min={10} max={60} step={1} />
                                            <SliderRow label="Shower pan (each)" field="shower_pan_each" rates={rates} onChange={updateRate} min={300} max={2500} step={50} />
                                        </RateCard>
                                        <RateCard title="↗️ Pattern upcharges">
                                            <SliderRow label="Diagonal 45°" field="floor_diagonal_pct" rates={rates} onChange={updateRate} min={0} max={40} step={5} prefix="" suffix="%" />
                                            <SliderRow label="Herringbone / chevron" field="floor_herringbone_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
                                        </RateCard>
                                    </>
                                )}

                                {/* Always visible — all job types */}
                                <RateCard title="🪑 Furniture moving">
                                    <SliderRow label="Standard room" field="furniture_moving_room" rates={rates} onChange={updateRate} min={25} max={200} step={5} />
                                    <SliderRow label="Heavy item" field="furniture_moving_heavy" rates={rates} onChange={updateRate} min={50} max={400} step={10} />
                                </RateCard>

                                <RateCard title="🛡️ Protection fees">
                                    <SliderRow label="Minimum job fee" field="minimum_job_fee" rates={rates} onChange={updateRate} min={50} max={800} step={25} />
                                    <SliderRow label="Travel / mile" field="travel_fee_per_mile" rates={rates} onChange={updateRate} min={0.5} max={5} step={0.25} />
                                    <SliderRow label="Travel flat fee" field="travel_fee_flat" rates={rates} onChange={updateRate} min={0} max={300} step={10} />
                                </RateCard>

                                <RateCard title="🧾 Tax rate">
                                    <div className="d-flex align-items-center gap-3 py-2 border-bottom">
                                        <span className="text-muted flex-shrink-0" style={{ fontSize: 13, minWidth: 180 }}>Sales tax %</span>
                                        <input type="range" className="flex-fill" min={0} max={20} step={0.25}
                                            value={rates.tax_rate || 0}
                                            onChange={e => updateRate("tax_rate", parseFloat(e.target.value))}
                                            style={{ accentColor: "#212529" }} />
                                        <span className="fw-medium flex-shrink-0 font-monospace" style={{ fontSize: 13, minWidth: 52, textAlign: "right" }}>
                                            {Number(rates.tax_rate || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                    <p className="text-muted mb-0 mt-1 pb-2" style={{ fontSize: 11 }}>
                                        Applied to the full quote total. Set 0 if you don't charge tax.
                                    </p>
                                </RateCard>

                                <button className="btn btn-dark fw-semibold w-100 mb-2" onClick={handleSaveRates} disabled={savingRates}>
                                    {savingRates ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : savedRates ? "✓ Saved!" : "💾 Save my rates"}
                                </button>
                                <p className="text-muted text-center mb-0" style={{ fontSize: 12 }}>Saved rates apply to all future estimates</p>
                            </>
                        )}
                    </div>

                    {/* Footer — calculator tab only */}
                    {activeTab === "calculator" && (
                        <div className="calc-modal-footer">
                            <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Cancel</button>
                            <button type="button" className="btn btn-success fw-semibold flex-fill py-2"
                                onClick={handleApply} disabled={saving || !displayTotal}>
                                {saving
                                    ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                    : `✓ Use ${money(displayTotal)} as quote`}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}