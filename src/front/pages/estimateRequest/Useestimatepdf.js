// src/hooks/useEstimatePDF.js
// Requires: npm install jspdf jspdf-autotable
// Run: npm install jspdf jspdf-autotable

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── colour palette ─────────────────────────────────────────────────────── */
const C = {
  dark:       [30,  30,  30],
  green:      [22, 163, 74],
  greenLight: [240, 253, 244],
  gray:       [100, 100, 100],
  lightGray:  [245, 245, 245],
  border:     [220, 220, 220],
  white:      [255, 255, 255],
};

function fmt(val) {
  if (!val && val !== 0) return "—";
  return String(val).replace(/_/g, " ");
}
function money(val) {
  if (!val && val !== 0) return "—";
  return `$${Number(val).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

/* ─── build PDF ──────────────────────────────────────────────────────────── */
export function buildEstimatePDF(estimate, contractorInfo = {}) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const PW  = doc.internal.pageSize.getWidth();   // 612
  const PH  = doc.internal.pageSize.getHeight();  // 792
  const ML  = 48;   // margin left
  const MR  = PW - 48; // margin right
  const W   = MR - ML;
  let y = 0;

  // ── helpers ──────────────────────────────────────────────────────────────
  const setFont = (size, style = "normal", color = C.dark) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
  };

  const addLine = (x1, y1, x2, y2, color = C.border, width = 0.5) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
  };

  const addRect = (x, y, w, h, fill, stroke) => {
    if (fill) doc.setFillColor(...fill);
    if (stroke) doc.setDrawColor(...stroke);
    if (fill && stroke) doc.rect(x, y, w, h, "FD");
    else if (fill)      doc.rect(x, y, w, h, "F");
    else                doc.rect(x, y, w, h, "D");
  };

  const addSection = (title, yStart) => {
    setFont(8, "bold", C.gray);
    doc.setFillColor(...C.lightGray);
    doc.rect(ML, yStart, W, 16, "F");
    doc.text(title.toUpperCase(), ML + 8, yStart + 10.5);
    return yStart + 22;
  };

  // ── HEADER BANNER ────────────────────────────────────────────────────────
  addRect(0, 0, PW, 80, C.dark);

  // Company name / logo area
  setFont(18, "bold", C.white);
  doc.text(contractorInfo.business_name || "Your Company", ML, 36);
  setFont(8, "normal", [180, 180, 180]);
  if (contractorInfo.phone)   doc.text(contractorInfo.phone,        ML, 50);
  if (contractorInfo.email)   doc.text(contractorInfo.email,        ML, 62);
  if (contractorInfo.address) doc.text(contractorInfo.address, ML, 74);

  // ESTIMATE badge (right side)
  addRect(PW - 170, 14, 122, 52, C.green);
  setFont(20, "bold", C.white);
  doc.text("ESTIMATE", PW - 109, 44, { align: "center" });
  setFont(8, "normal", C.white);
  doc.text(`#${estimate.id}`, PW - 109, 58, { align: "center" });

  y = 100;

  // ── DATE ROW ─────────────────────────────────────────────────────────────
  const issueDate = estimate.create_at
    ? new Date(estimate.create_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";
  const prefDate = estimate.preferred_date
    ? new Date(estimate.preferred_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  setFont(8, "normal", C.gray);
  doc.text(`Date issued: ${issueDate}`, ML, y);
  doc.text(`Preferred start: ${prefDate}`, MR, y, { align: "right" });
  addLine(ML, y + 6, MR, y + 6);
  y += 20;

  // ── BILL TO / PROJECT AT ─────────────────────────────────────────────────
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

  const addrY = y - (estimate.customer_phone ? 24 : 0) - (estimate.customer_email ? 12 : 0) - 2;
  setFont(9, "normal", C.dark);
  const addrLines = doc.splitTextToSize(estimate.customer_address || "Address not provided", colW);
  doc.text(addrLines, col2, addrY + 2);

  y = Math.max(y, addrY + addrLines.length * 12) + 16;
  addLine(ML, y, MR, y);
  y += 16;

  // ── WORK TYPE BADGE ──────────────────────────────────────────────────────
  const typeLabel = estimate.estimate_type === "painting"
    ? "🎨  Painting Estimate"
    : estimate.estimate_type === "flooring"
    ? "🪵  Flooring Estimate"
    : "🎨🪵  Painting + Flooring Estimate";

  setFont(11, "bold", C.dark);
  doc.text(typeLabel, ML, y);
  if (estimate.computed_sqft > 0) {
    setFont(9, "normal", C.gray);
    doc.text(`Total area: ${estimate.computed_sqft.toFixed(0)} sq ft`, MR, y, { align: "right" });
  }
  y += 20;

  // ── ROOMS TABLE ───────────────────────────────────────────────────────────
  if (estimate.rooms?.length > 0) {
    y = addSection("Rooms / Areas", y);

    const roomRows = estimate.rooms.map(r => [
      r.name,
      r.length_ft  ? `${r.length_ft} ft`  : "—",
      r.width_ft   ? `${r.width_ft} ft`   : "—",
      r.height_ft  ? `${r.height_ft} ft`  : "—",
      r.floor_sqft > 0 ? `${r.floor_sqft.toFixed(0)} sq ft` : "—",
      r.wall_sqft  > 0 ? `${r.wall_sqft.toFixed(0)} sq ft`  : "—",
    ]);
    roomRows.push(["", "", "", "Total floor area", {
      content: `${estimate.computed_sqft?.toFixed(0) || 0} sq ft`,
      styles: { fontStyle: "bold", textColor: C.green },
    }, ""]);

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: 48 },
      head: [["Room", "Length", "Width", "Height", "Floor Area", "Wall Area"]],
      body: roomRows,
      styles: { fontSize: 8, cellPadding: 5 },
      headStyles: { fillColor: C.dark, textColor: C.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { fontStyle: "bold" },
        4: { textColor: C.green, fontStyle: "bold" },
      },
    });
    y = doc.lastAutoTable.finalY + 16;
  }

  // ── PAINTING SECTION ──────────────────────────────────────────────────────
  const isPainting = ["painting", "both"].includes(estimate.estimate_type);
  const isFlooring = ["flooring", "both"].includes(estimate.estimate_type);

  if (isPainting) {
    y = addSection("Painting Specifications", y);

    const paintRows = [
      ["Surface condition",   fmt(estimate.paint_surface_condition)],
      ["Paint type",          fmt(estimate.paint_type)],
      ["Finish",              fmt(estimate.paint_finish)],
      ["Number of coats",     estimate.paint_coats || "—"],
      ["Ceiling included",    estimate.include_ceiling ? "Yes" : "No"],
      ["Trim / baseboards",   estimate.include_trim   ? "Yes" : "No"],
      ["Doors included",      estimate.include_doors  ? `Yes (${estimate.door_count || 0} doors)` : "No"],
      ["Number of windows",   estimate.window_count > 0 ? String(estimate.window_count) : "—"],
      ["Client provides paint", estimate.client_provides_paint ? "Yes — material cost excluded" : "No"],
      ["Desired colors",      estimate.desired_colors || "—"],
      ["Repairs needed",      estimate.repairs_needed ? "YES ⚠" : "No"],
    ];
    if (estimate.repairs_needed && estimate.repairs_detail) {
      paintRows.push(["Repair detail", estimate.repairs_detail]);
    }

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: 48 },
      body: paintRows,
      styles: { fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { fontStyle: "bold", textColor: C.gray, cellWidth: 170 },
        1: { textColor: C.dark },
      },
      didParseCell(data) {
        if (data.column.index === 1 && data.cell.raw === "YES ⚠") {
          data.cell.styles.textColor = [180, 30, 30];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });
    y = doc.lastAutoTable.finalY + 16;
  }

  // ── FLOORING SECTION ──────────────────────────────────────────────────────
  if (isFlooring) {
    y = addSection("Flooring Specifications", y);

    const floorRows = [
      ["New material",          fmt(estimate.flooring_material)],
      ["Current floor state",   fmt(estimate.flooring_current)],
      ["Installation pattern",  fmt(estimate.flooring_pattern)],
      ["Subfloor condition",    fmt(estimate.subfloor_condition)],
      ["Removal of old floor",  estimate.include_removal    ? "Included" : "Not included"],
      ["Baseboard installation",estimate.include_baseboards ? "Yes"      : "No"],
      ["Transition strips",     estimate.transition_strips > 0 ? String(estimate.transition_strips) : "—"],
      ["Stairs",                estimate.include_stairs    ? `Yes — ${estimate.stair_count || 0} steps` : "No"],
    ];

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: 48 },
      body: floorRows,
      styles: { fontSize: 8, cellPadding: 5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: {
        0: { fontStyle: "bold", textColor: C.gray, cellWidth: 170 },
        1: { textColor: C.dark },
      },
    });
    y = doc.lastAutoTable.finalY + 16;
  }

  // ── NOTES ─────────────────────────────────────────────────────────────────
  if (estimate.description) {
    // page break check
    if (y > PH - 120) { doc.addPage(); y = 48; }
    y = addSection("Notes / Special Instructions", y);
    setFont(8, "normal", C.dark);
    const noteLines = doc.splitTextToSize(estimate.description, W - 16);
    doc.text(noteLines, ML + 8, y);
    y += noteLines.length * 12 + 10;
  }

  // ── QUOTED PRICE BOX ──────────────────────────────────────────────────────
  if (estimate.quoted_amount) {
    if (y > PH - 110) { doc.addPage(); y = 48; }
    y += 10;
    addRect(ML, y, W, 56, C.greenLight, C.green);
    setFont(8, "bold", C.gray);
    doc.text("TOTAL ESTIMATE", ML + W / 2, y + 16, { align: "center" });
    setFont(24, "bold", C.green);
    doc.text(money(estimate.quoted_amount), ML + W / 2, y + 40, { align: "center" });
    if (estimate.contractor_notes) {
      setFont(7, "normal", C.gray);
      const noteLines = doc.splitTextToSize(estimate.contractor_notes, W - 32);
      // append below box
      y += 64;
      doc.text(noteLines, ML + 8, y);
      y += noteLines.length * 10 + 4;
    } else {
      y += 64;
    }
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addLine(ML, PH - 36, MR, PH - 36, C.border);
    setFont(7, "normal", C.gray);
    doc.text(
      `${contractorInfo.business_name || "Company"} · This estimate is valid for 30 days · Page ${p} of ${totalPages}`,
      PW / 2, PH - 20, { align: "center" }
    );
  }

  return doc;
}

/* ─── public hooks ───────────────────────────────────────────────────────── */
export function useEstimatePDF() {
  /** Download PDF to browser */
  const downloadPDF = (estimate, contractorInfo) => {
    const doc = buildEstimatePDF(estimate, contractorInfo);
    doc.save(`estimate-${estimate.id}-${estimate.customer_name?.replace(/\s+/g, "-") || "client"}.pdf`);
  };

  /** Open PDF in new tab (print / share) */
  const previewPDF = (estimate, contractorInfo) => {
    const doc  = buildEstimatePDF(estimate, contractorInfo);
    const blob = doc.output("blob");
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  /**
   * Send PDF via backend email endpoint.
   * Your backend should have:  POST /api/estimates/:id/send-email
   * which accepts { recipient_email, pdf_base64, filename }
   */
  const sendByEmail = async (estimate, contractorInfo) => {
    const doc    = buildEstimatePDF(estimate, contractorInfo);
    const base64 = doc.output("datauristring").split(",")[1];
    const token  = localStorage.getItem("token");
    const BASE   = import.meta.env.VITE_BACKEND_URL || "";

    const res = await fetch(`${BASE}/api/estimates/${estimate.id}/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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