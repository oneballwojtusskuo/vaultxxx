// Shared license schema, defaults, presets and human-readable text generator.
// Used by the sell form, product page and PDF generator.

export type LicenseType = "personal" | "commercial" | "extended_commercial" | "exclusive";

export type LicenseLimit = "1" | "5" | "10" | "50" | "100" | "500" | "5000" | "50000" | "unlimited";
export type LicenseDuration = "perpetual" | "1y" | "3y" | "5y";
export type DeliveryMode = "stream" | "download" | "both";

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  stream: "Tylko streaming na stronie",
  download: "Tylko pobieranie pliku",
  both: "Streaming + pobieranie",
};

/** Human-readable descriptions used in UI tooltips. */
export const LICENSE_OPTION_HELP: Record<string, string> = {
  commercial_use: "Kupujący może wykorzystywać produkt w celach zarobkowych — np. w reklamach, produktach na sprzedaż, kanałach monetyzowanych.",
  private_use: "Kupujący może korzystać z produktu prywatnie, niekomercyjnie — np. do własnych projektów, nauki, użytku domowego.",
  can_modify: "Kupujący może edytować, remiksować i tworzyć utwory zależne na podstawie pliku (np. remix beatu, edycja PSD).",
  use_in_client_projects: "Kupujący (np. freelancer, agencja) może użyć produktu w projekcie realizowanym dla swojego klienta.",
  use_for_ai: "Produkt może być wejściem/zasobem dla narzędzi AI (np. generatywne prompt-y, referencje). Nie oznacza zgody na trenowanie modeli.",
  train_ai: "Zgoda na trenowanie modeli uczenia maszynowego / AI na podstawie tego pliku (osobne, silniejsze uprawnienie).",
  create_nft: "Kupujący może wykorzystać produkt jako podstawę tokena niewymiennego (NFT).",
  attribution_required: 'Kupujący musi wskazać autora (np. "Beat by X", credits w opisie wideo) przy każdym publicznym wykorzystaniu.',
  redistribution: "Kupujący może rozpowszechniać oryginalny plik dalej (np. wrzucić na inną platformę). Zwykle WYŁĄCZONE.",
  resale: "Kupujący może odsprzedać licencję lub sam plik osobom trzecim. Zwykle WYŁĄCZONE.",
  worldwide: "Licencja obowiązuje na całym świecie. Odznacz, aby ograniczyć do konkretnego terytorium.",
  max_users: "Maksymalna liczba osób w organizacji kupującego, które mogą korzystać z pliku (np. członków zespołu).",
  max_projects: "Maksymalna liczba oddzielnych projektów, w których kupujący może wykorzystać plik.",
  max_end_products: "Maksymalna liczba egzemplarzy produktu końcowego zawierającego ten plik, które kupujący może sprzedać (np. sztuk merchu, kopii albumu).",
  duration: 'Jak długo licencja obowiązuje. "Bezterminowa" = bezterminowo, bez terminu wygaśnięcia.',
  max_streams: "Maksymalna łączna liczba odtworzeń / dystrybucji strumieniowych utworu zawierającego plik.",
  territory: 'Geograficzny zasięg licencji — jeśli nie chcesz całego świata, wpisz np. "Polska", "UE", "Ameryka Północna".',
  delivery_mode: "Jak kupujący otrzyma plik: tylko strumieniowo w naszym odtwarzaczu (max ochrona), tylko do pobrania, lub oba naraz.",
  custom_terms: "Twoje dodatkowe zapisy, które trafią do umowy — np. wyjątki, specjalne wymagania, kontakt.",
};

export type LicenseTerms = {
  license_type?: LicenseType;

  // Permissions
  commercial_use?: boolean;
  private_use?: boolean;
  can_modify?: boolean;
  use_in_client_projects?: boolean;
  use_for_ai?: boolean;
  train_ai?: boolean;
  create_nft?: boolean;
  attribution_required?: boolean;
  redistribution?: boolean;
  resale?: boolean;
  worldwide?: boolean;

  // Limits
  max_users?: LicenseLimit;         // 1 / 5 / 50 / unlimited
  max_projects?: LicenseLimit;      // 1 / 10 / 100 / unlimited
  max_end_products?: LicenseLimit;  // 500 / 5000 / 50000 / unlimited
  duration?: LicenseDuration;

  // Legacy / free-form
  exclusive?: boolean;
  max_streams?: number | null;
  territory?: string;
  custom_terms?: string;
};

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  personal: "Personal",
  commercial: "Commercial",
  extended_commercial: "Extended Commercial",
  exclusive: "Exclusive",
};

