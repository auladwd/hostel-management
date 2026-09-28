import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utility functions for exporting reports to Excel, CSV, and PDF formats
 */

export function exportToExcel(
  filename: string,
  sheetName: string,
  data: Record<string, any>[]
) {
  if (!data || data.length === 0) {
    alert('এক্সপোর্ট করার মতো কোনো তথ্য নেই');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.substring(0, 31));

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToCsv(
  filename: string,
  data: Record<string, any>[]
) {
  if (!data || data.length === 0) {
    alert('এক্সপোর্ট করার মতো কোনো তথ্য নেই');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM so Excel opens Bengali characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePdfDocument(options: {
  title: string;
  subtitle?: string;
  hostelName?: string;
  headers: string[];
  rows: (string | number)[][];
  filename: string;
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const hostelName = options.hostelName || 'গ্রিন ভিউ হোস্টেল ও মেস';

  // Title and header
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Navy blue
  doc.text(hostelName, 14, 18);

  doc.setFontSize(12);
  doc.setTextColor(51, 65, 85);
  doc.text(options.title, 14, 26);

  if (options.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(options.subtitle, 14, 32);
  }

  // Draw table
  autoTable(doc, {
    startY: options.subtitle ? 36 : 30,
    head: [options.headers],
    body: options.rows,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${options.filename}.pdf`);
}
