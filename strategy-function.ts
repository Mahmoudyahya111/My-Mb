// Supabase Edge Function named "strategy". Needs the secret ANTHROPIC_API_KEY.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
const out = (o: unknown) => new Response(JSON.stringify(o), { headers: { ...cors, "Content-Type": "application/json" } });
const SYS = `You are a senior performance-marketing strategist for the Egyptian and wider Arab market. Given a business, produce a practical marketing strategy.
Rules: be concrete and specific to the business. Never invent statistics, search volumes or guaranteed results. Where you mention keyword competition, label it as a rough estimate. Consider Egypt first (EGP budgets, mobile-first, WhatsApp-driven sales, cash on delivery habits) and any market the user names.
Platforms to consider: Meta (Facebook/Instagram), TikTok, Google Search, Google Shopping/Performance Max, YouTube, Snapchat, LinkedIn (only if B2B).
If the requested language is "ar", write ALL text values in natural Egyptian colloquial Arabic (not formal Arabic), except brand/platform names and keywords that are better in English. If "en", write English (keywords may include Arabic transliteration/Arabic terms where useful).
Return ONLY valid JSON, no markdown, with exactly this shape:
{"summary":"3-4 sentences","campaigns":[{"platform":"","objective":"","type":"","budget_pct":0,"why":""}],
"keywords":{"primary":[{"kw":"","intent":"","competition":"","why":""}],"long_tail":[{"kw":"","intent":"","competition":"","why":""}],"arabic":[{"kw":"","intent":"","competition":"","why":""}],"negative":[""]},
"website_copy":{"meta_title":"","meta_description":"","headline":"","subheadline":"","cta":"","sections":[{"title":"","body":""}],"faqs":[{"q":"","a":""}]},
"organic_creatives":[{"platform":"","format":"","idea":"","why":""}],
"paid_creatives":[{"platform":"","format":"video|image|carousel|collection|other","idea":"","why":""}],
"audiences":[{"name":"","age":"","gender":"","location":"","interests":"","behaviours":"","demographics":"","why":""}],
"why_overall":"","next_steps":[""]}
Give 3-5 campaigns (budget_pct sums to 100), 6-8 primary keywords, 6-8 long-tail, 5-6 Arabic, 6-8 negative, 4-5 website sections, 4 FAQs, 5-6 organic ideas, 4-5 paid ideas, 3-4 audiences.`;
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: u } = await sb.auth.getUser();
    if (!u?.user) return out({ error: "Please sign in." });
    const { data: ok } = await sb.rpc("is_admin");
    if (ok !== true) return out({ error: "No admin access." });
    const b = await req.json();
    const c = (x: unknown, n = 1500) => String(x ?? "").slice(0, n);
    const brief = `Business type: ${c(b.business, 300)}\nProducts/services: ${c(b.products)}\nMarket/location: ${c(b.market, 200)}\nMonthly ad budget (EGP): ${c(b.budget, 40) || "not given"}\nMain goal: ${c(b.goal, 60)}\nExtra notes: ${c(b.notes)}\nLanguage: ${b.lang === "ar" ? "ar" : "en"}`;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 8000, system: SYS, messages: [{ role: "user", content: brief }] }),
    });
    const j = await r.json();
    if (!r.ok) return out({ error: j?.error?.message || "AI request failed." });
    const t = (j.content || []).map((x: { text?: string }) => x.text || "").join("").replace(/^```(?:json)?|```$/g, "").trim();
    return out({ result: JSON.parse(t) });
  } catch (e) { return out({ error: "Could not build the strategy. Try again." }); }
});
