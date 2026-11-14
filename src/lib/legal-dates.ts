// Launch and revision dates are distinct; neither backdates amended obligations.
export const SERVICE_LAUNCH_DATE = "2026-11-06";
export const LEGAL_REVISION_DATE = "2026-11-14";

export function formatLegalDate(value: string) {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}