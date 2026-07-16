import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase-for-user";

export default defineTool({
  name: "list_my_purchases",
  title: "List my purchases",
  description: "List transactions where the signed-in user is the buyer (products they purchased).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const { data, error } = await supabaseForUser(ctx)
      .from("transactions")
      .select("id,product_id,seller_id,amount,currency,status,created_at")
      .eq("buyer_id", ctx.getUserId()!)
      .order("created_at", { ascending: false });

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { transactions: data ?? [] },
    };
  },
});
