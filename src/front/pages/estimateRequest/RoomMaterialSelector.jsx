const FLOOR_MATERIALS = [
    { value: "hardwood", label: "Hardwood", emoji: "🪵", sub: "$$$" },
    { value: "engineered_wood", label: "Engineered Wood", emoji: "🪵", sub: "$$" },
    { value: "laminate", label: "Laminate", emoji: "📋", sub: "$" },
    { value: "vinyl_plank", label: "Vinyl / LVP", emoji: "🟫", sub: "$" },
    { value: "tile_ceramic", label: "Ceramic Tile", emoji: "🟦", sub: "$$" },
    { value: "tile_porcelain", label: "Porcelain Tile", emoji: "⬜", sub: "$$$" },
    { value: "carpet", label: "Carpet", emoji: "🟩", sub: "$" },
    { value: "concrete", label: "Concrete", emoji: "⬛", sub: "$$" },
    { value: "none", label: "No flooring", emoji: "✖️", sub: "skip" },
];

const FLOOR_CURRENT = [
    { value: "bare_concrete", label: "Bare concrete", emoji: "⬛" },
    { value: "old_carpet", label: "Old carpet", emoji: "🟩" },
    { value: "old_hardwood", label: "Old hardwood", emoji: "🪵" },
    { value: "old_tile", label: "Old tile", emoji: "🟦" },
    { value: "old_vinyl", label: "Old vinyl", emoji: "🟫" },
    { value: "already_removed", label: "Already removed", emoji: "✅" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

function RoomMaterialSelector({ rooms, roomMaterials, onChange }) {
    // roomMaterials shape: { [roomName]: { material: string, current: string } }
    // onChange: (roomName, field, value) => void

    const [expandedRoom, setExpandedRoom] = useState(rooms[0]?.name || null);

    // Apply a material/current to ALL rooms at once
    const applyToAll = (field, value) => {
        rooms.forEach(r => onChange(r.name, field, value));
    };

    const getMat = (roomName) => roomMaterials[roomName]?.material || null;
    const getCur = (roomName) => roomMaterials[roomName]?.current || null;

    const MATERIAL_COLORS = {
        hardwood: "#92400e", engineered_wood: "#a16207", laminate: "#0369a1",
        vinyl_plank: "#7c3aed", tile_ceramic: "#0891b2", tile_porcelain: "#374151",
        carpet: "#15803d", concrete: "#374151", none: "#9ca3af",
    };

    return (
        <div>
            {/* Apply to all rooms shortcut */}
            <div className="card border bg-light mb-4">
                <div className="card-header py-2 px-3 bg-light border-bottom">
                    <span className="fw-semibold small">⚡ Apply same material to all rooms</span>
                    <span className="text-muted ms-2" style={{ fontSize: 11 }}>— use if all rooms get the same floor</span>
                </div>
                <div className="card-body py-2 px-3">
                    <p className="text-muted mb-2" style={{ fontSize: 12 }}>New material for all:</p>
                    <div className="d-flex flex-wrap gap-1 mb-3">
                        {FLOOR_MATERIALS.filter(m => m.value !== "none").map(m => (
                            <button key={m.value} type="button"
                                onClick={() => applyToAll("material", m.value)}
                                className="btn btn-sm btn-outline-secondary">
                                {m.emoji} {m.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-muted mb-2" style={{ fontSize: 12 }}>Current floor in all rooms:</p>
                    <div className="d-flex flex-wrap gap-1">
                        {FLOOR_CURRENT.map(c => (
                            <button key={c.value} type="button"
                                onClick={() => applyToAll("current", c.value)}
                                className="btn btn-sm btn-outline-secondary">
                                {c.emoji} {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Per-room selector */}
            <p className="fw-medium mb-2" style={{ fontSize: 13 }}>
                Or set individually per room:
            </p>

            {rooms.map((room, idx) => {
                const mat = getMat(room.name);
                const cur = getCur(room.name);
                const matObj = FLOOR_MATERIALS.find(m => m.value === mat);
                const curObj = FLOOR_CURRENT.find(c => c.value === cur);
                const isOpen = expandedRoom === room.name;
                const sqft = room.floor_sqft || (room.length_ft && room.width_ft
                    ? parseFloat(room.length_ft) * parseFloat(room.width_ft) : 0);

                return (
                    <div key={room.name || idx} className="card border mb-2 overflow-hidden">
                        {/* Room header — click to expand/collapse */}
                        <button
                            type="button"
                            className="card-header py-2 px-3 text-start w-100 border-0 d-flex justify-content-between align-items-center"
                            style={{
                                background: mat ? "#f0fdf4" : "#fafafa",
                                cursor: "pointer",
                            }}
                            onClick={() => setExpandedRoom(isOpen ? null : room.name)}
                        >
                            <div className="d-flex align-items-center gap-2">
                                <span className="fw-semibold" style={{ fontSize: 14 }}>{room.name}</span>
                                {sqft > 0 && (
                                    <span className="text-muted" style={{ fontSize: 12 }}>{sqft.toFixed(0)} sq ft</span>
                                )}
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                {mat ? (
                                    <span className="badge rounded-pill px-2 py-1"
                                        style={{
                                            background: MATERIAL_COLORS[mat] || "#374151",
                                            color: "#fff", fontSize: 11
                                        }}>
                                        {matObj?.emoji} {matObj?.label}
                                        {cur && ` · ${curObj?.emoji || ""} ${curObj?.label || cur}`}
                                    </span>
                                ) : (
                                    <span className="badge bg-warning text-dark rounded-pill" style={{ fontSize: 11 }}>
                                        ⚠ Not set
                                    </span>
                                )}
                                <span className="text-muted" style={{ fontSize: 16 }}>{isOpen ? "▲" : "▼"}</span>
                            </div>
                        </button>

                        {/* Expanded content */}
                        {isOpen && (
                            <div className="card-body py-2 px-3">
                                {/* Material */}
                                <p className="fw-medium mb-2" style={{ fontSize: 12, color: "#374151" }}>
                                    New flooring material:
                                </p>
                                <div className="row g-2 row-cols-2 row-cols-md-4 mb-3">
                                    {FLOOR_MATERIALS.map(m => {
                                        const sel = mat === m.value;
                                        return (
                                            <div key={m.value} className="col">
                                                <button type="button"
                                                    onClick={() => onChange(room.name, "material", sel ? null : m.value)}
                                                    className={`w-100 btn text-start py-2 px-2 ${sel ? "btn-dark" : "btn-outline-secondary"}`}
                                                    style={{ minHeight: 56 }}>
                                                    <span className="d-block" style={{ fontSize: 16 }}>{m.emoji}</span>
                                                    <span className="d-block fw-medium" style={{ fontSize: 12 }}>{m.label}</span>
                                                    <span className="d-block" style={{ fontSize: 10, color: sel ? "#86efac" : "#9ca3af" }}>{m.sub}</span>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Current state */}
                                <p className="fw-medium mb-2" style={{ fontSize: 12, color: "#374151" }}>
                                    Current floor in this room:
                                </p>
                                <div className="d-flex flex-wrap gap-1">
                                    {FLOOR_CURRENT.map(c => {
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

                                {/* Auto-advance to next room */}
                                {rooms[idx + 1] && mat && cur && (
                                    <button type="button"
                                        className="btn btn-outline-success btn-sm w-100 mt-3"
                                        onClick={() => setExpandedRoom(rooms[idx + 1].name)}>
                                        Next: {rooms[idx + 1].name} →
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Completion indicator */}
            {(() => {
                const setCount = rooms.filter(r => getMat(r.name)).length;
                const total = rooms.length;
                if (setCount === total && total > 0) {
                    return (
                        <div className="alert alert-success d-flex gap-2 py-2 mt-2" style={{ fontSize: 13 }}>
                            <span>✅</span>
                            <span>All {total} room{total > 1 ? "s" : ""} have materials set — ready to continue</span>
                        </div>
                    );
                }
                return (
                    <div className="alert alert-warning d-flex gap-2 py-2 mt-2" style={{ fontSize: 13 }}>
                        <span>⚠</span>
                        <span>{setCount} of {total} rooms set — tap each room above to select materials</span>
                    </div>
                );
            })()}
        </div>
    );
}