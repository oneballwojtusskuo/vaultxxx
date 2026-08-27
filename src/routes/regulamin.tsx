import { createFileRoute, Link } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import {
  OPERATOR_NAME,
  OPERATOR_LEGAL_FORM,
  OPERATOR_ADDRESS,
  OPERATOR_CONTACT,
} from "@/lib/operator";

const EFFECTIVE_DATE = "1 stycznia 2026 r.";

export const Route = createFileRoute("/regulamin")({
  head: () => ({
    meta: [
      { title: "Regulamin serwisu — vlnd" },
      {
        name: "description",
        content:
          "Regulamin platformy vlnd — marketplace cyfrowego z płatnościami powierniczymi (escrow). Warunki korzystania, prawa i obowiązki użytkowników, procedura Notice & Takedown, DAC7.",
      },
      { property: "og:title", content: "Regulamin serwisu — vlnd" },
      {
        property: "og:description",
        content:
          "Pełny regulamin korzystania z platformy vlnd wraz z zapisami zgodnymi z DSA, RODO i ustawą o prawach konsumenta.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegulaminPage,
});

function RegulaminPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
              <ScrollText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="font-display text-3xl font-bold">Regulamin serwisu vlnd</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-10">
            Obowiązuje od dnia {EFFECTIVE_DATE}. Kontakt:{" "}
            <a className="underline hover:text-foreground" href={`mailto:${OPERATOR_CONTACT}`}>
              {OPERATOR_CONTACT}
            </a>
            .
          </p>

          <article className="prose prose-invert prose-sm sm:prose-base max-w-none space-y-8 leading-relaxed">
            <Section title="§ 1. Postanowienia ogólne i definicje">
              <p>
                Niniejszy Regulamin (dalej: <b>„Regulamin”</b>) określa zasady świadczenia usług
                drogą elektroniczną przez operatora platformy internetowej VLND dostępnej pod domeną
                vlnd.pl (dalej: <b>„Platforma”</b> lub <b>„Serwis”</b>), w szczególności zasady
                zawierania i wykonywania umów pomiędzy jej Użytkownikami oraz warunki obsługi
                płatności w modelu powierniczym (escrow).
              </p>
              <p>
                <b>Operator Platformy VLND oraz Administrator Danych Osobowych:</b> {OPERATOR_NAME},{" "}
                {OPERATOR_LEGAL_FORM}.<br />
                Adres do korespondencji: {OPERATOR_ADDRESS}.<br />
                Kontakt e-mail:{" "}
                <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                  {OPERATOR_CONTACT}
                </a>
                .
              </p>
              <p>Na potrzeby Regulaminu przyjmuje się następujące definicje:</p>
              <ul>
                <li>
                  <b>Operator</b> – {OPERATOR_NAME}, {OPERATOR_LEGAL_FORM}, adres do korespondencji:{" "}
                  {OPERATOR_ADDRESS}, e-mail: {OPERATOR_CONTACT} – podmiot prowadzący Platformę
                  VLND, świadczący usługi pośrednictwa w rozumieniu Rozporządzenia (UE) 2022/2065
                  (Digital Services Act, „DSA”).
                </li>
                <li>
                  <b>Użytkownik</b> – każda osoba fizyczna, prawna lub jednostka organizacyjna
                  korzystająca z Platformy.
                </li>
                <li>
                  <b>Konsument</b> – Użytkownik będący konsumentem w rozumieniu art. 22¹ Kodeksu
                  cywilnego.
                </li>
                <li>
                  <b>Sprzedawca</b> – Użytkownik oferujący do sprzedaży Produkty Cyfrowe za
                  pośrednictwem Platformy.
                </li>
                <li>
                  <b>Kupujący</b> – Użytkownik nabywający Produkt Cyfrowy od Sprzedawcy.
                </li>
                <li>
                  <b>Produkt Cyfrowy</b> – treść cyfrowa w rozumieniu ustawy z dnia 30 maja 2014 r.
                  o prawach konsumenta, oferowana przez Sprzedawcę (np. pliki audio, graficzne,
                  wideo, dokumenty, kod źródłowy, szablony, presety, projekty).
                </li>
                <li>
                  <b>Umowa Sprzedaży</b> – umowa zawierana bezpośrednio pomiędzy Sprzedawcą a
                  Kupującym, której przedmiotem jest odpłatne dostarczenie Produktu Cyfrowego.
                </li>
                <li>
                  <b>Operator Płatności</b> – zewnętrzny, licencjonowany dostawca usług płatniczych
                  (m.in. Stripe Payments Europe Ltd. z siedzibą w Irlandii oraz podmioty z nim
                  współpracujące), obsługujący transakcje na Platformie oraz przechowujący środki na
                  rachunku powierniczym.
                </li>
                <li>
                  <b>Escrow</b> – mechanizm depozytu, w którym środki Kupującego są blokowane u
                  Operatora Płatności do czasu potwierdzenia prawidłowego wykonania Umowy Sprzedaży
                  przez Kupującego.
                </li>
              </ul>
            </Section>

            <Section title="§ 2. Rola Platformy i podział odpowiedzialności">
              <ol>
                <li>
                  Platforma stanowi wyłącznie <b>infrastrukturę technologiczną</b> umożliwiającą
                  Sprzedawcom prezentację Produktów Cyfrowych, a Kupującym ich nabycie. Operator
                  działa jako <b>pośrednik</b>
                  (dostawca usługi hostingu i platformy internetowej w rozumieniu art. 6 DSA) i nie
                  jest stroną Umowy Sprzedaży.
                </li>
                <li>
                  Umowa Sprzedaży zawierana jest bezpośrednio pomiędzy Sprzedawcą a Kupującym.
                  Operator nie nabywa praw do Produktów Cyfrowych, nie jest ich sprzedawcą, dostawcą
                  ani licencjodawcą.
                </li>
                <li>
                  W zakresie dopuszczonym przez bezwzględnie obowiązujące przepisy prawa Operator{" "}
                  <b>nie ponosi odpowiedzialności</b> za:
                  <ul>
                    <li>
                      jakość, kompletność, przydatność do określonego celu oraz wady jawne i ukryte
                      Produktów Cyfrowych;
                    </li>
                    <li>
                      legalność Produktów Cyfrowych, w szczególności naruszenie przez Sprzedawcę
                      praw autorskich, praw pokrewnych, praw własności przemysłowej lub dóbr
                      osobistych osób trzecich;
                    </li>
                    <li>
                      prawdziwość oświadczeń, opisów, tagów, próbek oraz metadanych zamieszczanych
                      przez Sprzedawców;
                    </li>
                    <li>
                      nienależyte wykonanie lub niewykonanie Umowy Sprzedaży przez którąkolwiek z
                      jej stron;
                    </li>
                    <li>skutki podatkowe transakcji po stronie Sprzedawcy i Kupującego.</li>
                  </ul>
                </li>
                <li>
                  Operator nie prowadzi ogólnego monitoringu treści zamieszczanych przez
                  Użytkowników. Zgodnie z art. 8 DSA na Operatorze nie spoczywa ogólny obowiązek
                  nadzoru ani aktywnego poszukiwania faktów wskazujących na nielegalną działalność.
                </li>
                <li>
                  Odpowiedzialność Operatora wobec Użytkowników niebędących Konsumentami ograniczona
                  jest do szkody rzeczywistej (damnum emergens) i nie obejmuje utraconych korzyści
                  (lucrum cessans).
                </li>
              </ol>
            </Section>

            <Section title="§ 3. Rejestracja i warunki korzystania. Wiek Użytkowników">
              <ol>
                <li>
                  Korzystanie z podstawowych funkcji przeglądania Platformy nie wymaga rejestracji.
                  Zakup, sprzedaż, wymiana Produktów Cyfrowych oraz korzystanie z funkcji
                  społecznościowych wymaga założenia Konta.
                </li>
                <li>
                  Konto może założyć osoba, która ukończyła <b>16. rok życia</b> (zgodnie z art. 8
                  RODO oraz art. 4 ust. 1 ustawy z dnia 10 maja 2018 r. o ochronie danych
                  osobowych).
                </li>
                <li>
                  Rejestracja i korzystanie z Platformy przez osobę, która ukończyła 13. rok życia,
                  a nie ukończyła 16. roku życia, wymaga{" "}
                  <b>wyraźnej zgody rodzica lub opiekuna prawnego</b>. Operator zastrzega sobie
                  prawo do żądania okazania takiej zgody i do zablokowania Konta w razie jej braku.
                </li>
                <li>
                  Konta osób, które nie ukończyły 13. roku życia, są zabronione i będą usuwane
                  niezwłocznie po powzięciu wiarygodnej informacji.
                </li>
                <li>
                  Użytkownik zobowiązuje się do korzystania z Platformy zgodnie z prawem, dobrymi
                  obyczajami i Regulaminem, w szczególności do niezamieszczania treści bezprawnych,
                  obraźliwych, dyskryminujących, pornograficznych z udziałem osób małoletnich,
                  propagujących przemoc lub nienawiść.
                </li>
                <li>
                  Operator zastrzega sobie prawo do{" "}
                  <b>zablokowania lub trwałego usunięcia Konta bez odszkodowania</b>
                  oraz do wstrzymania wypłat środków w przypadku:
                  <ul>
                    <li>naruszenia postanowień Regulaminu lub przepisów prawa;</li>
                    <li>
                      uzasadnionego podejrzenia oszustwa, prania pieniędzy lub finansowania
                      terroryzmu;
                    </li>
                    <li>podania nieprawdziwych danych identyfikacyjnych;</li>
                    <li>zgłoszenia treści jako nielegalnych zgodnie z procedurą § 5.</li>
                  </ul>
                </li>
              </ol>
            </Section>

            <Section title="§ 4. Mechanizm płatności Escrow i Operator Płatności">
              <ol>
                <li>
                  Wszelkie płatności na Platformie procesowane są wyłącznie przez zewnętrznego,{" "}
                  <b>licencjonowanego Operatora Płatności</b> (Stripe Payments Europe Ltd.; w
                  przyszłości dopuszczalne są dodatkowo PayU S.A., Przelewy24 – DialCom24 sp. z
                  o.o.). Operator nie przechowuje danych kart płatniczych Użytkowników.
                </li>
                <li>
                  Środki Kupującego są pobierane w chwili zawarcia Umowy Sprzedaży i przechowywane
                  na <b>rachunku powierniczym (escrow)</b> Operatora Płatności do momentu spełnienia
                  warunku wydania środków.
                </li>
                <li>
                  Cena widoczna dla Kupującego zawiera ustaloną przez Sprzedawcę kwotę netto oraz
                  doliczoną prowizję Platformy w wysokości <b>10%</b> ceny netto Sprzedawcy.
                  Dodatkowe opłaty Operatora Płatności (opłaty przetwarzania) mogą pomniejszać kwotę
                  do wypłaty zgodnie z jego cennikiem.
                </li>
                <li>
                  Zwolnienie środków na rzecz Sprzedawcy następuje po{" "}
                  <b>potwierdzeniu odbioru Produktu Cyfrowego przez Kupującego</b> (funkcja
                  „Potwierdź odbiór i zwolnij środki”) lub – jeżeli Kupujący w ciągu 24 godzin od
                  udostępnienia Produktu nie potwierdzi odbioru ani nie zgłosi problemu –
                  automatycznie po upływie tego terminu. Po zgłoszeniu sporu środki pozostają w
                  depozycie bez ograniczenia czasowego do czasu rozstrzygnięcia.
                </li>
                <li>
                  Operator zastrzega sobie prawo do <b>wstrzymania wypłaty środków Sprzedawcy</b>, w
                  tym do utrzymania środków w depozycie escrow, w szczególności w przypadku:
                  <ul>
                    <li>zgłoszenia sporu (dispute) przez Kupującego zgodnie z § 6;</li>
                    <li>
                      uzasadnionego podejrzenia naruszenia prawa, w tym prawa autorskiego lub
                      własności intelektualnej;
                    </li>
                    <li>zgłoszenia chargeback lub innej reklamacji u Operatora Płatności;</li>
                    <li>
                      wpłynięcia urzędowego żądania organu państwowego (sądu, prokuratury, KAS,
                      UODO).
                    </li>
                  </ul>
                </li>
                <li>
                  W przypadku uznania sporu na korzyść Kupującego środki są zwracane w całości na
                  jego rzecz. Rozliczenie prowizji Platformy w takim wypadku nie następuje.
                </li>
                <li>
                  Sprzedawca przyjmuje do wiadomości, że rzeczywiste terminy uznania środków na jego
                  rachunku bankowym zależą od Operatora Płatności i mogą wynosić od 2 do 14 dni
                  roboczych.
                </li>
              </ol>
            </Section>

            <Section title="§ 5. Prawa autorskie. Procedura Notice &amp; Takedown (DSA)">
              <ol>
                <li>
                  Sprzedawca oświadcza i gwarantuje, że posiada{" "}
                  <b>pełnię majątkowych praw autorskich</b> do oferowanych Produktów Cyfrowych albo
                  dysponuje <b>ważnymi licencjami</b> uprawniającymi go do ich odpłatnej dystrybucji
                  na warunkach oferowanych w Serwisie, w tym do udzielania sublicencji Kupującym w
                  zakresie wybranego typu licencji (Personal, Commercial, Extended itp.).
                </li>
                <li>
                  Sprzedawca ponosi <b>wyłączną odpowiedzialność</b> za naruszenia praw autorskich,
                  praw pokrewnych, praw do znaków towarowych, wizerunku lub dóbr osobistych osób
                  trzecich wynikające z zamieszczonych przez niego treści. Sprzedawca zobowiązuje
                  się <b>zwolnić Operatora z odpowiedzialności</b> i pokryć wszelkie koszty (w tym
                  koszty obsługi prawnej i zasądzonych roszczeń) w związku z takimi naruszeniami.
                </li>
                <li>
                  Zgodnie z art. 16 DSA Operator udostępnia procedurę zgłaszania treści potencjalnie
                  nielegalnych (<b>Notice &amp; Takedown</b>). Zgłoszenia można kierować:
                  <ul>
                    <li>
                      za pośrednictwem formularza „Zgłoś” dostępnego przy każdym Produkcie Cyfrowym;
                    </li>
                    <li>
                      na adres e-mail:{" "}
                      <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                        {OPERATOR_CONTACT}
                      </a>
                      .
                    </li>
                  </ul>
                </li>
                <li>
                  Wiarygodne zgłoszenie powinno zawierać: (a) wskazanie kwestionowanej treści (URL),
                  (b) uzasadnienie bezprawności, (c) dane kontaktowe zgłaszającego, (d) oświadczenie
                  o działaniu w dobrej wierze oraz o prawdziwości informacji.
                </li>
                <li>
                  Operator, po otrzymaniu wiarygodnej wiadomości o nielegalnym charakterze treści,{" "}
                  <b>niezwłocznie blokuje do niej dostęp lub ją usuwa</b>. Do momentu otrzymania
                  takiego zgłoszenia Operator korzysta z wyłączenia odpowiedzialności przewidzianego
                  w art. 6 DSA (tzw. safe harbor).
                </li>
                <li>
                  Sprzedawca, którego treść została usunięta lub zablokowana, otrzymuje uzasadnienie
                  decyzji i ma prawo złożyć <b>odwołanie</b> w terminie 14 dni na adres{" "}
                  {OPERATOR_CONTACT}.
                </li>
                <li>
                  W razie stwierdzenia zamieszczania treści{" "}
                  <b>
                    nielegalnych, skradzionych, naruszających prawa osób trzecich lub uzyskanych z
                    naruszeniem prawa
                  </b>
                  , Operator uprawniony jest do:
                  <ul>
                    <li>
                      natychmiastowego, trwałego usunięcia Konta Sprzedawcy bez prawa do
                      odszkodowania;
                    </li>
                    <li>
                      naliczenia kary umownej w wysokości do 200% wartości kwestionowanych
                      transakcji, nie mniej niż 500 zł za każdy przypadek naruszenia, z prawem do
                      dochodzenia odszkodowania przewyższającego wysokość kary umownej;
                    </li>
                    <li>
                      zawiadomienia właściwych organów ścigania oraz uprawnionego (posiadacza praw).
                    </li>
                  </ul>
                </li>
                <li>
                  Operator prowadzi wewnętrzny rejestr zgłoszeń oraz publikuje raporty
                  przejrzystości zgodnie z art. 15 i 24 DSA.
                </li>
              </ol>
            </Section>

            <Section title="§ 6. Postępowanie reklamacyjne i spory (Escrow Dispute)">
              <ol>
                <li>
                  Kupujący uprawniony jest do zgłoszenia sporu w mechanizmie escrow („Zgłoś
                  problem”) w terminie do momentu automatycznego zwolnienia środków, wskazując
                  uzasadnienie (co najmniej 10 znaków).
                </li>
                <li>
                  Po zgłoszeniu sporu środki pozostają w depozycie do czasu polubownego
                  rozstrzygnięcia sporu pomiędzy Sprzedawcą a Kupującym albo decyzji Operatora
                  działającego jako mediator.
                </li>
                <li>
                  Reklamacje dotyczące funkcjonowania Platformy (a nie treści Produktów Cyfrowych)
                  należy kierować na adres {OPERATOR_CONTACT}. Operator rozpatruje reklamację w
                  terminie 14 dni.
                </li>
                <li>
                  Konsument może skorzystać z pozasądowych sposobów rozpatrywania reklamacji i
                  dochodzenia roszczeń, w szczególności platformy ODR pod adresem{" "}
                  <a
                    className="underline"
                    href="https://ec.europa.eu/consumers/odr"
                    target="_blank"
                    rel="noreferrer"
                  >
                    https://ec.europa.eu/consumers/odr
                  </a>
                  .
                </li>
              </ol>
            </Section>

            <Section title="§ 7. Prawo konsumenckie. Utrata prawa odstąpienia od umowy">
              <ol>
                <li>
                  Umowa Sprzedaży dotyczy dostarczenia treści cyfrowej niedostarczanej na nośniku
                  materialnym.
                </li>
                <li>
                  Zgodnie z <b>art. 38 pkt 13 ustawy z dnia 30 maja 2014 r. o prawach konsumenta</b>
                  , Konsumentowi
                  <b> nie przysługuje prawo odstąpienia od umowy</b> zawartej na odległość, jeżeli
                  spełnianie świadczenia rozpoczęło się za wyraźną i uprzednią zgodą Konsumenta,
                  który został poinformowany przed rozpoczęciem świadczenia, że po jego spełnieniu
                  utraci prawo odstąpienia od umowy, i przyjął to do wiadomości.
                </li>
                <li>
                  Składając zamówienie i zaznaczając odpowiednie oświadczenie w procesie zakupowym,
                  Kupujący będący Konsumentem <b>wyraża wyraźną i uprzednią zgodę</b> na rozpoczęcie
                  spełniania świadczenia (udostępnienie do pobrania lub odtwarzania Produktu
                  Cyfrowego) przed upływem 14-dniowego terminu na odstąpienie od umowy oraz{" "}
                  <b>przyjmuje do wiadomości utratę prawa odstąpienia</b>.
                </li>
                <li>
                  Powyższe nie wyłącza uprawnień Konsumenta z tytułu niezgodności treści cyfrowej z
                  umową wynikających z rozdziału 5b ustawy o prawach konsumenta (implementacja
                  dyrektywy 2019/770).
                </li>
              </ol>
            </Section>

            <Section title="§ 8. Obowiązki podatkowe. Dyrektywa DAC7">
              <ol>
                <li>
                  Sprzedawca zobowiązany jest podać{" "}
                  <b>prawdziwe i aktualne dane identyfikacyjne i podatkowe</b>, w tym: imię i
                  nazwisko lub firmę, adres, numer PESEL lub NIP (a w przypadku podmiotów
                  zagranicznych – odpowiedni numer identyfikacji podatkowej TIN oraz VAT-UE, jeżeli
                  dotyczy) oraz numer rachunku bankowego do wypłat.
                </li>
                <li>
                  Zgodnie z <b>Dyrektywą Rady (UE) 2021/514 („DAC7”)</b> oraz ustawą z dnia 23 maja
                  2024 r. wdrażającą DAC7 do polskiego porządku prawnego, Operator jako operator
                  platformy cyfrowej jest zobowiązany do gromadzenia, weryfikacji i{" "}
                  <b>
                    corocznego przekazywania Szefowi Krajowej Administracji Skarbowej informacji o
                    Sprzedawcach
                  </b>{" "}
                  podlegających raportowaniu, w tym o wysokości uzyskanego wynagrodzenia.
                </li>
                <li>
                  Sprzedawca zobowiązany jest do współpracy z Operatorem w zakresie weryfikacji
                  danych oraz do ich niezwłocznej aktualizacji. Odmowa podania wymaganych danych po
                  dwóch wezwaniach skutkuje
                  <b> zablokowaniem możliwości wypłat</b> oraz – zgodnie z ustawą DAC7 – może
                  skutkować zamknięciem Konta.
                </li>
                <li>
                  Sprzedawca ponosi <b>wyłączną odpowiedzialność</b> za rozliczenie należnych
                  podatków (PIT, CIT, VAT) oraz składek z tytułu prowadzonej działalności lub
                  uzyskanych przychodów. Operator nie świadczy usług doradztwa podatkowego.
                </li>
                <li>
                  Użytkownik uzyskujący przychody z programu partnerskiego (afiliacyjnego)
                  samodzielnie odpowiada za ich prawidłowe rozliczenie w zeznaniu podatkowym i wobec
                  właściwego urzędu skarbowego. Operator nie rozlicza za Użytkownika PIT, CIT, VAT
                  ani innych należności publicznoprawnych.
                </li>
                <li>
                  Partner korzystający z wygenerowanych linków afiliacyjnych ma obowiązek oznaczać
                  treści promocyjne zgodnie z aktualnymi wytycznymi UOKiK, w szczególności jasno
                  informować o komercyjnym charakterze rekomendacji i relacji afiliacyjnej.
                </li>
                <li>
                  Operator gromadzi dane o wypłatach z programu partnerskiego i może raportować je
                  zgodnie z DAC7. Raportowanie może dotyczyć Użytkownika, który w roku kalendarzowym
                  otrzyma co najmniej 30 wypłat lub którego łączna kwota wypłat przekroczy
                  równowartość 2 000 EUR, około 8 500–9 000 zł.
                </li>
              </ol>
            </Section>

            <Section title="§ 9. Dane osobowe i pliki cookies">
              <ol>
                <li>
                  Administratorem danych osobowych Użytkowników jest Operator. Szczegółowe
                  informacje dotyczące przetwarzania danych osobowych zawarte są w{" "}
                  <b>Polityce Prywatności</b> stanowiącej odrębny dokument.
                </li>
                <li>
                  Platforma wykorzystuje pliki cookies, w tym cookies programu partnerskiego
                  (afiliacja) o okresie ważności do 30 dni, na zasadach opisanych w Polityce
                  Cookies.
                </li>
              </ol>
            </Section>

            <Section title="§ 10. Zmiany Regulaminu. Postanowienia końcowe">
              <ol>
                <li>
                  Operator zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn (zmiana
                  przepisów prawa, zmiana funkcjonalności Serwisu, zmiana modelu rozliczeń). O
                  zmianach Użytkownicy zostaną poinformowani z co najmniej 14-dniowym wyprzedzeniem.
                </li>
                <li>
                  W sprawach nieuregulowanych Regulaminem zastosowanie mają w szczególności: Kodeks
                  cywilny, ustawa o prawach konsumenta, ustawa o świadczeniu usług drogą
                  elektroniczną, RODO, DSA, DAC7, ustawa o prawie autorskim i prawach pokrewnych.
                </li>
                <li>
                  Prawem właściwym jest prawo polskie. Sądem właściwym dla sporów z Użytkownikami
                  niebędącymi Konsumentami jest sąd właściwy miejscowo dla siedziby Operatora.
                </li>
                <li>Regulamin wchodzi w życie z dniem {EFFECTIVE_DATE}.</li>
              </ol>
            </Section>

            <p className="text-xs text-muted-foreground pt-6 border-t border-border/40">
              Kontakt w sprawach związanych z Regulaminem, zgłoszeniami DSA (Notice &amp; Takedown),
              obowiązkami DAC7 oraz reklamacjami:{" "}
              <a className="underline hover:text-foreground" href={`mailto:${OPERATOR_CONTACT}`}>
                {OPERATOR_CONTACT}
              </a>
              . Zobacz również{" "}
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
