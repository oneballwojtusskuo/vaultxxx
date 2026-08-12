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

/** Predefined territories — free text caused inconsistent contracts. */
export const TERRITORY_OPTIONS: { value: string; label: string }[] = [
  { value: "worldwide", label: "Cały świat" },
  { value: "eu", label: "Unia Europejska" },
  { value: "eea", label: "Europejski Obszar Gospodarczy (EOG)" },
  { value: "poland", label: "Polska" },
  { value: "europe", label: "Europa" },
  { value: "north_america", label: "Ameryka Północna" },
  { value: "custom", label: "Inne (wpisz ręcznie)" },
];

export const TERRITORY_LABELS: Record<string, string> = Object.fromEntries(
  TERRITORY_OPTIONS.map((o) => [o.value, o.label]),
);

export function territoryLabel(value?: string): string {
  if (!value) return "Cały świat";
  return TERRITORY_LABELS[value] ?? value;
}

/** Human-readable descriptions used in UI tooltips — plain language, no legalese. */
export const LICENSE_OPTION_HELP: Record<string, string> = {
  commercial_use:
    "Czy kupujący może zarabiać na produkcie? Np. użyć beatu w piosence, którą sprzedaje, wstawić grafikę do reklamy albo do produktu na sprzedaż. Jeśli odznaczysz — plik może być używany wyłącznie prywatnie, bez zarobku.",
  private_use:
    "Czy kupujący może używać pliku prywatnie (nauka, własne projekty do szuflady, użytek domowy). Zwykle zostaw ZAZNACZONE — bez tego licencja praktycznie nic nie daje.",
  can_modify:
    "Czy kupujący może przerobić plik: zremiksować beat, pociąć sample, edytować warstwy PSD, zmienić kolory. Odznacz, jeśli chcesz, by plik był używany wyłącznie w oryginalnej formie.",
  use_in_client_projects:
    "Dotyczy freelancerów i agencji: czy kupujący może użyć Twojego pliku w projekcie, który robi dla SWOJEGO klienta (np. logo dla firmy X). To rozszerzone uprawnienie — zwykle tylko w licencjach komercyjnych.",
  use_for_ai:
    "Czy kupujący może wrzucić plik do narzędzi AI jako materiał wejściowy (referencja, upscaling, generowanie wariantów). NIE oznacza zgody na trenowanie modeli — to osobna opcja niżej.",
  train_ai:
    "Najmocniejsze uprawnienie: zgoda na trenowanie modeli AI na Twoim pliku. Praktycznie oznacza, że model może potem generować podobne treści. Zostaw ODZNACZONE, jeśli nie sprzedajesz świadomie danych treningowych.",
  create_nft:
    "Czy kupujący może wybić NFT/token oparty na Twoim pliku. Wiąże się z publicznym, trwałym udostępnieniem pliku w sieci blockchain.",
  attribution_required:
    'Czy kupujący musi podać Cię jako autora przy każdym publicznym użyciu (np. "prod. by TwojaNazwa", credits w opisie wideo). Poniżej możesz wpisać dokładny format oznaczenia.',
  attribution_format:
    'Dokładny tekst, jakim kupujący ma Cię oznaczać, np. "prod. by NOVA" albo "grafika: Anna Kowalska (annakowalska.pl)". Zostaw puste, aby użyć Twojej nazwy z profilu.',
  redistribution:
    "Czy kupujący może rozdawać/wrzucać dalej ORYGINALNY plik (np. na inną platformę, dysk publiczny, torrent). Prawie zawsze zostaw ODZNACZONE — inaczej tracisz kontrolę nad plikiem.",
  resale:
    "Czy kupujący może odsprzedać dalej licencję lub sam plik. Prawie zawsze zostaw ODZNACZONE — inaczej kupujący staje się Twoim konkurentem z Twoim plikiem.",
  worldwide:
    "Czy licencja działa na całym świecie. Odznacz tylko, jeśli świadomie chcesz ograniczyć użycie do jednego regionu (poniżej wybierzesz terytorium).",
  max_users:
    "Ile osób po stronie kupującego może pracować na pliku (np. członkowie zespołu, pracownicy firmy). Dla licencji prywatnej zwykle 1.",
  max_projects:
    "W ilu OSOBNYCH projektach kupujący może użyć pliku (np. 1 utwór, 1 kampania reklamowa, 1 gra = 1 projekt).",
  max_end_products:
    "Ile egzemplarzy produktu końcowego zawierającego Twój plik kupujący może sprzedać (np. sztuk merchu, kopii albumu, licencji na grę). Dotyczy tylko licencji komercyjnych.",
  duration:
    'Jak długo licencja działa. "Bezterminowa" = na zawsze. Okres czasowy oznacza, że po jego upływie kupujący musi przestać używać pliku lub odnowić licencję.',
  max_streams:
    "Limit odtworzeń utworu/materiału zawierającego Twój plik (np. 100 000 streamów na Spotify). Po przekroczeniu kupujący musi wykupić wyższą licencję. Puste = bez limitu.",
  territory:
    "Gdzie geograficznie licencja obowiązuje. Domyślnie cały świat — ograniczaj tylko, jeśli masz ku temu powód.",
  delivery_mode:
    "Jak kupujący dostanie plik: tylko odtwarzanie u nas na stronie (najlepsza ochrona), tylko pobranie, lub oba naraz.",
  custom_terms:
    "Twoje dodatkowe zapisy dopisane do umowy — np. wyjątki, wymagania, dane kontaktowe, warunki współpracy.",
  credit_removal_fee:
    "Opłata, za jaką kupujący może wykupić zwolnienie z obowiązku oznaczania autora. Zostaw puste, jeśli nie oferujesz takiej opcji.",
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
  max_users?: LicenseLimit;
  max_projects?: LicenseLimit;
  max_end_products?: LicenseLimit;
  duration?: LicenseDuration;

  // Delivery
  delivery_mode?: DeliveryMode;

  // Legacy / free-form
  exclusive?: boolean;
  max_streams?: number | null;
  territory?: string;
  territory_custom?: string;
  custom_terms?: string;
};

