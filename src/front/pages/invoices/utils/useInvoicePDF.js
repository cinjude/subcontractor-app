// src/front/pages/invoices/utils/useInvoicePDF.js
// Single-invoice professional PDF — mirrors Useestimatepdf.js (buildEstimatePDF)
// Renders: header, client/business info, rooms, paint/flooring specs,
// materials to purchase, full price breakdown, total, notes.

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const C = {
    dark: [30, 30, 30], green: [22, 163, 74], greenLight: [240, 253, 244],
    gray: [100, 100, 100], lightGray: [245, 245, 245], border: [220, 220, 220],
    white: [255, 255, 255], amber: [180, 83, 9],
};

function money(val) {
    if (val == null) return "—";
    return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}
function safeParse(json, fallback) {
    if (!json) return fallback;
    try { return JSON.parse(json); } catch (e) { return fallback; }
}

export function buildInvoicePDF(invoice, contractorInfo = {}) {
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

    const rooms     = safeParse(invoice.rooms_json, []);
    const mats      = safeParse(invoice.materials_json, []);
    let breakdown   = safeParse(invoice.price_breakdown_json, []);
    breakdown       = breakdown.filter(l => l.section !== "__tax_meta__");
    const hasDetailed = breakdown.length > 0;

    // ── HEADER ────────────────────────────────────────────────────────────
    doc.setFillColor(...C.dark);
    doc.rect(0, 0, PW, 68, "F");

    sf(16, "bold", C.white);
    doc.text(invoice.contractor_name || contractorInfo.businessName || "Your Company", ML, 30);
    sf(7.5, "normal", [180, 180, 180]);
    const contactParts = [invoice.contractor_phone, invoice.contractor_email, invoice.contractor_address].filter(Boolean);
    if (contactParts.length) doc.text(contactParts.join("  ·  "), ML, 44);

    doc.setFillColor(...C.green);
    doc.rect(PW - 155, 10, 115, 48, "F");
    sf(16, "bold", C.white);
    doc.text("INVOICE", PW - 97.5, 34, { align: "center" });
    sf(8, "normal", C.white);
    doc.text(`#${invoice.invoice_number}`, PW - 97.5, 48, { align: "center" });
    y = 78;

    // ── DATES + CLIENT ────────────────────────────────────────────────────
    const issueDate = invoice.issue_date
        ? new Date(invoice.issue_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
    const dueDate = invoice.due_date
        ? new Date(invoice.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

    sf(8, "normal", C.gray);
    doc.text(`Issued: ${issueDate}`, ML, y);
    doc.text(`Due: ${dueDate}`, ML + 150, y);
    sf(8, "bold", invoice.status === "paid" ? C.green : C.gray);
    doc.text((invoice.status || "draft").toUpperCase(), MR, y, { align: "right" });
    ln(ML, y + 5, MR, y + 5);
    y += 14;

    sf(7, "bold", C.gray);
    doc.text("BILL TO", ML, y);
    y += 10;
    sf(10, "bold", C.dark);
    doc.text(invoice.customer_name || "—", ML, y);
    y += 12;
    sf(8, "normal", C.dark);
    if (invoice.customer_email) { doc.text(invoice.customer_email, ML, y); y += 10; }
    if (invoice.customer_address) {
        const addrLines = doc.splitTextToSize(invoice.customer_address, W / 2 - 8);
        doc.text(addrLines, ML, y);
        y += addrLines.length * 10;
    }
    y += 6;
    ln(ML, y, MR, y);
    y += 10;

    // ── TYPE + SQ FT ──────────────────────────────────────────────────────
    if (invoice.estimate_type) {
        const typeLabel = invoice.estimate_type === "painting" ? "Painting Invoice"
            : invoice.estimate_type === "flooring" ? "Flooring Invoice"
            : "Painting + Flooring Invoice";
        sf(10, "bold", C.dark);
        doc.text(typeLabel, ML, y);
        const totalSqft = rooms.reduce((s, r) => s + (Number(r.floor_sqft) || 0), 0);
        if (totalSqft > 0) {
            sf(8, "normal", C.gray);
            doc.text(`${totalSqft.toFixed(0)} sq ft`, MR, y, { align: "right" });
        }
        y += 12;
    }

    // ── ROOMS ─────────────────────────────────────────────────────────────
    if (rooms.length > 0) {
        const roomRows = rooms.map(r => [r.name, r.floor_sqft > 0 ? `${Number(r.floor_sqft).toFixed(0)} sq ft` : "—"]);
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

    // ── MATERIALS TABLE ───────────────────────────────────────────────────
    if (mats.length > 0) {
        const totalMatCost = mats.reduce((s, m) => s + (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0), 0);
        sf(7, "bold", [180, 83, 9]);
        doc.text("MATERIALS TO PURCHASE", ML, y); y += 9;

        const matRows = mats.map(m => {
            const rowTotal = (parseFloat(m.quantity) || 0) * (parseFloat(m.unit_cost) || 0);
            return [m.name || "—", (m.category || "other").replace(/_/g, " "), `${m.quantity} ${m.unit}`, `$${parseFloat(m.unit_cost || 0).toFixed(2)}`, `$${rowTotal.toFixed(2)}`];
        });
        matRows.push([
            { content: "Total materials cost", colSpan: 4, styles: { fontStyle: "bold", halign: "right", textColor: [180, 83, 9] } },
            { content: `$${totalMatCost.toFixed(2)}`, styles: { fontStyle: "bold", textColor: [180, 30, 30], halign: "right" } },
        ]);
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 40 },
            head: [["Material", "Category", "Qty", "Unit cost", "Total"]],
            body: matRows,
            styles: { fontSize: 7.5, cellPadding: 3 },
            headStyles: { fillColor: [180, 83, 9], textColor: C.white, fontSize: 7.5, fontStyle: "bold" },
            columnStyles: { 0: { fontStyle: "bold" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right", textColor: [180, 30, 30], fontStyle: "bold" } },
            alternateRowStyles: { fillColor: [255, 247, 237] },
        });
        y = doc.lastAutoTable.finalY + 10;
    }

    // ── PRICE BREAKDOWN (or fallback simple line items) ──────────────────
    if (hasDetailed) {
        const getDesc = item => item.description || item.label || "";
        const getSection = item => item.section || "Installation";
        const sectionOrder = ["Materials", "Installation", "Prep & extras", "Protection fees"];
        const allSections = [...new Set(breakdown.map(getSection))];
        const orderedSections = [...sectionOrder.filter(s => allSections.includes(s)), ...allSections.filter(s => !sectionOrder.includes(s))];

        const tableRows = [];
        orderedSections.forEach(section => {
            const items = breakdown.filter(l => getSection(l) === section);
            if (!items.length) return;
            const isMatsSection = section === "Materials";
            tableRows.push([{
                content: section.toUpperCase(), colSpan: 2,
                styles: { fontStyle: "bold", fontSize: 6.5, textColor: isMatsSection ? [180, 83, 9] : C.gray, fillColor: isMatsSection ? [255, 247, 237] : C.lightGray, cellPadding: { top: 4, bottom: 2, left: 6, right: 6 } },
            }]);
            items.forEach(item => {
                const amt = Number(item.amount) || 0;
                const isNeg = amt < 0;
                tableRows.push([
                    { content: getDesc(item), styles: { textColor: item.warn ? C.amber : C.dark, fontSize: 8 } },
                    { content: isNeg ? `-$${Math.abs(amt).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : money(amt), styles: { halign: "right", fontStyle: "bold", fontSize: 8, textColor: isNeg ? [180, 30, 30] : C.dark } },
                ]);
            });
        });

        tableRows.push([
            { content: "Subtotal", styles: { fontStyle: "bold", textColor: C.gray, fontSize: 8, fillColor: [248, 249, 250] } },
            { content: money(invoice.subtotal), styles: { halign: "right", fontStyle: "bold", fontSize: 8, fillColor: [248, 249, 250] } },
        ]);
        if (Number(invoice.tax) > 0.01) {
            tableRows.push([
                { content: "Tax", styles: { fontStyle: "normal", textColor: C.gray, fontSize: 8, fillColor: [248, 249, 250] } },
                { content: money(invoice.tax), styles: { halign: "right", fontSize: 8, fillColor: [248, 249, 250] } },
            ]);
        }
        tableRows.push([
            { content: "TOTAL DUE", styles: { fontStyle: "bold", fontSize: 10, fillColor: C.green, textColor: C.white, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 } } },
            { content: money(invoice.total_amount), styles: { fontStyle: "bold", fontSize: 11, halign: "right", fillColor: C.green, textColor: C.white, cellPadding: { top: 7, bottom: 7, left: 8, right: 8 } } },
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
        y = doc.lastAutoTable.finalY + 8;

    } else if (invoice.invoice_items?.length > 0) {
        const rows = invoice.invoice_items.map(it => [
            it.description, String(it.quantity), money(it.unit_price), money(it.row_total ?? it.quantity * it.unit_price),
        ]);
        rows.push([
            { content: "Subtotal", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } },
            { content: money(invoice.subtotal), styles: { fontStyle: "bold", halign: "right" } },
        ]);
        if (Number(invoice.tax) > 0.01) {
            rows.push([
                { content: "Tax", colSpan: 3, styles: { halign: "right" } },
                { content: money(invoice.tax), styles: { halign: "right" } },
            ]);
        }
        rows.push([
            { content: "TOTAL DUE", colSpan: 3, styles: { fontStyle: "bold", fontSize: 10, fillColor: C.green, textColor: C.white, halign: "right" } },
            { content: money(invoice.total_amount), styles: { fontStyle: "bold", fontSize: 11, halign: "right", fillColor: C.green, textColor: C.white } },
        ]);
        autoTable(doc, {
            startY: y, margin: { left: ML, right: 40 },
            head: [["Description", "Qty", "Unit price", "Total"]],
            body: rows,
            styles: { fontSize: 8, cellPadding: 3.5 },
            headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 8 },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
        });
        y = doc.lastAutoTable.finalY + 8;
    }

    // ── NOTES ─────────────────────────────────────────────────────────────
    if (invoice.notes) {
        const cleanNotes = invoice.notes.split("\n").filter(l => !l.startsWith("Materials:")).join("\n").trim();
        if (cleanNotes) {
            sf(7, "bold", C.gray);
            doc.text("NOTES", ML, y); y += 9;
            sf(7.5, "normal", C.dark);
            const noteLines = doc.splitTextToSize(cleanNotes, W);
            doc.text(noteLines, ML, y);
            y += noteLines.length * 9 + 6;
        }
    }

    // ── FOOTER ────────────────────────────────────────────────────────────
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        ln(ML, PH - 28, MR, PH - 28, C.border);
        sf(6.5, "normal", C.gray);
        doc.text(
            `${invoice.contractor_name || "Company"} · Invoice #${invoice.invoice_number} · Page ${p} of ${totalPages}`,
            PW / 2, PH - 16, { align: "center" }
        );
    }

    return doc;
}

export function useInvoicePDF() {
    const downloadPDF = (invoice) => {
        const doc = buildInvoicePDF(invoice);
        doc.save(`invoice-${invoice.invoice_number}-${(invoice.customer_name || "client").replace(/\s+/g, "-")}.pdf`);
    };
    const previewPDF = (invoice) => {
        const doc = buildInvoicePDF(invoice);
        const blob = doc.output("blob");
        window.open(URL.createObjectURL(blob), "_blank");
    };
    return { downloadPDF, previewPDF };
}