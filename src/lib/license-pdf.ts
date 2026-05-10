import { jsPDF } from "jspdf";

export type LicenseTerms = {
  commercial_use?: boolean;
  max_streams?: number | null;
  exclusive?: boolean;
  attribution_required?: boolean;
  territory?: string;
  custom_terms?: string;
};

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
  let y = 60;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("LICENCJA / LICENSE AGREEMENT", pageW / 2, y, { align: "center" });
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`VaultX Marketplace · ID: ${input.transactionId}`, pageW / 2, y, { align: "center" });
  doc.setTextColor(0);

  y += 36;
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
    doc.text(`${k}:`, 60, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), 200, y);
    y += 18;
  }

  y += 16;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Warunki licencji", 60, y);
  y += 8;
  doc.setLineWidth(0.5);
  doc.line(60, y, pageW - 60, y);
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const t = input.terms ?? {};
  const lines: string[] = [
    `• Użytek komercyjny: ${t.commercial_use ? "TAK" : "NIE — tylko użytek prywatny"}`,
    `• Wyłączność: ${t.exclusive ? "TAK — licencja wyłączna" : "NIE — licencja niewyłączna"}`,
    `• Limit odtworzeń / dystrybucji: ${t.max_streams ? `${t.max_streams.toLocaleString()}` : "bez limitu"}`,
    `• Wymagane oznaczenie autora: ${t.attribution_required ? "TAK" : "NIE"}`,
    `• Terytorium: ${t.territory || "worldwide"}`,
  ];
  for (const ln of lines) {
    doc.text(ln, 60, y);
    y += 18;
  }

  if (t.custom_terms?.trim()) {
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text("Postanowienia dodatkowe:", 60, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(t.custom_terms, pageW - 120);
    doc.text(wrapped, 60, y);
    y += wrapped.length * 14;
  }

  y += 24;
  doc.setFontSize(9);
  doc.setTextColor(100);
  const note =
    "Niniejszy dokument potwierdza nabycie licencji na korzystanie z wymienionego produktu cyfrowego na warunkach określonych powyżej. Dokument jest powiązany z unikalnym identyfikatorem transakcji i adresem e-mail licencjobiorcy. Każde naruszenie warunków licencji upoważnia licencjodawcę do dochodzenia roszczeń.";
  const wrapped = doc.splitTextToSize(note, pageW - 120);
  doc.text(wrapped, 60, y);
  y += wrapped.length * 12 + 18;

  doc.setFontSize(8);
  doc.text(
    `Wygenerowano: ${new Date().toLocaleString("pl-PL")} · Hash: ${input.transactionId.slice(0, 16)}`,
    60,
    y,
  );

  doc.save(`licencja-${input.productTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.pdf`);
}