export const LICENSE_TYPE_LABELS: Record<LicenseType, string> = {
  personal: "Personal",
  commercial: "Commercial",
  extended_commercial: "Extended Commercial",
  exclusive: "Exclusive",
};

export const LICENSE_TYPE_SUMMARY: Record<LicenseType, string> = {
  personal: "Tylko użytek prywatny, bez zarabiania. Najbezpieczniejsza dla Ciebie.",
  commercial: "Kupujący może zarabiać, w ograniczonej skali. Standard dla beatów i grafik.",
  extended_commercial: "Duża skala + projekty klientów. Dla firm i agencji.",
  exclusive: "Sprzedajesz raz, produkt znika z oferty. Najdroższa opcja.",
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
    territory: "worldwide",
    duration: "perpetual",
    delivery_mode: "download",
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

const COMPARED_KEYS: (keyof LicenseTerms)[] = [
  "commercial_use",
  "private_use",
  "can_modify",
  "use_in_client_projects",
  "use_for_ai",
  "train_ai",
  "create_nft",
  "attribution_required",
  "redistribution",
  "resale",
  "worldwide",
  "max_users",
  "max_projects",
  "max_end_products",
  "duration",
];

const KEY_LABELS: Record<string, string> = {
  commercial_use: "Użytek komercyjny",
  private_use: "Użytek prywatny",
  can_modify: "Modyfikacje",
  use_in_client_projects: "Projekty klientów",
  use_for_ai: "Użycie w AI",
  train_ai: "Trenowanie AI",
  create_nft: "NFT",
  attribution_required: "Oznaczenie autora",
  redistribution: "Redystrybucja",
  resale: "Odsprzedaż",
  worldwide: "Cały świat",
  max_users: "Limit użytkowników",
  max_projects: "Limit projektów",
  max_end_products: "Limit produktów końcowych",
  duration: "Czas trwania",
};

/** Which fields the seller changed compared to the chosen preset. */
export function diffFromPreset(type: LicenseType, terms: LicenseTerms): string[] {
  const preset = presetForType(type);
  const out: string[] = [];
  for (const k of COMPARED_KEYS) {
    const a = preset[k];
    const b = terms[k];
    const norm = (v: unknown) => (typeof v === "boolean" ? v : v ?? null);
    if (norm(a) !== norm(b)) out.push(KEY_LABELS[k as string] ?? (k as string));
  }
  return out;
}

export type LicenseIssue = { level: "error" | "warning"; message: string };

/** Logical conflicts that would produce a contradictory or risky contract. */
export function validateLicenseTerms(terms: LicenseTerms): LicenseIssue[] {
  const t = terms ?? {};
  const issues: LicenseIssue[] = [];

  if (!t.private_use && !t.commercial_use) {
    issues.push({
      level: "error",
      message:
        "Wyłączyłeś zarówno użytek prywatny, jak i komercyjny — kupujący nie mógłby legalnie użyć pliku do niczego.",
    });
  }
  if (t.train_ai && !t.use_for_ai) {
    issues.push({
      level: "error",
      message:
        "Zezwalasz na trenowanie modeli AI, ale zabraniasz używania pliku w narzędziach AI. To sprzeczność — włącz „Można używać do AI”.",
    });
  }
  if (t.use_in_client_projects && !t.commercial_use) {
    issues.push({
      level: "error",
      message:
        "Projekty dla klientów to zawsze użycie zarobkowe. Włącz „Użytek komercyjny” albo wyłącz projekty klientów.",
    });
  }
  if (t.resale && !t.can_modify && !t.redistribution) {
    issues.push({
      level: "warning",
      message:
        "Zezwalasz na odsprzedaż, ale nie na redystrybucję pliku — zapis będzie trudny do wyegzekwowania i może być mylący.",
    });
  }
  if (t.create_nft && !t.commercial_use) {
    issues.push({
      level: "warning",
      message: "NFT prawie zawsze wiąże się ze sprzedażą — rozważ włączenie użytku komercyjnego.",
    });
  }
  if (!t.worldwide && (!t.territory || t.territory === "worldwide")) {
    issues.push({
      level: "error",
      message: "Odznaczyłeś licencję na cały świat — wybierz konkretne terytorium poniżej.",
    });
  }
  if (t.redistribution && t.license_type !== "exclusive") {
    issues.push({
      level: "warning",
      message:
        "Zezwalasz na dalsze rozpowszechnianie oryginalnego pliku. Kupujący będzie mógł udostępnić go innym za darmo.",
    });
  }
  if (t.train_ai) {
    issues.push({
      level: "warning",
      message:
        "Zgoda na trenowanie AI oznacza, że modele mogą generować treści podobne do Twoich. To bardzo szerokie uprawnienie.",
    });
  }
  if (t.commercial_use && t.max_end_products === "unlimited" && t.license_type === "personal") {
    issues.push({
      level: "warning",
      message: "Licencja Personal z nieograniczoną sprzedażą produktów końcowych jest sprzeczna z nazwą typu.",
    });
  }
  return issues;
}

const yn = (b?: boolean) => (b ? "TAK" : "NIE");

/** Generates a full professional license text (Polish) from terms. */
export function generateLicenseText(params: {
  terms: LicenseTerms;
  productTitle?: string;
  sellerName?: string;
  buyerName?: string;
  orderId?: string;
  orderDate?: string;
  price?: string;
}): string {
  const t = params.terms ?? {};
  const type = (t.license_type ?? "personal") as LicenseType;
  const typeLabel = LICENSE_TYPE_LABELS[type];
  const isExclusive = type === "exclusive" || t.exclusive === true;
  const territory =
    t.worldwide === false
      ? t.territory === "custom"
        ? t.territory_custom || "obszar wskazany przez Licencjodawcę"
        : territoryLabel(t.territory)
      : "cały świat";

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
  if (params.orderId || params.orderDate || params.price) {
    lines.push(
      `Licencja jest nierozerwalnie związana z zamówieniem${params.orderId ? ` nr ${params.orderId}` : ""}${
        params.orderDate ? ` z dnia ${params.orderDate}` : ""
      }${params.price ? ` na kwotę ${params.price}` : ""} złożonym w serwisie vlnd i wchodzi w życie z chwilą zaksięgowania pełnej zapłaty.`,
    );
  }
  lines.push("");

  let s = 0;
  const sec = (title: string) => {
    s += 1;
    lines.push(`§${s}. ${title}`);
  };

  sec("Typ licencji i zakres terytorialny");
  lines.push(
    `Udzielona zostaje licencja typu ${typeLabel}, ${
      isExclusive ? "wyłączna" : "niewyłączna, nieprzenoszalna"
    }, obowiązująca na terytorium: ${territory}, ${
      t.duration === "perpetual" || !t.duration
        ? "udzielona bezterminowo"
        : `udzielona na okres ${LICENSE_DURATION_LABELS[t.duration]} od dnia zakupu`
    }.`,
  );
  lines.push(
    "Licencja zostaje udzielona wyłącznie Licencjobiorcy wskazanemu w zamówieniu i nie może zostać przeniesiona na inny podmiot bez pisemnej zgody Licencjodawcy, z zastrzeżeniem §2 pkt 9.",
  );
  lines.push("");

  sec("Zakres dozwolonego użytku");
  lines.push(`1. Użytek prywatny: ${yn(t.private_use)}.`);
  lines.push(`2. Użytek komercyjny (zarobkowy): ${yn(t.commercial_use)}.`);
  lines.push(`3. Modyfikacja Produktu i tworzenie utworów zależnych: ${yn(t.can_modify)}.`);
  lines.push(`4. Wykorzystanie w projektach klientów Licencjobiorcy: ${yn(t.use_in_client_projects)}.`);
  lines.push(`5. Wykorzystanie jako materiał wejściowy w narzędziach AI: ${yn(t.use_for_ai)}.`);
  lines.push(`6. Trenowanie modeli uczenia maszynowego / AI na Produkcie: ${yn(t.train_ai)}.`);
  lines.push(`7. Wykorzystanie do tworzenia tokenów niewymiennych (NFT): ${yn(t.create_nft)}.`);
  lines.push(`8. Redystrybucja Produktu w oryginalnej formie: ${yn(t.redistribution)}.`);
  lines.push(`9. Odsprzedaż licencji lub Produktu osobom trzecim: ${yn(t.resale)}.`);
  lines.push("");

  sec("Limity licencji");
  {
    let n = 0;
    const item = (text: string) => {
      n += 1;
      lines.push(`${n}. ${text}`);
    };
    item(`Maksymalna liczba użytkowników po stronie Licencjobiorcy: ${limitLabel(t.max_users)}.`);
    item(`Maksymalna liczba projektów, w których może być użyty Produkt: ${limitLabel(t.max_projects)}.`);
    if (t.commercial_use) {
      item(
        `Maksymalna liczba sprzedanych produktów końcowych zawierających Produkt: ${limitLabel(t.max_end_products)}.`,
      );
    }
    if (t.max_streams && t.max_streams > 0) {
      item(`Maksymalna liczba odtworzeń / dystrybucji strumieniowych: ${Number(t.max_streams).toLocaleString("pl-PL")}.`);
    }
    const dm = (t.delivery_mode ?? "download") as DeliveryMode;
    item(`Sposób dostarczenia Produktu: ${DELIVERY_MODE_LABELS[dm]}.`);
    item(
      "Przekroczenie któregokolwiek z powyższych limitów wymaga wykupienia licencji wyższego poziomu. Do czasu jej wykupienia dalsze korzystanie z Produktu jest nieuprawnione.",
    );
  }
  lines.push("");

  sec("Prawa autorskie i oznaczenie autora");
  if (isExclusive) {
    lines.push(
      "1. W ramach niniejszej licencji wyłącznej Licencjobiorca uzyskuje wyłączne prawo do korzystania z Produktu w zakresie określonym w §1–§3 i przez czas jej obowiązywania.",
    );
    lines.push(
      "2. Licencjodawca zobowiązuje się nie udzielać kolejnych licencji na Produkt w okresie obowiązywania niniejszej umowy oraz wycofać Produkt ze sprzedaży.",
    );
    lines.push(
      "3. Licencje udzielone przed zawarciem niniejszej umowy pozostają w mocy; wyłączność działa wyłącznie na przyszłość.",
    );
    lines.push(
      "4. Autorskie prawa majątkowe do Produktu pozostają przy Licencjodawcy, chyba że strony zawarły odrębną pisemną umowę o przeniesieniu praw.",
    );
  } else {
    lines.push("1. Autorskie prawa majątkowe i osobiste do Produktu pozostają w całości przy Licencjodawcy.");
    lines.push(
      "2. Licencja nie stanowi przeniesienia praw autorskich — jest wyłącznie zgodą na korzystanie z Produktu w zakresie określonym powyżej.",
    );
    lines.push("3. Licencjodawca zachowuje prawo do udzielania analogicznych licencji dowolnej liczbie innych podmiotów.");
  }
  if (t.attribution_required) {
    lines.push(
      `4. Licencjobiorca zobowiązany jest oznaczyć autora przy każdym publicznym wykorzystaniu Produktu${
        t.attribution_format?.trim()
          ? `, w formacie: „${t.attribution_format.trim()}"`
          : params.sellerName
            ? `, wskazując: „${params.sellerName}"`
            : ""
      }. Usunięcie lub pominięcie oznaczenia stanowi istotne naruszenie Licencji.`,
    );
  } else {
    lines.push("4. Wskazanie autora (attribution) nie jest wymagane, choć jest mile widziane.");
  }
  lines.push(
    "5. Licencjobiorca nie nabywa praw do znaków towarowych, nazwy ani wizerunku Licencjodawcy i nie może sugerować jego udziału w projekcie ani rekomendacji bez odrębnej zgody.",
  );
  lines.push("");

  sec("Ograniczenia");
  {
    let n = 0;
    const item = (text: string) => {
      n += 1;
      lines.push(`${n}. ${text}`);
    };
    item(
      "Zabrania się wykorzystywania Produktu w treściach bezprawnych, dyskryminujących, oszczerczych, nawołujących do przemocy lub nienawiści, a także w materiałach pornograficznych, o ile Licencjodawca nie wyraził na to odrębnej pisemnej zgody.",
    );
    if (!t.redistribution)
      item(
        "Zabrania się redystrybucji Produktu w formie oryginalnej lub minimalnie zmodyfikowanej, w tym udostępniania go w bibliotekach zasobów, paczkach, na dyskach współdzielonych i w sieciach P2P.",
      );
    if (!t.resale) item("Zabrania się odsprzedaży, wynajmu, użyczenia ani sublicencjonowania Produktu osobom trzecim.");
    if (!t.train_ai)
      item(
        "Zabrania się wykorzystywania Produktu do trenowania, dostrajania (fine-tuning) lub walidacji modeli sztucznej inteligencji oraz do budowy zbiorów danych treningowych.",
      );
    if (!t.can_modify)
      item("Zabrania się modyfikowania, remiksowania i tworzenia opracowań Produktu bez zgody Licencjodawcy.");
    item(
      "Zabrania się rejestrowania Produktu (w całości lub w części) jako znaku towarowego, wzoru przemysłowego, a także zgłaszania go do systemów Content ID i innych systemów rozpoznawania treści w sposób blokujący Licencjodawcę lub innych licencjobiorców.",
    );
    item("Zabrania się usuwania oznaczeń autorskich, znaków wodnych i metadanych z Produktu.");
  }
  lines.push("");

  sec("Oświadczenia i odpowiedzialność");
  lines.push(
    "1. Licencjodawca oświadcza, że przysługują mu prawa niezbędne do udzielenia niniejszej Licencji oraz że Produkt nie narusza praw osób trzecich.",
  );
  lines.push(
    '2. Produkt jest udostępniany w stanie „takim, jaki jest" (as-is). Licencjodawca nie gwarantuje przydatności Produktu do konkretnego celu Licencjobiorcy.',
  );
  lines.push(
    "3. Odpowiedzialność Licencjodawcy z tytułu niniejszej Licencji ograniczona jest do wysokości ceny zapłaconej za Licencję, z wyłączeniem szkód pośrednich i utraconych korzyści. Ograniczenie to nie dotyczy szkód wyrządzonych umyślnie ani odpowiedzialności, której zgodnie z prawem nie można wyłączyć — w szczególności wobec konsumentów.",
  );
  lines.push(
    "4. Licencjobiorca ponosi wyłączną odpowiedzialność za sposób wykorzystania Produktu i zwolni Licencjodawcę z roszczeń osób trzecich wynikających z użycia Produktu niezgodnie z Licencją.",
  );
  lines.push("");

  sec("Naruszenia i wypowiedzenie");
  lines.push(
    "1. Każde naruszenie warunków Licencji uprawnia Licencjodawcę do jej natychmiastowego wypowiedzenia ze skutkiem na dzień doręczenia oświadczenia.",
  );
  lines.push(
    "2. Z chwilą wygaśnięcia lub wypowiedzenia Licencji Licencjobiorca zobowiązany jest zaprzestać korzystania z Produktu, usunąć jego kopie oraz — w miarę możliwości — wycofać materiały zawierające Produkt.",
  );
  lines.push(
    "3. Wypowiedzenie Licencji nie pozbawia Licencjodawcy prawa do dochodzenia roszczeń odszkodowawczych na zasadach ogólnych, w tym z tytułu naruszenia autorskich praw majątkowych.",
  );
  lines.push(
    "4. Na uzasadnione żądanie Licencjodawcy Licencjobiorca przedstawi informacje o zakresie wykorzystania Produktu (liczba projektów, egzemplarzy, odtworzeń) w celu weryfikacji limitów z §3.",
  );
  lines.push("");

  sec("Postanowienia końcowe");
  lines.push(
    "1. Licencja podlega prawu polskiemu. W sprawach nieuregulowanych stosuje się ustawę o prawie autorskim i prawach pokrewnych oraz Kodeks cywilny.",
  );
  lines.push(
    "2. Spory rozstrzyga sąd właściwy dla siedziby/miejsca zamieszkania Licencjodawcy, chyba że Licencjobiorca jest konsumentem — wówczas właściwość ustala się według przepisów ogólnych.",
  );
  lines.push(
    "3. Licencjobiorca będący konsumentem przyjmuje do wiadomości, że treść cyfrowa dostarczana jest niezwłocznie po zapłacie, a rozpoczęcie pobierania/odtwarzania oznacza utratę prawa odstąpienia od umowy (art. 38 pkt 13 ustawy o prawach konsumenta).",
  );
  lines.push(
    "4. Nieważność któregokolwiek postanowienia nie wpływa na ważność pozostałych; w jego miejsce stosuje się zapis najbliższy zamiarowi stron.",
  );
  lines.push(
    "5. Serwis vlnd jest wyłącznie pośrednikiem technicznym i nie jest stroną niniejszej Licencji. Umowa zawierana jest pomiędzy Licencjodawcą a Licencjobiorcą.",
  );
  lines.push(
    "6. Wszelkie zmiany Licencji wymagają formy dokumentowej pod rygorem nieważności. Warunki obowiązujące w chwili zakupu pozostają wiążące niezależnie od późniejszych zmian oferty.",
  );

  if (t.custom_terms?.trim()) {
    lines.push("");
    sec("Postanowienia dodatkowe Licencjodawcy");
    lines.push(t.custom_terms.trim());
  }

  return lines.join("\n");
}
