
import { useState } from "react";

export function Chips({ options, value, onChange, cols = 2 }) {
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
export function Toggle({ id, label, sub, value, onChange }) {
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

/* ─── Counter ────────────────────────────────────────────────────────────── */
export function Counter({ label, sub, value, onChange, min = 0 }) {
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

export function SectionTitle({ text }) {
    return <p className="text-uppercase fw-semibold text-muted mb-2 mt-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>{text}</p>;
}

/* ─── Room row (basic add/edit, used in Create flow) ─────────────────────── */
export function RoomRow({ room, index, onChange, onRemove }) {
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

/* ─── Constants — identical to estimate system ────────────────────────────── */
export const FLOOR_MATERIALS_OPTS = [
    { value: "hardwood", label: "Hardwood", emoji: "🪵", sub: "$$$" },
    { value: "engineered_wood", label: "Engineered Wood", emoji: "🪵", sub: "$$" },
    { value: "laminate", label: "Laminate", emoji: "📋", sub: "$" },
    { value: "vinyl_plank", label: "Vinyl / LVP", emoji: "🟫", sub: "$" },
    { value: "tile_ceramic", label: "Ceramic Tile", emoji: "🟦", sub: "$$" },
    { value: "tile_porcelain", label: "Porcelain Tile", emoji: "⬜", sub: "$$$" },
    { value: "carpet", label: "Carpet", emoji: "🟩", sub: "$" },
    { value: "concrete", label: "Concrete", emoji: "⬛", sub: "$$" },
];

export const FLOOR_CURRENT_OPTS = [
    { value: "bare_concrete", label: "Bare concrete", emoji: "⬛" },
    { value: "old_carpet", label: "Old carpet", emoji: "🟩" },
    { value: "old_hardwood", label: "Old hardwood", emoji: "🪵" },
    { value: "old_tile", label: "Old tile", emoji: "🟦" },
    { value: "old_vinyl", label: "Old vinyl", emoji: "🟫" },
    { value: "already_removed", label: "Already removed", emoji: "✅" },
];

export const MAT_COLORS = {
    hardwood: "#92400e", engineered_wood: "#a16207", laminate: "#0369a1",
    vinyl_plank: "#7c3aed", tile_ceramic: "#0891b2", tile_porcelain: "#374151",
    carpet: "#15803d", concrete: "#6b7280",
};

export const PAINT_CONDITIONS = [
    { value: "new_drywall", label: "New drywall", emoji: "🆕", sub: "Never painted" },
    { value: "same_color", label: "Same color", emoji: "🔄", sub: "Repaint same shade" },
    { value: "color_change", label: "Color change", emoji: "🎨", sub: "Different color", warning: "Extra coat" },
    { value: "dark_to_light", label: "Dark → Light", emoji: "☀️", sub: "Big contrast", warning: "Primer + extra coats" },
    { value: "damaged", label: "Needs repairs", emoji: "🔧", sub: "Cracks, holes…", warning: "Extra labor cost" },
];
export const PAINT_TYPES = [
    { value: "interior_standard", label: "Interior standard", emoji: "🏠" },
    { value: "interior_premium", label: "Interior premium", emoji: "⭐" },
    { value: "exterior_standard", label: "Exterior standard", emoji: "🌤" },
    { value: "exterior_premium", label: "Exterior premium", emoji: "🌟" },
    { value: "primer_only", label: "Primer only", emoji: "🔳" },
];
export const PAINT_FINISHES = [
    { value: "flat", label: "Flat / Matte", emoji: "▫️", sub: "Ceilings" },
    { value: "eggshell", label: "Eggshell", emoji: "🥚", sub: "Living rooms" },
    { value: "satin", label: "Satin", emoji: "✨", sub: "Kitchens" },
    { value: "semi_gloss", label: "Semi-gloss", emoji: "💧", sub: "Trim, doors" },
    { value: "gloss", label: "Gloss", emoji: "💎", sub: "Cabinets" },
];
export const FLOOR_PATTERNS = [
    { value: "straight", label: "Straight", emoji: "➡️" },
    { value: "diagonal_45", label: "Diagonal 45°", emoji: "↗️" },
    { value: "herringbone", label: "Herringbone", emoji: "〽️" },
    { value: "chevron", label: "Chevron", emoji: "⌄" },
];

/* ─── Per-room material selector (identical to estimate system) ──────────── */
export function RoomMaterialSelector({ rooms, roomMaterials, onChange, errors }) {
    const [openRoom, setOpenRoom] = useState(rooms[0]?.name || null);

    const getMat = name => roomMaterials[name]?.material || null;
    const getCur = name => roomMaterials[name]?.current || null;
    const applyToAll = (field, value) => rooms.forEach(r => onChange(r.name, field, value));
    const setCount = rooms.filter(r => getMat(r.name)).length;

    return (
        <div>
            <div className="card border mb-3" style={{ background: "#fffbeb" }}>
                <div className="card-header py-2 px-3 border-bottom fw-semibold small" style={{ background: "#fef3c7" }}>
                    ⚡ Same material in all rooms?
                </div>
                <div className="card-body py-2 px-3">
                    <p className="text-muted mb-2" style={{ fontSize: 12 }}>Tap to apply to every room at once:</p>
                    <div className="d-flex flex-wrap gap-1 mb-2">
                        {FLOOR_MATERIALS_OPTS.map(m => (
                            <button key={m.value} type="button" onClick={() => applyToAll("material", m.value)} className="btn btn-sm btn-outline-secondary">
                                {m.emoji} {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-muted mb-2 mt-2" style={{ fontSize: 12 }}>Current floor in all rooms:</p>
                    <div className="d-flex flex-wrap gap-1">
                        {FLOOR_CURRENT_OPTS.map(c => (
                            <button key={c.value} type="button" onClick={() => applyToAll("current", c.value)} className="btn btn-sm btn-outline-secondary">
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
                                    <span className="badge rounded-pill px-2 py-1" style={{ background: MAT_COLORS[mat] || "#374151", color: "#fff", fontSize: 11 }}>
                                        {matObj?.emoji} {matObj?.label}{cur ? ` · ${curObj?.emoji || ""} ${curObj?.label || ""}` : " · current?"}
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
                                                <button type="button" onClick={() => onChange(room.name, "material", sel ? null : m.value)}
                                                    className={`w-100 btn text-start py-2 px-2 ${sel ? "btn-dark" : "btn-outline-secondary"}`} style={{ minHeight: 60 }}>
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
                                            <button key={c.value} type="button" onClick={() => onChange(room.name, "current", sel ? null : c.value)}
                                                className={`btn btn-sm ${sel ? "btn-dark" : "btn-outline-secondary"}`}>
                                                {c.emoji} {c.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                {rooms[idx + 1] && mat && cur && (
                                    <button type="button" className="btn btn-outline-success btn-sm w-100 mt-2" onClick={() => setOpenRoom(rooms[idx + 1].name)}>
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
            {errors?.room_materials && <p className="text-danger mt-1" style={{ fontSize: 13 }}>⚠ {errors.room_materials}</p>}
        </div>
    );
}

/* ─── Materials section (identical to estimate system) ───────────────────── */
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
export const CATEGORY_COLORS = {
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
    return { id: Date.now() + Math.random(), name: "", category: "other", quantity: 1, unit: "piece", unit_cost: 0, notes: "", ...overrides };
}

export function MaterialsSection({ materials = [], onChange, estimateType = "painting" }) {
    const [showPresets, setShowPresets] = useState(false);
    const isPainting = ["painting", "both"].includes(estimateType);
    const isFlooring = ["flooring", "both"].includes(estimateType);
    const totalCost = materials.reduce((sum, m) => sum + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);

    const addMaterial = (preset = null) => {
        const mat = preset ? { ...newMaterial(), ...preset, id: Date.now() + Math.random(), quantity: preset.qty || 1 } : newMaterial();
        onChange([...materials, mat]);
        setShowPresets(false);
    };
    const updateMaterial = (id, field, value) => onChange(materials.map(m => m.id === id ? { ...m, [field]: value } : m));
    const removeMaterial = (id) => onChange(materials.filter(m => m.id !== id));

    const presets = [
        ...(isPainting ? PAINT_PRESETS : []),
        ...(isPainting ? PAINT_SUPPLY_PRESETS : []),
        ...(isFlooring ? FLOOR_PRESETS : []),
        ...(isFlooring ? FLOOR_SUPPLY_PRESETS : []),
    ];

    return (
        <div>
            <div className="d-flex align-items-center justify-content-between mb-1">
                <div>
                    <h6 className="fw-semibold mb-0">🛒 Materials to purchase</h6>
                    <p className="text-muted mb-0" style={{ fontSize: 13 }}>Track what you need to buy. Costs are included in the invoice total automatically.</p>
                </div>
                {materials.length > 0 && totalCost > 0 && (
                    <div className="text-end flex-shrink-0 ms-3">
                        <p className="text-muted mb-0" style={{ fontSize: 11 }}>Materials cost</p>
                        <p className="fw-bold text-danger mb-0" style={{ fontSize: 18 }}>${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                    </div>
                )}
            </div>

            {materials.length > 0 && (
                <div className="mb-3">
                    {materials.map((mat) => {
                        const cat = CATEGORY_COLORS[mat.category] || CATEGORY_COLORS.other;
                        const rowTotal = (parseFloat(mat.quantity) || 0) * (parseFloat(mat.unit_cost) || 0);
                        return (
                            <div key={mat.id} className="rounded-3 p-3 mb-2" style={{ background: cat.bg, border: `1px solid ${cat.border}` }}>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="badge rounded-pill" style={{ background: cat.badge, color: "#fff", fontSize: 10 }}>{cat.text}</span>
                                    <input className="form-control form-control-sm fw-semibold border-0 bg-transparent shadow-none flex-fill"
                                        style={{ outline: "none", fontSize: 14 }} value={mat.name}
                                        onChange={e => updateMaterial(mat.id, "name", e.target.value)} placeholder="Material name" />
                                    <button type="button"
                                        className="btn btn-outline-danger btn-sm flex-shrink-0 d-flex align-items-center gap-1"
                                        style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6 }}
                                        onClick={() => removeMaterial(mat.id)}>
                                        🗑 Remove
                                    </button>
                                </div>
                                <div className="row g-2">
                                    <div className="col-12 col-sm-3">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Category</label>
                                        <select className="form-select form-select-sm" value={mat.category} onChange={e => updateMaterial(mat.id, "category", e.target.value)}>
                                            {Object.entries(CATEGORY_COLORS).map(([k, v]) => <option key={k} value={k}>{v.text}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Quantity</label>
                                        <input type="number" inputMode="decimal" className="form-control form-control-sm" value={mat.quantity} min={0} step={0.5}
                                            onChange={e => updateMaterial(mat.id, "quantity", e.target.value)} />
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Unit</label>
                                        <select className="form-select form-select-sm" value={mat.unit} onChange={e => updateMaterial(mat.id, "unit", e.target.value)}>
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-6 col-sm-2">
                                        <label className="form-label mb-1 text-muted" style={{ fontSize: 10 }}>Unit cost ($)</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text">$</span>
                                            <input type="number" inputMode="decimal" className="form-control" value={mat.unit_cost} min={0} step={0.01}
                                                onChange={e => updateMaterial(mat.id, "unit_cost", e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="col-6 col-sm-3 d-flex align-items-end">
                                        <div className="w-100 text-end py-1">
                                            <span className="text-muted" style={{ fontSize: 11 }}>Subtotal</span>
                                            <p className="fw-bold mb-0" style={{ fontSize: 14 }}>${rowTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <input className="form-control form-control-sm border-0 bg-transparent shadow-none" style={{ fontSize: 12, color: "#6b7280" }}
                                        placeholder="Notes (brand, color, SKU…)" value={mat.notes} onChange={e => updateMaterial(mat.id, "notes", e.target.value)} />
                                </div>
                            </div>
                        );
                    })}
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}>
                        <span className="text-muted fw-medium" style={{ fontSize: 13 }}>Total materials cost</span>
                        <span className="fw-bold text-danger" style={{ fontSize: 16 }}>${totalCost.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            )}

            <div className="d-flex gap-2 flex-wrap">
                <button type="button" className="btn btn-outline-secondary btn-sm" style={{ borderStyle: "dashed" }} onClick={() => addMaterial()}>+ Add material</button>
                {presets.length > 0 && (
                    <button type="button" className={`btn btn-sm ${showPresets ? "btn-dark" : "btn-outline-secondary"}`} onClick={() => setShowPresets(p => !p)}>
                        ⚡ Quick add from list {showPresets ? "▲" : "▼"}
                    </button>
                )}
            </div>

            {showPresets && (
                <div className="mt-2 p-3 rounded-3 border" style={{ background: "#fafafa" }}>
                    <p className="fw-semibold mb-2" style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: "#6b7280" }}>Common materials — tap to add</p>
                    <div className="d-flex flex-wrap gap-1">
                        {presets.map((p, i) => {
                            const cat = CATEGORY_COLORS[p.category] || CATEGORY_COLORS.other;
                            return (
                                <button key={i} type="button" onClick={() => addMaterial(p)} className="btn btn-sm"
                                    style={{ background: cat.bg, border: `1px solid ${cat.border}`, color: "#374151", fontSize: 12 }}>
                                    {p.name}<span className="ms-1 text-muted" style={{ fontSize: 10 }}>${p.unit_cost}/{p.unit}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}