// src/pages/Settings/MyRatesPage.jsx
//
// Standalone page for managing contractor rates.
// Add this to your router:
//   <Route path="/providerdashboard/settings/rates" element={<MyRatesPage />} />
// Add a link in your sidebar:
//   Settings → My Rates

import { useEffect, useState, useCallback } from "react";

const BASE = import.meta.env.VITE_BACKEND_URL || "";

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

// ── Slider row ──────────────────────────────────────────────────────────────
function SliderRow({ label, hint, field, rates, onChange, min, max, step, prefix = "$", suffix = "" }) {
    const val = rates[field] ?? DEFAULTS[field];
    const dec = step < 1 ? 2 : 0;
    const display = prefix + (dec > 0 ? Number(val).toFixed(dec) : Math.round(val)) + suffix;
    return (
        <div className="d-flex align-items-center gap-3 py-2 border-bottom">
            <div style={{ minWidth: 220, flexShrink: 0 }}>
                <span className="d-block" style={{ fontSize: 13, color: "#495057" }}>{label}</span>
                {hint && <span className="d-block text-muted" style={{ fontSize: 11 }}>{hint}</span>}
            </div>
            <input type="range" className="flex-fill"
                min={min} max={max} step={step} value={val}
                onChange={e => onChange(field, parseFloat(e.target.value))}
                style={{ accentColor: "#212529" }} />
            <span className="fw-semibold font-monospace flex-shrink-0"
                style={{ fontSize: 14, minWidth: 64, textAlign: "right" }}>
                {display}
            </span>
        </div>
    );
}

// ── Section card ────────────────────────────────────────────────────────────
function RateSection({ title, icon, why, children }) {
    return (
        <div className="card border shadow-sm mb-4">
            <div className="card-header bg-light py-2 px-3 d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-2">
                    <span>{icon}</span>
                    <span className="fw-semibold small text-uppercase"
                        style={{ letterSpacing: "0.05em", fontSize: 11 }}>{title}</span>
                </div>
                {why && (
                    <span className="text-muted" style={{ fontSize: 11 }}>{why}</span>
                )}
            </div>
            <div className="card-body py-1 px-3">{children}</div>
        </div>
    );
}

