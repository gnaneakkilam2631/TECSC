import { jsPDF } from "jspdf";
import { fmtMoney } from "./utils.js";

export function downloadInvoicePDF(sale, shopName) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(shopName || "Trinadh Electronics & Computer Servicing Centre", 14, 18);
  doc.setFontSize(10);
  doc.text(`Invoice — ${sale.date}`, 14, 26);
  doc.line(14, 30, 196, 30);

  doc.setFontSize(11);
  doc.text(`Customer: ${sale.customerName || "—"}${sale.customerPhone ? " (" + sale.customerPhone + ")" : ""}`, 14, 40);

  doc.setFontSize(10);
  doc.text("Item", 14, 54);
  doc.text("Qty", 110, 54);
  doc.text("Unit price", 140, 54);
  doc.text("Total", 175, 54);
  doc.line(14, 57, 196, 57);

  doc.text(sale.itemName, 14, 65);
  doc.text(String(sale.qty), 110, 65);
  doc.text(fmtMoney(sale.unitPrice), 140, 65);
  doc.text(fmtMoney(sale.total), 175, 65);

  doc.setFontSize(13);
  doc.text(`Total: ${fmtMoney(sale.total)}`, 175, 85, { align: "right" });

  doc.save(`invoice-${sale.date}-${sale.itemName.replace(/\s+/g, "-")}.pdf`);
}

export function downloadSalaryReportPDF(staffList, summaries, monthLabel, shopName) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(shopName || "Trinadh Electronics & Computer Servicing Centre", 14, 18);
  doc.setFontSize(11);
  doc.text(`Salary report — ${monthLabel}`, 14, 26);
  doc.line(14, 30, 196, 30);

  let y = 40;
  doc.setFontSize(9);
  doc.text("Staff", 14, y);
  doc.text("Base", 70, y);
  doc.text("Hours", 100, y);
  doc.text("Deduction", 135, y);
  doc.text("Net pay", 170, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 8;

  for (const [name, sum] of staffList.map((s, i) => [s.name, summaries[i]])) {
    doc.text(name, 14, y);
    doc.text(fmtMoney(sum.base), 70, y);
    doc.text(`${sum.hoursWorked.toFixed(1)}/${sum.hoursExpected.toFixed(1)}`, 100, y);
    doc.text(fmtMoney(sum.deduction), 135, y);
    doc.text(fmtMoney(sum.net), 170, y);
    y += 8;
  }

  doc.save(`salary-report-${monthLabel.replace(/\s+/g, "-")}.pdf`);
}

export function downloadGenericReportPDF(title, rows, columns, shopName) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(shopName || "Trinadh Electronics & Computer Servicing Centre", 14, 18);
  doc.setFontSize(11);
  doc.text(title, 14, 26);
  doc.line(14, 30, 196, 30);

  let y = 40;
  doc.setFontSize(9);
  const colWidth = 180 / columns.length;
  columns.forEach((col, i) => doc.text(col.label, 14 + i * colWidth, y));
  y += 4;
  doc.line(14, y, 196, y);
  y += 8;

  for (const row of rows) {
    columns.forEach((col, i) => doc.text(String(row[col.key] ?? ""), 14 + i * colWidth, y));
    y += 8;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  }

  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}