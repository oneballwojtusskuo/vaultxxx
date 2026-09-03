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
  /** Optional legal/order metadata — purely additive, safe to omit. */
  orderId?: string;
  fileName?: string;
  purchaseDate?: string;
  /** Legal (real) name/company of the licensor & licensee, if collected. */
  licensorLegalName?: string;
  licenseeLegalName?: string;
};

const FONT_REGULAR = "Roboto";

let fontsLoaded: Promise<{ regular: string; bold: string }> | null = null;
function loadFonts() {
  if (!fontsLoaded) {
    fontsLoaded = Promise.all([
      import("@/assets/fonts/roboto-regular"),
      import("@/assets/fonts/roboto-bold"),
    ]).then(([r, b]) => ({ regular: r.robotoRegularBase64, bold: b.robotoBoldBase64 }));
  }
  return fontsLoaded;
}

/** Clean, human readable party label: "nazwa (email)" — never "id <email>". */
function partyLabel(name?: string, email?: string): string {
  const n = name?.trim();
  const e = email?.trim();
  if (n && e && n.toLowerCase() !== e.toLowerCase()) return `${n} (${e})`;
  return n || e || "—";
}

export async function generateLicensePdf(input: LicenseInput) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // Embed a UTF-8 capable font so Polish diacritics (ą ć ę ł ń ó ś ź ż) render correctly.
  const fonts = await loadFonts();
  doc.addFileToVFS("Roboto-Regular.ttf", fonts.regular);
  doc.addFont("Roboto-Regular.ttf", FONT_REGULAR, "normal");
  doc.addFileToVFS("Roboto-Bold.ttf", fonts.bold);
  doc.addFont("Roboto-Bold.ttf", FONT_REGULAR, "bold");
  doc.setFont(FONT_REGULAR, "normal");
  doc.setCharSpace(0); // no artificial letter-spacing

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const contentW = pageW - margin * 2;
  const bottomLimit = pageH - margin;
  let y = margin;

  const typeKey =
    (input.terms?.license_type as keyof typeof LICENSE_TYPE_LABELS) ??
    (input.terms?.exclusive ? "exclusive" : "personal");
  const typeLabel = LICENSE_TYPE_LABELS[typeKey] ?? "Personal";

  const buyerLabel = partyLabel(input.buyerName, input.buyerEmail);

  doc.setFont(FONT_REGULAR, "bold");
  doc.setFontSize(18);
  doc.text(`LICENCJA — ${typeLabel.toUpperCase()}`, pageW / 2, y, { align: "center" });
  y += 18;
  doc.setFont(FONT_REGULAR, "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`vlnd Marketplace · ID: ${input.transactionId}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);

  y += 28;
  doc.setFontSize(10.5);
  const labelW = 130;
  const rows: [string, string][] = [
    ["Produkt", input.productTitle],
    ["Product ID", input.productId],
    ["Sprzedawca", partyLabel(input.licensorLegalName || input.sellerName)],
    ["Licencjobiorca", partyLabel(input.licenseeLegalName || input.buyerName, input.buyerEmail)],
    ["Data zakupu", new Date(input.createdAt).toLocaleString("pl-PL")],
    ["Kwota", `${input.amount.toFixed(2)} ${input.currency}`],
  ];
  for (const [k, v] of rows) {
    doc.setFont(FONT_REGULAR, "bold");
    doc.text(`${k}:`, margin, y);
    doc.setFont(FONT_REGULAR, "normal");
    const wrapped = doc.splitTextToSize(String(v), contentW - labelW);
    doc.text(wrapped, margin + labelW, y);
    y += 15 * wrapped.length;
  }

  y += 10;
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 20;

  const fullText = generateLicenseText({
    terms: input.terms,
    productTitle: input.productTitle,
    sellerName: input.sellerName,
    buyerName: buyerLabel,
    orderId: input.orderId ?? input.transactionId,
    fileName: input.fileName,
    purchaseDate: input.purchaseDate ?? new Date(input.createdAt).toLocaleString("pl-PL"),
    licensorLegalName: input.licensorLegalName,
    licenseeLegalName: input.licenseeLegalName,
  });

  const fontSize = 10;
  const lineHeight = fontSize * 1.4;
  doc.setFontSize(fontSize);

  for (const para of fullText.split("\n")) {
    const isHeading = /^§|^UMOWA/i.test(para);
    doc.setFont(FONT_REGULAR, isHeading ? "bold" : "normal");
    if (isHeading && y > margin) y += 4;
    const wrapped = para.length ? doc.splitTextToSize(para, contentW) : [""];
    for (const line of wrapped) {
      if (y > bottomLimit) {
        doc.addPage();
        doc.setFont(FONT_REGULAR, isHeading ? "bold" : "normal");
        doc.setFontSize(fontSize);
        doc.setCharSpace(0);
        y = margin;
      }
      doc.text(line, margin, y);
      y += lineHeight;
    }
  }

  y += 10;
  if (y > bottomLimit - 20) {
    doc.addPage();
    y = margin;
  }
  doc.setFont(FONT_REGULAR, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(
    `Wygenerowano: ${new Date().toLocaleString("pl-PL")} · Hash: ${input.transactionId.slice(0, 16)}`,
    margin,
    y,
  );

  doc.save(`licencja-${input.productTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}