// ── MAIN PAGE ───────────────────────────────────────────────────────────────
export default function MyRatesPage() {
    const [rates, setRates] = useState({ ...DEFAULTS });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(`${BASE}/api/contractor/rates`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.rates) setRates({ ...DEFAULTS, ...data.rates });
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const updateRate = useCallback((field, value) => {
        setRates(prev => ({ ...prev, [field]: value }));
        setSaved(false);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${BASE}/api/contractor/rates`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(rates),
            });
            if (!res.ok) throw new Error("Save failed");
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            alert("Failed to save rates: " + e.message);
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
        <div className="container-fluid py-3 py-lg-4 px-3 px-lg-5" style={{ maxWidth: 860, margin: "0 auto" }}>

            {/* Header */}
            <div className="d-flex align-items-start justify-content-between mb-4">
                <div>
                    <h4 className="fw-bold mb-1">My rates</h4>
                    <p className="text-muted mb-0" style={{ fontSize: 14 }}>
                        These rates are used by the price calculator on every estimate.
                        Set them once — the calculator does the math automatically.
                    </p>
                </div>
                <button className="btn btn-dark fw-semibold px-4 flex-shrink-0"
                    onClick={handleSave} disabled={saving}>
                    {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : saved
                            ? "✓ Saved"
                            : "Save rates"}
                </button>
            </div>

            {/* Info banner */}
            <div className="alert alert-info d-flex gap-3 align-items-start mb-4" style={{ fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                    <strong>How this works:</strong> When you open the price calculator on any estimate,
                    it reads these rates and calculates a suggested quote automatically based on the job's
                    square footage, conditions, and add-ons. You can always override the final number
                    before sending to the client.
                </div>
            </div>

            {/* ── PAINTING ───────────────────────────────────────────── */}
            <RateSection title="Painting rates" icon="🎨" why="per sq ft unless noted">
                <SliderRow label="Base labor" hint="Your standard labor rate per sq ft" field="paint_base_per_sqft" rates={rates} onChange={updateRate} min={0.5} max={8} step={0.25} />
                <SliderRow label="Extra coat" hint="Each additional coat beyond the first" field="paint_extra_coat_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                <SliderRow label="Ceiling" hint="Added when ceiling is included" field="paint_ceiling_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                <SliderRow label="Trim / baseboards" hint="Doors, window frames, crown molding" field="paint_trim_sqft" rates={rates} onChange={updateRate} min={0} max={3} step={0.25} />
                <SliderRow label="Per door" hint="Each door — cutting in, 2 coats face + edges" field="paint_door_each" rates={rates} onChange={updateRate} min={10} max={150} step={5} />
                <SliderRow label="Per window" hint="Frame and sill painting" field="paint_window_each" rates={rates} onChange={updateRate} min={10} max={100} step={5} />
                <SliderRow label="Color change surcharge" hint="Applied as % of subtotal when changing color" field="paint_color_change_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
                <SliderRow label="Dark → light surcharge" hint="Higher because primer + extra coats required" field="paint_dark_to_light_pct" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
                <SliderRow label="Repair surcharge" hint="Applied when repairs/patching are needed" field="paint_repair_surcharge" rates={rates} onChange={updateRate} min={0} max={60} step={5} prefix="" suffix="%" />
            </RateSection>

            {/* ── FLOORING BASE ───────────────────────────────────────── */}
            <RateSection title="Flooring — base install" icon="🪵" why="per sq ft by material">
                <SliderRow label="Hardwood" field="floor_hardwood_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                <SliderRow label="Engineered wood" field="floor_engineered_sqft" rates={rates} onChange={updateRate} min={2} max={15} step={0.5} />
                <SliderRow label="Laminate" field="floor_laminate_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                <SliderRow label="Vinyl LVP" field="floor_vinyl_sqft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                <SliderRow label="Ceramic tile" field="floor_tile_ceramic_sqft" rates={rates} onChange={updateRate} min={2} max={20} step={0.5} />
                <SliderRow label="Porcelain tile" field="floor_tile_porcelain_sqft" rates={rates} onChange={updateRate} min={2} max={25} step={0.5} />
                <SliderRow label="Carpet" field="floor_carpet_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.5} />
                <SliderRow label="Concrete" field="floor_concrete_sqft" rates={rates} onChange={updateRate} min={2} max={12} step={0.5} />
            </RateSection>

            {/* ── PREP FEES ───────────────────────────────────────────── */}
            <RateSection title="Prep fees" icon="🔧" why="where profit is won or lost">
                <SliderRow label="Light removal" hint="Carpet, floating floor — standard tearout" field="floor_removal_sqft" rates={rates} onChange={updateRate} min={0} max={5} step={0.25} />
                <SliderRow label="Heavy demo" hint="Glued hardwood, tile, thinset grinding — much harder" field="heavy_demo_sqft" rates={rates} onChange={updateRate} min={1} max={8} step={0.25} />
                <SliderRow label="Moisture barrier" hint="Required for LVP/laminate/engineered on concrete" field="moisture_barrier_sqft" rates={rates} onChange={updateRate} min={0.25} max={2} step={0.25} />
                <SliderRow label="Floor leveling / sq ft" hint="Self-leveler material + labor — uneven subfloors" field="floor_leveling_sqft" rates={rates} onChange={updateRate} min={0.5} max={6} step={0.25} />
                <SliderRow label="Floor leveling / bag" hint="When charging per bag of self-leveler" field="floor_leveling_bag" rates={rates} onChange={updateRate} min={20} max={150} step={5} />
                <SliderRow label="Baseboard / lin ft" hint="Installation of new baseboards or quarter round" field="floor_baseboard_lft" rates={rates} onChange={updateRate} min={1} max={10} step={0.5} />
                <SliderRow label="Per stair" hint="Riser + tread + nosing — precision work" field="floor_stair_each" rates={rates} onChange={updateRate} min={10} max={120} step={5} />
                <SliderRow label="Per transition strip" hint="Doorways, room-to-room changes" field="floor_transition_each" rates={rates} onChange={updateRate} min={5} max={60} step={5} />
            </RateSection>

            {/* ── FURNITURE MOVING ────────────────────────────────────── */}
            <RateSection title="Furniture moving" icon="🪑" why="workers tire before install starts">
                <SliderRow label="Standard room" hint="Sofa, bed, dresser, tables — per room" field="furniture_moving_room" rates={rates} onChange={updateRate} min={25} max={200} step={5} />
                <SliderRow label="Heavy item" hint="Refrigerator, piano, pool table, safe — per item" field="furniture_moving_heavy" rates={rates} onChange={updateRate} min={50} max={400} step={10} />
            </RateSection>

            {/* ── PREMIUM LABOR ────────────────────────────────────────── */}
            <RateSection title="Premium labor" icon="💎" why="never charge standard floor rate for these">
                <SliderRow label="Backsplash tile" hint="Detail work, small pieces, grout lines — much slower than floor" field="backsplash_tile_sqft" rates={rates} onChange={updateRate} min={8} max={40} step={1} />
                <SliderRow label="Shower tile" hint="Waterproofing, niches, slopes, membranes, precision cuts" field="shower_tile_sqft" rates={rates} onChange={updateRate} min={10} max={60} step={1} />
                <SliderRow label="Shower pan (each)" hint="Full shower floor pan with waterproof membrane" field="shower_pan_each" rates={rates} onChange={updateRate} min={300} max={2500} step={50} />
            </RateSection>

            {/* ── PATTERN UPCHARGES ────────────────────────────────────── */}
            <RateSection title="Pattern upcharges" icon="↗️" why="applied as % of base install cost">
                <SliderRow label="Diagonal 45°" hint="10-12% material waste from angled cuts" field="floor_diagonal_pct" rates={rates} onChange={updateRate} min={0} max={40} step={5} prefix="" suffix="%" />
                <SliderRow label="Herringbone / chevron" hint="15-20% waste + 2-3x longer layout time" field="floor_herringbone_pct" rates={rates} onChange={updateRate} min={0} max={50} step={5} prefix="" suffix="%" />
            </RateSection>

            {/* ── PROTECTION FEES ──────────────────────────────────────── */}
            <RateSection title="Protection fees" icon="🛡️" why="your time has value on every call">
                <SliderRow label="Minimum job fee" hint="Any job below this amount is charged this minimum" field="minimum_job_fee" rates={rates} onChange={updateRate} min={50} max={800} step={25} />
                <SliderRow label="Travel / mile" hint="Charged per mile one-way for distant jobs" field="travel_fee_per_mile" rates={rates} onChange={updateRate} min={0.5} max={5} step={0.25} />
                <SliderRow label="Travel flat fee" hint="Flat rate per trip instead of per-mile" field="travel_fee_flat" rates={rates} onChange={updateRate} min={0} max={300} step={10} />
            </RateSection>

            {/* Sticky save bar */}
            <div className="sticky-bottom bg-white border-top py-3 d-flex gap-3 align-items-center">
                {saved && (
                    <span className="text-success fw-medium" style={{ fontSize: 13 }}>
                        ✓ Rates saved successfully
                    </span>
                )}
                <button className="btn btn-dark fw-semibold flex-fill py-2"
                    onClick={handleSave} disabled={saving}>
                    {saving
                        ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                        : "💾 Save my rates"}
                </button>
            </div>
        </div>
    );
}