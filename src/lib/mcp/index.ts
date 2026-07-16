import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchProducts from "./tools/search-products";
import getProduct from "./tools/get-product";
import listMyProducts from "./tools/list-my-products";
import listMyPurchases from "./tools/list-my-purchases";

// The OAuth issuer MUST be the direct Supabase host, not the .lovable.cloud proxy.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "vaultx-mcp",
  title: "VaultX Marketplace",
  version: "0.1.0",
  instructions:
    "Tools for the VaultX digital goods marketplace. Use `search_products` and `get_product` to browse the catalog, `list_my_products` to see your own listings, and `list_my_purchases` to see items you have bought.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchProducts, getProduct, listMyProducts, listMyPurchases],
});