export const LICENSE_DURATION_LABELS: Record<LicenseDuration, string> = {
  perpetual: "Bezterminowa",
  "1y": "1 rok",
  "3y": "3 lata",
  "5y": "5 lat",
};

export function limitLabel(v?: LicenseLimit): string {
  if (!v || v === "unlimited") return "Bez limitu";
  return v;
}

/** Sensible defaults per license type — user can override. */
export function presetForType(type: LicenseType): LicenseTerms {
  const base: LicenseTerms = {
    license_type: type,
    private_use: true,
    worldwide: true,
    duration: "perpetual",
  };
  if (type === "personal") {
    return {
      ...base,
      commercial_use: false,
      can_modify: false,
      use_in_client_projects: false,
      use_for_ai: false,
      train_ai: false,
      create_nft: false,
      attribution_required: true,
      redistribution: false,
      resale: false,
      max_users: "1",
      max_projects: "1",
      max_end_products: "500",
    };
  }
  if (type === "commercial") {
    return {
      ...base,
      commercial_use: true,
      can_modify: true,
      use_in_client_projects: false,
      use_for_ai: false,
      train_ai: false,
      create_nft: false,
      attribution_required: true,
      redistribution: false,
      resale: false,
      max_users: "5",
      max_projects: "10",
      max_end_products: "5000",
    };
  }
  if (type === "extended_commercial") {
    return {
      ...base,
      commercial_use: true,
      can_modify: true,
      use_in_client_projects: true,
      use_for_ai: true,
      train_ai: false,
      create_nft: true,
      attribution_required: false,
      redistribution: false,
      resale: false,
      max_users: "50",
      max_projects: "100",
      max_end_products: "50000",
    };
  }
  // exclusive
  return {
    ...base,
    commercial_use: true,
    can_modify: true,
    use_in_client_projects: true,
    use_for_ai: true,
    train_ai: true,
    create_nft: true,
    attribution_required: false,
    redistribution: true,
    resale: true,
    exclusive: true,
    max_users: "unlimited",
    max_projects: "unlimited",
    max_end_products: "unlimited",
  };
}

const yn = (b?: boolean) => (b ? "TAK" : "NIE");

