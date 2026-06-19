// src/front/pages/invoices/utils/invoicePDF.js
// Professional MULTI-INVOICE REPORT PDF — used by InvoicesPage.jsx "Download PDF report" button
// Exports: generateInvoiceReportPDF({ invoices, stats, filters })
// This is DIFFERENT from useInvoicePDF.js (which builds a single invoice document)

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const fmtMoney = v => `$${Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const fmtDate  = d => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export async function generateInvoiceReportPDF({ invoices = [], stats = null, filters = {} }) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;

    // ── helpers ──────────────────────────────────────────────────────────────
    const totalShown = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const paid       = invoices.filter(i => i.status === "paid");
    const sent       = invoices.filter(i => i.status === "sent");
    const overdue    = invoices.filter(i => i.status === "overdue");
    const draft      = invoices.filter(i => i.status === "draft");
    const totalPaid  = paid.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalSent  = sent.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalOverdue = overdue.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const totalDraft   = draft.reduce((s, i) => s + Number(i.total_amount || 0), 0);
    const collectionRate = totalShown > 0 ? ((totalPaid / totalShown) * 100).toFixed(1) : "0.0";

    const periodLabel = () => {
        if (!filters.year || filters.year === "all") return "All Time";
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        if (!filters.month || filters.month === "all") return String(filters.year);
        return `${months[Number(filters.month) - 1]} ${filters.year}`;
    };

    const generatedDate = new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    // ── PAGE 1: Cover / Summary ───────────────────────────────────────────────
    doc.setFillColor(15, 35, 64);
    doc.rect(0, 0, pageW, 52, "F");

    doc.setFillColor(22, 163, 74);
    doc.rect(0, 52, pageW, 3, "F");

    doc.setFillColor(255, 255, 255, 0.1);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.circle(margin + 10, 26, 10, "S");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("TQ", margin + 7, 27.5);

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("INVOICE REPORT", margin + 26, 24);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(180, 200, 220);
    doc.text(`Period: ${periodLabel()}`, margin + 26, 32);
    doc.text(`Generated: ${generatedDate}`, margin + 26, 38);
    if (filters.status && filters.status !== "all") {
        doc.text(`Filter: ${filters.status.toUpperCase()}`, margin + 26, 44);
    }

    // ── Summary boxes (4 cards) ──────────────────────────────────────────────
    let y = 66;
    const boxW = (pageW - margin * 2 - 12) / 4;
    const boxes = [
        { label: "PAID",        value: fmtMoney(totalPaid),    count: paid.length,    color: [240, 253, 244], accent: [22, 163, 74]  },
        { label: "OUTSTANDING", value: fmtMoney(totalSent),    count: sent.length,    color: [239, 246, 255], accent: [37, 99, 235]  },
        { label: "OVERDUE",     value: fmtMoney(totalOverdue), count: overdue.length, color: [254, 242, 242], accent: [220, 38, 38]  },
        { label: "DRAFT",       value: fmtMoney(totalDraft),   count: draft.length,   color: [248, 250, 252], accent: [100, 116, 139]},
    ];

    boxes.forEach((b, i) => {
        const x = margin + i * (boxW + 4);
        doc.setFillColor(...b.color);
        doc.setDrawColor(220, 230, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, boxW, 36, 3, 3, "FD");
        doc.setFillColor(...b.accent);
        doc.roundedRect(x, y, boxW, 4, 3, 3, "F");
        doc.rect(x, y + 1, boxW, 3, "F");
        doc.setTextColor(...b.accent);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(b.label, x + 4, y + 12);
        doc.setTextColor(15, 35, 64);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(b.value, x + 4, y + 22);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text(`${b.count} invoice${b.count !== 1 ? "s" : ""}`, x + 4, y + 30);
    });

    y += 46;

    // ── Grand total row ──────────────────────────────────────────────────────
    doc.setFillColor(15, 35, 64);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL INVOICED", margin + 6, y + 9);
    doc.setFontSize(14);
    doc.text(fmtMoney(totalShown), margin + 6, y + 18);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${invoices.length} invoices`, pageW - margin - 50, y + 9);
    doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text(`Collection rate: ${collectionRate}%`, pageW - margin - 50, y + 18);

    y += 32;

    // ── Collection bar ───────────────────────────────────────────────────────
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("COLLECTION RATE", margin, y);
    doc.text(`${collectionRate}%`, pageW - margin, y, { align: "right" });
    y += 4;
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(margin, y, pageW - margin * 2, 5, 2, 2, "F");
    const barW = Math.min(((totalPaid / (totalShown || 1)) * (pageW - margin * 2)), pageW - margin * 2);
    doc.setFillColor(22, 163, 74);
    if (barW > 0) doc.roundedRect(margin, y, barW, 5, 2, 2, "F");

    y += 14;

    // ── Status breakdown table (small) ───────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 35, 64);
    doc.text("BREAKDOWN BY STATUS", margin, y);
    y += 4;

    autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [["Status", "Count", "Total Amount", "% of Total"]],
        body: [
            ["Paid",        paid.length,    fmtMoney(totalPaid),    totalShown > 0 ? `${((totalPaid / totalShown) * 100).toFixed(1)}%` : "0%"],
            ["Outstanding", sent.length,    fmtMoney(totalSent),    totalShown > 0 ? `${((totalSent / totalShown) * 100).toFixed(1)}%` : "0%"],
            ["Overdue",     overdue.length, fmtMoney(totalOverdue), totalShown > 0 ? `${((totalOverdue / totalShown) * 100).toFixed(1)}%` : "0%"],
            ["Draft",       draft.length,   fmtMoney(totalDraft),   totalShown > 0 ? `${((totalDraft / totalShown) * 100).toFixed(1)}%` : "0%"],
        ],
        foot: [["TOTAL", invoices.length, fmtMoney(totalShown), "100%"]],
        styles: { fontSize: 8.5, cellPadding: 4 },
        headStyles: { fillColor: [15, 35, 64], textColor: 255, fontStyle: "bold" },
        footStyles: { fillColor: [240, 253, 244], textColor: [15, 35, 64], fontStyle: "bold" },
        columnStyles: {
            0: { fontStyle: "bold" },
            2: { halign: "right" },
            3: { halign: "right" },
        },
        didParseCell: (d) => {
            if (d.section === "body") {
                const statusColors = { Paid: [240,253,244], Outstanding: [239,246,255], Overdue: [254,242,242], Draft: [248,250,252] };
                if (statusColors[d.row.raw[0]]) d.cell.styles.fillColor = statusColors[d.row.raw[0]];
            }
        },
    });

    // ── PAGE 2+: Invoice list ─────────────────────────────────────────────────
    doc.addPage();

    doc.setFillColor(15, 35, 64);
    doc.rect(0, 0, pageW, 20, "F");
    doc.setFillColor(22, 163, 74);
    doc.rect(0, 20, pageW, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INVOICE DETAILS", margin, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(180, 200, 220);
    doc.text(`${invoices.length} invoices · ${periodLabel()}`, pageW - margin, 13, { align: "right" });

    const rows = invoices.map(inv => [
        `#${inv.invoice_number}`,
        inv.customer_name || "—",
        fmtDate(inv.issue_date),
        fmtDate(inv.due_date),
        (inv.status || "draft").toUpperCase(),
        fmtMoney(inv.total_amount),
    ]);

    autoTable(doc, {
        startY: 28,
        margin: { left: margin, right: margin },
        head: [["Invoice #", "Client", "Issued", "Due Date", "Status", "Amount"]],
        body: rows,
        foot: [["", "", "", "", `TOTAL (${invoices.length})`, fmtMoney(totalShown)]],
        styles: { fontSize: 8, cellPadding: 3.5, overflow: "ellipsize" },
        headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold", fontSize: 8 },
        footStyles: { fillColor: [15, 35, 64], textColor: 255, fontStyle: "bold" },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 22 },
            1: { cellWidth: "auto" },
            2: { cellWidth: 26 },
            3: { cellWidth: 26 },
            4: { cellWidth: 24, halign: "center" },
            5: { cellWidth: 28, halign: "right", fontStyle: "bold" },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (d) => {
            if (d.section === "body" && d.column.index === 4) {
                const status = d.cell.raw.toLowerCase();
                const colMap = {
                    paid:    { textColor: [22, 163, 74],   fillColor: [240, 253, 244] },
                    sent:    { textColor: [37, 99, 235],   fillColor: [239, 246, 255] },
                    overdue: { textColor: [220, 38, 38],   fillColor: [254, 242, 242] },
                    draft:   { textColor: [100, 116, 139], fillColor: [248, 250, 252] },
                };
                if (colMap[status]) {
                    d.cell.styles.textColor  = colMap[status].textColor;
                    d.cell.styles.fillColor  = colMap[status].fillColor;
                    d.cell.styles.fontStyle  = "bold";
                }
            }
            if (d.section === "body" && d.row.raw[4] === "OVERDUE") {
                d.cell.styles.textColor = d.column.index === 4 ? [220, 38, 38] : d.cell.styles.textColor;
            }
        },
        willDrawCell: (d) => {
            if (d.section === "body" && d.column.index === 5 && d.row.raw[4] === "PAID") {
                d.cell.styles.textColor = [22, 163, 74];
            }
        },
    });

    // ── Footer on every page ──────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFillColor(248, 250, 252);
        doc.rect(0, pageH - 12, pageW, 12, "F");
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.line(0, pageH - 12, pageW, pageH - 12);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text("TradeQuote — Invoice Report", margin, pageH - 5);
        doc.text(`Page ${p} of ${totalPages}`, pageW / 2, pageH - 5, { align: "center" });
        doc.text(`Confidential · ${generatedDate}`, pageW - margin, pageH - 5, { align: "right" });
    }

    // ── Save ──────────────────────────────────────────────────────────────────
    const fileName = `invoice-report-${periodLabel().replace(/\s+/g, "-").toLowerCase()}.pdf`;
    doc.save(fileName);
}