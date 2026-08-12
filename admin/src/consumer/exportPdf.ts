import { jsPDF } from 'jspdf';
import type { DocumentReport } from './types';

const NAVY: [number, number, number] = [11, 18, 32];
const GOLD: [number, number, number] = [212, 175, 55];
const MUTED: [number, number, number] = [107, 114, 128];
const TEXT: [number, number, number] = [31, 41, 55];

function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  return doc.splitTextToSize(text, maxWidth);
}

export function exportReportPdf(report: DocumentReport) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function ensureSpace(next: number) {
    if (y + next > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 96, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text('LegalLens AI — Document Report', margin, 34);
  doc.setFontSize(16);
  doc.text(report.documentType?.replace(/_/g, ' ') || 'Document', margin, 58);
  doc.setFontSize(9);
  doc.setTextColor(183, 192, 209);
  doc.text(report.fileName, margin, 76);

  if (report.riskAnalysis) {
    doc.setTextColor(...GOLD);
    doc.setFontSize(11);
    doc.text(`Risk: ${report.riskAnalysis.level} (${report.riskAnalysis.score}/100)`, pageWidth - margin, 58, { align: 'right' });
  }

  y = 128;

  function heading(text: string) {
    ensureSpace(24);
    doc.setTextColor(...NAVY);
    doc.setFontSize(13);
    doc.text(text, margin, y);
    y += 18;
  }

  function paragraph(text: string, color: [number, number, number] = TEXT) {
    const lines = wrapText(doc, text, contentWidth);
    doc.setFontSize(10);
    doc.setTextColor(...color);
    for (const line of lines) {
      ensureSpace(14);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 6;
  }

  if (report.summary?.summaryText) {
    heading('Summary');
    paragraph(report.summary.summaryText);
  }

  if (report.riskAnalysis?.flags?.length) {
    heading('Risk Flags');
    report.riskAnalysis.flags.forEach((flag, i) => {
      paragraph(`${i + 1}. [${flag.severity.toUpperCase()}] ${flag.title} — ${flag.detail}`);
    });
  }

  if (report.clauseAnalysis?.clauses?.length) {
    heading('Clause Cards');
    report.clauseAnalysis.clauses.forEach((clause) => {
      paragraph(`${clause.label}: ${clause.value}`);
    });
  }

  if (report.riskAnalysis?.suggestions?.length) {
    heading('Before Signing, Ask');
    report.riskAnalysis.suggestions.forEach((s, i) => paragraph(`${i + 1}. ${s}`));
  }

  ensureSpace(40);
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.line(margin, y, pageWidth - margin, y);
  y += 16;
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  wrapText(
    doc,
    'This is an informational explanation, not professional legal advice. Consult a qualified lawyer for important decisions.',
    contentWidth,
  ).forEach((line: string) => {
    doc.text(line, margin, y);
    y += 11;
  });

  doc.save(`LegalLensAI-Report-${report.fileName.replace(/\.[^/.]+$/, '')}.pdf`);
}

export function exportPlainTextPdf(fileName: string, title: string, content: string) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFontSize(14);
  doc.setTextColor(...NAVY);
  doc.text(title, margin, y);
  y += 24;

  doc.setFontSize(10);
  doc.setTextColor(...TEXT);
  const lines = content.split('\n').flatMap((line) => (line.trim() ? wrapText(doc, line, contentWidth) : ['']));
  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 14;
  }

  doc.save(`${fileName}.pdf`);
}