/** Generates a full professional license text (Polish) from terms. */
export function generateLicenseText(params: {
  terms: LicenseTerms;
  productTitle?: string;
  sellerName?: string;
  buyerName?: string;
}): string {
  const t = params.terms ?? {};
  const type = (t.license_type ?? "personal") as LicenseType;
  const typeLabel = LICENSE_TYPE_LABELS[type];
  const isExclusive = type === "exclusive" || t.exclusive === true;

  const lines: string[] = [];
  lines.push(`UMOWA LICENCYJNA — ${typeLabel.toUpperCase()}`);
  lines.push("");
  lines.push(
    `Niniejsza umowa licencyjna („Licencja") określa warunki, na jakich Licencjodawca${
      params.sellerName ? ` (${params.sellerName})` : ""
    } udziela Licencjobiorcy${params.buyerName ? ` (${params.buyerName})` : ""} prawa do korzystania z produktu cyfrowego${
      params.productTitle ? ` „${params.productTitle}"` : ""
    } („Produkt").`,
  );
  lines.push("");

  lines.push("§1. Typ licencji");
  lines.push(
    `Udzielona zostaje licencja typu ${typeLabel}, ${
      isExclusive ? "wyłączna" : "niewyłączna, nieprzenoszalna"
    }, ${t.worldwide ? "obowiązująca na terenie całego świata" : `ograniczona terytorialnie do: ${t.territory || "obszaru określonego przez Licencjodawcę"}`}, ${
      t.duration === "perpetual" || !t.duration
        ? "udzielona bezterminowo"
        : `udzielona na okres ${LICENSE_DURATION_LABELS[t.duration]}`
    }.`,
  );
  lines.push("");

  lines.push("§2. Zakres dozwolonego użytku");
  lines.push(`1. Użytek prywatny: ${yn(t.private_use)}.`);
  lines.push(`2. Użytek komercyjny: ${yn(t.commercial_use)}.`);
  lines.push(`3. Modyfikacja pliku Produktu i tworzenie utworów zależnych: ${yn(t.can_modify)}.`);
  lines.push(`4. Wykorzystanie w projektach klientów Licencjobiorcy: ${yn(t.use_in_client_projects)}.`);
  lines.push(`5. Wykorzystanie w rozwiązaniach opartych o sztuczną inteligencję (AI): ${yn(t.use_for_ai)}.`);
  lines.push(`6. Trenowanie modeli AI z użyciem Produktu: ${yn(t.train_ai)}.`);
  lines.push(`7. Wykorzystanie do tworzenia tokenów niewymiennych (NFT): ${yn(t.create_nft)}.`);
  lines.push(`8. Redystrybucja Produktu w oryginalnej formie: ${yn(t.redistribution)}.`);
  lines.push(`9. Odsprzedaż licencji lub Produktu osobom trzecim: ${yn(t.resale)}.`);
  lines.push("");

  lines.push("§3. Limity licencji");
  lines.push(`1. Maksymalna liczba użytkowników końcowych: ${limitLabel(t.max_users)}.`);
  lines.push(`2. Maksymalna liczba projektów, w których może być użyty Produkt: ${limitLabel(t.max_projects)}.`);
  lines.push(`3. Maksymalna liczba sprzedanych produktów końcowych zawierających Produkt: ${limitLabel(t.max_end_products)}.`);
  if (t.max_streams && t.max_streams > 0) {
    lines.push(`4. Maksymalna liczba odtworzeń / dystrybucji strumieniowych: ${Number(t.max_streams).toLocaleString()}.`);
  }
  lines.push("");

  lines.push("§4. Prawa autorskie");
  if (isExclusive) {
    lines.push(
      "1. W ramach niniejszej licencji wyłącznej Licencjobiorca uzyskuje wyłączne prawo do korzystania z Produktu w zakresie określonym w §1–§3 i przez czas jej obowiązywania.",
    );
    lines.push(
      "2. Licencjodawca zobowiązuje się nie udzielać kolejnych licencji na Produkt w okresie obowiązywania niniejszej umowy oraz wycofać Produkt ze sprzedaży.",
    );
    lines.push(
      "3. Autorskie prawa majątkowe do Produktu pozostają przy Licencjodawcy, chyba że strony zawarły odrębną pisemną umowę o przeniesieniu praw.",
    );
  } else {
    lines.push(
      "1. Autorskie prawa majątkowe i osobiste do Produktu pozostają w całości przy Licencjodawcy.",
    );
    lines.push(
      "2. Licencja nie stanowi przeniesienia praw autorskich — jest wyłącznie zgodą na korzystanie z Produktu w zakresie określonym powyżej.",
    );
    lines.push(
      "3. Licencjodawca zachowuje prawo do udzielania analogicznych licencji dowolnej liczbie innych podmiotów.",
    );
  }
  if (t.attribution_required) {
    lines.push(
      "4. Licencjobiorca jest zobowiązany do wskazania autora Produktu (attribution) w każdym publicznym wykorzystaniu.",
    );
  } else {
    lines.push("4. Wskazanie autora (attribution) nie jest wymagane.");
  }
  lines.push("");

  lines.push("§5. Ograniczenia");
  lines.push(
    "1. Zabrania się wykorzystywania Produktu w sposób niezgodny z prawem, w treściach dyskryminujących, oszczerczych, nawołujących do przemocy lub o charakterze bezprawnym.",
  );
  if (!t.redistribution)
    lines.push("2. Zabrania się redystrybucji Produktu w formie oryginalnej lub minimalnie zmodyfikowanej.");
  if (!t.resale) lines.push("3. Zabrania się odsprzedaży licencji lub Produktu osobom trzecim.");
  if (!t.train_ai)
    lines.push("4. Zabrania się wykorzystywania Produktu do trenowania modeli sztucznej inteligencji.");
  lines.push("");

  lines.push("§6. Naruszenia");
  lines.push(
    "Każde naruszenie warunków niniejszej licencji uprawnia Licencjodawcę do jej natychmiastowego wypowiedzenia oraz dochodzenia roszczeń odszkodowawczych na zasadach ogólnych, w tym z tytułu naruszenia autorskich praw majątkowych.",
  );

  if (t.custom_terms?.trim()) {
    lines.push("");
    lines.push("§7. Postanowienia dodatkowe");
    lines.push(t.custom_terms.trim());
  }

  return lines.join("\n");
}
