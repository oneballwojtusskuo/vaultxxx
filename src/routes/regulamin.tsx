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

import { SERVICE_LAUNCH_DATE, LEGAL_REVISION_DATE, formatLegalDate } from "@/lib/legal-dates";

const LAUNCH_DATE = formatLegalDate(SERVICE_LAUNCH_DATE);
const UPDATED_DATE = formatLegalDate(LEGAL_REVISION_DATE);

export const Route = createFileRoute("/regulamin")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Regulamin serwisu — vlnd" },
      {
        name: "description",
        content:
          "Regulamin platformy vlnd — marketplace cyfrowego z płatnościami powierniczymi (escrow). Warunki korzystania, prawa i obowiązki użytkowników, procedura Notice & Takedown i dostarczanie treści cyfrowych.",
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
            Start serwisu: {LAUNCH_DATE} r. Wersja dokumentu: {UPDATED_DATE} r. Kontakt:{" "}
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
              <p>Na potrzeby Regulaminu przyjmuje się następujące definicje:</p>
              <ul>
                <li>
                  <b>Operator</b> – {OPERATOR_NAME}, {OPERATOR_LEGAL_FORM}, adres do korespondencji:{" "}
                  {OPERATOR_ADDRESS}, kontakt e-mail i punkt kontaktowy DSA:{" "}
                  <a className="underline" href={`mailto:${OPERATOR_CONTACT}`}>
                    {OPERATOR_CONTACT}
                  </a>
                  {" "}– podmiot prowadzący Platformę VLND i administrator danych osobowych,
                  świadczący usługi pośrednictwa w rozumieniu Rozporządzenia (UE) 2022/2065
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
                  o prawach konsumenta, czyli dane wytwarzane i dostarczane w postaci cyfrowej,
                  oferowane bez nośnika materialnego (np. pliki PDF, e-booki, raporty, notatki, szablony,
                  pliki audio, graficzne i wideo).
                </li>
                <li>
                  <b>Umowa Sprzedaży</b> – umowa zawierana bezpośrednio pomiędzy Sprzedawcą a
                  Kupującym, której przedmiotem jest odpłatne dostarczenie Produktu Cyfrowego.
                </li>
                <li>
                  <b>Operator Płatności</b> – zewnętrzny, licencjonowany dostawca usług płatniczych
                  (m.in. Stripe Payments Europe Ltd. z siedzibą w Irlandii oraz podmioty z nim
                  współpracujące), obsługujący transakcje na Platformie oraz przechowujący środki na
                  saldzie w systemie płatności zgodnie z zasadami opisanymi w § 4;
                  nie oznacza to prowadzenia przez Platformę bankowego rachunku powierniczego.
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
                  Operator nie nabywa praw do Produktów Cyfrowych, nie jest ich sprzedawcą ani licencjodawcą w relacji cywilnoprawnej.
                  Nie wyłącza to obowiązków Operatora wynikających z bezwzględnie obowiązujących
                  przepisów, w tym ewentualnych obowiązków podatkowych dotyczących usług elektronicznych.
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
                  Serwis jest przeznaczony dla osób od <b>13 roku życia</b> (osoby małoletnie w
                  wieku 13–17 lat mogą korzystać z serwisu wyłącznie za zgodą rodzica lub opiekuna
                  prawnego).
                </li>
                <li>
                  Podczas rejestracji Użytkownik składa oświadczenie o ukończeniu 18 lat lub o
                  ukończeniu 13 lat i posiadaniu zgody rodzica/opiekuna prawnego. Operator
                  zastrzega sobie prawo do żądania okazania takiej zgody i do zablokowania Konta w
                  razie jej braku.
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
                  na <b>saldzie Operatora w systemie Stripe (depozyt – escrow)</b> do momentu
                  spełnienia warunku wydania środków.
                </li>
                <li>
                  Cena Produktu prezentowana w ogłoszeniu to kwota ustalona przez Sprzedawcę. Do
                  ceny tej doliczana jest <b>opłata serwisowa i realizacji płatności</b> ponoszona
                  przez Kupującego, obejmująca prowizję Platformy w wysokości <b>10%</b> ceny
                  Sprzedawcy oraz opłatę Operatora Płatności właściwą dla wybranej metody płatności
                  (BLIK: 1,6% + 1,00 PLN; karta płatnicza i Przelewy24: 1,9% + 1,00 PLN). Łączna
                  kwota do zapłaty wynosi: (cena Sprzedawcy × 1,10 + 1,00 PLN) / (1 − stawka
                  procentowa metody) i jest prezentowana Kupującemu przed złożeniem zamówienia, z
                  podziałem na cenę Produktu i opłatę serwisową. Sprzedawca otrzymuje 100% ustalonej
                  przez siebie ceny (pomniejszonej wyłącznie o ewentualną prowizję Partnera przy
                  sprzedaży z linku polecającego). Opłaty serwisowe nie podlegają zwrotowi, chyba że
                  dochodzi do zwrotu całej płatności na rzecz Kupującego.
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
                  <b>Wypłaty dla Sprzedawców (Stripe Connect).</b> Warunkiem wystawienia płatnego
                  Produktu Cyfrowego jest połączenie przez Sprzedawcę własnego konta w systemie
                  Stripe (Stripe Connect Express) i przejście weryfikacji tożsamości (KYC)
                  bezpośrednio u Operatora Płatności. Operator nie gromadzi numerów rachunków
                  bankowych Sprzedawców. Po zwolnieniu środków z depozytu (ust. 4) należna
                  Sprzedawcy kwota (cena netto pomniejszona o ewentualną prowizję Partnera) jest
                  automatycznie przekazywana na konto Stripe Sprzedawcy, a następnie wypłacana przez
                  Stripe na jego rachunek bankowy zgodnie z harmonogramem wypłat Stripe. Do relacji
                  Sprzedawcy ze Stripe stosuje się także Umowę o usługi z kontem połączonym Stripe
                  (Stripe Connected Account Agreement).
                </li>
                <li>
                  <b>Saldo afiliacyjne (Portfel Partnera).</b> Prowizja należna Partnerowi z tytułu
                  sprzedaży z linku polecającego nie jest wypłacana natychmiast — po zwolnieniu
                  środków z depozytu powiększa wewnętrzne saldo Partnera prowadzone przez Platformę,
                  a odpowiadające mu środki pozostają na rachunku Operatora w systemie Stripe.
                  Partner może zlecić wypłatę salda, gdy osiągnie ono co najmniej{" "}
                  <b>100,00 PLN</b>. Wypłata jest realizowana automatycznie, w całości dostępnego
                  salda, przelewem w systemie Stripe na połączone konto Stripe Partnera, skąd Stripe
                  przekazuje środki na jego rachunek bankowy. Wypłata wymaga połączenia i
                  zweryfikowania konta Stripe. Saldo nie jest oprocentowane i nie stanowi depozytu
                  bankowego ani pieniądza elektronicznego. W razie zwrotu środków Kupującemu lub
                  uznanego chargebacku przed zwolnieniem depozytu prowizja nie jest naliczana.
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
                  Operator prowadzi rejestr zgłoszeń i wykonuje obowiązki przejrzystości DSA
                  w zakresie, w którym mają do niego zastosowanie, z uwzględnieniem ustawowych
                  wyłączeń dla mikroprzedsiębiorstw i małych przedsiębiorstw.
                </li>
              </ol>
            </Section>

            <Section title="§ 6. Postępowanie reklamacyjne i spory (Escrow Dispute)">
              <ol>
                <li>
                  Kupujący uprawniony jest do zgłoszenia sporu w mechanizmie escrow („Zgłoś
                  problem”) w terminie do momentu automatycznego zwolnienia środków, wskazując
                  uzasadnienie (co najmniej 10 znaków). Termin technicznego sporu escrow nie
                  ogranicza ustawowych uprawnień do reklamacji ani dochodzenia roszczeń.
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
                  Konsument może skorzystać z pomocy miejskiego lub powiatowego rzecznika
                  konsumentów oraz właściwego podmiotu pozasądowego rozwiązywania sporów.
                  Informacje o uprawnionych podmiotach publikuje
                  {" "}<a className="underline" href="https://polubowne.uokik.gov.pl/" target="_blank" rel="noreferrer">UOKiK</a>.
                  Unijna platforma ODR została zamknięta 20 lipca 2025 r. i nie służy już
                  do składania skarg. Udział w postępowaniu pozasądowym odbywa się na zasadach
                  właściwych dla danego podmiotu i sporu.
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
                  Zgodnie z <b>art. 38 ust. 1 pkt 13 ustawy z dnia 30 maja 2014 r. o prawach konsumenta</b>
                  , Konsumentowi
                  <b> nie przysługuje prawo odstąpienia od umowy</b> zawartej na odległość, jeżeli
                  spełnianie świadczenia rozpoczęło się za wyraźną i uprzednią zgodą Konsumenta,
                  który został poinformowany przed rozpoczęciem świadczenia, że po jego spełnieniu
                  utraci prawo odstąpienia od umowy, i przyjął to do wiadomości, a przedsiębiorca
                  przekazał wymagane potwierdzenie zawarcia umowy oraz tej zgody na trwałym nośniku
                  zgodnie z art. 15 ust. 1 i 2 lub art. 21 ust. 1 ustawy. Brak któregokolwiek
                  z ustawowych warunków nie pozwala uznać prawa odstąpienia za utracone.
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

            <Section title="§ 8. Treści cyfrowe i obowiązki podatkowe">
              <ol>
                <li>
                  Platforma obsługuje wyłącznie dostarczanie gotowych treści cyfrowych drogą
                  elektroniczną, w szczególności plików PDF, e-booków, raportów i notatek. Nie pośredniczy
                  w sprzedaży rzeczy materialnych, ich wysyłce ani w zamawianiu indywidualnych
                  usług wykonywanych przez twórcę na zlecenie Kupującego. Dostarczenie Produktu
                  oznacza przyznanie dostępu do pliku lub treści, a nie fizycznej przesyłki.
                </li>
                <li>
                  Na gruncie VAT automatyczne dostarczanie plików przez internet przy minimalnym
                  udziale człowieka stanowi usługę świadczoną drogą elektroniczną, jeżeli spełnia
                  warunki art. 7 rozporządzenia wykonawczego Rady (UE) nr 282/2011. Nie zmienia to
                  kwalifikacji Produktu jako treści cyfrowej w prawie konsumenckim ani zasad licencji.
                </li>
                <li>
                  Dostarczanie gotowych plików cyfrowych nie jest sprzedażą towarów materialnych
                  w rozumieniu DAC7. Progi 30 transakcji lub 2 000 EUR dotyczące sprzedaży towarów
                  nie mają zastosowania do dostarczania takich plików ani do wypłat afiliacyjnych.
                  Kwalifikacja jako usługi elektronicznej dla VAT nie przesądza sama w sobie
                  o zakresie DAC7. Rozszerzenie Platformy o czynności objęte tymi przepisami,
                  w tym usługi wykonywane osobiście na zlecenie, wymaga odrębnej oceny prawnej.
                </li>
                <li>
                  Sprzedawca podaje prawdziwe i aktualne dane niezbędne do rozliczeń oraz wykonania
                  obowiązków wynikających z właściwych przepisów. Weryfikację tożsamości (KYC),
                  dane rachunku bankowego i dokumenty wymagane do wypłat przekazuje bezpośrednio
                  Stripe. Wymogi obsługi płatności są odrębne od raportowania DAC7 przez Platformę.
                </li>
                <li>
                  Sprzedawca odpowiada za rozliczenie należnych podatków (PIT, CIT, VAT) oraz
                  składek stosownie do prowadzonej działalności i uzyskiwanych przychodów.
                  Brak zastosowania progów DAC7 dla towarów nie oznacza zwolnienia z podatków.
                  Operator nie świadczy usług doradztwa podatkowego.
                </li>
                <li>
                  Partner uzyskujący przychody z afiliacji samodzielnie odpowiada za ich prawidłowe
                  rozliczenie podatkowe. Operator wykonuje własne obowiązki podatkowe, księgowe
                  i ewentualne obowiązki płatnika, jeżeli wynikają z właściwych przepisów prawa.
                  Dane transakcji i wypłat są przetwarzane na potrzeby rozliczeń, a nie na podstawie
                  progów raportowania sprzedaży rzeczy materialnych.
                </li>
                <li>
                  Partner ma obowiązek oznaczać treści promocyjne zgodnie z aktualnymi wytycznymi
                  UOKiK, jasno informując o komercyjnym charakterze rekomendacji i relacji afiliacyjnej.
                </li>
              </ol>
            </Section>

            <Section id="akcja-startowa" title="§ 9. Akcja dla pierwszych 30 twórców">
              <ol>
                <li>
                  Akcja obejmuje 30 twórców, których pierwszy Produkt Cyfrowy uzyska status
                  opublikowany po przejściu weryfikacji. O kolejności decyduje moment nadania tego
                  statusu. Przysługuje jedno miejsce na twórcę, niezależnie od liczby Produktów
                  Cyfrowych; Operator może wykluczyć dodatkowe Konta tej samej osoby.
                </li>
                <li>
                  Nagrodą jest trwały numer miejsca, wyróżnienie profilu i wybranego Produktu
                  Cyfrowego na stronie głównej oraz jednorazowa bezpłatna promocja na profilu vlnd
                  w serwisie Instagram. Formę i termin publikacji promocji Operator ustala z twórcą;
                  promocja nie obejmuje płatnego zasięgu i nie gwarantuje sprzedaży.
                </li>
                <li>
                  Numer miejsca nie przechodzi na inną osobę i nie jest ponownie przyznawany.
                  Publiczne wyróżnienie wymaga aktywnego Konta i co najmniej jednego opublikowanego
                  Produktu Cyfrowego. Usunięcie Konta lub Produktu Cyfrowego, albo naruszenie
                  Regulaminu, może zakończyć publiczne wyróżnienie bez prawa do ekwiwalentu.
                </li>
                <li>
                  Nagroda nie ma formy pieniężnej, nie podlega wypłacie ani wymianie i nie zmienia
                  zasad opłat, prowizji lub afiliacji. Po zajęciu wszystkich miejsc akcja zostanie
                  zamknięta, a miejsca już przyznane zachowają swój numer.
                </li>
              </ol>
            </Section>

            <Section title="§ 10. Dane osobowe i pliki cookies">
              <ol>
                <li>
                  Administratorem danych osobowych Użytkowników jest Operator. Szczegółowe
                  informacje dotyczące przetwarzania danych osobowych zawarte są w{" "}
                  <b>Polityce Prywatności</b> stanowiącej odrębny dokument.
                </li>
                <li>
                  Platforma wykorzystuje cookies i pamięć przeglądarki, w tym cookies programu partnerskiego
                  (afiliacja) o okresie ważności do 30 dni, na zasadach opisanych w Polityce
                  Cookies.
                </li>
              </ol>
            </Section>

            <Section title="§ 11. Zmiany Regulaminu. Postanowienia końcowe">
              <ol>
                <li>
                  Operator zastrzega sobie prawo do zmiany Regulaminu z ważnych przyczyn (zmiana
                  przepisów prawa, zmiana funkcjonalności Serwisu, zmiana modelu rozliczeń). O
                  zmianach Użytkownicy zostaną poinformowani z co najmniej 14-dniowym wyprzedzeniem.
                </li>
                <li>
                  W sprawach nieuregulowanych Regulaminem zastosowanie mają w szczególności: Kodeks
                  cywilny, ustawa o prawach konsumenta, ustawa o świadczeniu usług drogą
                  elektroniczną, ustawa z dnia 12 lipca 2024 r. — Prawo komunikacji elektronicznej
                  (w szczególności art. 398 i 399, obowiązujące od 10 listopada 2024 r.), RODO, DSA, ustawa o prawie autorskim i prawach pokrewnych oraz
                  właściwe przepisy podatkowe.
                </li>
                <li>
                  Prawem właściwym jest prawo polskie. Sądem właściwym dla sporów z Użytkownikami
                  niebędącymi Konsumentami jest sąd właściwy miejscowo dla siedziby Operatora.
                </li>
                <li>
                  Serwis rozpoczął działalność {LAUNCH_DATE} r. Niniejsza wersja dokumentu została
                  opracowana {UPDATED_DATE} r.; data startu serwisu nie jest datą wejścia w życie
                  nowych obowiązków. Zmiany warunków umownych stosuje się z zachowaniem wymaganego
                  zawiadomienia i terminów wskazanych powyżej, bez działania wstecz.
                </li>
              </ol>
            </Section>

            <p className="text-xs text-muted-foreground pt-6 border-t border-border/40">
              Kontakt w sprawach związanych z Regulaminem, zgłoszeniami DSA (Notice &amp; Takedown),
              dostarczaniem treści cyfrowych oraz reklamacjami:{" "}
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

function Section({ id, title, children }: { id?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">{title}</h2>
      <div className="text-sm sm:text-base text-muted-foreground space-y-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_b]:text-foreground [&_a]:text-accent">
        {children}
      </div>
    </section>
  );
}
