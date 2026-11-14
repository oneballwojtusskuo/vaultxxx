import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../../drizzle/migrations/0015_fix_recursive_admin_check.sql", import.meta.url),
  "utf8",
);

describe("administrator RLS recursion regression", () => {
  it("uses an owner-executed, caller-scoped role check instead of recursively reading user_roles", () => {
    expect(migration).toMatch(/SECURITY DEFINER/i);
    expect(migration).toMatch(/SET search_path = public/i);
    expect(migration).toMatch(/SELECT public\.has_role\(auth\.uid\(\), 'admin'::public\.app_role\)/);
    expect(migration).not.toMatch(/FROM\s+public\.user_roles/i);
  });

  it("keeps administrator checks authenticated-only", () => {
    expect(migration).toMatch(/REVOKE ALL ON FUNCTION public\.is_current_user_admin\(\) FROM PUBLIC, anon/);
    expect(migration).toMatch(/GRANT EXECUTE ON FUNCTION public\.is_current_user_admin\(\) TO authenticated, service_role/);
    expect(migration).not.toMatch(/GRANT[^;]+TO[^;]*\banon\b/i);
  });
});