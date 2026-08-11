# vlnd — plan wdrożenia: dostępność zakupów, wyszukiwarka, compliance

Zakres jest bardzo duży (rejestracja, checkout, wypłaty, DSA, RODO, cookies, audit log, wersjonowanie).
Dzielę go na etapy — każdy etap kończy się działającą aplikacją. Zaczynam od Etapu 1 po akceptacji.

## Etap 1 — to, o co prosisz wprost (funkcje produktowe)

**Zdjęcie ogłoszenia przez sprzedającego vs. usunięcie przez admina**
- Sprzedający „zdejmuje” ofertę → status `archived`: znika z wyszukiwarki i profilu, ale każdy, kto ma
  transakcję (`held/released/completed` lub z wymiany), nadal widzi stronę produktu, pobiera plik i ma licencję.
- Admin usuwa → jak dziś: trwałe usunięcie z plikami + notatka do sprzedającego (nikt nie ma dostępu).
- Strona produktu i „Zakupy” pobierają archiwalne produkty osobną, autoryzowaną ścieżką (kupujący / właściciel / admin).

**Wyszukiwarka z rankingiem słów kluczowych**
- Indeks tekstowy po: tytule (waga najwyższa), tagach/hasztagach, opisie, nazwie kategorii oraz własnej
  kategorii wpisanej przez sprzedawcę.
- Zapytanie dzielone na słowa, dopasowania częściowe, sortowanie po trafności (potem po popularności/dacie).
- Pole `custom_category` na produkcie; przy wyborze kategorii „Inna” wpisanie własnej nazwy jest **obowiązkowe**
  (walidacja w formularzu i przy zapisie).

## Etap 2 — rejestracja, cookies, RODO (najszybsze compliance-wins)

- **Data urodzenia obowiązkowa** przy rejestracji, twarda blokada < 16 lat (bez fikcyjnej zgody rodzica),
  zapis daty i statusu wieku przy koncie.
- **Baner cookies** z kategoriami: niezbędne (zawsze), analityczne, marketingowe, afiliacyjne, funkcjonalne.
  Przyciski: Akceptuj wszystkie / Odrzuć opcjonalne / Ustawienia. Zapis wyboru + wersji bannera + timestamp
  w bazie (dla zalogowanych) i lokalnie. Zmiana zgody w każdej chwili z ustawień konta.
  Cookie afiliacyjne ustawiane dopiero po zgodzie.
- **Panel „Moje dane”** w koncie: eksport danych (JSON do pobrania), żądanie sprostowania/ograniczenia/sprzeciwu,
  usunięcie konta z jasną informacją, co i jak długo zostaje (transakcje, faktury, DAC7).
- **Dane operatora w stopce**: nazwa podmiotu, NIP, adres, dane rejestrowe — pola do uzupełnienia przez Ciebie.

## Etap 3 — checkout, licencje, status sprzedawcy

- Dwie **osobne, niezaznaczone** zgody przy zakupie: (1) regulamin + polityka prywatności,
  (2) natychmiastowe rozpoczęcie świadczenia i utrata prawa odstąpienia. Zapis treści + wersji + timestampu
  przy transakcji.
- Status sprzedawcy: **przedsiębiorca / osoba prywatna** — obowiązkowy przed publikacją, widoczny na ofercie
  i w checkoucie, z informacją o podziale odpowiedzialności.
- Oświadczenie o prawach do pliku (checkbox z wersją i timestampem) przy wystawianiu.
- Rozszerzone metadane oferty (format, rozmiar, wersja, wymagania, data aktualizacji) i zapis pełnej treści
  licencji przy zamówieniu + pobranie kopii licencji z zakupu.

## Etap 4 — reklamacje, dispute, DSA/copyright, moderacja, audit log, DAC7

- Osobne ścieżki: reklamacja produktu, spór transakcyjny, zgłoszenie nielegalnej treści, copyright, problem
  techniczny — każda z własnymi statusami i historią.
- Dispute ze statusami OPEN → … → CLOSED, uzasadnieniami i historią zmian.
- Notice & Action: formularz przy każdym produkcie (URL, rodzaj naruszenia, dowody, oświadczenie o dobrej wierze),
  case ze statusami NEW/UNDER_REVIEW/ACTION_TAKEN/NO_ACTION/APPEAL/CLOSED, powiadomienie sprzedawcy z uzasadnieniem
  i **odwołanie w aplikacji**.
- **Compliance Center** w panelu admina z licznikami i filtrowaniem.
- **Audit log** (append-only) dla zdarzeń konta, produktu, płatności, moderacji, zgód.
- **KYC/DAC7**: formularz danych podatkowych wymagany **przed pierwszą wypłatą**, blokada wypłaty przy brakach,
  statusy DAC7_*, licznik transakcji i wartości.
- Strona „Jak działają wyniki wyszukiwania?” z rzeczywistymi parametrami rankingu.

## Kwestie oznaczone do decyzji / przeglądu prawnego (LEGAL REVIEW REQUIRED)

- **Model płatności nie jest escrow w sensie prawnym.** Dziś płatność idzie przez Stripe na konto operatora,
  a wypłaty do sprzedawców nie są zautomatyzowane przez Stripe Connect — środki przechodzą przez operatora.
  Regulamin mówi o „depozycie/escrow”. To rozbieżność **CRITICAL**: albo wdrażamy Stripe Connect
  (sprzedawca = odbiorca środków, transfer/hold przez Stripe), albo zmieniamy nazewnictwo i opis w regulaminie.
  Wymaga Twojej decyzji biznesowej + konfiguracji Stripe; sam tego nie rozstrzygnę.
- Merchant of record, kto ponosi opłaty płatnicze, zasady refundów i chargebacków.
- Dane rejestrowe operatora (nazwa, NIP, adres) — muszę je od Ciebie dostać.
- Czy dopuszczasz sprzedawców-przedsiębiorców i jakie dane od nich zbieramy.
- Treść regulaminu i polityki zostaje bez zmian — po Etapach 2–4 wskażę miejsca, które trzeba dostosować do
  faktycznego działania aplikacji.

## Techniczne

Zmiany bazy: `products.custom_category`, indeksy tekstowe (`pg_trgm` / `tsvector`) i funkcja rankująca,
`consents` + `document_versions`, `cookie_consents`, `audit_log`, `seller_tax_profiles` (DAC7/KYC),
`complaints`, `disputes`, rozbudowa `reports` o typy/statusy/odwołania, `profiles.date_of_birth` i
`seller_type`. Wszystkie z GRANT-ami i RLS. Dostęp do archiwalnych produktów przez autoryzowaną funkcję
serwerową, nigdy przez publiczne polityki.
