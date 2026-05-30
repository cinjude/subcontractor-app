// src/pages/Estimates/NewEstimateForm.jsx — VERSION 2
// Changes vs v1:
//   - Step 3 flooring: per-room material selector replaces global chips
//   - Step 4: Extras (furniture, prep, travel) — same as before, unchanged
//   - Step 5: Review — shows per-room materials + extras

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";
import useGlobalReducer from "../../hooks/useGlobalReducer.jsx";

/* ─── Chip selector ──────────────────────────────────────────────────────── */
function Chips({ options, value, onChange, cols = 2 }) {
    return (
        <div className={`row g-2 row-cols-${cols} row-cols-md-${Math.min(cols + 1, 4)}`}>
            {options.map(o => {
                const sel = value === o.value;
                return (
                    <div key={o.value} className="col">
                        <button type="button" onClick={() => onChange(sel ? null : o.value)}
                            className={`w-100 h-100 btn text-start ${sel ? "btn-dark" : "btn-outline-secondary"}`}
                            style={{ padding: "10px 12px", lineHeight: 1.4, minHeight: 60 }}>
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

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
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

/* ─── Counter ────────────────────────────────────────────────────────────── */
function Counter({ label, sub, value, onChange, min = 0 }) {
    return (
        <div className="d-flex justify-content-between align-items-center py-2 border-bottom">
            <div>
                <span className="fw-medium d-block" style={{ fontSize: 14 }}>{label}</span>
                {sub && <span className="text-muted d-block" style={{ fontSize: 12 }}>{sub}</span>}
            </div>
            <div className="d-flex align-items-center gap-3">
                <button type="button"
                    className="btn btn-outline-secondary fw-bold d-flex align-items-center justify-content-center"
                    style={{ width: 36, height: 36, borderRadius: "50%", padding: 0, fontSize: 20, lineHeight: 1 }}
                    onClick={() => onChange(Math.max(min, value - 1))}>−</button>
                <span className="fw-semibold" style={{ minWidth: 24, textAlign: "center", fontSize: 16 }}>{value}</span>
                <button type="button"
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
    return (
        <div className="card border bg-light mb-2">
            <div className="card-body py-2 px-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <input value={room.name} onChange={e => onChange(index, "name", e.target.value)}
                        placeholder="Room name (e.g. Living Room)"
                        className="form-control form-control-sm fw-medium border-0 bg-transparent shadow-none" />
                    <button type="button" className="btn-close flex-shrink-0" onClick={() => onRemove(index)} />
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
                {sqft > 0 && <span className="text-success fw-semibold mt-1 d-block" style={{ fontSize: 12 }}>Floor: {sqft} sq ft</span>}
            </div>
        </div>
    );
}

/* ─── Per-room material selector ─────────────────────────────────────────── */
const FLOOR_MATERIALS_OPTS = [
    { value: "hardwood", label: "Hardwood", emoji: "🪵", sub: "$$$" },
    { value: "engineered_wood", label: "Engineered Wood", emoji: "🪵", sub: "$$" },
    { value: "laminate", label: "Laminate", emoji: "📋", sub: "$" },
    { value: "vinyl_plank", label: "Vinyl / LVP", emoji: "🟫", sub: "$" },
    { value: "tile_ceramic", label: "Ceramic Tile", emoji: "🟦", sub: "$$" },
    { value: "tile_porcelain", label: "Porcelain Tile", emoji: "⬜", sub: "$$$" },
    { value: "carpet", label: "Carpet", emoji: "🟩", sub: "$" },
    { value: "concrete", label: "Concrete", emoji: "⬛", sub: "$$" },
];

const FLOOR_CURRENT_OPTS = [
    { value: "bare_concrete", label: "Bare concrete", emoji: "⬛" },
    { value: "old_carpet", label: "Old carpet", emoji: "🟩" },
    { value: "old_hardwood", label: "Old hardwood", emoji: "🪵" },
    { value: "old_tile", label: "Old tile", emoji: "🟦" },
    { value: "old_vinyl", label: "Old vinyl", emoji: "🟫" },
    { value: "already_removed", label: "Already removed", emoji: "✅" },
];

const MAT_COLORS = {
    hardwood: "#92400e", engineered_wood: "#a16207", laminate: "#0369a1",
    vinyl_plank: "#7c3aed", tile_ceramic: "#0891b2", tile_porcelain: "#374151",
    carpet: "#15803d", concrete: "#6b7280",
};

function RoomMaterialSelector({ rooms, roomMaterials, onChange, errors }) {
    const [openRoom, setOpenRoom] = useState(rooms[0]?.name || null);

    const getMat = name => roomMaterials[name]?.material || null;
    const getCur = name => roomMaterials[name]?.current || null;

    const applyToAll = (field, value) => rooms.forEach(r => onChange(r.name, field, value));

    const setCount = rooms.filter(r => getMat(r.name)).length;

    return (
        <div>
            {/* Quick apply to all */}
            <div className="card border mb-3" style={{ background: "#fffbeb" }}>
                <div className="card-header py-2 px-3 border-bottom fw-semibold small"
                    style={{ background: "#fef3c7" }}>
                    ⚡ Same material in all rooms?
                </div>
                <div className="card-body py-2 px-3">
                    <p className="text-muted mb-2" style={{ fontSize: 12 }}>Tap to apply to every room at once:</p>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                        {FLOOR_MATERIALS_OPTS.map(m => (
                            <button key={m.value} type="button"
                                onClick={() => applyToAll("material", m.value)}
                                className="btn btn-sm btn-outline-secondary">
                                {m.emoji} {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-muted mb-2 mt-2" style={{ fontSize: 12 }}>Current floor in all rooms:</p>
                    <div className="d-flex flex-wrap gap-1">
                        {FLOOR_CURRENT_OPTS.map(c => (
                            <button key={c.value} type="button"
                                onClick={() => applyToAll("current", c.value)}
                                className="btn btn-sm btn-outline-secondary">
                                {c.emoji} {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <p className="fw-medium mb-2" style={{ fontSize: 13 }}>Per-room (tap to expand):</p>

            {rooms.map((room, idx) => {
                const mat = getMat(room.name);
                const cur = getCur(room.name);
                const matObj = FLOOR_MATERIALS_OPTS.find(m => m.value === mat);
                const curObj = FLOOR_CURRENT_OPTS.find(c => c.value === cur);
                const isOpen = openRoom === room.name;
                const sqft = room.floor_sqft || (room.length_ft && room.width_ft
                    ? parseFloat(room.length_ft) * parseFloat(room.width_ft) : 0);

                return (
                    <div key={room.name || idx} className="card border mb-2 overflow-hidden">
                        <button type="button"
                            className="card-header py-2 px-3 text-start w-100 border-0 d-flex justify-content-between align-items-center"
                            style={{ background: mat ? "#f0fdf4" : "#fafafa", cursor: "pointer" }}
                            onClick={() => setOpenRoom(isOpen ? null : room.name)}>
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="fw-semibold" style={{ fontSize: 14 }}>{room.name}</span>
                                {sqft > 0 && <span className="text-muted" style={{ fontSize: 12 }}>{Number(sqft).toFixed(0)} sq ft</span>}
                            </div>
                            <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                {mat ? (
                                    <span className="badge rounded-pill px-2 py-1"
                                        style={{ background: MAT_COLORS[mat] || "#374151", color: "#fff", fontSize: 11 }}>
                                        {matObj?.emoji} {matObj?.label}
                                        {cur ? ` · ${curObj?.emoji || ""} ${curObj?.label || ""}` : " · current?"}
                                    </span>
                                ) : (
                                    <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: 11 }}>⚠ Not set</span>
                                )}
                                <span className="text-muted">{isOpen ? "▲" : "▼"}</span>
                            </div>
                        </button>

                        {isOpen && (
                            <div className="card-body py-2 px-3">
                                <p className="fw-medium mb-2" style={{ fontSize: 12, color: "#374151" }}>New material for <strong>{room.name}</strong>:</p>
                                <div className="row g-1 row-cols-2 row-cols-md-4 mb-3">
                                    {FLOOR_MATERIALS_OPTS.map(m => {
                                        const sel = mat === m.value;
                                        return (
                                            <div key={m.value} className="col">
                                                <button type="button"
                                                    onClick={() => onChange(room.name, "material", sel ? null : m.value)}
                                                    className={`w-100 btn text-start py-2 px-2 ${sel ? "btn-dark" : "btn-outline-secondary"}`}
                                                    style={{ minHeight: 60 }}>
                                                    <span className="d-block" style={{ fontSize: 18 }}>{m.emoji}</span>
                                                    <span className="d-block fw-medium" style={{ fontSize: 12 }}>{m.label}</span>
                                                    <span style={{ fontSize: 10, color: sel ? "#86efac" : "#9ca3af" }}>{m.sub}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                <p className="fw-medium mb-2" style={{ fontSize: 12, color: "#374151" }}>Current floor in <strong>{room.name}</strong>:</p>
                                <div className="d-flex flex-wrap gap-1 mb-2">
                                    {FLOOR_CURRENT_OPTS.map(c => {
                                        const sel = cur === c.value;
                                        return (
                                            <button key={c.value} type="button"
                                                onClick={() => onChange(room.name, "current", sel ? null : c.value)}
                                                className={`btn btn-sm ${sel ? "btn-dark" : "btn-outline-secondary"}`}>
                                                {c.emoji} {c.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {rooms[idx + 1] && mat && cur && (
                                    <button type="button"
                                        className="btn btn-outline-success btn-sm w-100 mt-2"
                                        onClick={() => setOpenRoom(rooms[idx + 1].name)}>
                                        Next: {rooms[idx + 1].name} →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {setCount === rooms.length && rooms.length > 0 ? (
                <div className="alert alert-success d-flex gap-2 py-2 mt-1" style={{ fontSize: 13 }}>
                    <span>✅</span><span>All {rooms.length} room{rooms.length > 1 ? "s" : ""} set — ready to continue</span>
                </div>
            ) : (
                <div className="alert alert-warning d-flex gap-2 py-2 mt-1" style={{ fontSize: 13 }}>
                    <span>⚠</span><span>{setCount} of {rooms.length} rooms set — tap each to choose material</span>
                </div>
            )}
            {errors?.room_materials && (
                <p className="text-danger mt-1" style={{ fontSize: 13 }}>⚠ {errors.room_materials}</p>
            )}
        </div>
    );
}


// ── PRESET TEMPLATES — common materials per job type ─────────────────────────
const PAINT_PRESETS = [
    { name: "Interior paint", category: "paint", unit: "gallon", unit_cost: 45, qty: 2 },
    { name: "Primer", category: "paint", unit: "gallon", unit_cost: 35, qty: 1 },
    { name: "Exterior paint", category: "paint", unit: "gallon", unit_cost: 55, qty: 2 },
    { name: "Spray paint", category: "paint", unit: "can", unit_cost: 12, qty: 3 },
];

const PAINT_SUPPLY_PRESETS = [
    { name: "Painter's tape", category: "supplies", unit: "roll", unit_cost: 8, qty: 4 },
    { name: "Drop cloth", category: "supplies", unit: "piece", unit_cost: 15, qty: 2 },
    { name: "Paint roller", category: "supplies", unit: "piece", unit_cost: 12, qty: 2 },
    { name: "Sandpaper", category: "supplies", unit: "pack", unit_cost: 10, qty: 2 },
    { name: "Caulk", category: "supplies", unit: "tube", unit_cost: 7, qty: 3 },
    { name: "Putty / spackle", category: "supplies", unit: "tub", unit_cost: 12, qty: 1 },
];

const FLOOR_PRESETS = [
    { name: "Hardwood flooring", category: "flooring", unit: "sq ft", unit_cost: 6, qty: 0 },
    { name: "Engineered wood", category: "flooring", unit: "sq ft", unit_cost: 5, qty: 0 },
    { name: "Laminate planks", category: "flooring", unit: "sq ft", unit_cost: 3, qty: 0 },
    { name: "Vinyl / LVP planks", category: "flooring", unit: "sq ft", unit_cost: 2.5, qty: 0 },
    { name: "Ceramic tile", category: "flooring", unit: "sq ft", unit_cost: 4, qty: 0 },
    { name: "Porcelain tile", category: "flooring", unit: "sq ft", unit_cost: 6, qty: 0 },
    { name: "Carpet", category: "flooring", unit: "sq ft", unit_cost: 3, qty: 0 },
];

const FLOOR_SUPPLY_PRESETS = [
    { name: "Flooring adhesive", category: "adhesive", unit: "gallon", unit_cost: 35, qty: 1 },
    { name: "Grout", category: "adhesive", unit: "bag", unit_cost: 18, qty: 2 },
    { name: "Thinset mortar", category: "adhesive", unit: "bag", unit_cost: 22, qty: 3 },
    { name: "Self-leveling compound", category: "prep", unit: "bag", unit_cost: 40, qty: 2 },
    { name: "Moisture barrier", category: "prep", unit: "roll", unit_cost: 55, qty: 1 },
    { name: "Underlayment", category: "prep", unit: "roll", unit_cost: 45, qty: 1 },
    { name: "Transition strips", category: "hardware", unit: "piece", unit_cost: 18, qty: 2 },
    { name: "Baseboard molding", category: "hardware", unit: "lin ft", unit_cost: 3, qty: 0 },
    { name: "Staples / nails", category: "hardware", unit: "box", unit_cost: 12, qty: 1 },
];

const CATEGORY_COLORS = {
    paint: { bg: "#eff6ff", border: "#bfdbfe", badge: "#1d4ed8", text: "Paint" },
    supplies: { bg: "#f0fdf4", border: "#bbf7d0", badge: "#15803d", text: "Supplies" },
    flooring: { bg: "#fffbeb", border: "#fde68a", badge: "#92400e", text: "Flooring" },
    adhesive: { bg: "#fdf4ff", border: "#e9d5ff", badge: "#7c3aed", text: "Adhesive" },
    prep: { bg: "#fff7ed", border: "#fed7aa", badge: "#c2410c", text: "Prep" },
    hardware: { bg: "#f8fafc", border: "#cbd5e1", badge: "#374151", text: "Hardware" },
    other: { bg: "#f9fafb", border: "#e5e7eb", badge: "#6b7280", text: "Other" },
};

const UNITS = ["sq ft", "gallon", "bag", "roll", "box", "piece", "can", "tube", "tub", "lin ft", "yard", "lb", "each"];

function newMaterial(overrides = {}) {
    return {
        id: Date.now() + Math.random(),
        name: "",
        category: "other",
        quantity: 1,
        unit: "piece",
        unit_cost: 0,
        notes: "",
        ...overrides,
    };
}

function MaterialsSection({ materials = [], onChange, estimateType = "painting" }) {
    const [showPresets, setShowPresets] = useState(false);

    const isPainting = ["painting", "both"].includes(estimateType);
    const isFlooring = ["flooring", "both"].includes(estimateType);

    const totalCost = materials.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);

    const addMaterial = (preset = null) => {
        const mat = preset
            ? { ...newMaterial(), ...preset, id: Date.now() + Math.random(), quantity: preset.qty || 1 }
            : newMaterial();
        onChange([...materials, mat]);
        setShowPresets(false);
    };

    const updateMaterial = (id, field, value) => {
        onChange(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    const removeMaterial = (id) => {
        onChange(materials.filter(m => m.id !== id));
    };

    const presets = [
        ...(isPainting ? PAINT_PRESETS : []),
        ...(isPainting ? PAINT_SUPPLY_PRESETS : []),
        ...(isFlooring ? FLOOR_PRESETS : []),
        ...(isFlooring ? FLOOR_SUPPLY_PRESETS : []),
    ];

    return (
        <div>
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-1">
                <div>
                    <h6 className="fw-semibold mb-0">🛒 Materials to purchase</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>
                        Track what you need to buy for this job. Costs are included in your quote automatically.
                    </p>
                </div>
                {materials.length > 0 && totalCost > 0 && (
                    <div className="text-end flex-shrink-0 ms-3">
                        <p className="text-muted mb-0" style={{ fontSize: 11 }}>Materials cost</p>
                        <p className="fw-bold text-danger mb-0" style={{ fontSize: 18 }}>
                            ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                )}
            </div>

            {/* Alert if client provides materials */}
            <div className="alert alert-info d-flex gap-2 py-2 mt-2 mb-3" style={{ fontSize: 13 }}>
                <span>💡</span>
                <span>Only add materials <strong>you</strong> are buying. If the client provides materials, skip this section and use the "Client provides paint" toggle in painting details.</span>
            </div>

            {/* Material rows */}
            {materials.length > 0 && (
                <div className="mb-3">
                    {materials.map((mat, idx) => {
                        const cat = CATEGORY_COLORS[mat.category] || CATEGORY_COLORS.other;
                        const rowTotal = (parseFloat(mat.quantity) || 0) * (parseFloat(mat.unit_cost) || 0);
                        return (
                            <div key={mat.id}
                                className="rounded-3 p-3 mb-2"
                                style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>

                                {/* Row header */}
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="badge rounded-pill" style={{ background: cat.badge, color: "#fff", fontSize: 10 }}>
                                        {cat.text}
                                    </span>
                                    <input
                                        className="form-control form-control-sm fw-semibold border-0 bg-transparent shadow-none flex-fill"
                                        style={{ outline: "none", fontSize: 14 }}
                                        value={mat.name}
                                        onChange={e => updateMaterial(mat.id, "name", e.target.value)}
                                        placeholder="Material name (e.g. Interior paint)"
                                    />
                                    <button type="button"
                                        className="btn-close flex-shrink-0"
                                        style={{ fontSize: 10 }}
                                        onClick={() => removeMaterial(mat.id)} />
                                </div>

                                {/* Category + qty + unit + cost */}
                                <div className="row g-2">
                                    <div className="col-12 col-sm-3">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Category</label>
                                        <select className="form-select form-select-sm"
                                            value={mat.category}
                                            onChange={e => updateMaterial(mat.id, "category", e.target.value)}>
                                            {Object.entries(CATEGORY_COLORS).map(([k, v]) => (
                                                <option key={k} value={k}>{v.text}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Quantity</label>
                                        <input type="number" inputMode="decimal" className="form-control form-control-sm"
                                            value={mat.quantity}
                                            min={0} step={0.5}
                                            onChange={e => updateMaterial(mat.id, "quantity", e.target.value)} />
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Unit</label>
                                        <select className="form-select form-select-sm"
                                            value={mat.unit}
                                            onChange={e => updateMaterial(mat.id, "unit", e.target.value)}>
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Unit cost ($)</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text">$</span>
                                            <input type="number" inputMode="decimal" className="form-control"
                                                value={mat.unit_cost}
                                                min={0} step={0.01}
                                                onChange={e => updateMaterial(mat.id, "unit_cost", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-6 col-sm-3 d-flex align-items-end">
                                        <div className="w-100 text-end py-1">
                                            <span className="text-muted" style={{ fontSize: 11 }}>Subtotal</span>
                                            <p className="fw-bold mb-0" style={{ fontSize: 14 }}>
                                                ${rowTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Optional notes */}
                                <div className="mt-2">
                                    <input className="form-control form-control-sm border-0 bg-transparent shadow-none"
                                        style={{ fontSize: 12, color: "#6b7280" }}
                                        placeholder="Notes (brand, color, SKU…)"
                                        value={mat.notes}
                                        onChange={e => updateMaterial(mat.id, "notes", e.target.value)} />
                                </div>
                            </div>
                        );
                    })}

                    {/* Total bar */}
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                        style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted fw-medium" style={{ fontSize: 13 }}>Total materials cost</span>
                        <span className="fw-bold text-danger" style={{ fontSize: 16 }}>
                            ${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            )}

            {/* Add buttons */}
            <div className="d-flex gap-2 flex-wrap">
                <button type="button"
                    className="btn btn-outline-secondary btn-sm"
                    style={{ borderStyle: "dashed" }}
                    onClick={() => addMaterial()}>
                    + Add material
                </button>
                {presets.length > 0 && (
                    <button type="button"
                        className={`btn btn-sm ${showPresets ? "btn-dark" : "btn-outline-secondary"}`}
                        onClick={() => setShowPresets(p => !p)}>
                        ⚡ Quick add from list {showPresets ? "▲" : "▼"}
                    </button>
                )}
            </div>

            {/* Preset picker */}
            {showPresets && (
                <div className="mt-2 p-3 rounded-3 border" style={{ background: "#fafafa" }}>
                    <p className="fw-semibold mb-2" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6b7280" }}>
                        Common materials — tap to add
                    </p>
                    <div className="d-flex flex-wrap gap-1">
                        {presets.map((p, i) => {
                            const cat = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;
                            return (
                                <button key={i} type="button"
                                    onClick={() => addMaterial(p)}
                                    className="btn btn-sm"
                                    style={{
                                        background: cat.bg, border: `1px solid ${cat.border}`,
                                        color: "#374151", fontSize: 12
                                    }}>
                                    {p.name}
                                    <span className="ms-1 text-muted" style={{ fontSize: 10 }}>
                                        ${p.unit_cost}/{p.unit}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}


/* ─── Step bar ───────────────────────────────────────────────────────────── */
const STEPS = ["Type", "Client", "Rooms", "Details", "Materials", "Extras", "Review"];

function StepBar({ step }) {
    return (
        <div className="mb-4">
            <div className="d-none d-md-flex justify-content-between align-items-center position-relative mb-3">
                <div className="position-absolute top-50 start-0 end-0 translate-middle-y bg-secondary bg-opacity-25"
                    style={{ height: 2, zIndex: 0 }} />
                {STEPS.map((s, i) => (
                    <div key={i} className="d-flex flex-column align-items-center" style={{ position: "relative", zIndex: 1 }}>
                        <div className={`rounded-circle d-flex align-items-center justify-content-center fw-bold
                            ${i < step ? "bg-success text-white" : i === step ? "bg-dark text-white" : "bg-white text-muted border border-secondary"}`}
                            style={{ width: 38, height: 38, fontSize: 14, border: i < step || i === step ? "none" : "2px solid" }}>
                            {i < step ? "✓" : i + 1}
                        </div>
                        <span className={`mt-1 ${i === step ? "fw-semibold text-dark" : "text-muted"}`} style={{ fontSize: 12 }}>{s}</span>
                    </div>
                ))}
            </div>
            <div className="d-md-none">
                <div className="d-flex gap-1 mb-2">
                    {STEPS.map((_, i) => (
                        <div key={i} className="flex-fill rounded"
                            style={{ height: 5, background: i <= step ? "#212529" : "#dee2e6", transition: "background .2s" }} />
                    ))}
                </div>
                <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                    Step {step + 1} of {STEPS.length} — <strong className="text-dark">{STEPS[step]}</strong>
                </p>
            </div>
        </div>
    );
}

function SectionTitle({ text }) {
    return <p className="text-uppercase fw-semibold text-muted mb-2" style={{ fontSize: 11, letterSpacing: "0.06em" }}>{text}</p>;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */
const PAINT_CONDITIONS = [
    { value: "new_drywall", label: "New drywall", emoji: "🆕", sub: "Never painted" },
    { value: "same_color", label: "Same color", emoji: "🔄", sub: "Repaint same shade" },
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
    const { store } = useGlobalReducer();
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({
        estimate_type: "painting",
        customer_name: "", customer_email: "", customer_phone: "", customer_address: "",
        preferred_date: "", budget_range: "", description: "",
        rooms: [{ name: "Living Room", length_ft: "", width_ft: "", height_ft: "" }],
        // work scope
        paint_scope: [], floor_scope: [],
        // paint
        paint_surface_condition: "", paint_coats: "2",
        paint_type: "interior_standard", paint_finish: "eggshell",
        include_ceiling: false, include_trim: false, include_doors: false,
        door_count: 0, window_count: 0, client_provides_paint: false,
        desired_colors: "", repairs_needed: false, repairs_detail: "",
        // flooring — global fallback for backend + calculator
        flooring_material: "", flooring_current: "", include_removal: false,
        subfloor_condition: "unknown", flooring_pattern: "straight",
        include_baseboards: false, transition_strips: 0,
        include_stairs: false, stair_count: 0,
        // per-room materials
        room_materials: {},
        materials: [],          // materials to purchase
        // extras
        furniture_rooms: 0, furniture_heavy: 0,
        moisture_barrier: false, floor_leveling: false,
        floor_leveling_mode: "sqft", floor_leveling_bags: 1,
        heavy_demo: false, travel_miles: 0, use_flat_travel: false,
    });

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isPainting = form.estimate_type === "painting" || form.estimate_type === "both";
    const isFlooring = form.estimate_type === "flooring" || form.estimate_type === "both";

    const updateRoom = (i, k, v) =>
        setForm(f => { const r = [...f.rooms]; r[i] = { ...r[i], [k]: v }; return { ...f, rooms: r }; });
    const addRoom = () =>
        setForm(f => ({ ...f, rooms: [...f.rooms, { name: `Room ${f.rooms.length + 1}`, length_ft: "", width_ft: "", height_ft: "" }] }));
    const removeRoom = i =>
        setForm(f => ({ ...f, rooms: f.rooms.filter((_, idx) => idx !== i) }));

    const updateRoomMaterial = (roomName, field, value) =>
        setForm(f => ({
            ...f,
            room_materials: {
                ...f.room_materials,
                [roomName]: { ...(f.room_materials[roomName] || {}), [field]: value }
            }
        }));

    const materialsCost = form.materials.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);
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
                e.paint_surface_condition = "Please select surface condition";
            if (isFlooring) {
                const namedRooms = form.rooms.filter(r => r.name.trim());


                const allSet = namedRooms.length > 0 && namedRooms.every(r => form.room_materials[r.name]?.material);
                if (!allSet) e.room_materials = "Please set flooring material for every room";
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        // Auto-remove rooms with no name when leaving the Rooms step
        if (step === 2) {
            setForm(f => ({ ...f, rooms: f.rooms.filter(r => r.name.trim()) }));
        }
        if (!validate()) return;
        setStep(s => s + 1);
        window.scrollTo(0, 0);
    };
    const back = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    const handleSubmit = async () => {
        setSubmitting(true);
        const token = localStorage.getItem("token");
        try {
            // Derive global flooring_material from most common per-room choice
            const matCounts = {};
            const curCounts = {};
            Object.values(form.room_materials).forEach(rm => {
                if (rm.material) matCounts[rm.material] = (matCounts[rm.material] || 0) + 1;
                if (rm.current) curCounts[rm.current] = (curCounts[rm.current] || 0) + 1;
            });
            const primaryMat = Object.entries(matCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || form.flooring_material;
            const primaryCur = Object.entries(curCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || form.flooring_current;

            // Build per-room material line for description prefix
            const roomMatLines = Object.entries(form.room_materials)
                .filter(([, v]) => v.material)
                .map(([name, v]) => `${name}: ${v.material.replace(/_/g, " ")}`)
                .join(", ");

            // Build scope prefix
            const scopeParts = [];
            if (form.paint_scope?.length) scopeParts.push("Painting: " + form.paint_scope.join(", "));
            if (form.floor_scope?.length) scopeParts.push("Flooring: " + form.floor_scope.join(", "));

            const descParts = [];
            if (scopeParts.length) descParts.push(scopeParts.join(" | "));
            if (roomMatLines) descParts.push("Materials: " + roomMatLines);
            if (form.description) descParts.push(form.description);

            // Sanitize rooms — empty string "" crashes Postgres NUMERIC columns.
            // Convert "" → null so the backend gets null instead of invalid input.
            const cleanRooms = form.rooms
                .filter(r => r.name.trim())
                .map(r => ({
                    name: r.name.trim(),
                    length_ft: r.length_ft !== "" && r.length_ft != null ? parseFloat(r.length_ft) : null,
                    width_ft: r.width_ft !== "" && r.width_ft != null ? parseFloat(r.width_ft) : null,
                    height_ft: r.height_ft !== "" && r.height_ft != null ? parseFloat(r.height_ft) : null,
                }));

            const payload = {
                ...form,
                flooring_material: primaryMat,
                flooring_current: primaryCur,
                description: descParts.join("\n"),
                rooms: cleanRooms,
            };

            const materialsJson = form.materials.length > 0
                ? JSON.stringify(form.materials.map(({ id: _id, ...rest }) => rest))
                : null;

            const est = await createEstimate({ ...payload, materials_json: materialsJson }, token);
            navigate(`/providerdashboard/estimates/${est.id}`);
        } catch (e) {
            alert(e.message || "Failed to create estimate");
        } finally {
            setSubmitting(false);
        }
    };

    const RevRow = ({ label, value }) => value ? (
        <div className="d-flex justify-content-between border-bottom py-2">
            <span className="text-muted" style={{ fontSize: 13 }}>{label}</span>
            <span className="fw-medium text-end ms-3" style={{ fontSize: 13 }}>{value}</span>
        </div>
    ) : null;

    const namedRooms = form.rooms.filter(r => r.name.trim());

    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => step === 0 ? navigate("/providerdashboard/estimates") : back()}>← Back</button>
                <div>
                    <h5 className="fw-bold mb-0">New estimate</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>Fill in each step — no hidden cost surprises</p>
                </div>
            </div>

            <StepBar step={step} />

            {/* ── STEP 0 — TYPE ─────────────────────────────────────────── */}
            {step === 0 && (
                <div>
                    <h6 className="fw-semibold mb-3">What type of work? <span className="text-danger">*</span></h6>
                    <div className="row g-3 mb-4">
                        {[
                            { value: "painting", label: "Painting", emoji: "🎨", sub: "Interior / exterior walls, ceilings, trim" },
                            { value: "flooring", label: "Flooring", emoji: "🪵", sub: "Hardwood, vinyl, tile, carpet installation" },
                            { value: "both", label: "Painting + Flooring", emoji: "🎨🪵", sub: "Combo project" },
                        ].map(o => (
                            <div key={o.value} className="col-12 col-md-4">
                                <button type="button" onClick={() => set("estimate_type", o.value)}
                                    className={`w-100 btn text-start p-3 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`}
                                    style={{ minHeight: 110 }}>
                                    <span className="d-block fs-2 mb-1">{o.emoji}</span>
                                    <span className="d-block fw-semibold">{o.label}</span>
                                    <span className="d-block text-muted" style={{ fontSize: 12 }}>{o.sub}</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    <h6 className="fw-semibold mb-1">Work scope <span className="text-muted fw-normal" style={{ fontSize: 13 }}>(optional)</span></h6>
                    <p className="text-muted mb-3" style={{ fontSize: 13 }}>Select all areas included — these appear on the PDF.</p>

                    {isPainting && (
                        <div className="mb-3">
                            <p className="fw-medium mb-2" style={{ fontSize: 13 }}>🎨 Painting scope</p>
                            <div className="d-flex flex-wrap gap-2">
                                {["Interior walls", "Exterior walls", "Ceilings", "Trim & baseboards", "Doors", "Cabinets", "Garage", "Deck / fence"].map(scope => {
                                    const sel = (form.paint_scope || []).includes(scope);
                                    return (
                                        <button key={scope} type="button"
                                            onClick={() => set("paint_scope", sel ? form.paint_scope.filter(s => s !== scope) : [...(form.paint_scope || []), scope])}
                                            className={`btn btn-sm ${sel ? "btn-dark" : "btn-outline-secondary"}`}>
                                            {sel ? "✓ " : ""}{scope}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    {isFlooring && (
                        <div className="mb-3">
                            <p className="fw-medium mb-2" style={{ fontSize: 13 }}>🪵 Flooring scope</p>
                            <div className="d-flex flex-wrap gap-2">
                                {["Living room", "Bedrooms", "Kitchen", "Bathrooms", "Hallway", "Stairs", "Basement", "Entire house"].map(scope => {
                                    const sel = (form.floor_scope || []).includes(scope);
                                    return (
                                        <button key={scope} type="button"
                                            onClick={() => set("floor_scope", sel ? form.floor_scope.filter(s => s !== scope) : [...(form.floor_scope || []), scope])}
                                            className={`btn btn-sm ${sel ? "btn-dark" : "btn-outline-secondary"}`}>
                                            {sel ? "✓ " : ""}{scope}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── STEP 1 — CLIENT ───────────────────────────────────────── */}
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
                                type="tel" placeholder="(555) 000-0000" value={form.customer_phone}
                                onChange={e => set("customer_phone", e.target.value)} />
                            {errors.customer_phone && <div className="invalid-feedback">{errors.customer_phone}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Email</label>
                            <input className="form-control" type="email" placeholder="john@email.com"
                                value={form.customer_email} onChange={e => set("customer_email", e.target.value)} />
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

            {/* ── STEP 2 — ROOMS ────────────────────────────────────────── */}
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
                    {form.rooms.map((r, i) => (
                        <RoomRow key={i} room={r} index={i} onChange={updateRoom} onRemove={removeRoom} />
                    ))}
                    <button type="button" onClick={addRoom}
                        className="btn btn-outline-secondary w-100 mt-1" style={{ borderStyle: "dashed" }}>
                        + Add room / area
                    </button>
                    {form.rooms.some(r => !r.name.trim()) && (
                        <p className="text-muted mt-2 mb-0" style={{ fontSize: 12 }}>
                            ⚠ Rooms without a name will be removed when you continue.
                        </p>
                    )}
                </div>
            )}

            {/* ── STEP 3 — DETAILS ──────────────────────────────────────── */}
            {step === 3 && (
                <div>
                    {isPainting && (
                        <>
                            <div className="alert alert-warning d-flex gap-2 align-items-start">
                                <span className="fs-5 flex-shrink-0">⚠️</span>
                                <div>
                                    <strong>Surface condition is the #1 profit protector.</strong>
                                    <span className="d-block" style={{ fontSize: 13 }}>Wrong choice = hidden costs. Choose carefully.</span>
                                </div>
                            </div>
                            <SectionTitle text="Surface condition *" />
                            <Chips options={PAINT_CONDITIONS} value={form.paint_surface_condition}
                                onChange={v => set("paint_surface_condition", v)} cols={2} />
                            {errors.paint_surface_condition && <p className="text-danger mt-2" style={{ fontSize: 13 }}>⚠ {errors.paint_surface_condition}</p>}
                            <hr className="my-4" />
                            <SectionTitle text="Paint type" />
                            <Chips options={PAINT_TYPES} value={form.paint_type} onChange={v => set("paint_type", v)} cols={3} />
                            <SectionTitle text="Finish" />
                            <Chips options={PAINT_FINISHES} value={form.paint_finish} onChange={v => set("paint_finish", v)} cols={3} />
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
                                    <Toggle id="t_cpaint" label="Client provides paint" sub="Reduces material cost" value={form.client_provides_paint} onChange={v => set("client_provides_paint", v)} />
                                    <Toggle id="t_repairs" label="Repairs / patching needed" sub="Cracks, holes, water damage" value={form.repairs_needed} onChange={v => set("repairs_needed", v)} />
                                    {form.repairs_needed && (
                                        <div className="py-2">
                                            <textarea className="form-control form-control-sm" rows={2}
                                                placeholder="Describe damage…"
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

                    {isFlooring && (
                        <>
                            {isPainting && <hr className="my-4" />}

                            {/* PER-ROOM MATERIAL SELECTOR — replaces global chips */}
                            <SectionTitle text="Flooring material per room *" />
                            {namedRooms.length === 0 ? (
                                <div className="alert alert-warning" style={{ fontSize: 13 }}>
                                    ⚠ Go back to Step 2 and add rooms first — materials are set per room
                                </div>
                            ) : (
                                <RoomMaterialSelector
                                    rooms={namedRooms}
                                    roomMaterials={form.room_materials}
                                    onChange={updateRoomMaterial}
                                    errors={errors}
                                />
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
                                    {form.include_stairs && <Counter label="Number of steps" value={form.stair_count} onChange={v => set("stair_count", v)} />}
                                    <Counter label="Transition strips" value={form.transition_strips} onChange={v => set("transition_strips", v)} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}


            {/* ── STEP 4 — MATERIALS ────────────────────────────────── */}
            {step === 4 && (
                <MaterialsSection
                    materials={form.materials}
                    onChange={mats => set("materials", mats)}
                    estimateType={form.estimate_type}
                />
            )}

            {/* ── STEP 5 — EXTRAS ───────────────────────────────────────── */}
            {step === 5 && (
                <div>
                    <h6 className="fw-semibold mb-1">Job extras</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>
                        The details most contractors forget to charge for. The price calculator includes these automatically.
                    </p>
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                            🪑 Furniture moving
                            <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— workers tire before install starts</span>
                        </div>
                        <div className="card-body py-1 px-3">
                            <Counter label="Standard rooms" sub="Sofa, bed, dresser — per room" value={form.furniture_rooms} onChange={v => set("furniture_rooms", v)} />
                            <Counter label="Heavy items" sub="Fridge, piano, pool table, safe — per item" value={form.furniture_heavy} onChange={v => set("furniture_heavy", v)} />
                        </div>
                    </div>
                    {isFlooring && (
                        <div className="card border bg-light mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                🔧 Prep work <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— where profit is won or lost</span>
                            </div>
                            <div className="card-body py-1 px-3">
                                {form.include_removal && (
                                    <Toggle id="x_heavydemo" label="Heavy demo" sub="Tile, glued hardwood, thinset grinding" value={form.heavy_demo} onChange={v => set("heavy_demo", v)} />
                                )}
                                <Toggle id="x_moisture" label="Moisture barrier needed" sub="Required for LVP, laminate, engineered on concrete" value={form.moisture_barrier} onChange={v => set("moisture_barrier", v)} />
                                <Toggle id="x_leveling" label="Floor leveling needed" sub="Uneven subfloor — biggest hidden cost" value={form.floor_leveling} onChange={v => set("floor_leveling", v)} />
                                {form.floor_leveling && (
                                    <div className="py-2 ps-2">
                                        <div className="d-flex gap-2 mb-2">
                                            {[{ value: "sqft", label: "Per sq ft" }, { value: "bag", label: "Per bag" }].map(o => (
                                                <button key={o.value} type="button"
                                                    onClick={() => set("floor_leveling_mode", o.value)}
                                                    className={`btn btn-sm ${form.floor_leveling_mode === o.value ? "btn-dark" : "btn-outline-secondary"}`}>{o.label}</button>
                                            ))}
                                        </div>
                                        {form.floor_leveling_mode === "bag" && (
                                            <Counter label="Estimated bags" sub="~50 sq ft per bag at 1/8 inch depth" value={form.floor_leveling_bags} onChange={v => set("floor_leveling_bags", v)} min={1} />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                            🚗 Travel <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— far jobs become unprofitable without this</span>
                        </div>
                        <div className="card-body py-1 px-3">
                            <Counter label="One-way miles" sub="Leave at 0 for local jobs" value={form.travel_miles} onChange={v => set("travel_miles", v)} min={0} />
                            {form.travel_miles > 0 && (
                                <Toggle id="x_flat" label="Charge flat travel fee instead of per-mile" value={form.use_flat_travel} onChange={v => set("use_flat_travel", v)} />
                            )}
                        </div>
                    </div>
                    <div className="alert alert-info d-flex gap-2 align-items-start" style={{ fontSize: 13 }}>
                        <span>🛡️</span>
                        <div><strong>Minimum job fee</strong> is applied automatically by the calculator if total falls below your minimum. Set it in <strong>Settings → My rates</strong>.</div>
                    </div>
                </div>
            )}

            {/* ── STEP 6 — REVIEW ───────────────────────────────────────── */}
            {step === 6 && (
                <div>
                    <h6 className="fw-semibold mb-1">Review before creating</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>Double-check everything is correct</p>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className="badge bg-dark fs-6 px-3 py-2">
                            {form.estimate_type === "painting" ? "🎨 Painting" : form.estimate_type === "flooring" ? "🪵 Flooring" : "🎨🪵 Painting + Flooring"}
                        </span>
                        {totalSqft > 0 && <span className="badge bg-success fs-6 px-3 py-2">📐 {totalSqft.toFixed(0)} sq ft</span>}
                        {materialsCost > 0 && <span className="badge bg-danger fs-6 px-3 py-2">🛒 ${materialsCost.toFixed(2)} materials</span>}
                    </div>

                    {(form.paint_scope?.length > 0 || form.floor_scope?.length > 0) && (
                        <div className="d-flex flex-wrap gap-1 mb-3">
                            {form.paint_scope?.map(s => <span key={s} className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: 12 }}>🎨 {s}</span>)}
                            {form.floor_scope?.map(s => <span key={s} className="badge bg-secondary bg-opacity-10 text-secondary border" style={{ fontSize: 12 }}>🪵 {s}</span>)}
                        </div>
                    )}

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
                                <div className="d-flex justify-content-between pt-2 fw-semibold">
                                    <span style={{ fontSize: 13 }}>Total</span>
                                    <span className="text-success" style={{ fontSize: 13 }}>{totalSqft.toFixed(0)} sq ft</span>
                                </div>
                            </div>
                        </div>
                    )}

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

                    {isFlooring && namedRooms.some(r => form.room_materials[r.name]?.material) && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">🪵 Flooring</div>
                            <div className="card-body py-2 px-3">
                                <RevRow label="Pattern" value={form.flooring_pattern} />
                                <RevRow label="Removal" value={form.include_removal ? "Included" : null} />
                                <RevRow label="Baseboards" value={form.include_baseboards ? "Yes" : null} />
                                <RevRow label="Stairs" value={form.include_stairs ? `${form.stair_count} steps` : null} />
                                <RevRow label="Transitions" value={form.transition_strips > 0 ? form.transition_strips : null} />
                            </div>
                        </div>
                    )}

                    {form.materials.length > 0 && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small d-flex justify-content-between">
                                <span>🛒 Materials to purchase</span>
                                <span className="text-danger fw-bold">${materialsCost.toFixed(2)}</span>
                            </div>
                            <div className="card-body py-2 px-3">
                                {form.materials.map((m, i) => {
                                    const rowTotal = (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0);
                                    const cat = CATEGORY_COLORS[m.category] || CATEGORY_COLORS.other;
                                    return (
                                        <div key={i} className="d-flex justify-content-between align-items-center border-bottom py-2">
                                            <div>
                                                <span className="badge rounded-pill me-1" style={{ background: cat.badge, color: "#fff", fontSize: 9 }}>{cat.text}</span>
                                                <span style={{ fontSize: 13 }}>{m.name || "—"}</span>
                                                <span className="text-muted ms-2" style={{ fontSize: 12 }}>{m.quantity} {m.unit}</span>
                                            </div>
                                            <span className="fw-medium text-danger" style={{ fontSize: 13 }}>{rowTotal.toFixed(2)}</span>
                                        </div>
                                    );
                                })}
                                <div className="d-flex justify-content-between pt-2 fw-semibold">
                                    <span style={{ fontSize: 13 }}>Total</span>
                                    <span className="text-danger" style={{ fontSize: 13 }}>${materialsCost.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {(form.furniture_rooms > 0 || form.furniture_heavy > 0 || form.moisture_barrier ||
                        form.floor_leveling || form.heavy_demo || form.travel_miles > 0) && (
                            <div className="card border mb-3">
                                <div className="card-header bg-light py-2 fw-semibold small">🔧 Extras</div>
                                <div className="card-body py-2 px-3">
                                    {form.furniture_rooms > 0 && <RevRow label="Furniture rooms" value={`${form.furniture_rooms} room${form.furniture_rooms > 1 ? "s" : ""}`} />}
                                    {form.furniture_heavy > 0 && <RevRow label="Heavy items" value={`${form.furniture_heavy} item${form.furniture_heavy > 1 ? "s" : ""}`} />}
                                    {form.moisture_barrier && <RevRow label="Moisture barrier" value="Yes — included" />}
                                    {form.floor_leveling && <RevRow label="Floor leveling" value={form.floor_leveling_mode === "bag" ? `${form.floor_leveling_bags} bags` : "Per sq ft"} />}
                                    {form.heavy_demo && <RevRow label="Heavy demo" value="Yes" />}
                                    {form.travel_miles > 0 && <RevRow label="Travel" value={form.use_flat_travel ? `Flat fee — ${form.travel_miles} miles` : `${form.travel_miles} miles`} />}
                                </div>
                            </div>
                        )}
                </div>
            )}

            {/* ── STICKY NAV ────────────────────────────────────────────── */}
            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                {step > 0 && (
                    <button type="button" onClick={back} className="btn btn-outline-secondary px-4">← Back</button>
                )}
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn btn-dark flex-fill fw-semibold">Continue →</button>
                ) : (
                    <button type="button" onClick={handleSubmit} disabled={submitting}
                        className="btn btn-success flex-fill fw-semibold">
                        {submitting ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : "✓ Create estimate"}
                    </button>
                )}
            </div>
        </div>
    );
}