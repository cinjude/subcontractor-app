import { useEffect, useState, useCallback } from "react";

const DEFAULTS = {
    // painting
    paint_base_per_sqft: 2.50,
    paint_extra_coat_sqft: 0.50,
    paint_ceiling_sqft: 0.75,
    paint_trim_sqft: 0.60,
    paint_door_each: 45.00,
    paint_window_each: 25.00,
    paint_repair_surcharge: 25.00,
    paint_color_change_pct: 20.00,
    paint_dark_to_light_pct: 35.00,
    // flooring base
    floor_hardwood_sqft: 8.00,
    floor_engineered_sqft: 6.50,
    floor_laminate_sqft: 4.50,
    floor_vinyl_sqft: 4.00,
    floor_tile_ceramic_sqft: 7.00,
    floor_tile_porcelain_sqft: 9.00,
    floor_carpet_sqft: 3.50,
    floor_concrete_sqft: 5.00,
    // flooring extras
    floor_removal_sqft: 1.50,
    floor_baseboard_lft: 3.00,
    floor_stair_each: 35.00,
    floor_transition_each: 20.00,
    floor_diagonal_pct: 15.00,
    floor_herringbone_pct: 25.00,
    // protection fees
    minimum_job_fee: 250.00,
    travel_fee_per_mile: 1.50,
    travel_fee_flat: 75.00,
    // furniture moving
    furniture_moving_room: 75.00,
    furniture_moving_heavy: 150.00,
    // prep fees
    moisture_barrier_sqft: 0.65,
    floor_leveling_sqft: 2.00,
    floor_leveling_bag: 65.00,
    heavy_demo_sqft: 3.50,
    // premium labor
    backsplash_tile_sqft: 15.00,
    shower_tile_sqft: 25.00,
    shower_pan_each: 900.00,
};

// ── Floor material rate lookup ──────────────────────────────────────────────
function getFloorRate(material, rates) {
    const map = {
        hardwood: rates.floor_hardwood_sqft,
        engineered_wood: rates.floor_engineered_sqft,
        laminate: rates.floor_laminate_sqft,
        vinyl_plank: rates.floor_vinyl_sqft,
        tile_ceramic: rates.floor_tile_ceramic_sqft,
        tile_porcelain: rates.floor_tile_porcelain_sqft,
        carpet: rates.floor_carpet_sqft,
        concrete: rates.floor_concrete_sqft,
    };
    return map[material] || rates.floor_hardwood_sqft;
}

