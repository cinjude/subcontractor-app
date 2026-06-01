// src/pages/Estimates/Useestimatepdf.js — VERSION 4
// KEY FIX: reads price_breakdown_json stored on estimate
// and renders ALL line items in the PDF including furniture, travel, min fee
// Compact layout — fits on ONE page for most estimates

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
    dark: [30, 30, 30], green: [22, 163, 74], greenLight: [240, 253, 244],
    gray: [100, 100, 100], lightGray: [245, 245, 245], border: [220, 220, 220],
    white: [255, 255, 255], amber: [180, 83, 9],
};

function fmt(val) { return val ? String(val).replace(/_/g, " ") : "—"; }
function money(val) {
    if (val == null) return "—";
    return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

export function buildEstimatePDF(estimate, contractorInfo = {}) {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();
    const ML = 40, MR = PW - 40, W = MR - ML;
    let y = 0;

    const sf = (size, style = "normal", color = C.dark) => {
        doc.setFontSize(size); doc.setFont("helvetica", style); doc.setTextColor(...color);
    };
    const ln = (x1, y1, x2, y2, color = C.border) => {
        doc.setDrawColor(...color); doc.setLineWidth(0.5); doc.line(x1, y1, x2, y2);
    };

    // ── HEADER ────────────────────────────────────────────────────────────
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 68, "F");

    sf(16, "bold", C.white);
    doc.text(contractorInfo.businessName || contractorInfo.business_name || "Your Company", ML, 30);
    sf(7.5, "normal", [180, 180, 180]);
    const contactParts = [contractorInfo.phone, contractorInfo.email, contractorInfo.address].filter(Boolean);
    if (contactParts.length) doc.text(contactParts.join("  ·  "), ML, 44);

    doc.setFillColor(...C.green);
    doc.rect(PW - 155, 10, 115, 48, "F");
    sf(16, "bold", C.white);
    doc.text("ESTIMATE", PW - 97.5, 34, { align: "center" });
    sf(8, "normal", C.white);
    doc.text(`#${estimate.id}`, PW - 97.5, 48, { align: "center" });
    y = 78;

    // ── DATE + CLIENT ─────────────────────────────────────────────────────
    const issueDate = estimate.create_at
        ? new Date(estimate.create_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    sf(8, "normal", C.gray);
    doc.text(`Issued: ${issueDate}`, ML, y);
    const prefDate = estimate.preferred_date
        ? new Date(estimate.preferred_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
    if (prefDate) doc.text(`Start: ${prefDate}`, ML + 120, y);
    ln(ML, y + 5, MR, y + 5);
    y += 14;

    sf(7, "bold", C.gray);
    doc.text("BILL TO", ML, y);
    doc.text("JOB ADDRESS", ML + W / 2 + 8, y);
    y += 10;
    sf(10, "bold", C.dark);
    doc.text(estimate.customer_name || "—", ML, y);
    y += 12;
    sf(8, "normal", C.dark);
    if (estimate.customer_phone) { doc.text(estimate.customer_phone, ML, y); y += 10; }
    if (estimate.customer_email) { doc.text(estimate.customer_email, ML, y); y += 10; }
    const addrText = estimate.customer_address || "—";
    const addrLines = doc.splitTextToSize(addrText, W / 2 - 8);
    doc.text(addrLines, ML + W / 2 + 8, y - 20);
    y += 6;
    ln(ML, y, MR, y);
    y += 10;

    // ── TYPE + SQ FT ──────────────────────────────────────────────────────
    const typeLabel = estimate.estimate_type === "painting" ? "Painting Estimate"
        : estimate.estimate_type === "flooring" ? "Flooring Estimate"
        : "Painting + Flooring Estimate";
    sf(10, "bold", C.dark);
    doc.text(typeLabel, ML, y);
    if (estimate.computed_sqft > 0) {
        sf(8, "normal", C.gray);
        doc.text(`${Number(estimate.computed_sqft).toFixed(0)} sq ft`, MR, y, { align: "right" });
    }
    y += 12;

    // ── ROOMS ─────────────────────────────────────────────────────────────
    if (estimate.rooms?.length > 0) {
        const roomRows = estimate.rooms.map(r => [
            r.name,
            r.floor_sqft > 0 ? `${r.floor_sqft.toFixed(0)} sq ft` : "—",
        ]);
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 40 },
            head: [["Room / Area", "Floor Area"]],
            body: roomRows,
            styles: { fontSize: 7.5, cellPadding: 3 },
            headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: "bold", fontSize: 7.5 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" } },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── SPECS ─────────────────────────────────────────────────────────────
    const isPainting = ["painting", "both"].includes(estimate.estimate_type);
    const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

    const paintRows = isPainting ? [
        ["Surface", fmt(estimate.paint_surface_condition)],
        ["Paint type", fmt(estimate.paint_type)],
        ["Finish", fmt(estimate.paint_finish)],
        ["Coats", estimate.paint_coats || "—"],
        ["Ceiling", estimate.include_ceiling ? "Yes" : "No"],
        ["Trim", estimate.include_trim ? "Yes" : "No"],
        ["Doors", estimate.include_doors ? `${estimate.door_count || 0} doors` : "No"],
        ["Windows", estimate.window_count > 0 ? `${estimate.window_count}` : "—"],
        ["Client paint", estimate.client_provides_paint ? "Yes — credit applied" : "No"],
        ...(estimate.desired_colors ? [["Colors", estimate.desired_colors]] : []),
        ...(estimate.repairs_needed ? [["Repairs", `YES — ${estimate.repairs_detail || "see notes"}`]] : []),
    ] : [];

    const floorRows = isFlooring ? [
        ["Material", fmt(estimate.flooring_material)],
        ["Current floor", fmt(estimate.flooring_current)],
        ["Pattern", fmt(estimate.flooring_pattern)],
        ["Subfloor", fmt(estimate.subfloor_condition)],
        ["Removal", estimate.include_removal ? "Included" : "No"],
        ["Baseboards", estimate.include_baseboards ? "Yes" : "No"],
        ["Transitions", estimate.transition_strips > 0 ? `${estimate.transition_strips}` : "—"],
        ["Stairs", estimate.include_stairs ? `${estimate.stair_count} steps` : "No"],
    ] : [];

    const specTableOpts = {
        styles: { fontSize: 7.5, cellPadding: 3 },
        headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 7.5 },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 0: { fontStyle: "bold", textColor: C.gray, cellWidth: 100 } },
        didParseCell(data) {
            if (data.column.index === 1 && String(data.cell.raw).startsWith("YES")) {
                data.cell.styles.textColor = [180, 30, 30];
                data.cell.styles.fontStyle = "bold";
            }
        },
    };

    if (isPainting && isFlooring) {
        const halfW = (W - 16) / 2;
        const startY = y;
        autoTable(doc, { ...specTableOpts, startY, margin: { left: ML, right: ML + halfW + 16 }, head: [["Painting", ""]], body: paintRows });
        const leftEnd = doc.lastAutoTable.finalY;
        autoTable(doc, { ...specTableOpts, startY, margin: { left: ML + halfW + 16, right: 40 }, head: [["Flooring", ""]], body: floorRows });
        y = Math.max(leftEnd, doc.lastAutoTable.finalY) + 8;
    } else if (isPainting) {
        autoTable(doc, { ...specTableOpts, startY: y, margin: { left: ML, right: 40 }, head: [["Painting specifications", ""]], body: paintRows });
        y = doc.lastAutoTable.finalY + 8;
    } else if (isFlooring) {
        autoTable(doc, { ...specTableOpts, startY: y, margin: { left: ML, right: 40 }, head: [["Flooring specifications", ""]], body: floorRows });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── NOTES ─────────────────────────────────────────────────────────────
    if (estimate.description) {
        // Strip the "Materials: ..." prefix from description (internal data, not for client)
        const cleanDesc = estimate.description
            .split("\n")
            .filter(l => !l.startsWith("Materials:") && !l.startsWith("Painting:") && !l.startsWith("Flooring:"))
            .join("\n")
            .trim();
        if (cleanDesc) {
            sf(7, "bold", C.gray);
            doc.text("NOTES", ML, y); y += 9;
            sf(7.5, "normal", C.dark);
            const noteLines = doc.splitTextToSize(cleanDesc, W);
            doc.text(noteLines, ML, y);
            y += noteLines.length * 9 + 6;
        }
    }

    // ── PURCHASED MATERIALS TABLE (contractor cost — not shown to client by default) ────
    if (estimate.materials_json) {
        let mats = [];
        try { mats = JSON.parse(estimate.materials_json); } catch(e) {}
        if (mats.length > 0) {
            const totalMatCost = mats.reduce((s,m) => s+(parseFloat(m.quantity)||0)*(parseFloat(m.unit_cost)||0), 0);

            // Section label
            sf(7, "bold", [180, 83, 9]);
            doc.text("MATERIALS TO PURCHASE", ML, y); y += 9;

            const matRows = mats.map(m => {
                const rowTotal = (parseFloat(m.quantity)||0)*(parseFloat(m.unit_cost)||0);
                return [
                    m.name || "—",
                    (m.category || "other").replace(/_/g," "),
                    `${m.quantity} ${m.unit}`,
                    `$${parseFloat(m.unit_cost||0).toFixed(2)}`,
                    `$${rowTotal.toFixed(2)}`,
                ];
            });
            matRows.push([
                { content: "Total materials cost", colSpan: 4, styles: { fontStyle: "bold", halign: "right", textColor: [180,83,9] } },
                { content: `$${totalMatCost.toFixed(2)}`, styles: { fontStyle: "bold", textColor: [180,30,30], halign:"right" } },
            ]);
            autoTable(doc, {
                startY: y, margin: { left: ML, right: 40 },
                head: [["Material", "Category", "Qty", "Unit cost", "Total"]],
                body: matRows,
                styles: { fontSize: 7.5, cellPadding: 3 },
                headStyles: { fillColor: [180, 83, 9], textColor: C.white, fontSize: 7.5, fontStyle: "bold" },
                columnStyles: {
                    0: { fontStyle: "bold" },
                    2: { halign: "right" },
                    3: { halign: "right" },
                    4: { halign: "right", textColor: [180,30,30], fontStyle: "bold" },
                },
                alternateRowStyles: { fillColor: [255, 247, 237] },
                footStyles: { fillColor: [255, 247, 237] },
            });
            y = doc.lastAutoTable.finalY + 8;

            // Small disclaimer
            sf(6.5, "italic", C.gray);
            doc.text("* Contractor purchasing cost — included in quoted price above.", ML, y);
            y += 10;
        }
    }


    // ── PRICE BREAKDOWN ───────────────────────────────────────────────────
    if (estimate.quoted_amount) {
        // Parse stored JSON breakdown — this is written by PriceCalculatorModal
        // and contains ALL line items: installation, prep, furniture, travel, min fee
        let lineItems = [];
        if (estimate.price_breakdown_json) {
            try {
                const parsed = JSON.parse(estimate.price_breakdown_json);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    lineItems = parsed;
                }
            } catch (e) {
                lineItems = [];
            }
        }

        if (lineItems.length > 0) {
            // Group by section — handle both "section" field naming conventions
            // PriceCalculatorModal saves: { section, label, amount, warn }
            // handleQuoteSave maps: label -> description
            // So items could have either .label or .description
            const getDesc = item => item.description || item.label || "";
            const getSection = item => item.section || "Installation";

            // Collect all unique section names in order
            const sectionOrder = ["Materials", "Installation", "Prep & extras", "Protection fees"];
            // Also capture any sections not in the default order
            const allSections = [...new Set(lineItems.map(getSection))];
            const orderedSections = [
                ...sectionOrder.filter(s => allSections.includes(s)),
                ...allSections.filter(s => !sectionOrder.includes(s) && s !== "__tax_meta__"),
            ];

            // Read tax from the __tax_meta__ sentinel row — MUST be before forEach
            const taxMeta = lineItems.find(l => l.section === "__tax_meta__");
            const pdfTaxRate = taxMeta?.taxRate || 0;
            const pdfTaxAmt  = Number(taxMeta?.amount) || 0;
            // Real lines exclude the sentinel — MUST be before forEach
            const realItems = lineItems.filter(l => l.section !== "__tax_meta__");
            const lineItemsTotal = realItems.reduce((s, l) => s + (Number(l.amount) || 0), 0);

            const tableRows = [];
            orderedSections.forEach(section => {
                const items = realItems.filter(l => getSection(l) === section);
                if (!items.length) return;

                // Section subheader — Materials section gets orange accent
                const isMatsSection = section === "Materials";
                tableRows.push([{
                    content: section.toUpperCase(), colSpan: 2,
                    styles: {
                        fontStyle: "bold", fontSize: 6.5,
                        textColor: isMatsSection ? [180, 83, 9] : C.gray,
                        fillColor: isMatsSection ? [255, 247, 237] : C.lightGray,
                        cellPadding: { top: 4, bottom: 2, left: 6, right: 6 },
                    },
                }]);

                items.forEach(item => {
                    const amt = Number(item.amount) || 0;
                    const isNeg = amt < 0;
                    tableRows.push([
                        {
                            content: getDesc(item),
                            styles: { textColor: item.warn ? C.amber : C.dark, fontSize: 8 },
                        },
                        {
                            content: isNeg
                                ? `-$${Number(Math.abs(amt)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})}`
                                : money(amt),
                            styles: {
                                halign: "right", fontStyle: "bold", fontSize: 8,
                                textColor: isNeg ? [180, 30, 30] : C.dark,
                            },
                        },
                    ]);
                });
            });

            tableRows.push([
                { content: "Subtotal", styles: { fontStyle: "bold", textColor: C.gray, fontSize: 8, fillColor: [248,249,250] } },
                { content: money(lineItemsTotal), styles: { halign: "right", fontStyle: "bold", fontSize: 8, fillColor: [248,249,250], textColor: C.dark } },
            ]);

            // Tax row — from stored tax metadata
            if (pdfTaxAmt > 0.01) {
                const taxLabel = pdfTaxRate > 0 ? `Tax (${pdfTaxRate}%)` : "Tax";
                tableRows.push([
                    { content: taxLabel, styles: { fontStyle: "normal", textColor: C.gray, fontSize: 8, fillColor: [248,249,250] } },
                    { content: money(pdfTaxAmt), styles: { halign: "right", fontSize: 8, fillColor: [248,249,250], textColor: C.dark } },
                ]);
            }

            // Grand total row
            tableRows.push([
                {
                    content: "TOTAL ESTIMATE",
                    styles: {
                        fontStyle: "bold", fontSize: 10, fillColor: C.green,
                        textColor: C.white, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
                    },
                },
                {
                    content: money(estimate.quoted_amount),
                    styles: {
                        fontStyle: "bold", fontSize: 11, halign: "right",
                        fillColor: C.green, textColor: C.white,
                        cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
                    },
                },
            ]);

            autoTable(doc, {
                startY: y, margin: { left: ML, right: 40 },
                head: [["Price Breakdown", ""]],
                body: tableRows,
                styles: { fontSize: 8, cellPadding: 3.5 },
                headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 8 },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 80 } },
            });
            y = doc.lastAutoTable.finalY + 6;

        } else {
            // Fallback — no breakdown stored, show green total box
            doc.setFillColor(...C.greenLight);
            doc.setDrawColor(...C.green);
            doc.rect(ML, y, W, 44, "FD");
            sf(7.5, "bold", C.gray);
            doc.text("TOTAL ESTIMATE", ML + W / 2, y + 14, { align: "center" });
            sf(20, "bold", C.green);
            doc.text(money(estimate.quoted_amount), ML + W / 2, y + 34, { align: "center" });
            y += 50;
        }

        // Contractor notes below total
        if (estimate.contractor_notes) {
            sf(7.5, "italic", C.gray);
            const cn = doc.splitTextToSize(`Included: ${estimate.contractor_notes}`, W - 8);
            doc.text(cn, ML + 4, y);
            y += cn.length * 9 + 4;
        }
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        ln(ML, PH - 28, MR, PH - 28, C.border);
        sf(6.5, "normal", C.gray);
        doc.text(
            `${contractorInfo.businessName || contractorInfo.business_name || "Company"} · Estimate valid 30 days · Page ${p} of ${totalPages}`,
            PW / 2, PH - 16, { align: "center" }
        );
    }

    return doc;
}

export function useEstimatePDF() {
    const downloadPDF = (estimate, contractorInfo) => {
        const doc = buildEstimatePDF(estimate, contractorInfo);
        doc.save(`estimate-${estimate.id}-${(estimate.customer_name || "client").replace(/\s+/g, "-")}.pdf`);
    };
    const previewPDF = (estimate, contractorInfo) => {
        const doc = buildEstimatePDF(estimate, contractorInfo);
        const blob = doc.output("blob");
        window.open(URL.createObjectURL(blob), "_blank");
    };
    const sendByEmail = async (estimate, contractorInfo) => {
        const doc = buildEstimatePDF(estimate, contractorInfo);
        const base64 = doc.output("datauristring").split(",")[1];
        const token = localStorage.getItem("token");
        const BASE = import.meta.env.VITE_BACKEND_URL || "";
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