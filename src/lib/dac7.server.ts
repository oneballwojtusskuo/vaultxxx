// Pure DAC7 / seller-tax-threshold calculation helpers. No DB access here.

/**
 * Approximate EUR -> PLN conversion used only to translate the DAC7 EU thresholds
 * (expressed in EUR) into PLN for display purposes. Not a live exchange rate.
 */
export const EUR_PLN = 4.3;

/** DAC7 reporting thresholds (EU-wide): platforms must report sellers who cross either. */
export const DAC7_TX_WARN = 25;
export const DAC7_TX_REQUIRED = 30;
export const DAC7_EUR_WARN = 1800;
export const DAC7_EUR_REQUIRED = 2000;
export const DAC7_PLN_WARN = DAC7_EUR_WARN * EUR_PLN;
export const DAC7_PLN_REQUIRED = DAC7_EUR_REQUIRED * EUR_PLN;

export type Dac7Level = "ok" | "warn" | "required";

export interface Dac7StatusResult {
  level: Dac7Level;
  txCount: number;
  grossPln: number;
  grossEur: number;
  pctTx: number;
  pctAmount: number;
}

/**
 * Determine a seller's DAC7 status for the current tax year based on the number
 * of completed sales and the gross amount received (in PLN).
 */
export function dac7Status(txCount: number, grossPln: number): Dac7StatusResult {
  const grossEur = grossPln / EUR_PLN;
  const pctTx = Math.min(100, Math.round((txCount / DAC7_TX_REQUIRED) * 100));
  const pctAmount = Math.min(100, Math.round((grossPln / DAC7_PLN_REQUIRED) * 100));

  let level: Dac7Level = "ok";
  if (txCount >= DAC7_TX_REQUIRED || grossPln >= DAC7_PLN_REQUIRED) {
    level = "required";
  } else if (txCount >= DAC7_TX_WARN || grossPln >= DAC7_PLN_WARN) {
    level = "warn";
  }

  return { level, txCount, grossPln, grossEur, pctTx, pctAmount };
}

/**
 * Quarterly limit for Polish "działalność nierejestrowana" (unregistered activity) — 2026 threshold.
 * Revenue collected by the platform's owner (commission) must not exceed this per calendar quarter.
 */
export const UNREGISTERED_ACTIVITY_QUARTERLY_LIMIT_PLN = 10813.5;
export const UNREGISTERED_ACTIVITY_WARN_PCT = 0.75;
export const UNREGISTERED_ACTIVITY_HIGH_PCT = 0.9;

export type OwnerThresholdLevel = "ok" | "warn" | "high" | "exceeded";

export interface OwnerThresholdStatus {
  level: OwnerThresholdLevel;
  quarterRevenuePln: number;
  limitPln: number;
  pct: number;
}

export function ownerThresholdStatus(quarterRevenuePln: number): OwnerThresholdStatus {
  const limitPln = UNREGISTERED_ACTIVITY_QUARTERLY_LIMIT_PLN;
  const pct = Math.min(999, Math.round((quarterRevenuePln / limitPln) * 100));

  let level: OwnerThresholdLevel = "ok";
  if (quarterRevenuePln >= limitPln) level = "exceeded";
  else if (quarterRevenuePln >= limitPln * UNREGISTERED_ACTIVITY_HIGH_PCT) level = "high";
  else if (quarterRevenuePln >= limitPln * UNREGISTERED_ACTIVITY_WARN_PCT) level = "warn";

  return { level, quarterRevenuePln, limitPln, pct };
}
