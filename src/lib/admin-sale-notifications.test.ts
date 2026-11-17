import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const admin = "00000000-0000-0000-0000-000000000001";
const seller = "00000000-0000-0000-0000-000000000002";
const product = "00000000-0000-0000-0000-000000000003";
const db = new PGlite();

beforeAll(async () => {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    CREATE TYPE public.transaction_status AS ENUM ('pending','held','released','failed','disputed');
    CREATE TABLE public.user_roles (user_id uuid, role public.app_role);
    CREATE TABLE public.products (id uuid, title text);
    CREATE TABLE public.profiles (id uuid, display_name text, username text);
    CREATE TABLE public.notifications (user_id uuid, type text, title text, body text, link text, data jsonb);
    CREATE TABLE public.transactions (id uuid PRIMARY KEY, product_id uuid, seller_id uuid,
      amount numeric, seller_amount numeric, currency text, source text, stripe_env text,
      stripe_payment_intent_id text, status public.transaction_status);
    INSERT INTO public.user_roles VALUES ('${admin}', 'admin'), ('${seller}', 'user');
    INSERT INTO public.products VALUES ('${product}', 'E-book');
    INSERT INTO public.profiles VALUES ('${seller}', 'Twórca', 'tworca');
  `);
  await db.exec(readFileSync(new URL("../../drizzle/migrations/0020_admin_paid_sale_notifications.sql", import.meta.url), "utf8"));
}, 30000);
afterAll(async () => { await db.close(); });

let nextId = 10;
async function order(overrides: Record<string, unknown> = {}) {
  const id = `00000000-0000-0000-0000-${String(nextId++).padStart(12, "0")}`;
  const row = { id, product_id: product, seller_id: seller, amount: 56.91, seller_amount: 50,
    currency: "PLN", source: "purchase", stripe_env: "live", stripe_payment_intent_id: "pi_test", status: "pending", ...overrides };
  const keys = Object.keys(row);
  await db.query(`INSERT INTO public.transactions (${keys.join(",")}) VALUES (${keys.map((_, i) => `$${i + 1}`).join(",")})`, Object.values(row));
  return id;
}
async function alerts(id: string) {
  return (await db.query<{ user_id: string; data: { amount: number; seller_amount: number; currency: string } }>(
    "SELECT user_id, data FROM public.notifications WHERE data->>'transaction_id' = $1", [id])).rows;
}

describe("admin confirmed sale notifications", () => {
  it("notifies only the administrator with paid and seller amounts on confirmed sale", async () => {
    const id = await order();
    expect(await alerts(id)).toHaveLength(0);
    await db.query("UPDATE public.transactions SET status='held' WHERE id=$1", [id]);
    expect(await alerts(id)).toEqual([{ user_id: admin, data: expect.objectContaining({ amount: 56.91, seller_amount: 50, currency: "PLN" }) }]);
  });
  it("does not report failed or abandoned checkout", async () => {
    const id = await order();
    await db.query("UPDATE public.transactions SET status='failed' WHERE id=$1", [id]);
    expect(await alerts(id)).toHaveLength(0);
  });
  it("does not report free downloads", async () => {
    const id = await order({ amount: 0, seller_amount: 0, status: "held" });
    expect(await alerts(id)).toHaveLength(0);
  });
  it("does not report sandbox payments", async () => {
    const id = await order({ stripe_env: "sandbox", status: "held" });
    expect(await alerts(id)).toHaveLength(0);
  });
  it("does not report exchanges", async () => {
    const id = await order({ source: "exchange", status: "held" });
    expect(await alerts(id)).toHaveLength(0);
  });
  it("requires a confirmed payment identity", async () => {
    const id = await order({ stripe_payment_intent_id: null, status: "held" });
    expect(await alerts(id)).toHaveLength(0);
  });
  it("does not duplicate on retries, escrow release or repeated payment transitions", async () => {
    const id = await order({ status: "held" });
    for (const status of ["held", "released", "pending", "held"]) {
      await db.query("UPDATE public.transactions SET status=$1::public.transaction_status WHERE id=$2", [status, id]);
    }
    expect(await alerts(id)).toHaveLength(1);
  });
});