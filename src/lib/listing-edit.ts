import { z } from "zod";
import { validatePrice } from "./pricing-rules";
import { isSellerFile } from "./access-security";

export const listingEditSchema = z.object({
  productId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(20000),
  price: z.number().finite().max(1000000).refine((value) => !validatePrice(value), "Niepoprawna cena"),
  category_id: z.string().uuid(),
  custom_category: z.string().trim().max(60).nullable(),
  tags: z.array(z.string().trim().max(100)).max(50),
  is_tradable: z.boolean(),
  affiliate_commission_pct: z.number().int().min(0).max(50),
  preview_url: z.string().url(),
  sample_url: z.string().url().nullable(),
  file_paths: z.array(z.string().min(1).max(1000)).min(1).max(50),
  license_terms: z.record(z.string(), z.union([z.string().max(20000), z.boolean(), z.number().finite(), z.null()])),
}).strict();

export function assertListingOwner(sellerId: string, userId: string) {
  if (sellerId !== userId) throw new Error("Możesz edytować tylko własne ogłoszenia.");
}

export function assertListingFiles(paths: string[], userId: string) {
  if (paths.some((path) => !isSellerFile(path, userId))) throw new Error("Nieprawidłowy plik produktu.");
}

export function needsListingReview(previous: Record<string, unknown>, next: Record<string, unknown>) {
  return ["title", "description", "category_id", "custom_category", "tags", "preview_url", "sample_url", "file_paths", "license_terms"]
    .some((key) => stableValue(previous[key]) !== stableValue(next[key]));
}

function stableValue(value: unknown): string {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))));
  }
  return JSON.stringify(value ?? null);
}