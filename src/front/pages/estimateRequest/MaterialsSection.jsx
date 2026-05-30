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

export default function MaterialsSection({ materials = [], onChange, estimateType = "painting" }) {
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