import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const InputSchema = z.object({
  productId: z.string().uuid(),
});

const EXE_SIG = [0x4d, 0x5a]; // MZ
const ELF_SIG = [0x7f, 0x45, 0x4c, 0x46];

function looksLikeExecutable(buf: Uint8Array) {
  const mz = EXE_SIG.every((b, i) => buf[i] === b);
  const elf = ELF_SIG.every((b, i) => buf[i] === b);
  return mz || elf;
}

function tokens(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/[#_]/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3);
}

function overlap(a: string[], b: string[]) {
  const set = new Set(b);
  return a.filter((t) => set.has(t)).length;
}

/**
 * Step 1: automatic malware / dangerous-content scan of the uploaded files.
 * Step 2: heuristic (+ optional AI) listing check.
 * Nothing is auto-published when the scan is not clean.
 */
export const reviewListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { scanProductFiles } = await import("@/lib/malware-scan.server");

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("id, seller_id, title, description, tags, file_path, file_paths, status")
      .eq("id", data.productId)
      .maybeSingle();
    if (error || !product) throw new Response("Product not found", { status: 404 });
    if (product.seller_id !== context.userId) throw new Response("Forbidden", { status: 403 });
    if (product.status !== "pending_review") {
      return { status: product.status as string, autoApproved: product.status === "published" };
    }

    const paths: string[] = Array.from(
      new Set(
        [product.file_path, ...(((product as any).file_paths as string[] | null) ?? [])].filter(
          (p): p is string => typeof p === "string" && p.length > 0,
        ),
      ),
    );

    const title = product.title ?? "";
    const desc = product.description ?? "";
    const tags = ((product.tags as string[] | null) ?? []).join(" ");

    // ---- Step 1: malware scan -------------------------------------------------
    const scan = await scanProductFiles(supabaseAdmin, {
      paths,
      title,
      description: desc,
    });

    if (scan.verdict === "infected") {
      const notes = scan.findings.join(" ");
      await supabaseAdmin
        .from("products")
        .update({
          status: "pending_review",
          malware_scan_status: "infected",
          malware_scan_notes: notes,
          malware_scanned_at: new Date().toISOString(),
          ai_review_status: "blocked_malware",
          ai_review_notes: notes,
          review_notes: `Skan bezpieczeństwa zablokował publikację: ${notes}`,
          reviewed_at: null,
        } as any)
        .eq("id", product.id);

      await supabaseAdmin.from("seller_notifications").insert({
        user_id: product.seller_id,
        kind: "product_review_required",
        product_title: product.title,
        admin_note: `Plik został zablokowany przez automatyczny skan bezpieczeństwa. ${notes}`,
      } as any);

      return {
        status: "pending_review",
        autoApproved: false,
        malware: "infected" as const,
        notes: scan.findings,
      };
    }

    const doubts: string[] = [...scan.findings];

    const names: string[] = scan.files.map((f) => f.name);
    for (const f of scan.files) {
      if (f.size > 0 && f.size < 32) doubts.push(`${f.name}: plik wygląda na pusty lub uszkodzony.`);
    }

    if (title.trim().length < 4) doubts.push("Tytuł jest zbyt krótki.");
    if (desc.trim().length < 12)
      doubts.push("Opis jest zbyt krótki, żeby potwierdzić zgodność z plikiem.");

    const spam = /(?:https?:\/\/).{0,40}(?:https?:\/\/)|(.)\1{8,}|crypto\s*airdrop|free\s*nft/i;
    if (spam.test(title) || spam.test(desc)) doubts.push("Treść wygląda na spam.");

    const nameTok = tokens(names.join(" "));
    const textTok = tokens(`${title} ${desc} ${tags}`);
    if (nameTok.length >= 1 && textTok.length >= 1 && overlap(nameTok, textTok) === 0) {
      doubts.push("Nazwy plików słabo pasują do tytułu/opisu.");
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && doubts.length === 0) {

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            temperature: 0,
            messages: [
              {
                role: "system",
                content:
                  'Jesteś moderatorem marketplace\'u plików cyfrowych. Odpowiadasz wyłącznie JSON: {"ok": boolean, "reason": string}. ok=true jeśli oferta wygląda na legalny produkt cyfrowy zgodny z opisem, nie spam i nie malware.',
              },
              {
                role: "user",
                content: JSON.stringify({
                  title,
                  description: desc.slice(0, 2000),
                  tags,
                  files: names,
                }),
              },
            ],
          }),
        });
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content ?? "";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        if (parsed && parsed.ok === false)
          doubts.push(String(parsed.reason || "Model AI zgłosił wątpliwości."));
      } catch {
        doubts.push("Automatyczna ocena AI niedostępna — przekazano do moderatora.");
      }
    }

    const autoApproved = doubts.length === 0;
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("products")
      .update({
        status: autoApproved ? "published" : "pending_review",
        ai_review_status: autoApproved ? "auto_approved" : "needs_human",
        ai_review_notes: autoApproved ? "Zatwierdzone automatycznie." : doubts.join(" "),
        review_notes: autoApproved
          ? "Zatwierdzone automatycznie (weryfikacja AI)."
          : doubts.join(" "),
        reviewed_at: autoApproved ? now : null,
      } as any)
      .eq("id", product.id);

    await supabaseAdmin.from("seller_notifications").insert({
      user_id: product.seller_id,
      kind: autoApproved ? "product_published" : "product_review_required",
      product_title: product.title,
      admin_note: autoApproved
        ? "Produkt został automatycznie zweryfikowany i opublikowany."
        : doubts.join(" "),
    } as any);

    return { status: autoApproved ? "published" : "pending_review", autoApproved, notes: doubts };
  });
