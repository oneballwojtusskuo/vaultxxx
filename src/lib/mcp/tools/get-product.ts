import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase-for-user";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Get full details of a single product by id, including description, price, license terms, tags, and seller.",
  inputSchema: {
    product_id: z.string().uuid().describe("UUID of the product."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ product_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("products")
      .select("id,title,description,price,currency,status,tags,seller_id,preview_url,sample_url,license_terms,is_tradable,downloads_count,created_at")
      .eq("id", product_id)
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Product not found or not accessible" }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { product: data },
    };
  },
});
