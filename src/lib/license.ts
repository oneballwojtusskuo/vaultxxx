// Shared license schema, defaults, presets and human-readable text generator.
// Used by the sell form, product page and PDF generator.

export type LicenseType = "personal" | "commercial" | "extended_commercial" | "exclusive";

export type LicenseLimit =
  | "0"
  | "1"
  | "5"
  | "10"
  | "50"
  | "100"
  | "500"
  | "5000"
  | "50000"
  | "unlimited";
export type LicenseDuration = "perpetual" | "1y" | "3y" | "5y";
export type DeliveryMode = "stream" | "download" | "both";
export type TerritoryPreset = "worldwide" | "pl" | "eu" | "other";

export const DELIVERY_MODE_LABELS: Record<DeliveryMode, string> = {
  stream: "Tylko streaming na stronie",
  download: "Tylko pobieranie pliku",
  both: "Streaming + pobieranie",
};

export const TERRITORY_PRESET_LABELS: Record<TerritoryPreset, string> = {
  worldwide: "Cały świat",
  pl: "Polska",
  eu: "Unia Europejska",
  other: "Inne — wpisz kraje",
};

/** Human-readable descriptions used in UI tooltips: [krótkie wyjaśnienie, przykład]. */
export const LICENSE_OPTION_HELP: Record<string, string> = {
  commercial_use:
    "Kupujący może wykorzystywać produkt w celach zarobkowych. Przykład: włącz, gdy sprzedajesz beat do reklamy; wyłącz dla licencji czysto prywatnej/hobbystycznej.",
  private_use:
    "Kupujący może korzystać z produktu prywatnie, niekomercyjnie. Przykład: włącz, gdy sprzedajesz zdjęcie na tapetę na telefon; nie ma to znaczenia przy licencji wyłącznie komercyjnej.",
  can_modify:
    "Kupujący może edytować, remiksować i tworzyć utwory zależne na podstawie pliku. Przykład: włącz, jeśli sprzedajesz beat pod remiks; wyłącz, jeśli chcesz, by plik był używany bez zmian (np. gotowy plakat).",
  use_in_client_projects:
    "Kupujący (np. freelancer, agencja) może użyć produktu w projekcie realizowanym dla swojego klienta. Przykład: włącz dla grafików robiących zlecenia; wyłącz, jeśli chcesz sprzedawać osobną licencję każdemu klientowi z osobna.",
  use_for_ai:
    "Produkt może być wejściem/zasobem dla narzędzi AI (np. jako referencja albo materiał w promptach). Nie oznacza zgody na trenowanie modeli. Przykład: włącz, jeśli ktoś ma prawo wrzucić Twoje zdjęcie jako inspirację do generatora.",
  train_ai:
    "Osobna, mocniejsza zgoda: pozwolenie na trenowanie modeli uczenia maszynowego / AI na podstawie tego pliku. Przykład: wyłącz, jeśli nie chcesz, by Twoja muzyka/grafika trafiła do zbioru treningowego modelu AI.",
  create_nft:
    "Kupujący może wykorzystać produkt jako podstawę tokena niewymiennego (NFT). Przykład: włącz tylko w licencji exclusive, gdy świadomie sprzedajesz prawo do zmintowania NFT.",
  attribution_required:
    "Kupujący musi wskazać autora przy każdym publicznym wykorzystaniu, np. „Beat by X” w opisie. Przykład: włącz w licencji personal/commercial, żeby budować rozpoznawalność; wyłącz w licencji extended/exclusive, gdzie kupujący chce, by produkt wyglądał jak w pełni jego.",
  redistribution:
    "Kupujący może rozpowszechniać oryginalny plik dalej, np. wrzucić na inną platformę do pobrania. Zwykle WYŁĄCZONE — włączaj tylko przy licencji exclusive, gdy oddajesz pełną kontrolę nad plikiem.",
  resale:
    "Kupujący może odsprzedać licencję lub sam plik osobom trzecim. Zwykle WYŁĄCZONE — włączaj tylko przy licencji exclusive/wykupie pełnych praw handlowych.",
  worldwide:
    "Licencja obowiązuje na całym świecie. Przykład: zostaw włączone dla produktów cyfrowych sprzedawanych globalnie; wybierz konkretne terytorium, jeśli masz umowy wyłączności regionalnej (np. tylko Polska).",
  territory:
    "Geograficzny zasięg licencji. Przykład: wybierz „Polska”, jeśli masz już wyłączność na inne kraje z innym partnerem, albo „Inne” i wpisz konkretne kraje.",
  max_users:
    "Maksymalna liczba osób w organizacji kupującego, które mogą korzystać z pliku. Przykład: ustaw „1” dla licencji personal, „5” gdy sprzedajesz małej agencji.",
  max_projects:
    "Maksymalna liczba oddzielnych projektów, w których kupujący może wykorzystać plik. Przykład: „1” dla jednorazowego użycia w konkretnym teledysku; „bez limitu” dla licencji extended.",
  max_end_products:
    "Maksymalna liczba egzemplarzy produktu końcowego zawierającego ten plik, które kupujący może sprzedać (np. sztuk merchu, kopii albumu). Przykład: ustaw limit, gdy chcesz ograniczyć skalę komercyjnego wykorzystania taniej licencji.",
  duration:
    "Jak długo licencja obowiązuje. Przykład: wybierz „Bezterminowa” dla standardowej sprzedaży; ogranicz do „1 rok”, jeśli sprzedajesz dostęp czasowy (np. do kampanii).",
  max_streams:
    "Maksymalna łączna liczba odtworzeń / dystrybucji strumieniowych utworu zawierającego plik. Przykład: ustaw limit przy tańszej licencji na beat (np. 100 000 odtworzeń), potem kupujący musi dokupić wyższą licencję.",
  delivery_mode:
    "Jak kupujący otrzyma plik: tylko strumieniowo w naszym odtwarzaczu (max ochrona przed kopiowaniem), tylko do pobrania, lub oba naraz. Przykład: wybierz streaming dla drogich sampli, żeby utrudnić nielegalne kopiowanie.",
  custom_terms:
    "Twoje dodatkowe zapisy, które trafią do umowy — np. wyjątki, specjalne wymagania, dane kontaktowe. Przykład: „Wymagane oznaczenie linku do profilu w opisie wideo”.",
  attribution_format:
    "Dokładna forma podpisu, jakiej oczekujesz od kupującego. Przykład: „Zdjęcie: Jan Kowalski / instagram.com/jankowalski”.",
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
  attribution_format?: string;
  redistribution?: boolean;
  resale?: boolean;
  worldwide?: boolean;

  // Limits
  max_users?: LicenseLimit; // 1 / 5 / 50 / unlimited
  max_projects?: LicenseLimit; // 1 / 10 / 100 / unlimited
  max_end_products?: LicenseLimit; // 500 / 5000 / 50000 / unlimited
  duration?: LicenseDuration;

  // Delivery
  delivery_mode?: DeliveryMode;

  // Legacy / free-form
  exclusive?: boolean;
  max_streams?: number | null;
  /** Preset territory selector; "other" reveals free-text `territory`. */
  territory_preset?: TerritoryPreset;
  /** Free-text territory, used only when territory_preset === "other". */
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

/** Human-readable territory description, never emits the English word "worldwide". */
export function territoryLabel(t: Pick<LicenseTerms, "territory_preset" | "territory">): string {
  const preset = t.territory_preset ?? (t.territory ? "other" : "worldwide");
  if (preset === "other")
    return t.territory?.trim() || "Terytorium określone odrębnie przez Licencjodawcę";
  return TERRITORY_PRESET_LABELS[preset];
}

/** Sensible defaults per license type — user can override. */
export function presetForType(type: LicenseType): LicenseTerms {
  const base: LicenseTerms = {
    license_type: type,
    private_use: true,
    worldwide: true,
    territory_preset: "worldwide",
    territory: undefined,
    duration: "perpetual",
    delivery_mode: "download",
    attribution_format: undefined,
    max_streams: null,
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
      max_end_products: "0",
    };
  }
  if (type === "commercial") {
    return {
      ...base,
      commercial_use: true,
      can_modify: true,
      use_in_client_projects: true,
      use_for_ai: false,
      train_ai: false,
      create_nft: false,
      attribution_required: false,
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
      redistribution: true,
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
  /** Legal (real) name/company of the licensor — falls back to platform nick if missing. */
  licensorLegalName?: string;
  /** Legal (real) name/company of the licensee — falls back to platform nick if missing. */
  licenseeLegalName?: string;
  orderId?: string;
  fileName?: string;
  purchaseDate?: string;
}): string {
  const t = params.terms ?? {};
  const type = (t.license_type ?? "personal") as LicenseType;
  const typeLabel = LICENSE_TYPE_LABELS[type];
  const isExclusive = type === "exclusive" || t.exclusive === true;

  const lines: string[] = [];
  lines.push(`UMOWA LICENCYJNA — ${typeLabel.toUpperCase()}`);
  lines.push("");
  lines.push(
    `Niniejsza umowa licencyjna („Licencja”) określa warunki, na jakich Licencjodawca${
      params.sellerName ? ` (${params.sellerName})` : ""
    } udziela Licencjobiorcy${params.buyerName ? ` (${params.buyerName})` : ""} prawa do korzystania z produktu cyfrowego${
      params.productTitle ? ` „${params.productTitle}”` : ""
    } („Produkt”).`,
  );
  lines.push("");

  // ── Strony i przedmiot umowy ──────────────────────────────────────────
  lines.push("§1. Strony i przedmiot umowy");
  {
    let n = 1;
    const licensorLine = `Licencjodawca: Użytkownik ${params.licensorLegalName?.trim() || params.sellerName || "VLND"}, identyfikowany na podstawie konta w serwisie VLND.`;
    lines.push(`${n++}. ${licensorLine}`);
    const licenseeLine = `Licencjobiorca: Użytkownik ${params.licenseeLegalName?.trim() || params.buyerName || "VLND"}, identyfikowany na podstawie konta w serwisie VLND.`;
    lines.push(`${n++}. ${licenseeLine}`);
    lines.push(
      `${n++}. Przedmiot umowy: produkt cyfrowy${params.productTitle ? ` „${params.productTitle}”` : ""}${
        params.fileName ? ` (plik: ${params.fileName})` : ""
      }.`,
    );
    if (params.orderId) lines.push(`${n++}. Numer zamówienia / transakcji: ${params.orderId}.`);
    if (params.purchaseDate) lines.push(`${n++}. Data zakupu: ${params.purchaseDate}.`);
  }
  lines.push("");

  lines.push("§2. Typ licencji");
  lines.push(
    `Udzielona zostaje licencja typu ${typeLabel}, ${
      isExclusive ? "wyłączna" : "niewyłączna, nieprzenoszalna"
    }, obowiązująca na terytorium: ${territoryLabel(t)}, ${
      t.duration === "perpetual" || !t.duration
        ? "udzielona bezterminowo"
        : `udzielona na okres ${LICENSE_DURATION_LABELS[t.duration]}`
    }.`,
  );
  lines.push("");

  lines.push("§3. Zakres dozwolonego użytku");
  {
    let n = 1;
    lines.push(`${n++}. Użytek prywatny: ${yn(t.private_use)}.`);
    lines.push(`${n++}. Użytek komercyjny: ${yn(t.commercial_use)}.`);
    lines.push(
      `${n++}. Modyfikacja pliku Produktu i tworzenie utworów zależnych: ${yn(t.can_modify)}.`,
    );
    lines.push(
      `${n++}. Wykorzystanie w projektach klientów Licencjobiorcy: ${yn(t.use_in_client_projects)}.`,
    );
    lines.push(
      `${n++}. Wykorzystanie w rozwiązaniach opartych o sztuczną inteligencję (AI): ${yn(t.use_for_ai)}.`,
    );
    lines.push(`${n++}. Trenowanie modeli AI z użyciem Produktu: ${yn(t.train_ai)}.`);
    lines.push(
      `${n++}. Wykorzystanie do tworzenia tokenów niewymiennych (NFT): ${yn(t.create_nft)}.`,
    );
    lines.push(`${n++}. Redystrybucja Produktu w oryginalnej formie: ${yn(t.redistribution)}.`);
    lines.push(`${n++}. Odsprzedaż licencji lub Produktu osobom trzecim: ${yn(t.resale)}.`);
  }
  lines.push("");

  lines.push("§4. Limity licencji");
  {
    let n = 1;
    lines.push(`${n++}. Maksymalna liczba użytkowników końcowych: ${limitLabel(t.max_users)}.`);
    lines.push(
      `${n++}. Maksymalna liczba projektów, w których może być użyty Produkt: ${limitLabel(t.max_projects)}.`,
    );
    lines.push(
      `${n++}. Maksymalna liczba sprzedanych produktów końcowych zawierających Produkt: ${limitLabel(t.max_end_products)}.`,
    );
    if (t.max_streams && t.max_streams > 0) {
      lines.push(
        `${n++}. Maksymalna liczba odtworzeń / dystrybucji strumieniowych: ${Number(t.max_streams).toLocaleString()}.`,
      );
    }
    const dm = (t.delivery_mode ?? "both") as DeliveryMode;
    lines.push(`${n++}. Sposób dostarczenia Produktu: ${DELIVERY_MODE_LABELS[dm]}.`);
  }
  lines.push("");

  lines.push("§5. Prawa autorskie");
  {
    let n = 1;
    if (isExclusive) {
      lines.push(
        `${n++}. W ramach niniejszej licencji wyłącznej Licencjobiorca uzyskuje wyłączne prawo do korzystania z Produktu w zakresie określonym w §2–§4 i przez czas jej obowiązywania.`,
      );
      lines.push(
        `${n++}. Licencjodawca zobowiązuje się nie udzielać kolejnych licencji na Produkt w okresie obowiązywania niniejszej umowy oraz wycofać Produkt ze sprzedaży.`,
      );
      lines.push(
        `${n++}. Autorskie prawa majątkowe do Produktu pozostają przy Licencjodawcy, chyba że strony zawarły odrębną pisemną umowę o przeniesieniu praw.`,
      );
    } else {
      lines.push(
        `${n++}. Autorskie prawa majątkowe i osobiste do Produktu pozostają w całości przy Licencjodawcy.`,
      );
      lines.push(
        `${n++}. Licencja nie stanowi przeniesienia praw autorskich — jest wyłącznie zgodą na korzystanie z Produktu w zakresie określonym powyżej.`,
      );
      lines.push(
        `${n++}. Licencjodawca zachowuje prawo do udzielania analogicznych licencji dowolnej liczbie innych podmiotów.`,
      );
    }
    if (t.attribution_required) {
      const format = t.attribution_format?.trim();
      lines.push(
        `${n++}. Licencjobiorca jest zobowiązany do wskazania autora Produktu (attribution) w każdym publicznym wykorzystaniu${
          format ? `, w formie: „${format}”` : ""
        }.`,
      );
    } else {
      lines.push(`${n++}. Wskazanie autora (attribution) nie jest wymagane.`);
    }
  }
  lines.push("");

  lines.push("§6. Ograniczenia");
  {
    let n = 1;
    lines.push(
      `${n++}. Zabrania się wykorzystywania Produktu w sposób niezgodny z prawem, w treściach dyskryminujących, oszczerczych, nawołujących do przemocy lub o charakterze bezprawnym.`,
    );
    if (!t.redistribution)
      lines.push(
        `${n++}. Zabrania się redystrybucji Produktu w formie oryginalnej lub minimalnie zmodyfikowanej.`,
      );
    if (!t.resale)
      lines.push(`${n++}. Zabrania się odsprzedaży licencji lub Produktu osobom trzecim.`);
    if (!t.train_ai)
      lines.push(
        `${n++}. Zabrania się wykorzystywania Produktu do trenowania modeli sztucznej inteligencji.`,
      );
  }
  lines.push("");

  lines.push("§7. Skutki naruszenia");
  lines.push(
    "1. Każde naruszenie warunków niniejszej licencji uprawnia Licencjodawcę do jej natychmiastowego wypowiedzenia oraz dochodzenia roszczeń odszkodowawczych na zasadach ogólnych, w tym z tytułu naruszenia autorskich praw majątkowych.",
  );
  lines.push(
    "2. W przypadku naruszenia Licencjobiorca jest zobowiązany do natychmiastowego zaprzestania korzystania z Produktu oraz usunięcia wszystkich jego kopii, w tym kopii zapasowych i zmodyfikowanych wersji, znajdujących się w jego posiadaniu lub pod jego kontrolą.",
  );
  lines.push("");

  lines.push("§8. Prawo właściwe i rozstrzyganie sporów");
  lines.push(
    "1. Niniejsza umowa licencyjna podlega prawu polskiemu, niezależnie od postanowień regulaminu platformy vlnd dotyczących innych aspektów korzystania z serwisu.",
  );
  lines.push(
    "2. Wszelkie spory wynikające z niniejszej umowy będą rozstrzygane przez sąd właściwy dla siedziby lub miejsca zamieszkania Licencjodawcy.",
  );
  lines.push(
    "3. Operator platformy vlnd nie jest stroną niniejszej umowy licencyjnej — pełni wyłącznie rolę pośrednika technicznego umożliwiającego zawarcie transakcji między Licencjodawcą a Licencjobiorcą.",
  );

  if (t.custom_terms?.trim()) {
    lines.push("");
    lines.push("§9. Postanowienia dodatkowe");
    lines.push(t.custom_terms.trim());
  }

  return lines.join("\n");
}
