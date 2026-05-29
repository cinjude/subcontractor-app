// src/pages/estimateRequest/EditEstimatePage.jsx — VERSION 2
// Adds: Step-based navigation, Extras step, Per-room material selector

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useEstimate } from "./Estimatecontext.jsx";

/* ─── Chips ──────────────────────────────────────────────────────────────── */
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
                    checked={!!value} onChange={e => onChange(e.target.checked)}
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

function SectionTitle({ text }) {
    return <p className="text-uppercase fw-semibold text-muted mb-2 mt-3" style={{ fontSize: 11, letterSpacing: "0.06em" }}>{text}</p>;
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
            {/* Quick apply to all rooms */}
            <div className="card border mb-3" style={{ background: "#fffbeb" }}>
                <div className="card-header py-2 px-3 border-bottom fw-semibold small" style={{ background: "#fef3c7" }}>
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

/* ─── Step bar ───────────────────────────────────────────────────────────── */
const STEPS = ["Type", "Client", "Details", "Extras", "Review"];

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
                            style={{ width: 38, height: 38, fontSize: 14, border: i < step || i === step ? "2px solid transparent" : "2px solid" }}>
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

/* ─── MAIN EDIT PAGE ─────────────────────────────────────────────────────── */
export default function EditEstimatePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { fetchEstimate, updateEstimate } = useEstimate();

    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [form, setForm] = useState(null);
    // rooms loaded from the estimate — needed for per-room material selector
    const [rooms, setRooms] = useState([]);

    useEffect(() => {
        fetchEstimate(id)
            .then(data => {
                const est = data?.estimate ?? data;

                // Parse per-room materials from description prefix if stored
                let roomMats = {};
                if (est.description?.includes("Materials:")) {
                    const lines = est.description.split("\n");
                    const matLine = lines.find(l => l.startsWith("Materials:"));
                    if (matLine) {
                        matLine.replace("Materials: ", "").split(", ").forEach(pair => {
                            const colonIdx = pair.indexOf(": ");
                            if (colonIdx !== -1) {
                                const name = pair.slice(0, colonIdx).trim();
                                const mat = pair.slice(colonIdx + 2).trim().replace(/ /g, "_");
                                if (name && mat) roomMats[name] = { material: mat };
                            }
                        });
                    }
                }
                // If no per-room data, pre-fill from global flooring_material
                if (Object.keys(roomMats).length === 0 && est.flooring_material && est.rooms?.length) {
                    est.rooms.forEach(r => {
                        roomMats[r.name] = {
                            material: est.flooring_material,
                            current: est.flooring_current || null,
                        };
                    });
                }

                setRooms(est.rooms || []);
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
                    // flooring global (used as fallback for calculator)
                    flooring_material: est.flooring_material || "",
                    flooring_current: est.flooring_current || "",
                    include_removal: est.include_removal ?? false,
                    subfloor_condition: est.subfloor_condition || "unknown",
                    flooring_pattern: est.flooring_pattern || "straight",
                    include_baseboards: est.include_baseboards ?? false,
                    transition_strips: est.transition_strips ?? 0,
                    include_stairs: est.include_stairs ?? false,
                    stair_count: est.stair_count ?? 0,
                    // per-room materials
                    room_materials: roomMats,
                    // extras
                    furniture_rooms: est.furniture_rooms || 0,
                    furniture_heavy: est.furniture_heavy || 0,
                    moisture_barrier: est.moisture_barrier || false,
                    floor_leveling: est.floor_leveling || false,
                    floor_leveling_mode: est.floor_leveling_mode || "sqft",
                    floor_leveling_bags: est.floor_leveling_bags || 1,
                    heavy_demo: est.heavy_demo || false,
                    travel_miles: est.travel_miles || 0,
                    use_flat_travel: est.use_flat_travel || false,
                });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [id]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const updateRoomMaterial = (roomName, field, value) =>
        setForm(f => ({
            ...f,
            room_materials: {
                ...f.room_materials,
                [roomName]: { ...(f.room_materials[roomName] || {}), [field]: value }
            }
        }));

    const isPainting = form?.estimate_type === "painting" || form?.estimate_type === "both";
    const isFlooring = form?.estimate_type === "flooring" || form?.estimate_type === "both";
    const namedRooms = rooms.filter(r => r.name?.trim());

    const validate = () => {
        const e = {};
        if (step === 1) {
            if (!form.customer_name.trim()) e.customer_name = "Name is required";
            if (!form.customer_phone.trim()) e.customer_phone = "Phone is required";
        }
        if (step === 2) {
            if (isPainting && !form.paint_surface_condition)
                e.paint_surface_condition = "Please select surface condition";
            if (isFlooring && namedRooms.length > 0) {
                const allSet = namedRooms.every(r => form.room_materials[r.name]?.material);
                if (!allSet) e.room_materials = "Please set flooring material for every room";
            }
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => { if (!validate()) return; setStep(s => s + 1); window.scrollTo(0, 0); };
    const back = () => { setStep(s => s - 1); window.scrollTo(0, 0); };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            // Derive global flooring fields from per-room selections
            const matCounts = {};
            const curCounts = {};
            Object.values(form.room_materials).forEach(rm => {
                if (rm.material) matCounts[rm.material] = (matCounts[rm.material] || 0) + 1;
                if (rm.current) curCounts[rm.current] = (curCounts[rm.current] || 0) + 1;
            });
            const primaryMat = Object.entries(matCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || form.flooring_material;
            const primaryCur = Object.entries(curCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || form.flooring_current;

            // Build per-room line for description prefix
            const roomMatLines = Object.entries(form.room_materials)
                .filter(([, v]) => v.material)
                .map(([name, v]) => `${name}: ${v.material.replace(/_/g, " ")}`)
                .join(", ");

            // Rebuild description — strip old Materials: prefix if exists
            const baseDesc = form.description
                .split("\n")
                .filter(l => !l.startsWith("Materials:"))
                .join("\n")
                .trim();

            const newDesc = roomMatLines
                ? `Materials: ${roomMatLines}${baseDesc ? "\n" + baseDesc : ""}`
                : baseDesc;

            await updateEstimate(id, {
                ...form,
                flooring_material: primaryMat,
                flooring_current: primaryCur,
                description: newDesc,
            });
            navigate(`/providerdashboard/estimates/${id}`);
        } catch (e) {
            alert(e.message || "Failed to save");
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

    /* ─── LOADING / NOT FOUND ─────────────────────────────────────────── */
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

    /* ─── RENDER ──────────────────────────────────────────────────────── */
    return (
        <div className="container py-3 py-lg-4" style={{ maxWidth: 780 }}>

            {/* Header */}
            <div className="d-flex align-items-center gap-3 mb-4">
                <button className="btn btn-outline-secondary btn-sm px-3"
                    onClick={() => step === 0 ? navigate(`/providerdashboard/estimates/${id}`) : back()}>
                    ← Back
                </button>
                <div>
                    <h5 className="fw-bold mb-0">Edit estimate #{id}</h5>
                    <p className="text-muted mb-0" style={{ fontSize: 12 }}>Changes saved when you click Save</p>
                </div>
            </div>

            <StepBar step={step} />

            {/* ══ STEP 0 — TYPE ════════════════════════════════════════════ */}
            {step === 0 && (
                <div>
                    <h6 className="fw-semibold mb-2">Type of work</h6>
                    <div className="row g-3 mb-4">
                        {[
                            { value: "painting", label: "Painting", emoji: "🎨", sub: "Interior / exterior walls, ceilings, trim" },
                            { value: "flooring", label: "Flooring", emoji: "🪵", sub: "Hardwood, vinyl, tile, carpet installation" },
                            { value: "both", label: "Painting + Flooring", emoji: "🎨🪵", sub: "Combo project" },
                        ].map(o => (
                            <div key={o.value} className="col-12 col-md-4">
                                <button type="button" onClick={() => set("estimate_type", o.value)}
                                    className={`w-100 btn text-start p-3 ${form.estimate_type === o.value ? "btn-dark" : "btn-outline-secondary"}`}
                                    style={{ minHeight: 90 }}>
                                    <span className="d-block fs-2 mb-1">{o.emoji}</span>
                                    <span className="d-block fw-semibold">{o.label}</span>
                                    <span className="d-block text-muted" style={{ fontSize: 12 }}>{o.sub}</span>
                                </button>
                            </div>
                        ))}
                    </div>

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
                                type="tel" value={form.customer_phone} onChange={e => set("customer_phone", e.target.value)} />
                            {errors.customer_phone && <div className="invalid-feedback">{errors.customer_phone}</div>}
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Email</label>
                            <input className="form-control" type="email" value={form.customer_email}
                                onChange={e => set("customer_email", e.target.value)} />
                        </div>
                        <div className="col-12 col-md-6">
                            <label className="form-label fw-medium small">Job address</label>
                            <input className="form-control" value={form.customer_address}
                                onChange={e => set("customer_address", e.target.value)} />
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

                    <div className="mt-3">
                        <label className="form-label fw-medium small">Notes / special requests</label>
                        <textarea className="form-control" rows={3} value={
                            // Strip Materials: prefix from display so contractor only sees their notes
                            form.description.split("\n").filter(l => !l.startsWith("Materials:")).join("\n")
                        }
                            onChange={e => {
                                // When editing, preserve Materials: prefix if it exists
                                const matLine = form.description.split("\n").find(l => l.startsWith("Materials:"));
                                set("description", matLine ? matLine + "\n" + e.target.value : e.target.value);
                            }}
                            placeholder="Access hours, special instructions…" />
                    </div>
                </div>
            )}

            {/* ══ STEP 1 — CLIENT (skipped — merged into step 0) ══════════ */}

            {/* ══ STEP 1 — DETAILS ═════════════════════════════════════════ */}
            {step === 1 && (
                <div>
                    {isPainting && (
                        <>
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

                    {isFlooring && (
                        <>
                            {isPainting && <hr className="my-4" />}
                            <h6 className="fw-semibold mb-3">🪵 Flooring details</h6>

                            {/* Per-room material selector */}
                            <SectionTitle text="Flooring material per room *" />
                            {namedRooms.length === 0 ? (
                                <div className="alert alert-info" style={{ fontSize: 13 }}>
                                    ℹ️ Rooms are managed on the estimate detail page. You can still update the global material below.
                                </div>
                            ) : (
                                <RoomMaterialSelector
                                    rooms={namedRooms}
                                    roomMaterials={form.room_materials}
                                    onChange={updateRoomMaterial}
                                    errors={errors}
                                />
                            )}

                            <SectionTitle text="Installation pattern" />
                            <Chips options={FLOOR_PATTERNS} value={form.flooring_pattern}
                                onChange={v => set("flooring_pattern", v)} cols={2} />

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
                </div>
            )}

            {/* ══ STEP 2 — EXTRAS ══════════════════════════════════════════ */}
            {step === 2 && (
                <div>
                    <h6 className="fw-semibold mb-1">Job extras</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>
                        Update job-specific charges. The price calculator pre-fills from these automatically.
                    </p>

                    <div className="card border bg-light mb-3">
                        <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                            🪑 Furniture moving
                            <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— workers tire before install starts</span>
                        </div>
                        <div className="card-body py-1 px-3">
                            <Counter label="Standard rooms" sub="Sofa, bed, dresser — per room" value={form.furniture_rooms} onChange={v => set("furniture_rooms", v)} />
                            <Counter label="Heavy items" sub="Fridge, piano, pool table — per item" value={form.furniture_heavy} onChange={v => set("furniture_heavy", v)} />
                        </div>
                    </div>

                    {isFlooring && (
                        <div className="card border bg-light mb-3">
                            <div className="card-header bg-light py-2 px-3 fw-semibold small border-bottom">
                                🔧 Prep work <span className="text-muted fw-normal ms-2" style={{ fontSize: 11 }}>— where profit is won or lost</span>
                            </div>
                            <div className="card-body py-1 px-3">
                                {form.include_removal && (
                                    <Toggle id="ex_heavydemo" label="Heavy demo" sub="Tile, glued hardwood, thinset grinding" value={form.heavy_demo} onChange={v => set("heavy_demo", v)} />
                                )}
                                <Toggle id="ex_moisture" label="Moisture barrier needed" sub="Required for LVP, laminate, engineered on concrete" value={form.moisture_barrier} onChange={v => set("moisture_barrier", v)} />
                                <Toggle id="ex_leveling" label="Floor leveling needed" sub="Uneven subfloor — biggest hidden cost" value={form.floor_leveling} onChange={v => set("floor_leveling", v)} />
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
                                            <Counter label="Estimated bags" sub="~50 sq ft per bag" value={form.floor_leveling_bags} onChange={v => set("floor_leveling_bags", v)} min={1} />
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
                                <Toggle id="ex_flat" label="Charge flat travel fee instead of per-mile" value={form.use_flat_travel} onChange={v => set("use_flat_travel", v)} />
                            )}
                        </div>
                    </div>

                    <div className="alert alert-info d-flex gap-2 align-items-start" style={{ fontSize: 13 }}>
                        <span>🛡️</span>
                        <div><strong>Minimum job fee</strong> is applied automatically by the calculator. Set it in <strong>Settings → My rates</strong>.</div>
                    </div>
                </div>
            )}

            {/* ══ STEP 3 — REVIEW ══════════════════════════════════════════ */}
            {step === 3 && (
                <div>
                    <h6 className="fw-semibold mb-1">Review changes</h6>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>Click Save to apply all changes</p>

                    <div className="d-flex flex-wrap gap-2 mb-4">
                        <span className="badge bg-dark fs-6 px-3 py-2">
                            {form.estimate_type === "painting" ? "🎨 Painting"
                                : form.estimate_type === "flooring" ? "🪵 Flooring"
                                    : "🎨🪵 Painting + Flooring"}
                        </span>
                    </div>

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

                    {isFlooring && (
                        <div className="card border mb-3">
                            <div className="card-header bg-light py-2 fw-semibold small">🪵 Flooring</div>
                            <div className="card-body py-2 px-3">
                                {/* Per-room materials */}
                                {namedRooms.filter(r => form.room_materials[r.name]?.material).map((r, i) => (
                                    <div key={i} className="d-flex justify-content-between border-bottom py-2">
                                        <span className="text-muted" style={{ fontSize: 13 }}>{r.name}</span>
                                        <span className="fw-medium" style={{ fontSize: 13 }}>
                                            {FLOOR_MATERIALS_OPTS.find(m => m.value === form.room_materials[r.name]?.material)?.label || form.room_materials[r.name]?.material}
                                        </span>
                                    </div>
                                ))}
                                <RevRow label="Pattern" value={form.flooring_pattern} />
                                <RevRow label="Removal" value={form.include_removal ? "Included" : null} />
                                <RevRow label="Baseboards" value={form.include_baseboards ? "Yes" : null} />
                                <RevRow label="Stairs" value={form.include_stairs ? `${form.stair_count} steps` : null} />
                                <RevRow label="Transitions" value={form.transition_strips > 0 ? form.transition_strips : null} />
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

            {/* ─── STICKY BOTTOM NAV ────────────────────────────────────── */}
            <div className="sticky-bottom bg-white border-top py-3 mt-4 d-flex gap-2">
                {step > 0 && (
                    <button type="button" onClick={back} className="btn btn-outline-secondary px-4">← Back</button>
                )}
                {step < STEPS.length - 1 ? (
                    <button type="button" onClick={next} className="btn btn-dark flex-fill fw-semibold">Continue →</button>
                ) : (
                    <button type="button" onClick={handleSave} disabled={saving}
                        className="btn btn-success flex-fill fw-semibold">
                        {saving
                            ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                            : "✓ Save changes"}
                    </button>
                )}
            </div>
        </div>
    );
}