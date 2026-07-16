import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-for-user";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search published products on the VaultX marketplace. Returns id, title, price, currency, tags, and seller id. Filter by a text query matched against title/description, or by tag.",
  inputSchema: {
    query: z.string().trim().max(200).optional().describe("Free-text search matched against title and description."),
    tag: z.string().trim().max(60).optional().describe("Filter by a single tag."),
    limit: z.number().int().min(1).max(50).default(20).describe("Max results (1-50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, tag, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("products")
      .select("id,title,description,price,currency,tags,seller_id,created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (tag) q = q.contains("tags", [tag]);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
