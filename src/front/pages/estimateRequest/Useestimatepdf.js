// src/pages/Estimates/Useestimatepdf.js
// COMPLETE VERSION v2
//
// CHANGES FROM v1:
//   - Added buildLineItems() — generates the same breakdown as PriceCalculatorModal
//   - PDF now shows a full line-item table instead of just the total
//   - Each section (Installation, Prep & extras, Protection fees) is labeled
//   - Total is highlighted in green at the bottom
//   - Contractor notes shown below the total
//   - All other sections (header, client, rooms, specs, footer) unchanged

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ── colour palette ──────────────────────────────────────────────────────── */
const C = {
    dark:       [30,  30,  30],
    green:      [22, 163, 74],
    greenLight: [240, 253, 244],
    gray:       [100, 100, 100],
    lightGray:  [245, 245, 245],
    border:     [220, 220, 220],
    white:      [255, 255, 255],
    amber:      [180, 83, 9],
    amberLight: [254, 243, 199],
};

function fmt(val) {
    if (!val && val !== 0) return "—";
    return String(val).replace(/_/g, " ");
}
function money(val) {
    if (!val && val !== 0) return "—";
    return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/* ── Build line items from estimate data ─────────────────────────────────── */
function buildLineItems(estimate) {
    const sqft  = estimate.computed_sqft || 0;
    const coats = parseInt(estimate.paint_coats || "1");
    const items = []; // { section, description, amount }

    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    // ── PAINTING ──────────────────────────────────────────────────────────
    if (isPainting && sqft > 0) {
        const base = sqft * (estimate._rates?.paint_base_per_sqft || 2.50);
        items.push({ section: "Installation", description: `Base labor — ${sqft} sq ft`, amount: base });

        if (coats > 1) {
            const extra = sqft * (estimate._rates?.paint_extra_coat_sqft || 0.50) * (coats - 1);
            items.push({ section: "Installation", description: `Extra coat${coats - 1 > 1 ? "s" : ""} ×${coats - 1}`, amount: extra });
        }
        if (estimate.include_ceiling) {
            const c = sqft * (estimate._rates?.paint_ceiling_sqft || 0.75);
            items.push({ section: "Installation", description: "Ceiling painting", amount: c });
        }
        if (estimate.include_trim) {
            const c = sqft * (estimate._rates?.paint_trim_sqft || 0.60);
            items.push({ section: "Installation", description: "Trim / baseboards", amount: c });
        }
        if (estimate.include_doors && estimate.door_count > 0) {
            const c = estimate.door_count * (estimate._rates?.paint_door_each || 45);
            items.push({ section: "Installation", description: `${estimate.door_count} doors`, amount: c });
        }
        if (estimate.window_count > 0) {
            const c = estimate.window_count * (estimate._rates?.paint_window_each || 25);
            items.push({ section: "Installation", description: `${estimate.window_count} windows`, amount: c });
        }

        const installSub = items.reduce((s, i) => s + i.amount, 0);
        const cond = estimate.paint_surface_condition;
        if (cond === "color_change") {
            const pct = estimate._rates?.paint_color_change_pct || 20;
            items.push({ section: "Prep & extras", description: `Color change surcharge (${pct}%)`, amount: installSub * pct / 100, warn: true });
        } else if (cond === "dark_to_light") {
            const pct = estimate._rates?.paint_dark_to_light_pct || 35;
            items.push({ section: "Prep & extras", description: `Dark-to-light surcharge (${pct}%)`, amount: installSub * pct / 100, warn: true });
        } else if (cond === "damaged" && estimate.repairs_needed) {
            const pct = estimate._rates?.paint_repair_surcharge || 25;
            items.push({ section: "Prep & extras", description: `Surface repair surcharge (${pct}%)`, amount: installSub * pct / 100, warn: true });
        }
        if (estimate.client_provides_paint) {
            const d = -(installSub * 0.10);
            items.push({ section: "Prep & extras", description: "Client provides paint (−10% material credit)", amount: d });
        }
    }

    // ── FLOORING ──────────────────────────────────────────────────────────
    if (isFlooring && sqft > 0) {
        const material = estimate.flooring_material || "";
        const rateMap = {
            hardwood: 8.00, engineered_wood: 6.50, laminate: 4.50,
            vinyl_plank: 4.00, tile_ceramic: 7.00, tile_porcelain: 9.00,
            carpet: 3.50, concrete: 5.00,
        };
        const rate = (estimate._rates || {})[`floor_${material}_sqft`] || rateMap[material] || 5.00;
        const floorBase = sqft * rate;
        items.push({ section: "Installation", description: `${material.replace(/_/g, " ")} installation — ${sqft} sq ft`, amount: floorBase });

        const pattern = estimate.flooring_pattern;
        if (pattern === "herringbone" || pattern === "chevron") {
            const pct = estimate._rates?.floor_herringbone_pct || 25;
            items.push({ section: "Installation", description: `${pattern.replace(/_/g, " ")} pattern upcharge (${pct}%)`, amount: floorBase * pct / 100, warn: true });
        } else if (pattern === "diagonal_45") {
            const pct = estimate._rates?.floor_diagonal_pct || 15;
            items.push({ section: "Installation", description: `Diagonal pattern upcharge (${pct}%)`, amount: floorBase * pct / 100, warn: true });
        }
        if (estimate.include_stairs && estimate.stair_count > 0) {
            const c = estimate.stair_count * (estimate._rates?.floor_stair_each || 35);
            items.push({ section: "Installation", description: `${estimate.stair_count} stairs`, amount: c });
        }
        if (estimate.transition_strips > 0) {
            const c = estimate.transition_strips * (estimate._rates?.floor_transition_each || 20);
            items.push({ section: "Installation", description: `${estimate.transition_strips} transition strips`, amount: c });
        }
        if (estimate.include_baseboards) {
            const perim = Math.round(Math.sqrt(sqft) * 4);
            const c = perim * (estimate._rates?.floor_baseboard_lft || 3);
            items.push({ section: "Installation", description: `Baseboards (~${perim} linear ft)`, amount: c });
        }
        if (estimate.include_removal) {
            const rate = estimate._rates?.floor_removal_sqft || 1.50;
            items.push({ section: "Prep & extras", description: `Floor removal — ${sqft} sq ft`, amount: sqft * rate });
        }
    }

    return items;
}

/* ── Build PDF ───────────────────────────────────────────────────────────── */
export function buildEstimatePDF(estimate, contractorInfo = {}) {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const PW  = doc.internal.pageSize.getWidth();
    const PH  = doc.internal.pageSize.getHeight();
    const ML  = 48;
    const MR  = PW - 48;
    const W   = MR - ML;
    let y = 0;

    const setFont = (size, style = "normal", color = C.dark) => {
        doc.setFontSize(size); doc.setFont("helvetica", style); doc.setTextColor(...color);
    };
    const addLine = (x1, y1, x2, y2, color = C.border, width = 0.5) => {
        doc.setDrawColor(...color); doc.setLineWidth(width); doc.line(x1, y1, x2, y2);
    };
    const addRect = (x, y, w, h, fill, stroke) => {
        if (fill) doc.setFillColor(...fill);
        if (stroke) doc.setDrawColor(...stroke);
        if (fill && stroke) doc.rect(x, y, w, h, "FD");
        else if (fill) doc.rect(x, y, w, h, "F");
        else doc.rect(x, y, w, h, "D");
    };
    const addSection = (title, yStart) => {
        setFont(8, "bold", C.gray);
        doc.setFillColor(...C.lightGray);
        doc.rect(ML, yStart, W, 16, "F");
        doc.text(title.toUpperCase(), ML + 8, yStart + 10.5);
        return yStart + 22;
    };

    // ── HEADER ───────────────────────────────────────────────────────────
    addRect(0, 0, PW, 80, C.dark);
    setFont(18, "bold", C.white);
    doc.text(contractorInfo.businessName || contractorInfo.business_name || "Your Company", ML, 36);
    setFont(8, "normal", [180, 180, 180]);
    if (contractorInfo.phone)   doc.text(contractorInfo.phone,   ML, 50);
    if (contractorInfo.email)   doc.text(contractorInfo.email,   ML, 62);
    if (contractorInfo.address) doc.text(contractorInfo.address, ML, 74);

    addRect(PW - 170, 14, 122, 52, C.green);
    setFont(20, "bold", C.white);
    doc.text("ESTIMATE", PW - 109, 44, { align: "center" });
    setFont(8, "normal", C.white);
    doc.text(`#${estimate.id}`, PW - 109, 58, { align: "center" });
    y = 100;

    // ── DATE ROW ─────────────────────────────────────────────────────────
    const issueDate = estimate.create_at
        ? new Date(estimate.create_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
    const prefDate = estimate.preferred_date
        ? new Date(estimate.preferred_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—";
    setFont(8, "normal", C.gray);
    doc.text(`Date issued: ${issueDate}`, ML, y);
    doc.text(`Preferred start: ${prefDate}`, MR, y, { align: "right" });
    addLine(ML, y + 6, MR, y + 6);
    y += 20;

    // ── BILL TO ───────────────────────────────────────────────────────────
    const colW = W / 2 - 12;
    const col2 = ML + colW + 24;
    setFont(8, "bold", C.gray);
    doc.text("BILL TO", ML, y);
    doc.text("PROJECT AT", col2, y);
    y += 12;
    setFont(10, "bold", C.dark);
    doc.text(estimate.customer_name || "—", ML, y);
    y += 14;
    setFont(9, "normal", C.dark);
    if (estimate.customer_phone) { doc.text(estimate.customer_phone, ML, y); y += 12; }
    if (estimate.customer_email) { doc.text(estimate.customer_email, ML, y); y += 12; }
    const addrLines = doc.splitTextToSize(estimate.customer_address || "Address not provided", colW);
    doc.text(addrLines, col2, y - 24);
    y += 16;
    addLine(ML, y, MR, y);
    y += 16;

    // ── TYPE ──────────────────────────────────────────────────────────────
    const typeLabel = estimate.estimate_type === "painting" ? "🎨  Painting Estimate"
        : estimate.estimate_type === "flooring" ? "🪵  Flooring Estimate"
        : "🎨🪵  Painting + Flooring Estimate";
    setFont(11, "bold", C.dark);
    doc.text(typeLabel, ML, y);
    if (estimate.computed_sqft > 0) {
        setFont(9, "normal", C.gray);
        doc.text(`Total area: ${estimate.computed_sqft.toFixed(0)} sq ft`, MR, y, { align: "right" });
    }
    y += 20;

    // ── ROOMS TABLE ───────────────────────────────────────────────────────
    if (estimate.rooms?.length > 0) {
        y = addSection("Rooms / Areas", y);
        const roomRows = estimate.rooms.map(r => [
            r.name,
            r.length_ft ? `${r.length_ft} ft` : "—",
            r.width_ft  ? `${r.width_ft} ft`  : "—",
            r.height_ft ? `${r.height_ft} ft` : "—",
            r.floor_sqft > 0 ? `${r.floor_sqft.toFixed(0)} sq ft` : "—",
        ]);
        roomRows.push(["", "", "", "Total floor", {
            content: `${estimate.computed_sqft?.toFixed(0) || 0} sq ft`,
            styles: { fontStyle: "bold", textColor: C.green },
        }]);
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 48 },
            head: [["Room", "Length", "Width", "Height", "Floor Area"]],
            body: roomRows,
            styles: { fontSize: 8, cellPadding: 5 },
            headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: "bold" },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 0: { fontStyle: "bold" }, 4: { textColor: C.green, fontStyle: "bold" } },
        });
        y = doc.lastAutoTable.finalY + 16;
    }

    // ── SCOPE SPECS ───────────────────────────────────────────────────────
    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    if (isPainting) {
        y = addSection("Painting Specifications", y);
        const paintRows = [
            ["Surface condition",    fmt(estimate.paint_surface_condition)],
            ["Paint type",           fmt(estimate.paint_type)],
            ["Finish",               fmt(estimate.paint_finish)],
            ["Number of coats",      estimate.paint_coats || "—"],
            ["Ceiling included",     estimate.include_ceiling ? "Yes" : "No"],
            ["Trim / baseboards",    estimate.include_trim   ? "Yes" : "No"],
            ["Doors",                estimate.include_doors  ? `Yes — ${estimate.door_count || 0} doors` : "No"],
            ["Windows",              estimate.window_count > 0 ? `${estimate.window_count}` : "—"],
            ["Client provides paint",estimate.client_provides_paint ? "Yes — material credit applied" : "No"],
            ["Desired colors",       estimate.desired_colors || "—"],
            ["Repairs needed",       estimate.repairs_needed ? "YES ⚠" : "No"],
        ];
        if (estimate.repairs_needed && estimate.repairs_detail)
            paintRows.push(["Repair detail", estimate.repairs_detail]);
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 48 },
            body: paintRows,
            styles: { fontSize: 8, cellPadding: 5 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 0: { fontStyle: "bold", textColor: C.gray, cellWidth: 170 } },
            didParseCell(data) {
                if (data.column.index === 1 && data.cell.raw === "YES ⚠") {
                    data.cell.styles.textColor = [180, 30, 30];
                    data.cell.styles.fontStyle = "bold";
                }
            },
        });
        y = doc.lastAutoTable.finalY + 16;
    }

    if (isFlooring) {
        y = addSection("Flooring Specifications", y);
        const floorRows = [
            ["New material",          fmt(estimate.flooring_material)],
            ["Current floor state",   fmt(estimate.flooring_current)],
            ["Installation pattern",  fmt(estimate.flooring_pattern)],
            ["Subfloor condition",    fmt(estimate.subfloor_condition)],
            ["Removal of old floor",  estimate.include_removal    ? "Included" : "Not included"],
            ["Baseboard installation",estimate.include_baseboards ? "Yes" : "No"],
            ["Transition strips",     estimate.transition_strips > 0 ? String(estimate.transition_strips) : "—"],
            ["Stairs",                estimate.include_stairs ? `Yes — ${estimate.stair_count || 0} steps` : "No"],
        ];
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 48 },
            body: floorRows,
            styles: { fontSize: 8, cellPadding: 5 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 0: { fontStyle: "bold", textColor: C.gray, cellWidth: 170 } },
        });
        y = doc.lastAutoTable.finalY + 16;
    }

    // ── NOTES ─────────────────────────────────────────────────────────────
    if (estimate.description) {
        if (y > PH - 140) { doc.addPage(); y = 48; }
        y = addSection("Notes / Special Instructions", y);
        setFont(8, "normal", C.dark);
        const noteLines = doc.splitTextToSize(estimate.description, W - 16);
        doc.text(noteLines, ML + 8, y);
        y += noteLines.length * 12 + 10;
    }

    // ── LINE-ITEM PRICE BREAKDOWN ─────────────────────────────────────────
    // NEW in v2: full breakdown table visible to the client
  if (estimate.quoted_amount) {
        if (y > PH - 200) { doc.addPage(); y = 48; }
        y = addSection("Price Breakdown", y);
 
        // Read the stored breakdown JSON (saved when contractor set the quote)
        let lineItems = [];
        if (estimate.price_breakdown_json) {
            try {
                lineItems = JSON.parse(estimate.price_breakdown_json);
            } catch (e) {
                lineItems = [];
            }
        }
 
        if (lineItems.length > 0) {
            const sections = ["Installation", "Prep & extras", "Protection fees"];
            const tableRows = [];
 
            sections.forEach(section => {
                const sectionItems = lineItems.filter(l => l.section === section);
                if (sectionItems.length === 0) return;
 
                // Section subheader
                tableRows.push([{
                    content: section.toUpperCase(),
                    colSpan: 2,
                    styles: {
                        fontStyle: "bold", fontSize: 7,
                        textColor: C.gray, fillColor: C.lightGray,
                        cellPadding: { top: 5, bottom: 3, left: 6, right: 6 },
                    },
                }]);
 
                sectionItems.forEach(item => {
                    const isNeg = item.amount < 0;
                    tableRows.push([
                        {
                            content: item.description,
                            styles: { textColor: item.warn ? C.amber : C.dark },
                        },
                        {
                            content: isNeg
                                ? `-$${Math.abs(Math.round(item.amount)).toLocaleString()}`
                                : money(item.amount),
                            styles: {
                                halign: "right",
                                fontStyle: "bold",
                                textColor: isNeg ? [180, 30, 30] : C.dark,
                            },
                        },
                    ]);
                });
            });
 
            // Grand total row
            tableRows.push([
                {
                    content: "TOTAL ESTIMATE",
                    styles: {
                        fontStyle: "bold", fontSize: 10,
                        fillColor: C.green, textColor: C.white,
                        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 },
                    },
                },
                {
                    content: money(estimate.quoted_amount),
                    styles: {
                        fontStyle: "bold", fontSize: 12, halign: "right",
                        fillColor: C.green, textColor: C.white,
                        cellPadding: { top: 8, bottom: 8, left: 8, right: 8 },
                    },
                },
            ]);
 
            autoTable(doc, {
                startY: y,
                margin: { left: ML, right: 48 },
                body: tableRows,
                styles: { fontSize: 9, cellPadding: 5 },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 90 } },
            });
            y = doc.lastAutoTable.finalY + 12;
 
        } else {
            // Fallback — no breakdown stored, show just the total
            addRect(ML, y, W, 56, C.greenLight, C.green);
            setFont(8, "bold", C.gray);
            doc.text("TOTAL ESTIMATE", ML + W / 2, y + 16, { align: "center" });
            setFont(24, "bold", C.green);
            doc.text(money(estimate.quoted_amount), ML + W / 2, y + 40, { align: "center" });
            y += 64;
        }
 
        // Contractor notes
        if (estimate.contractor_notes) {
            setFont(8, "italic", C.gray);
            const cnLines = doc.splitTextToSize(`Included: ${estimate.contractor_notes}`, W - 16);
            doc.text(cnLines, ML + 8, y);
            y += cnLines.length * 12 + 10;
        }
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        addLine(ML, PH - 36, MR, PH - 36, C.border);
        setFont(7, "normal", C.gray);
        doc.text(
            `${contractorInfo.businessName || contractorInfo.business_name || "Company"} · This estimate is valid for 30 days · Page ${p} of ${totalPages}`,
            PW / 2, PH - 20, { align: "center" }
        );
    }

    return doc;
}

/* ── Public hooks ────────────────────────────────────────────────────────── */
export function useEstimatePDF() {
    const downloadPDF = (estimate, contractorInfo) => {
        const doc = buildEstimatePDF(estimate, contractorInfo);
        doc.save(`estimate-${estimate.id}-${(estimate.customer_name || "client").replace(/\s+/g, "-")}.pdf`);
    };

    const previewPDF = (estimate, contractorInfo) => {
        const doc  = buildEstimatePDF(estimate, contractorInfo);
        const blob = doc.output("blob");
        const url  = URL.createObjectURL(blob);
        window.open(url, "_blank");
    };

    const sendByEmail = async (estimate, contractorInfo) => {
        const doc    = buildEstimatePDF(estimate, contractorInfo);
        const base64 = doc.output("datauristring").split(",")[1];
        const token  = localStorage.getItem("token");
        const BASE   = import.meta.env.VITE_BACKEND_URL || "";
        const res = await fetch(`${BASE}/api/estimates/${estimate.id}/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                recipient_email: estimate.customer_email,
                pdf_base64: base64,
                filename: `estimate-${estimate.id}.pdf`,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send email");
        return data;
    };

    return { downloadPDF, previewPDF, sendByEmail };
}