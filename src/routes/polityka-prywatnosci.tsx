import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import {
  OPERATOR_NAME,
  OPERATOR_LEGAL_FORM,
  OPERATOR_ADDRESS,
  OPERATOR_CONTACT,
} from "@/lib/operator";

const EFFECTIVE_DATE = "1 stycznia 2026 r.";

export const Route = createFileRoute("/polityka-prywatnosci")({
  head: () => ({
    meta: [
      { title: "Polityka Prywatności i Cookies — vlnd" },
      {
        name: "description",
        content:
          "Polityka Prywatności i Polityka Plików Cookies platformy vlnd — zgodna z RODO (GDPR) i polskim prawem. Zasady przetwarzania danych Kupujących i Sprzedawców, escrow, DAC7.",
      },
      { property: "og:title", content: "Polityka Prywatności i Cookies — vlnd" },
      {
        property: "og:description",
        content:
          "Jak vlnd przetwarza dane osobowe użytkowników marketplace'u cyfrowego zgodnie z RODO, ustawą o ochronie danych osobowych i DAC7.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold">
              Polityka Prywatności i Polityka Plików Cookies
            </h1>
          </div>
          <p className="text-sm text-muted-foreground mb-10">
            Obowiązuje od dnia {EFFECTIVE_DATE}. Kontakt w sprawach prywatności:{" "}
            <a className="underline hover:text-foreground" href={`mailto:${OPERATOR_CONTACT}`}>
              {OPERATOR_CONTACT}
            </a>
            .
          </p>

          <article className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-8 leading-relaxed">
            <Section title="§ 1. Administrator danych osobowych">
              <p>
                Operator Platformy VLND oraz Administrator Danych Osobowych: <b>{OPERATOR_NAME}</b>,{" "}
                {OPERATOR_LEGAL_FORM} (dalej: <b>„Administrator”</b> lub <b>„Operator”</b>).
                <br />
                Adres do korespondencji: {OPERATOR_ADDRESS}.<br />
                Kontakt e-mail:{" "}
                <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                  {OPERATOR_CONTACT}
                </a>
                .
              </p>
              <p>
                We wszystkich sprawach dotyczących przetwarzania danych osobowych oraz wykonywania
                przysługujących Państwu praw można kontaktować się z Administratorem pod adresem
                e-mail:{" "}
                <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                  {OPERATOR_CONTACT}
                </a>
                .
              </p>
              <p>
                Podstawą prawną niniejszej Polityki jest Rozporządzenie Parlamentu Europejskiego i
                Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w
                związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich
                danych (<b>„RODO”</b>), ustawa z dnia 10 maja 2018 r. o ochronie danych osobowych,
                ustawa z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną, ustawa z
                dnia 16 lipca 2004 r. — Prawo telekomunikacyjne oraz ustawa z dnia 23 maja 2024 r.
                wdrażająca Dyrektywę Rady (UE) 2021/514 (<b>„DAC7”</b>).
              </p>
            </Section>

            <Section title="§ 2. Kategorie zbieranych danych i cele przetwarzania">
              <p>
                Zakres przetwarzanych danych zależy od roli Użytkownika oraz od zakresu korzystania
                z Platformy. Poniżej wskazano cele, kategorie danych oraz podstawy prawne
                przetwarzania.
              </p>

              <h3 className="font-semibold text-foreground pt-2">A. Dane Kupujących</h3>
              <ul>
                <li>
                  <b>Zakres danych:</b> adres e-mail, hasło (w postaci zaszyfrowanego skrótu), nazwa
                  użytkownika, adres IP, dane urządzenia i przeglądarki, historia zakupów, dane
                  transakcji (kwota, produkt, data), dane rozliczeniowe (imię, nazwisko, adres,
                  opcjonalnie NIP na potrzeby faktury), treść wiadomości wysyłanych do Sprzedawców,
                  treść zgłoszeń reklamacyjnych i sporów escrow.
                </li>
                <li>
                  <b>Cele i podstawy prawne:</b>
                  <ul>
                    <li>
                      świadczenie usług drogą elektroniczną (założenie i utrzymanie Konta,
                      dostarczanie Produktów Cyfrowych) — <b>art. 6 ust. 1 lit. b RODO</b>{" "}
                      (wykonanie umowy);
                    </li>
                    <li>
                      obsługa płatności powierniczych (escrow) i rozliczeń — art. 6 ust. 1 lit. b i
                      lit. c RODO;
                    </li>
                    <li>
                      obsługa reklamacji, sporów oraz procedury Notice &amp; Takedown — art. 6 ust.
                      1 lit. b, c i f RODO (prawnie uzasadniony interes Administratora polegający na
                      obsłudze roszczeń);
                    </li>
                    <li>
                      wypełnianie obowiązków podatkowych, księgowych i rachunkowych — art. 6 ust. 1
                      lit. c RODO w związku z ustawą o rachunkowości oraz ustawami podatkowymi.
                    </li>
                  </ul>
                </li>
              </ul>

              <h3 className="font-semibold text-foreground pt-2">B. Dane Sprzedawców / Twórców</h3>
              <ul>
                <li>
                  <b>Zakres danych:</b> wszystkie dane wskazane w punkcie A, a ponadto: imię i
                  nazwisko lub firma, adres zamieszkania lub siedziby, kraj rezydencji podatkowej,
                  numer PESEL lub NIP (w przypadku podmiotów zagranicznych — TIN, VAT-UE), numer
                  rachunku bankowego lub identyfikator konta Stripe Connect, dane wymagane w
                  procesie KYC (weryfikacji tożsamości) przez dostawcę płatności, informacje o
                  wysokości uzyskanego wynagrodzenia, dane oferowanych Produktów Cyfrowych i
                  metadanych z nimi związanych.
                </li>
                <li>
                  <b>Cele i podstawy prawne:</b>
                  <ul>
                    <li>
                      umożliwienie sprzedaży Produktów Cyfrowych, wypłata środków ze escrow i
                      rozliczenie prowizji — art. 6 ust. 1 lit. b RODO;
                    </li>
                    <li>
                      wypełnienie obowiązków raportowych wynikających z <b>Dyrektywy DAC7</b>{" "}
                      (Dyrektywa Rady (UE) 2021/514) i ustawy wdrażającej ją do polskiego porządku
                      prawnego, w tym coroczne przekazywanie Szefowi Krajowej Administracji
                      Skarbowej informacji o Sprzedawcach podlegających raportowaniu — art. 6 ust. 1
                      lit. c RODO;
                    </li>
                    <li>
                      przeciwdziałanie oszustwom, praniu pieniędzy i finansowaniu terroryzmu (AML) —
                      art. 6 ust. 1 lit. c i f RODO;
                    </li>
                    <li>
                      obrona przed roszczeniami i dochodzenie roszczeń — art. 6 ust. 1 lit. f RODO.
                    </li>
                  </ul>
                </li>
              </ul>

              <h3 className="font-semibold text-foreground pt-2">C. Marketing własny</h3>
              <p>
                Za odrębną, dobrowolną zgodą Użytkownika (art. 6 ust. 1 lit. a RODO oraz art. 10
                ustawy o świadczeniu usług drogą elektroniczną i art. 172 Prawa telekomunikacyjnego)
                Administrator może przesyłać newsletter, powiadomienia o nowościach oraz informacje
                handlowe dotyczące własnych usług. Zgoda może być cofnięta w dowolnym momencie bez
                wpływu na zgodność z prawem przetwarzania dokonanego przed jej cofnięciem.
              </p>
            </Section>

            <Section title="§ 3. Odbiorcy danych (podmioty przetwarzające)">
              <p>
                Dane Użytkowników mogą być powierzane lub udostępniane następującym kategoriom
                odbiorców, wyłącznie w zakresie niezbędnym do realizacji wskazanych powyżej celów:
              </p>
              <ul>
                <li>
                  <b>Dostawcy usług płatniczych i escrow:</b> Stripe Payments Europe Ltd. (Irlandia)
                  — obsługa płatności kartowych, BLIK, Apple/Google Pay, mechanizmu escrow, procesu
                  KYC i wypłat do Sprzedawców; w przyszłości możliwe: PayU S.A., Przelewy24
                  (DialCom24 sp. z o.o.).
                </li>
                <li>
                  <b>Dostawca hostingu i infrastruktury chmurowej:</b> podmiot świadczący usługi
                  hostingowe oraz zaplecze bazodanowe Platformy.
                </li>
                <li>
                  <b>Dostawcy usług e-mail transakcyjnych i newslettera:</b> wysyłka powiadomień
                  systemowych, potwierdzeń rejestracji, potwierdzeń zakupu, przypomnień dotyczących
                  escrow.
                </li>
                <li>
                  <b>Dostawcy narzędzi analitycznych i antyfraudowych</b> — w zakresie
                  zanonimizowanych lub spseudonimizowanych danych statystycznych.
                </li>
                <li>
                  <b>Organy podatkowe i inne organy publiczne</b> (Szef Krajowej Administracji
                  Skarbowej, sądy, prokuratura, Policja, UODO) — wyłącznie w przypadkach wymaganych
                  przepisami prawa, w tym raportowanie DAC7.
                </li>
                <li>
                  <b>Kancelarie prawne, doradcy podatkowi, audytorzy</b> — w zakresie niezbędnym do
                  świadczenia usług na rzecz Administratora.
                </li>
              </ul>
              <p>
                Administrator zawiera z podmiotami przetwarzającymi umowy powierzenia przetwarzania
                danych osobowych zgodne z art. 28 RODO. W przypadku przekazania danych do państw
                trzecich (poza Europejski Obszar Gospodarczy) Administrator stosuje odpowiednie
                zabezpieczenia, w szczególności standardowe klauzule umowne zatwierdzone przez
                Komisję Europejską.
              </p>
            </Section>

            <Section title="§ 4. Prawa Użytkownika zgodnie z RODO">
              <p>
                Każdej osobie, której dane dotyczą, przysługują następujące prawa wynikające z RODO:
              </p>
              <ul>
                <li>
                  <b>Prawo dostępu do danych</b> (art. 15 RODO) — uzyskania potwierdzenia, czy
                  Administrator przetwarza dane, oraz otrzymania ich kopii.
                </li>
                <li>
                  <b>Prawo do sprostowania</b> (art. 16 RODO) — poprawienia nieprawidłowych lub
                  uzupełnienia niekompletnych danych.
                </li>
                <li>
                  <b>Prawo do usunięcia danych („prawo do bycia zapomnianym”)</b> (art. 17 RODO) — z
                  zastrzeżeniem sytuacji, w których dalsze przetwarzanie jest wymagane przepisami
                  prawa (np. dokumentacja księgowa, obowiązki DAC7, obrona przed roszczeniami).
                </li>
                <li>
                  <b>Prawo do ograniczenia przetwarzania</b> (art. 18 RODO).
                </li>
                <li>
                  <b>Prawo do przenoszenia danych</b> (art. 20 RODO) — w zakresie danych
                  przetwarzanych na podstawie zgody lub umowy w sposób zautomatyzowany.
                </li>
                <li>
                  <b>Prawo do wniesienia sprzeciwu</b> (art. 21 RODO) — w szczególności wobec
                  przetwarzania opartego na prawnie uzasadnionym interesie oraz wobec marketingu
                  bezpośredniego.
                </li>
                <li>
                  <b>Prawo do cofnięcia zgody</b> w dowolnym momencie (art. 7 ust. 3 RODO) — bez
                  wpływu na zgodność z prawem przetwarzania dokonanego przed cofnięciem zgody.
                </li>
                <li>
                  <b>
                    Prawo do niepodlegania decyzjom opartym wyłącznie na zautomatyzowanym
                    przetwarzaniu
                  </b>{" "}
                  (art. 22 RODO).
                </li>
              </ul>
              <p>
                W celu realizacji powyższych praw prosimy o kontakt na adres:{" "}
                <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                  {OPERATOR_CONTACT}
                </a>
                . Administrator udziela odpowiedzi bez zbędnej zwłoki, nie później niż w terminie
                jednego miesiąca od otrzymania żądania.
              </p>
              <p>
                Użytkownikowi przysługuje ponadto{" "}
                <b>prawo wniesienia skargi do organu nadzorczego</b> — Prezesa Urzędu Ochrony Danych
                Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa,{" "}
                <a
                  className="underline"
                  href="https://uodo.gov.pl"
                  target="_blank"
                  rel="noreferrer"
                >
                  uodo.gov.pl
                </a>
                , jeżeli uzna, że przetwarzanie jego danych osobowych narusza przepisy RODO.
              </p>
            </Section>

            <Section title="§ 5. Polityka Plików Cookies">
              <ol>
                <li>
                  Pliki <b>cookies</b> („ciasteczka”) to niewielkie pliki tekstowe zapisywane przez
                  przeglądarkę internetową na urządzeniu końcowym Użytkownika, umożliwiające
                  identyfikację przeglądarki podczas kolejnych odwiedzin Platformy.
                </li>
                <li>
                  Platforma wykorzystuje następujące kategorie plików cookies:
                  <ul>
                    <li>
                      <b>Cookies niezbędne</b> — bezwzględnie konieczne do prawidłowego działania
                      Platformy, w tym utrzymania sesji zalogowanego Użytkownika, obsługi koszyka,
                      procesu zakupu i mechanizmu escrow oraz zapewnienia bezpieczeństwa (ochrona
                      przed atakami CSRF). Cookies te nie wymagają zgody Użytkownika i są
                      przetwarzane na podstawie art. 173 ust. 3 pkt 2 Prawa telekomunikacyjnego.
                    </li>
                    <li>
                      <b>Cookies analityczne / statystyczne</b> — służące do zliczania odwiedzin,
                      analizy zachowań Użytkowników i doskonalenia Platformy. Zbierają dane w formie
                      zagregowanej i spseudonimizowanej.
                    </li>
                    <li>
                      <b>Cookies marketingowe i afiliacyjne</b> — umożliwiające prawidłowe działanie
                      programu partnerskiego (afiliacji), w tym zapamiętanie linku polecającego
                      przez okres do 30 dni oraz dopasowanie treści marketingowych.
                    </li>
                    <li>
                      <b>Cookies funkcjonalne</b> — zapamiętujące preferencje Użytkownika, np.
                      wybrany język interfejsu, zamknięcie okna powitalnego, ustawienia motywu.
                    </li>
                  </ul>
                </li>
                <li>
                  Cookies analityczne i marketingowe uruchamiane są wyłącznie po uzyskaniu
                  <b> dobrowolnej zgody</b> Użytkownika wyrażonej za pośrednictwem banera zgód
                  cookie. Zgoda może być w każdej chwili wycofana, w tym poprzez zmianę ustawień
                  przeglądarki.
                </li>
                <li>
                  Użytkownik może samodzielnie zarządzać plikami cookies z poziomu swojej
                  przeglądarki internetowej — blokować je w całości, ograniczyć do wybranych domen
                  lub usuwać już zapisane pliki. Instrukcje dostępne są w dokumentacji
                  najpopularniejszych przeglądarek (Chrome, Firefox, Safari, Edge, Opera).
                </li>
                <li>
                  Ograniczenie lub wyłączenie plików cookies niezbędnych może uniemożliwić
                  prawidłowe korzystanie z Platformy, w tym zalogowanie się i dokonanie zakupu.
                </li>
              </ol>
            </Section>

            <Section title="§ 6. Bezpieczeństwo danych i okres ich przechowywania">
              <ol>
                <li>
                  Administrator stosuje odpowiednie środki techniczne i organizacyjne zapewniające
                  ochronę przetwarzanych danych osobowych, adekwatne do zagrożeń oraz kategorii
                  danych, w szczególności:
                  <ul>
                    <li>
                      szyfrowanie transmisji danych przy użyciu protokołu <b>TLS/SSL (HTTPS)</b>;
                    </li>
                    <li>
                      przechowywanie haseł Użytkowników wyłącznie w postaci kryptograficznego skrótu
                      (hash), bez możliwości ich odczytania;
                    </li>
                    <li>kontrolę dostępu opartą o mechanizm Row-Level Security w bazie danych;</li>
                    <li>
                      pseudonimizację danych tam, gdzie jest to możliwe, oraz zasadę minimalizacji
                      danych;
                    </li>
                    <li>
                      regularne kopie zapasowe oraz monitorowanie bezpieczeństwa infrastruktury;
                    </li>
                    <li>
                      przekazywanie danych płatniczych wyłącznie licencjonowanym dostawcom usług
                      płatniczych — Administrator nie przechowuje pełnych numerów kart płatniczych.
                    </li>
                  </ul>
                </li>
                <li>
                  Dane osobowe przetwarzane są przez okres niezbędny do realizacji celów, dla
                  których zostały zebrane, a w szczególności:
                  <ul>
                    <li>
                      dane Konta — przez czas jego istnienia, a po jego usunięciu przez okres
                      przedawnienia roszczeń;
                    </li>
                    <li>
                      dane transakcyjne oraz księgowe — przez okres <b>5 lat</b> licząc od końca
                      roku kalendarzowego, w którym powstał obowiązek podatkowy, zgodnie z ustawą
                      Ordynacja podatkowa oraz ustawą o rachunkowości;
                    </li>
                    <li>
                      dane raportowane w ramach <b>DAC7</b> — przez okres wymagany przepisami
                      wdrażającymi tę dyrektywę;
                    </li>
                    <li>
                      dane przetwarzane na podstawie zgody (marketing) — do czasu wycofania zgody;
                    </li>
                    <li>
                      dane niezbędne do obrony przed roszczeniami lub ich dochodzenia — do czasu
                      przedawnienia roszczeń wynikającego z Kodeksu cywilnego;
                    </li>
                    <li>
                      dane w rejestrze zgłoszeń DSA (Notice &amp; Takedown) — przez okres wymagany
                      Rozporządzeniem 2022/2065 (DSA).
                    </li>
                  </ul>
                </li>
                <li>Po upływie okresu przechowywania dane są usuwane lub trwale anonimizowane.</li>
              </ol>
            </Section>

            <Section title="§ 7. Dobrowolność podania danych">
              <p>
                Podanie danych osobowych jest dobrowolne, jednak niepodanie danych oznaczonych jako
                niezbędne może uniemożliwić założenie Konta, zawarcie i wykonanie umowy lub
                skorzystanie z określonych funkcji Platformy (w szczególności wypłat środków ze
                escrow, które wymagają danych identyfikacyjnych oraz weryfikacji KYC u dostawcy
                płatności).
              </p>
            </Section>

            <Section title="§ 8. Zmiany Polityki Prywatności">
              <p>
                Administrator zastrzega sobie prawo do zmiany niniejszej Polityki w przypadku zmiany
                przepisów prawa, wdrożenia nowych funkcji Platformy lub zmiany dostawców usług. O
                istotnych zmianach Użytkownicy zostaną poinformowani z co najmniej 14-dniowym
                wyprzedzeniem — poprzez komunikat na Platformie lub wiadomość e-mail.
              </p>
            </Section>

            <p className="text-xs text-muted-foreground pt-6 border-t border-border/40">
              Wszelkie pytania dotyczące ochrony danych osobowych i plików cookies prosimy kierować
              na adres:{" "}
              <a className="underline hover:text-foreground" href={`mailto:${OPERATOR_CONTACT}`}>
                {OPERATOR_CONTACT}
              </a>
              . Zobacz również{" "}
              <Link to="/regulamin" className="underline hover:text-foreground">
                Regulamin serwisu
              </Link>{" "}
              oraz{" "}
              <Link to="/help" className="underline hover:text-foreground">
                Centrum pomocy
              </Link>
              .
            </p>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
      <div className="text-sm sm:text-base text-muted-foreground space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_b]:text-foreground [&_a]:text-accent">
        {children}
      </div>
    </section>
  );
}
