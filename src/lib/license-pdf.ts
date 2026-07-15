import { jsPDF } from "jspdf";
import { generateLicenseText, LICENSE_TYPE_LABELS, type LicenseTerms } from "@/lib/license";

export type { LicenseTerms };

export type LicenseInput = {
  transactionId: string;
  createdAt: string;
  productTitle: string;
  productId: string;
  amount: number;
  currency: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  terms: LicenseTerms;
};

export function generateLicensePdf(input: LicenseInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 60;
  let y = 60;

  const typeKey =
    (input.terms?.license_type as keyof typeof LICENSE_TYPE_LABELS) ??
    (input.terms?.exclusive ? "exclusive" : "personal");
  const typeLabel = LICENSE_TYPE_LABELS[typeKey] ?? "Personal";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(`LICENCJA — ${typeLabel.toUpperCase()}`, pageW / 2, y, { align: "center" });
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`VaultX Marketplace · ID: ${input.transactionId}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);

  y += 30;
  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Produkt", input.productTitle],
    ["Product ID", input.productId],
    ["Sprzedawca", input.sellerName],
    ["Licencjobiorca", `${input.buyerName} <${input.buyerEmail}>`],
    ["Data zakupu", new Date(input.createdAt).toLocaleString("pl-PL")],
    ["Kwota", `${input.amount.toFixed(2)} ${input.currency}`],
  ];
  for (const [k, v] of rows) {
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), margin + 140, y);
    y += 16;
  }

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 18;

  const fullText = generateLicenseText({
    terms: input.terms,
    productTitle: input.productTitle,
    sellerName: input.sellerName,
    buyerName: `${input.buyerName} <${input.buyerEmail}>`,
  });

  doc.setFontSize(10);
  const paragraphs = fullText.split("\n");
  const lineHeight = 13;
  const bottomLimit = pageH - 60;
  for (const para of paragraphs) {
    const isHeading = /^§|^UMOWA/i.test(para);
    if (isHeading) {
      doc.setFont("helvetica", "bold");
    } else {
      doc.setFont("helvetica", "normal");
    }
    const wrapped = para.length ? doc.splitTextToSize(para, pageW - margin * 2) : [""];
    for (const line of wrapped) {
      if (y > bottomLimit) {
        doc.addPage();
        y = 60;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  }

  y += 8;
  if (y > bottomLimit - 40) {
    doc.addPage();
    y = 60;
  }
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Wygenerowano: ${new Date().toLocaleString("pl-PL")} · Hash: ${input.transactionId.slice(0, 16)}`,
    margin,
    y,
  );

  doc.save(`licencja-${input.productTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}
