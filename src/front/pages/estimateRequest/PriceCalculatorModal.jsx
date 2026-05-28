import { useEffect, useState, useCallback } from "react";

const DEFAULTS = {
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

function calculate(estimate, rates, extras) {
    const sqft = estimate.computed_sqft || 0;
    const coats = parseInt(estimate.paint_coats || "1");
    const lines = [];
    let total = 0;

    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    // ── PAINTING ──────────────────────────────────────────────────────────
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

    // ── FLOORING ──────────────────────────────────────────────────────────
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

        // Prep
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

    // ── FURNITURE MOVING — available for ALL job types ─────────────────────
    if (extras.furnitureRooms > 0) {
        const c = extras.furnitureRooms * rates.furniture_moving_room;
        lines.push({ section: "Protection fees", label: `Furniture moving — ${extras.furnitureRooms} room${extras.furnitureRooms > 1 ? "s" : ""} × $${rates.furniture_moving_room.toFixed(2)}`, amount: c });
        total += c;
    }
    if (extras.furnitureHeavy > 0) {
        const c = extras.furnitureHeavy * rates.furniture_moving_heavy;
        lines.push({ section: "Protection fees", label: `Heavy items (fridge/piano/pool table) ×${extras.furnitureHeavy} × $${rates.furniture_moving_heavy.toFixed(2)}`, amount: c, warn: true });
        total += c;
    }

    // ── TRAVEL ────────────────────────────────────────────────────────────
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

    // ── MINIMUM JOB FEE ───────────────────────────────────────────────────
    if (total < rates.minimum_job_fee && rates.minimum_job_fee > 0) {
        const diff = rates.minimum_job_fee - total;
        lines.push({ section: "Protection fees", label: `Minimum job fee (job $${Math.round(total)} is below your $${Math.round(rates.minimum_job_fee)} minimum)`, amount: diff });
        total = rates.minimum_job_fee;
    }

    return { lines, total: Math.round(total * 100) / 100 };
}

// ── Slider ──────────────────────────────────────────────────────────────────
function SliderRow({ label, field, rates, onChange, min, max, step, prefix = "$", suffix = "" }) {
    const val = rates[field] ?? DEFAULTS[field];
    const dec = step < 1 ? 2 : 0;
    const display = prefix + (dec > 0 ? Number(val).toFixed(dec) : Math.round(val)) + suffix;
    return (
        <div className="d-flex align-items-center gap-3 py-2 border-bottom">
            <span className="text-muted flex-shrink-0" style={{ fontSize: 13, minWidth: 190 }}>{label}</span>
            <input type="range" className="flex-fill" min={min} max={max} step={step} value={val}
                onChange={e => onChange(field, parseFloat(e.target.value))}
                style={{ accentColor: "#212529" }} />
            <span className="fw-medium flex-shrink-0 font-monospace" style={{ fontSize: 13, minWidth: 56, textAlign: "right" }}>
                {display}
            </span>
        </div>
    );
}

// ── Counter ─────────────────────────────────────────────────────────────────
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

// ── Toggle ───────────────────────────────────────────────────────────────────
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

// ── Section card for rates tab ───────────────────────────────────────────────
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

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
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
        levelingMode: "sqft", levelingBags: 1,
        heavyDemo: false, furnitureRooms: 0,
        furnitureHeavy: 0, travelMiles: 0, useFlatTravel: false,
    });

    const setExtra = (key, val) => setExtras(prev => ({ ...prev, [key]: val }));

    const isPainting = ["painting", "both"].includes(estimate?.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate?.estimate_type);

    // ── Fetch rates and pre-fill from stored estimate data ──────────────────
    useEffect(() => {
        if (!show || !estimate) return;
        setActiveTab("calculator");
        setManualTotal(null);

        // Pre-fill notes from stored contractor notes
        setNotes(estimate.contractor_notes || "");

        // Pre-fill extras from estimate fields if they exist
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
        fetch(`${BASE}/api/contractor/rates`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.rates) setRates({ ...DEFAULTS, ...data.rates });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [show, estimate]);

    // Recalculate when rates or extras change
    useEffect(() => {
        if (!estimate) return;
        const r = calculate(estimate, rates, extras);
        setResult(r);
    }, [rates, estimate, extras]);

    const updateRate = useCallback((field, value) => {
        setRates(prev => ({ ...prev, [field]: value }));
    }, []);

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
            setTimeout(() => setSavedRates(false), 2000);
        } catch (e) {
            alert("Failed to save rates: " + e.message);
        } finally {
            setSavingRates(false);
        }
    };

    const handleApply = async () => {
        const finalAmount = manualTotal !== null ? manualTotal : result.total;
        if (!finalAmount) return;
        setSaving(true);
        try {
            // Pass lines so EstimateDetailPage can store the breakdown JSON
            await onSave(finalAmount, notes, result.lines);
            onClose();
        } catch (e) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    if (!show) return null;

    const displayTotal = manualTotal !== null ? manualTotal : result.total;
    const money = v => `$${Number(Math.round(v)).toLocaleString("en-US")}`;
    const perSqft = estimate?.computed_sqft > 0 ? displayTotal / estimate.computed_sqft : 0;

    const installLines = result.lines.filter(l => l.section === "Installation");
    const prepLines = result.lines.filter(l => l.section === "Prep & extras");
    const protectionLines = result.lines.filter(l => l.section === "Protection fees");

    const minRate = isFlooring
        ? ({ hardwood: 6, engineered_wood: 5, laminate: 3, vinyl_plank: 3, tile_ceramic: 5, tile_porcelain: 7, carpet: 2.5, concrete: 4 }[estimate?.flooring_material] || 3)
        : 2.00;
    const priceDanger = perSqft > 0 && perSqft < minRate;
    const priceWarning = perSqft > 0 && !priceDanger && perSqft < minRate * 1.4;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <style>{`
                @media (max-width: 767px) {
                    .calc-dialog { margin:0!important;position:fixed!important;bottom:0!important;left:0!important;right:0!important;max-width:100%!important; }
                    .calc-dialog .modal-content { border-radius:20px 20px 0 0!important;border-bottom:none!important;max-height:90vh!important;overflow-y:auto!important; }
                }
            `}</style>

            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg calc-dialog">
                    <div className="modal-content">

                        {/* Drag handle mobile */}
                        <div className="d-flex justify-content-center pt-3 d-md-none">
                            <div style={{ width: 40, height: 4, background: "#dee2e6", borderRadius: 2 }} />
                        </div>

                        {/* Header */}
                        <div className="modal-header border-0 pb-0">
                            <div>
                                <h5 className="modal-title fw-bold mb-1">💰 Price calculator</h5>
                                <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                                    #{estimate?.id} · {estimate?.customer_name}
                                    {estimate?.computed_sqft > 0 ? ` · ${Number(estimate.computed_sqft).toFixed(0)} sq ft` : " · no rooms yet"}
                                </p>
                            </div>
                            <button type="button" className="btn-close" onClick={onClose} />
                        </div>

                        {/* Tabs */}
                        <div className="px-3 pt-2">
                            <ul className="nav nav-tabs border-bottom">
                                <li className="nav-item">
                                    <button className={`nav-link px-3 py-2 ${activeTab === "calculator" ? "active fw-semibold text-dark" : "text-muted"}`}
                                        onClick={() => setActiveTab("calculator")}>📊 Calculator</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link px-3 py-2 ${activeTab === "rates" ? "active fw-semibold text-dark" : "text-muted"}`}
                                        onClick={() => setActiveTab("rates")}>⚙️ My rates</button>
                                </li>
                            </ul>
                        </div>

                        <div className="modal-body pt-3">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-secondary" role="status" />
                                    <p className="text-muted mt-2 mb-0" style={{ fontSize: 13 }}>Loading your rates…</p>
                                </div>

                            ) : activeTab === "calculator" ? (
                                /* ═══════════════ CALCULATOR TAB ═══════════════ */
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

                                    {/* Stored quote sync notice */}
                                    {estimate?.quoted_amount && estimate.quoted_amount !== displayTotal && (
                                        <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>ℹ️</span>
                                            <span>Current stored quote is <strong>${Number(estimate.quoted_amount).toLocaleString()}</strong>. This calculator shows a fresh calculation — click "Use this price" to update it, or adjust rates to match.</span>
                                        </div>
                                    )}

                                    {/* Price warnings */}
                                    {!(estimate?.computed_sqft > 0) && (
                                        <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>⚠️</span><span>No rooms added — add rooms first for accurate calculation. You can still set a manual price below.</span>
                                        </div>
                                    )}
                                    {priceDanger && (
                                        <div className="alert alert-danger d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>🚨</span>
                                            <div>
                                                <strong>Price too low — you will lose money</strong>
                                                <div style={{ fontSize: 12, marginTop: 2 }}>
                                                    ${perSqft.toFixed(2)}/sq ft is below the minimum viable rate. Raise your base rate in My Rates tab.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {priceWarning && (
                                        <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>⚠️</span>
                                            <div>
                                                <strong>Thin margin — any surprise adds a loss</strong>
                                                <div style={{ fontSize: 12, marginTop: 2 }}>${perSqft.toFixed(2)}/sq ft leaves little buffer for unexpected prep work.</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── ADD-ONS FOR THIS JOB ── */}
                                    {/* Furniture moving — available for ALL job types */}
                                    <div className="card border bg-light mb-3">
                                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                            🪑 Furniture moving
                                            <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— charge for every room, workers tire before install starts</span>
                                        </div>
                                        <div className="card-body py-1 px-3">
                                            <CounterRow
                                                label="Standard rooms"
                                                sub={`Sofa, bed, dresser — $${rates.furniture_moving_room.toFixed(2)} each`}
                                                value={extras.furnitureRooms}
                                                onChange={v => setExtra("furnitureRooms", v)}
                                            />
                                            <CounterRow
                                                label="Heavy items"
                                                sub={`Fridge, piano, pool table — $${rates.furniture_moving_heavy.toFixed(2)} each`}
                                                value={extras.furnitureHeavy}
                                                onChange={v => setExtra("furnitureHeavy", v)}
                                            />
                                        </div>
                                    </div>

                                    {/* Flooring-only extras */}
                                    {isFlooring && (
                                        <div className="card border bg-light mb-3">
                                            <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                                🔧 Prep work
                                                <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— where profit is won or lost</span>
                                            </div>
                                            <div className="card-body py-1 px-3">
                                                {estimate.include_removal && (
                                                    <ToggleRow
                                                        label="Heavy demo (tile / glued hardwood)"
                                                        sub={`$${rates.heavy_demo_sqft.toFixed(2)}/sq ft instead of $${rates.floor_removal_sqft.toFixed(2)} light removal`}
                                                        value={extras.heavyDemo}
                                                        onChange={v => setExtra("heavyDemo", v)}
                                                    />
                                                )}
                                                <ToggleRow
                                                    label="Moisture barrier"
                                                    sub={`Required for LVP, laminate, engineered on concrete — $${rates.moisture_barrier_sqft.toFixed(2)}/sq ft`}
                                                    value={extras.moistureBarrier}
                                                    onChange={v => setExtra("moistureBarrier", v)}
                                                />
                                                <ToggleRow
                                                    label="Floor leveling needed"
                                                    sub="Uneven subfloor — biggest hidden cost"
                                                    value={extras.floorLeveling}
                                                    onChange={v => setExtra("floorLeveling", v)}
                                                />
                                                {extras.floorLeveling && (
                                                    <div className="py-2 ps-2">
                                                        <div className="d-flex gap-2 mb-2">
                                                            {[{ value: "sqft", label: `Per sq ft ($${rates.floor_leveling_sqft.toFixed(2)})` }, { value: "bag", label: `Per bag ($${rates.floor_leveling_bag.toFixed(2)})` }].map(o => (
                                                                <button key={o.value} type="button"
                                                                    onClick={() => setExtra("levelingMode", o.value)}
                                                                    className={`btn btn-sm ${extras.levelingMode === o.value ? "btn-dark" : "btn-outline-secondary"}`}>
                                                                    {o.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {extras.levelingMode === "bag" && (
                                                            <CounterRow label="Number of bags" value={extras.levelingBags}
                                                                onChange={v => setExtra("levelingBags", v)} min={1} max={30} />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Travel */}
                                    <div className="card border bg-light mb-3">
                                        <div className="card-body py-1 px-3">
                                            <CounterRow
                                                label="Travel miles (one way)"
                                                sub={`$${rates.travel_fee_per_mile.toFixed(2)}/mile — leave at 0 if local`}
                                                value={extras.travelMiles}
                                                onChange={v => setExtra("travelMiles", v)}
                                                min={0} max={300}
                                            />
                                            {extras.travelMiles > 0 && (
                                                <ToggleRow
                                                    label="Use flat travel fee instead"
                                                    sub={`Flat $${rates.travel_fee_flat.toFixed(2)} per trip instead of per-mile`}
                                                    value={extras.useFlatTravel}
                                                    onChange={v => setExtra("useFlatTravel", v)}
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* ── BREAKDOWN ── */}
                                    {result.lines.length > 0 && (
                                        <div className="rounded-3 p-3 mb-3" style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}>
                                            <p className="fw-semibold mb-2" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>Breakdown</p>

                                            {installLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", margin: "4px 0 2px" }}>Installation</p>
                                                    {installLines.map((l, i) => (
                                                        <div key={i} className="d-flex justify-content-between py-1" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                            <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                                                            <span className={`fw-medium ${l.amount < 0 ? "text-danger" : "text-dark"}`}>
                                                                {l.amount < 0 ? "-" : ""}${Math.abs(Math.round(l.amount)).toLocaleString()}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            {prepLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", margin: "10px 0 2px" }}>Prep & extras</p>
                                                    {prepLines.map((l, i) => (
                                                        <div key={i} className="d-flex justify-content-between py-1" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                            <span className={l.warn ? "text-warning fw-medium" : "text-muted"}>{l.warn ? "⚠ " : ""}{l.label}</span>
                                                            <span className="fw-medium text-dark">${Math.round(l.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                            {protectionLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", margin: "10px 0 2px" }}>Protection fees</p>
                                                    {protectionLines.map((l, i) => (
                                                        <div key={i} className="d-flex justify-content-between py-1" style={{ fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>
                                                            <span className="text-muted">{l.label}</span>
                                                            <span className="fw-medium text-dark">${Math.round(l.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </>
                                            )}

                                            <div className="d-flex justify-content-between pt-2 mt-1 fw-bold" style={{ borderTop: "1px solid #dee2e6", fontSize: 14 }}>
                                                <span>Total</span>
                                                <span className="text-success">{money(displayTotal)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual override */}
                                    <div className="mb-3">
                                        <label className="form-label fw-medium small">Override amount (optional)</label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text">$</span>
                                            <input type="number" inputMode="decimal"
                                                className="form-control fw-bold text-success"
                                                style={{ fontSize: 22 }}
                                                value={manualTotal !== null ? manualTotal : result.total || ""}
                                                onChange={e => {
                                                    const v = parseFloat(e.target.value);
                                                    setManualTotal(isNaN(v) ? null : v);
                                                }}
                                                placeholder="0.00" />
                                            {manualTotal !== null && (
                                                <button className="btn btn-outline-secondary" type="button"
                                                    onClick={() => setManualTotal(null)}>↺ Reset</button>
                                            )}
                                        </div>
                                        <p className="text-muted mt-1 mb-0" style={{ fontSize: 12 }}>
                                            Pre-filled from calculation — edit freely. Click ↺ to go back to calculated.
                                        </p>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="form-label fw-medium small">Notes for client (shown on PDF)</label>
                                        <textarea className="form-control" rows={2}
                                            placeholder="e.g. Includes 2 coats premium paint, labor, cleanup…"
                                            value={notes} onChange={e => setNotes(e.target.value)} />
                                    </div>
                                </>

                            ) : (
                                /* ═══════════════ MY RATES TAB ═══════════════ */
                                <>
                                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                                        Drag sliders to set your rates. These are saved to your account and used on every estimate automatically.
                                    </p>

                                    {/* PAINTING — always show */}
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

                                    {/* FLOORING */}
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

                                    {/* FURNITURE + PROTECTION — always show for all job types */}
                                    <RateCard title="🪑 Furniture moving">
                                        <SliderRow label="Standard room" field="furniture_moving_room" rates={rates} onChange={updateRate} min={25} max={200} step={5} />
                                        <SliderRow label="Heavy item" field="furniture_moving_heavy" rates={rates} onChange={updateRate} min={50} max={400} step={10} />
                                    </RateCard>

                                    <RateCard title="🛡️ Protection fees">
                                        <SliderRow label="Minimum job fee" field="minimum_job_fee" rates={rates} onChange={updateRate} min={50} max={800} step={25} />
                                        <SliderRow label="Travel / mile" field="travel_fee_per_mile" rates={rates} onChange={updateRate} min={0.5} max={5} step={0.25} />
                                        <SliderRow label="Travel flat fee" field="travel_fee_flat" rates={rates} onChange={updateRate} min={0} max={300} step={10} />
                                    </RateCard>

                                    <button className="btn btn-dark fw-semibold w-100 mb-2"
                                        onClick={handleSaveRates} disabled={savingRates}>
                                        {savingRates
                                            ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                            : savedRates ? "✓ Saved" : "💾 Save my rates"}
                                    </button>
                                    <p className="text-muted text-center mb-0" style={{ fontSize: 12 }}>
                                        Saving updates the calculator for all future estimates
                                    </p>
                                </>
                            )}
                        </div>

                        {/* Footer — only on calculator tab */}
                        {activeTab === "calculator" && (
                            <div className="modal-footer border-0 pt-0 gap-2">
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
            </div>
        </>
    );
}