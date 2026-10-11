// Dane Operatora Platformy VLND / Administratora Danych Osobowych.

export const OPERATOR_NAME = "INDYWIDUALNA PRAKTYKA LEKARSKA JANUSZ JUDEK";
export const OPERATOR_NIP = "7772568879";
export const OPERATOR_REGON = "301713974";
export const OPERATOR_LEGAL_FORM = `NIP: ${OPERATOR_NIP}, REGON: ${OPERATOR_REGON}`;
export const OPERATOR_ADDRESS = "ul. Kwiatowa 12, 64-530 Radzyny";
export const OPERATOR_CONTACT = "vlndmarketplace@gmail.com";

/** Pełna, jednolita definicja Operatora używana w Regulaminie, Polityce Prywatności i przy zakupie. */
export const OPERATOR_FULL = `${OPERATOR_NAME}, ${OPERATOR_ADDRESS}, ${OPERATOR_LEGAL_FORM}, kontakt e-mail: ${OPERATOR_CONTACT}`;

/** Krótki podpis prawny do stopki. */
export const OPERATOR_FOOTER_LINE = `vlnd.pl – Platforma prowadzona przez ${OPERATOR_NAME}. Kontakt: ${OPERATOR_CONTACT}.`;