// ── Main calculation engine ─────────────────────────────────────────────────
function calculate(estimate, rates, extras) {
    const sqft = estimate.computed_sqft || 0;
    const coats = parseInt(estimate.paint_coats || "1");
    const lines = [];   // { label, amount, warn, section }
    let total = 0;

    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    // ── PAINTING ───────────────────────────────────────────────────────
    if (isPainting && sqft > 0) {
        const base = sqft * rates.paint_base_per_sqft;
        lines.push({ section: "install", label: `Base labor (${sqft} sq ft × $${rates.paint_base_per_sqft.toFixed(2)})`, amount: base });
        total += base;

        if (coats > 1) {
            const c = sqft * rates.paint_extra_coat_sqft * (coats - 1);
            lines.push({ section: "install", label: `Extra coats ×${coats - 1} (${sqft} sq ft × $${rates.paint_extra_coat_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_ceiling) {
            const c = sqft * rates.paint_ceiling_sqft;
            lines.push({ section: "install", label: `Ceiling (${sqft} sq ft × $${rates.paint_ceiling_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_trim) {
            const c = sqft * rates.paint_trim_sqft;
            lines.push({ section: "install", label: `Trim / baseboards (${sqft} sq ft × $${rates.paint_trim_sqft.toFixed(2)})`, amount: c });
            total += c;
        }
        if (estimate.include_doors && estimate.door_count > 0) {
            const c = estimate.door_count * rates.paint_door_each;
            lines.push({ section: "install", label: `${estimate.door_count} doors × $${rates.paint_door_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.window_count > 0) {
            const c = estimate.window_count * rates.paint_window_each;
            lines.push({ section: "install", label: `${estimate.window_count} windows × $${rates.paint_window_each.toFixed(2)}`, amount: c });
            total += c;
        }

        const cond = estimate.paint_surface_condition;
        if (cond === "color_change") {
            const s = total * (rates.paint_color_change_pct / 100);
            lines.push({ section: "install", label: `Color change surcharge (${rates.paint_color_change_pct}%)`, amount: s, warn: true });
            total += s;
        } else if (cond === "dark_to_light") {
            const s = total * (rates.paint_dark_to_light_pct / 100);
            lines.push({ section: "install", label: `Dark→light surcharge (${rates.paint_dark_to_light_pct}%)`, amount: s, warn: true });
            total += s;
        } else if (cond === "damaged" && estimate.repairs_needed) {
            const s = total * (rates.paint_repair_surcharge / 100);
            lines.push({ section: "install", label: `Repair surcharge (${rates.paint_repair_surcharge}%)`, amount: s, warn: true });
            total += s;
        }
        if (estimate.client_provides_paint) {
            const d = -(total * 0.10);
            lines.push({ section: "install", label: "Client provides paint (−10% material)", amount: d });
            total += d;
        }
    }

    // ── FLOORING base ──────────────────────────────────────────────────
    if (isFlooring && sqft > 0) {
        const material = estimate.flooring_material;
        const floorRate = getFloorRate(material, rates);
        const matLabel = (material || "").replace(/_/g, " ");
        const floorBase = sqft * floorRate;
        lines.push({ section: "install", label: `${matLabel} install (${sqft} sq ft × $${floorRate.toFixed(2)})`, amount: floorBase });
        total += floorBase;

        // Pattern upcharge
        const pattern = estimate.flooring_pattern;
        if (pattern === "herringbone" || pattern === "chevron") {
            const up = floorBase * (rates.floor_herringbone_pct / 100);
            lines.push({ section: "install", label: `${pattern.replace(/_/g, " ")} pattern upcharge (${rates.floor_herringbone_pct}%)`, amount: up, warn: true });
            total += up;
        } else if (pattern === "diagonal_45") {
            const up = floorBase * (rates.floor_diagonal_pct / 100);
            lines.push({ section: "install", label: `Diagonal pattern upcharge (${rates.floor_diagonal_pct}%)`, amount: up, warn: true });
            total += up;
        }

        // Standard extras
        if (estimate.include_stairs && estimate.stair_count > 0) {
            const c = estimate.stair_count * rates.floor_stair_each;
            lines.push({ section: "install", label: `${estimate.stair_count} stairs × $${rates.floor_stair_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.transition_strips > 0) {
            const c = estimate.transition_strips * rates.floor_transition_each;
            lines.push({ section: "install", label: `${estimate.transition_strips} transition strips × $${rates.floor_transition_each.toFixed(2)}`, amount: c });
            total += c;
        }
        if (estimate.include_baseboards) {
            const perim = Math.round(Math.sqrt(sqft) * 4);
            const c = perim * rates.floor_baseboard_lft;
            lines.push({ section: "install", label: `Baseboards (~${perim} lf × $${rates.floor_baseboard_lft.toFixed(2)})`, amount: c });
            total += c;
        }
    }

    // ── DEMO / REMOVAL ─────────────────────────────────────────────────
    if (isFlooring && estimate.include_removal && sqft > 0) {
        const isHeavy = extras.heavyDemo;
        const rate = isHeavy ? rates.heavy_demo_sqft : rates.floor_removal_sqft;
        const c = sqft * rate;
        lines.push({
            section: "prep",
            label: isHeavy
                ? `Heavy demo / thinset grinding (${sqft} sq ft × $${rate.toFixed(2)})`
                : `Light removal / carpet tear out (${sqft} sq ft × $${rate.toFixed(2)})`,
            amount: c,
            warn: isHeavy,
        });
        total += c;
    }

    // ── MOISTURE BARRIER ───────────────────────────────────────────────
    if (isFlooring && extras.moistureBarrier && sqft > 0) {
        const c = sqft * rates.moisture_barrier_sqft;
        lines.push({ section: "prep", label: `Moisture barrier (${sqft} sq ft × $${rates.moisture_barrier_sqft.toFixed(2)})`, amount: c, warn: true });
        total += c;
    }

    // ── FLOOR LEVELING ─────────────────────────────────────────────────
    if (isFlooring && extras.floorLeveling) {
        const sqftMode = extras.levelingMode === "sqft";
        if (sqftMode && sqft > 0) {
            const c = sqft * rates.floor_leveling_sqft;
            lines.push({ section: "prep", label: `Floor leveling (${sqft} sq ft × $${rates.floor_leveling_sqft.toFixed(2)})`, amount: c, warn: true });
            total += c;
        } else {
            const bags = extras.levelingBags || 1;
            const c = bags * rates.floor_leveling_bag;
            lines.push({ section: "prep", label: `Floor leveling (${bags} bag${bags > 1 ? "s" : ""} × $${rates.floor_leveling_bag.toFixed(2)})`, amount: c, warn: true });
            total += c;
        }
    }

    // ── FURNITURE MOVING ───────────────────────────────────────────────
    if (extras.furnitureRooms > 0) {
        const c = extras.furnitureRooms * rates.furniture_moving_room;
        lines.push({ section: "protection", label: `Furniture moving — ${extras.furnitureRooms} room${extras.furnitureRooms > 1 ? "s" : ""} × $${rates.furniture_moving_room.toFixed(2)}`, amount: c });
        total += c;
    }
    if (extras.furnitureHeavy > 0) {
        const c = extras.furnitureHeavy * rates.furniture_moving_heavy;
        lines.push({ section: "protection", label: `Heavy items (fridge/piano/pool table) × ${extras.furnitureHeavy} × $${rates.furniture_moving_heavy.toFixed(2)}`, amount: c, warn: true });
        total += c;
    }

    // ── TRAVEL FEE ─────────────────────────────────────────────────────
    if (extras.travelMiles > 0) {
        const c = extras.travelMiles * rates.travel_fee_per_mile;
        lines.push({ section: "protection", label: `Travel (${extras.travelMiles} miles × $${rates.travel_fee_per_mile.toFixed(2)})`, amount: c });
        total += c;
    }

    // ── MINIMUM JOB FEE ────────────────────────────────────────────────
    if (total < rates.minimum_job_fee && rates.minimum_job_fee > 0) {
        const diff = rates.minimum_job_fee - total;
        lines.push({ section: "protection", label: `Minimum job fee applied (job was $${Math.round(total)} — below your $${Math.round(rates.minimum_job_fee)} minimum)`, amount: diff });
        total = rates.minimum_job_fee;
    }

    return { lines, total: Math.round(total * 100) / 100 };
}

// ── Slider row ──────────────────────────────────────────────────────────────
function SliderRow({ label, field, rates, onChange, min, max, step, prefix = "$", suffix = "" }) {
    const val = rates[field] ?? DEFAULTS[field];
    const dec = step < 1 ? 2 : 0;
    const display = prefix + (dec > 0 ? Number(val).toFixed(dec) : Math.round(val)) + suffix;
    return (
        <div className="d-flex align-items-center gap-3 py-2 border-bottom">
            <span className="text-muted flex-shrink-0" style={{ fontSize: 13, minWidth: 190 }}>{label}</span>
            <input type="range" className="flex-fill"
                min={min} max={max} step={step} value={val}
                onChange={e => onChange(field, parseFloat(e.target.value))}
                style={{ accentColor: "var(--color-text-primary)" }} />
            <span className="fw-medium flex-shrink-0 font-monospace"
                style={{ fontSize: 13, minWidth: 56, textAlign: "right" }}>
                {display}
            </span>
        </div>
    );
}

// ── Counter row (for furniture rooms, heavy items, bags, miles) ─────────────
function CounterRow({ label, sub, value, onChange, min = 0, max = 20 }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </div>
            <div className="d-flex align-items-center gap-3">
                <button type="button"
                    className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20 }}
                    onClick={() => onChange(Math.max(min, value - 1))}>−</button>
                <span className="fw-semibold" style={{ minWidth: 24, textAlign: "center", fontSize: 16 }}>{value}</span>
                <button type="button"
                    className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20 }}
                    onClick={() => onChange(Math.min(max, value + 1))}>+</button>
            </div>
        </div>
    );
}

// ── Toggle row ──────────────────────────────────────────────────────────────
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

// ── Section label ───────────────────────────────────────────────────────────
function SectionLabel({ text }) {
    return (
        <p className="text-uppercase fw-semibold text-muted mb-1 mt-3"
            style={{ fontSize: 10, letterSpacing: "0.06em" }}>{text}</p>
    );
}

// ── Line item breakdown row ─────────────────────────────────────────────────
function BkRow({ label, amount }) {
    const neg = amount < 0;
    return (
        <div className="d-flex justify-content-between py-1"
            style={{ fontSize: 13, borderBottom: "1px solid var(--color-border-tertiary, #f1f5f9)" }}>
            <span className="text-muted">{label}</span>
            <span className={`fw-medium ${neg ? "text-danger" : "text-dark"}`}>
                {neg ? "-" : ""}${Math.abs(Math.round(amount)).toLocaleString()}
            </span>
        </div>
    );
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PriceCalculatorModal({ show, estimate, onClose, onSave }) {
    const [rates, setRates] = useState({ ...DEFAULTS });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [savingRates, setSavingRates] = useState(false);
    const [activeTab, setActiveTab] = useState("calculator");
    const [notes, setNotes] = useState(estimate?.contractor_notes || "");
    const [result, setResult] = useState({ lines: [], total: 0 });
    const [manualTotal, setManualTotal] = useState(null); // null = use calculated

    // ── Extra job options (toggles + counters in calculator tab) ───────────
    const [extras, setExtras] = useState({
        moistureBarrier: false,
        floorLeveling: false,
        levelingMode: "sqft",   // "sqft" | "bag"
        levelingBags: 1,
        heavyDemo: false,
        furnitureRooms: 0,
        furnitureHeavy: 0,
        travelMiles: 0,
    });

    const setExtra = (key, val) => setExtras(prev => ({ ...prev, [key]: val }));

    const isPainting = ["painting", "both"].includes(estimate?.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate?.estimate_type);

    // Fetch saved rates
    useEffect(() => {
        if (!show) return;
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
    }, [show]);

    // Recalculate whenever anything changes
    useEffect(() => {
        if (!estimate) return;
        const r = calculate(estimate, rates, extras);
        setResult(r);
        if (manualTotal === null) { } // keep in sync
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
            setActiveTab("calculator");
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
    const perSqft = estimate?.computed_sqft > 0 ? displayTotal / estimate.computed_sqft : 0;
    const money = v => `$${Math.round(v).toLocaleString("en-US")}`;

    const installLines = result.lines.filter(l => l.section === "install");
    const prepLines = result.lines.filter(l => l.section === "prep");
    const protectionLines = result.lines.filter(l => l.section === "protection");

    // Price health
    const minFloorRate = {
        hardwood: 6, engineered_wood: 5, laminate: 3, vinyl_plank: 3,
        tile_ceramic: 5, tile_porcelain: 7, carpet: 2.5, concrete: 4
    }[estimate?.flooring_material] || 3;
    const minPaintRate = 2.00;
    const minRate = isFlooring ? minFloorRate : minPaintRate;
    const priceDanger = perSqft > 0 && perSqft < minRate;
    const priceWarning = perSqft > 0 && perSqft >= minRate && perSqft < minRate * 1.3;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} style={{ zIndex: 1040 }} />
            <style>{`
                @media (max-width: 767px) {
                    .calc-dialog {
                        margin: 0 !important;
                        position: fixed !important;
                        bottom: 0 !important;
                        left: 0 !important;
                        right: 0 !important;
                        max-width: 100% !important;
                    }
                    .calc-dialog .modal-content {
                        border-radius: 20px 20px 0 0 !important;
                        border-bottom: none !important;
                        max-height: 90vh !important;
                        overflow-y: auto !important;
                    }
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
                                    {estimate?.computed_sqft > 0
                                        ? ` · ${Number(estimate.computed_sqft).toFixed(0)} sq ft`
                                        : " · no rooms added yet"}
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

                        <div className="modal-body pt-2">
                            {loading ? (
                                <div className="text-center py-5">
                                    <div className="spinner-border text-secondary" role="status" />
                                    <p className="text-muted mt-2" style={{ fontSize: 13 }}>Loading your rates…</p>
                                </div>

                            ) : activeTab === "calculator" ? (
                                /* ═══════════════════════════════════════════
                                   CALCULATOR TAB
                                ═══════════════════════════════════════════ */
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

                                    {/* Price health warning */}
                                    {!(estimate?.computed_sqft > 0) && (
                                        <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>⚠️</span>
                                            <span>No rooms added — add rooms to get an accurate calculation. You can still set a manual price below.</span>
                                        </div>
                                    )}
                                    {priceDanger && (
                                        <div className="alert alert-danger d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>🚨</span>
                                            <div>
                                                <strong>Price too low — you will lose money</strong>
                                                <div style={{ fontSize: 12, marginTop: 2 }}>
                                                    ${perSqft.toFixed(2)}/sq ft is below the minimum viable rate for {(estimate?.flooring_material || estimate?.estimate_type || "").replace(/_/g, " ")}. Your labor and materials are not covered at this price.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {priceWarning && !priceDanger && (
                                        <div className="alert alert-warning d-flex gap-2 py-2 mb-3" style={{ fontSize: 13 }}>
                                            <span>⚠️</span>
                                            <div>
                                                <strong>Thin margin — any surprise adds a loss</strong>
                                                <div style={{ fontSize: 12, marginTop: 2 }}>
                                                    ${perSqft.toFixed(2)}/sq ft leaves almost no buffer. If leveling, subfloor issues, or extra demo comes up, you'll work at a loss.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ── JOB EXTRAS (this job only) ── */}
                                    {isFlooring && (
                                        <>
                                            <p className="fw-semibold mb-2" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>
                                                Add-ons for this job
                                            </p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">

                                                    {/* Heavy demo toggle */}
                                                    {estimate.include_removal && (
                                                        <ToggleRow
                                                            label="Heavy demo (tile / glued hardwood)"
                                                            sub={`Charges $${rates.heavy_demo_sqft.toFixed(2)}/sq ft instead of $${rates.floor_removal_sqft.toFixed(2)} light removal`}
                                                            value={extras.heavyDemo}
                                                            onChange={v => setExtra("heavyDemo", v)}
                                                        />
                                                    )}

                                                    {/* Moisture barrier */}
                                                    <ToggleRow
                                                        label="Moisture barrier"
                                                        sub={`Required for LVP, laminate, engineered on concrete — $${rates.moisture_barrier_sqft.toFixed(2)}/sq ft`}
                                                        value={extras.moistureBarrier}
                                                        onChange={v => setExtra("moistureBarrier", v)}
                                                    />

                                                    {/* Floor leveling */}
                                                    <ToggleRow
                                                        label="Floor leveling needed"
                                                        sub="Uneven subfloor — one of the biggest hidden costs"
                                                        value={extras.floorLeveling}
                                                        onChange={v => setExtra("floorLeveling", v)}
                                                    />
                                                    {extras.floorLeveling && (
                                                        <div className="py-2 ps-2">
                                                            <div className="d-flex gap-2 mb-2">
                                                                {["sqft", "bag"].map(mode => (
                                                                    <button key={mode} type="button"
                                                                        onClick={() => setExtra("levelingMode", mode)}
                                                                        className={`btn btn-sm ${extras.levelingMode === mode ? "btn-dark" : "btn-outline-secondary"}`}>
                                                                        {mode === "sqft" ? `Per sq ft ($${rates.floor_leveling_sqft.toFixed(2)})` : `Per bag ($${rates.floor_leveling_bag.toFixed(2)})`}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {extras.levelingMode === "bag" && (
                                                                <CounterRow
                                                                    label="Number of bags"
                                                                    value={extras.levelingBags}
                                                                    onChange={v => setExtra("levelingBags", v)}
                                                                    min={1} max={30}
                                                                />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Furniture moving */}
                                            <div className="card border bg-light mb-3">
                                                <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                                    🪑 Furniture moving
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

                                            {/* Travel */}
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <CounterRow
                                                        label="Travel miles (one way)"
                                                        sub={`$${rates.travel_fee_per_mile.toFixed(2)}/mile — leave at 0 if local`}
                                                        value={extras.travelMiles}
                                                        onChange={v => setExtra("travelMiles", v)}
                                                        min={0} max={200}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* ── BREAKDOWN ── */}
                                    {result.lines.length > 0 && (
                                        <div className="rounded-3 p-3 mb-3"
                                            style={{ background: "#f8f9fa", border: "1px solid #dee2e6" }}>
                                            <p className="fw-semibold mb-2" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>
                                                Breakdown
                                            </p>

                                            {installLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", marginBottom: 4, marginTop: 4 }}>Installation</p>
                                                    {installLines.map((l, i) => <BkRow key={i} label={l.label} amount={l.amount} />)}
                                                </>
                                            )}
                                            {prepLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", marginBottom: 4, marginTop: 10 }}>Prep & extras</p>
                                                    {prepLines.map((l, i) => <BkRow key={i} label={l.label} amount={l.amount} />)}
                                                </>
                                            )}
                                            {protectionLines.length > 0 && (
                                                <>
                                                    <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#9ca3af", marginBottom: 4, marginTop: 10 }}>Protection fees</p>
                                                    {protectionLines.map((l, i) => <BkRow key={i} label={l.label} amount={l.amount} />)}
                                                </>
                                            )}

                                            <div className="d-flex justify-content-between pt-2 mt-1 fw-bold"
                                                style={{ borderTop: "1px solid #dee2e6", fontSize: 14 }}>
                                                <span>Total</span>
                                                <span className="text-success">{money(displayTotal)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Manual override */}
                                    <div className="mb-3">
                                        <label className="form-label fw-medium small">
                                            Override amount (optional)
                                        </label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text">$</span>
                                            <input
                                                type="number" inputMode="decimal"
                                                className="form-control fw-bold text-success"
                                                style={{ fontSize: 22 }}
                                                value={manualTotal !== null ? manualTotal : result.total || ""}
                                                onChange={e => {
                                                    const v = parseFloat(e.target.value);
                                                    setManualTotal(isNaN(v) ? null : v);
                                                }}
                                                placeholder="0.00"
                                            />
                                            {manualTotal !== null && (
                                                <button className="btn btn-outline-secondary" type="button"
                                                    onClick={() => setManualTotal(null)}>
                                                    ↺ Reset
                                                </button>
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
                                            placeholder="e.g. Includes moisture barrier, furniture moving, 2 coats…"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)} />
                                    </div>
                                </>

                            ) : (
                                /* ═══════════════════════════════════════════
                                   MY RATES TAB
                                ═══════════════════════════════════════════ */
                                <>
                                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>
                                        These rates are saved to your account and used on every estimate. Adjust with sliders — tap "Save my rates" when done.
                                    </p>

                                    {/* PAINTING */}
                                    {isPainting && (
                                        <>
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>🎨 Painting rates</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Base labor / sq ft" field="paint_base_per_sqft" rates={rates} onChange={updateRate} min={0.5} max={8} step={0.25} />
                                                    <SliderRow label="Extra coat / sq ft" field="paint_extra_coat_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                                    <SliderRow label="Ceiling / sq ft" field="paint_ceiling_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                                    <SliderRow label="Trim / sq ft" field="paint_trim_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                                                    <SliderRow label="Per door" field="paint_door_each" rates={rates} onChange={updateRate} min={10} max={150} step={5} />
                                                    <SliderRow label="Per window" field="paint_window_each" rates={rates} onChange={updateRate} min={10} max={100} step={5} />
                                                    <SliderRow label="Color change %" field="paint_color_change_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
                                                    <SliderRow label="Dark → light %" field="paint_dark_to_light_pct" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
                                                    <SliderRow label="Repair surcharge %" field="paint_repair_surcharge" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* FLOORING BASE */}
                                    {isFlooring && (
                                        <>
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>🪵 Flooring — base install / sq ft</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Hardwood" field="floor_hardwood_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                                                    <SliderRow label="Engineered wood" field="floor_engineered_sqft" rates={rates} onChange={updateRate} min={2} max={15} step={0.5} />
                                                    <SliderRow label="Laminate" field="floor_laminate_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                                    <SliderRow label="Vinyl LVP" field="floor_vinyl_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                                    <SliderRow label="Ceramic tile" field="floor_tile_ceramic_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                                                    <SliderRow label="Porcelain tile" field="floor_tile_porcelain_sqft" rates={rates} onChange={updateRate} min={2} max={25} step={0.5} />
                                                    <SliderRow label="Carpet" field="floor_carpet_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.5} />
                                                    <SliderRow label="Concrete" field="floor_concrete_sqft" rates={rates} onChange={updateRate} min={2} max={12} step={0.5} />
                                                </div>
                                            </div>

                                            {/* PREP FEES */}
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>🔧 Prep fees — where profit is won or lost</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Light removal / sq ft" field="floor_removal_sqft" rates={rates} onChange={updateRate} min={0} max={5} step={0.25} />
                                                    <SliderRow label="Heavy demo / sq ft" field="heavy_demo_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.25} />
                                                    <SliderRow label="Moisture barrier / sq ft" field="moisture_barrier_sqft" rates={rates} onChange={updateRate} min={0.25} max={2} step={0.25} />
                                                    <SliderRow label="Floor leveling / sq ft" field="floor_leveling_sqft" rates={rates} onChange={updateRate} min={0.5} max={6} step={0.25} />
                                                    <SliderRow label="Floor leveling / bag" field="floor_leveling_bag" rates={rates} onChange={updateRate} min={20} max={150} step={5} />
                                                    <SliderRow label="Baseboard / lin ft" field="floor_baseboard_lft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                                                    <SliderRow label="Per stair" field="floor_stair_each" rates={rates} onChange={updateRate} min={10} max={120} step={5} />
                                                    <SliderRow label="Per transition strip" field="floor_transition_each" rates={rates} onChange={updateRate} min={5} max={60} step={5} />
                                                </div>
                                            </div>

                                            {/* FURNITURE MOVING */}
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>🪑 Furniture moving — workers tire before install starts</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Standard room" field="furniture_moving_room" rates={rates} onChange={updateRate} min={25} max={200} step={5} />
                                                    <SliderRow label="Heavy item" field="furniture_moving_heavy" rates={rates} onChange={updateRate} min={50} max={400} step={10} />
                                                </div>
                                            </div>

                                            {/* PREMIUM LABOR */}
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>💎 Premium labor — never charge standard rate</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Backsplash tile / sq ft" field="backsplash_tile_sqft" rates={rates} onChange={updateRate} min={8} max={40} step={1} />
                                                    <SliderRow label="Shower tile / sq ft" field="shower_tile_sqft" rates={rates} onChange={updateRate} min={10} max={60} step={1} />
                                                    <SliderRow label="Shower pan (each)" field="shower_pan_each" rates={rates} onChange={updateRate} min={300} max={2500} step={50} />
                                                </div>
                                            </div>

                                            {/* PATTERN UPCHARGES */}
                                            <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>↗️ Pattern upcharges</p>
                                            <div className="card border bg-light mb-3">
                                                <div className="card-body py-1 px-3">
                                                    <SliderRow label="Diagonal 45° %" field="floor_diagonal_pct" rates={rates} onChange={updateRate} min={0} max={40} step={5} prefix="" suffix="%" />
                                                    <SliderRow label="Herringbone / chevron %" field="floor_herringbone_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* PROTECTION FEES */}
                                    <p className="fw-semibold mb-1" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6c757d" }}>🛡️ Protection fees — your time has value</p>
                                    <div className="card border bg-light mb-3">
                                        <div className="card-body py-1 px-3">
                                            <SliderRow label="Minimum job fee" field="minimum_job_fee" rates={rates} onChange={updateRate} min={50} max={800} step={25} />
                                            <SliderRow label="Travel / mile" field="travel_fee_per_mile" rates={rates} onChange={updateRate} min={0.5} max={5} step={0.25} />
                                            <SliderRow label="Travel flat fee" field="travel_fee_flat" rates={rates} onChange={updateRate} min={0} max={300} step={10} />
                                        </div>
                                    </div>

                                    <button className="btn btn-dark fw-semibold w-100"
                                        onClick={handleSaveRates} disabled={savingRates}>
                                        {savingRates
                                            ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                                            : "💾 Save my rates"}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Footer */}
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