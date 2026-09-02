/**
 * Prosty filtr wulgaryzmów (PL/EN) używany przy nazwach użytkownika,
 * opisach profilu oraz danych do wypłaty.
 */

const BASE_WORDS = [
  // PL
  "kurwa",
  "kurwy",
  "chuj",
  "chuja",
  "chuje",
  "chujc",
  "huj",
  "pizda",
  "pizdy",
  "jebac",
  "jebać",
  "jebany",
  "jebana",
  "jebane",
  "pierdol",
  "pierdole",
  "pierdolony",
  "spierdalaj",
  "wypierdalaj",
  "skurwysyn",
  "kutas",
  "cipa",
  "cipka",
  "dupek",
  "debil",
  "idiota",
  "zjeb",
  "zajebisty",
  "pedal",
  "pedał",
  "cwel",
  "szmata",
  "dziwka",
  "kurewsk",
  "gowno",
  "gówno",
  "srac",
  "srać",
  "napierdal",
  // EN
  "fuck",
  "fucking",
  "fucker",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "cunt",
  "asshole",
  "dick",
  "pussy",
  "whore",
  "slut",
  "bastard",
  "nigger",
  "nigga",
  "faggot",
  "rape",
  "retard",
];

const LEET_MAP: Record<string, string> = {
  "0": "o",
  "1": "i",
  "!": "i",
  "3": "e",
  "4": "a",
  "@": "a",
  "5": "s",
  $: "s",
  "7": "t",
  "8": "b",
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .split("")
    .map((c) => LEET_MAP[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]/g, "");
}

/** Zwraca true, jeśli tekst zawiera wulgaryzm. */
export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  const n = normalize(text);
  if (!n) return false;
  return BASE_WORDS.some((w) => n.includes(normalize(w)));
}

/**
 * Waliduje nazwę użytkownika: 3–20 znaków, tylko a-z, 0-9 i "_",
 * bez wulgaryzmów. Zwraca komunikat błędu albo null.
 */
export function validateUsername(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.length < 3) return "Nazwa użytkownika musi mieć co najmniej 3 znaki.";
  if (v.length > 20) return "Nazwa użytkownika może mieć maksymalnie 20 znaków.";
  if (!/^[a-z0-9_]+$/.test(v)) return "Dozwolone są tylko małe litery, cyfry i podkreślnik.";
  if (!/[a-z0-9]/.test(v)) return "Nazwa musi zawierać litery lub cyfry.";
  if (containsProfanity(v)) return "Ta nazwa użytkownika zawiera niedozwolone słowa. Wybierz inną.";
  return null;
}

/** Waliduje dowolny tekst wpisywany przez użytkownika (opis, imię i nazwisko). */
export function validateCleanText(raw: string, label = "To pole"): string | null {
  if (containsProfanity(raw)) return `${label} zawiera niedozwolone słowa.`;
  return null;
}
