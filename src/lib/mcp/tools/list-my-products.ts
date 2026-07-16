import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-for-user";

export default defineTool({
  name: "list_my_products",
  title: "List my products",
  description: "List products owned by the signed-in seller, optionally filtered by status (draft, pending_review, published, rejected, archived).",
  inputSchema: {
    status: z
      .enum(["draft", "pending_review", "published", "rejected", "archived", "all"])
      .default("all")
      .describe("Filter by product status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("products")
      .select("id,title,price,currency,status,tags,downloads_count,created_at,review_notes")
      .eq("seller_id", ctx.getUserId()!)
      .order("created_at", { ascending: false });

    if (status !== "all") q = q.eq("status", status);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});
