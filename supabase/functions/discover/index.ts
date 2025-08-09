// Supabase Edge Function: discover
// Computes Score-Lite for a batch of keywords. Uses SerpApi (server-side) and stubs for Trends/Meta.
// CORS enabled and budgets enforced via provider_usage table.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE") ?? "";
const SERPAPI_API_KEY = Deno.env.get("SERPAPI_API_KEY") ?? "";
const SERPAPI_DAILY_BUDGET = parseFloat(Deno.env.get("SERPAPI_DAILY_BUDGET") ?? "1");
const OPENAI_DAILY_BUDGET = parseFloat(Deno.env.get("OPENAI_DAILY_BUDGET") ?? "2");

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
});

function minmax(values: number[], epsilon = 1e-6) {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = Math.max(mx - mn, epsilon);
  return (x: number) => (x - mn) / range;
}

async function charge(provider: "serpapi" | "openai" | "meta", estCost: number) {
  const dayStart = new Date(); dayStart.setUTCHours(0,0,0,0);
  const window_start = dayStart.toISOString();

  // Read existing row
  const { data: existing, error: readErr } = await supabaseAdmin
    .from("provider_usage")
    .select("id, units, cost_usd")
    .eq("provider", provider)
    .eq("window_start", window_start)
    .maybeSingle();
  if (readErr) {
    // Best effort; don't block on read errors
  }

  if (existing) {
    await supabaseAdmin
      .from("provider_usage")
      .update({
        units: (existing.units ?? 0) + 1,
        cost_usd: (Number(existing.cost_usd ?? 0) + estCost),
        last_spent_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("provider_usage").insert({
      provider,
      endpoint: "serpapi/search",
      units: 1,
      cost_usd: estCost,
      window_start,
      last_spent_at: new Date().toISOString(),
    });
  }

  const caps: Record<string, number> = {
    serpapi: SERPAPI_DAILY_BUDGET,
    openai: OPENAI_DAILY_BUDGET,
    meta: 0,
  };
  const { data: rows } = await supabaseAdmin
    .from("provider_usage")
    .select("provider, cost_usd")
    .eq("provider", provider)
    .eq("window_start", window_start);
  const spent = (rows ?? []).reduce((s, r: any) => s + Number(r.cost_usd ?? 0), 0);
  if (spent > (caps as any)[provider]) throw new Error(`BUDGET_EXCEEDED:${provider}`);
}

async function fetchSerp(q: string) {
  if (!SERPAPI_API_KEY) throw new Error("SERPAPI_KEY_MISSING");
  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&num=10&api_key=${SERPAPI_API_KEY}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`SERPAPI_${r.status}`);
  return await r.json();
}

async function fetchTrendsFixture(_q: string) {
  return { gtrends_weekly_mean: 50 + Math.random() * 30, gtrends_yoy: Math.random() * 0.3 };
}
async function fetchMetaFixture(_q: string) {
  return { meta_ads_30d: Math.floor(Math.random() * 300), meta_advertisers: Math.floor(Math.random() * 100) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const keywords: string[] = Array.isArray(body?.keywords) ? body.keywords : [];
  if (!keywords.length) return json({ error: "keywords[] required" }, 400);

  // Fetch signals in parallel
  const serpPromises = keywords.map(async (q) => {
    try {
      await charge("serpapi", 0.005);
      const raw = await fetchSerp(q);
      return { q, raw, status: "fresh" as const };
    } catch (e) {
      const msg = String(e ?? "");
      const status: "cached" | "partial" = msg.includes("BUDGET_EXCEEDED") ? "cached" : "partial";
      return { q, raw: null, status };
    }
  });
  const trendsPromises = keywords.map(async (q) => ({ q, raw: await fetchTrendsFixture(q), status: "partial" as const }));
  const metaPromises = keywords.map(async (q) => ({ q, raw: await fetchMetaFixture(q), status: "partial" as const }));

  const [serp, trends, meta] = await Promise.all([
    Promise.all(serpPromises),
    Promise.all(trendsPromises),
    Promise.all(metaPromises),
  ]);

  const batch = keywords.map((q) => {
    const s = serp.find((x) => x.q === q);
    const t = trends.find((x) => x.q === q);
    const m = meta.find((x) => x.q === q);

    let serp_paid_density = 0, serp_brand_share = 0;
    if (s?.raw) {
      const adsTop = (s.raw.ads?.length ?? 0);
      const shopping = (s.raw.shopping_results?.length ?? 0);
      serp_paid_density = Math.min(1, (adsTop + shopping / 5) / 5);

      const domains: string[] = (s.raw.organic_results ?? [])
        .map((r: any) => {
          try { return new URL(r.link).hostname.replace(/^www\./, ""); } catch { return null; }
        })
        .filter(Boolean) as string[];
      const brands = new Set(["amazon.com", "walmart.com", "target.com", "bestbuy.com", "etsy.com", "ebay.com", "homedepot.com", "lowes.com"]);
      const branded = domains.filter((d) => brands.has(d)).length;
      serp_brand_share = domains.length ? branded / domains.length : 0;
    }

    const gtrends_weekly_mean = t?.raw?.gtrends_weekly_mean ?? 50;
    const gtrends_yoy = t?.raw?.gtrends_yoy ?? 0;
    const meta_ads_30d = m?.raw?.meta_ads_30d ?? 0;
    const meta_advertisers = m?.raw?.meta_advertisers ?? 0;

    const status = s?.status === "fresh" ? "fresh" : (s?.status ?? "partial");
    return { q, status, serp_paid_density, serp_brand_share, gtrends_weekly_mean, gtrends_yoy, meta_ads_30d, meta_advertisers };
  });

  const N_demand = minmax(batch.map((b) => 0.6 * b.gtrends_weekly_mean + 0.4 * Math.max(0, b.gtrends_yoy)));
  const N_seo = minmax(batch.map((b) => 0.5 * b.serp_brand_share + 0.5 * b.serp_paid_density));
  const N_mapi = minmax(batch.map((b) => b.meta_ads_30d + 0.5 * b.meta_advertisers));

  const items: any[] = [];
  for (const b of batch) {
    const Demand = N_demand(0.6 * b.gtrends_weekly_mean + 0.4 * Math.max(0, b.gtrends_yoy));
    const SEO_comp = N_seo(0.5 * b.serp_brand_share + 0.5 * b.serp_paid_density);
    const Competition = 1 - SEO_comp;
    const KGI = Demand - SEO_comp;
    const MAPI = N_mapi(b.meta_ads_30d + 0.5 * b.meta_advertisers);
    const total_score = 0.45 * Demand + 0.35 * Competition + 0.2 * (1 - MAPI);
    const confidence = b.status === "fresh" ? 1 : 0.6;

    const candidateId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    items.push({
      candidate: { id: candidateId, user_id: "local", query: b.q, mode: "keyword", created_at: nowIso },
      signals: {
        serpapi: { signal_id: "serpapi", raw: { serp_paid_density: b.serp_paid_density, serp_brand_share: b.serp_brand_share }, collected_at: nowIso, ttl_days: 7, provider: "serpapi", status: b.status },
        trends: { signal_id: "trends", raw: { gtrends_weekly_mean: b.gtrends_weekly_mean, gtrends_yoy: b.gtrends_yoy }, collected_at: nowIso, ttl_days: 7, provider: "trends", status: "partial" },
        metalib: { signal_id: "metalib", raw: { meta_ads_30d: b.meta_ads_30d, meta_advertisers: b.meta_advertisers }, collected_at: nowIso, ttl_days: 7, provider: "meta", status: "partial" },
      },
      report: {
        id: crypto.randomUUID(), candidate_id: candidateId,
        indices: { KGI, MAPI }, subscores: { Demand, Competition },
        drivers: [
          { name: "Competition", value: Competition, direction: "up", magnitude: 0.35 * Competition },
          { name: "Demand", value: Demand, direction: "up", magnitude: 0.45 * Demand },
          { name: "MAPI", value: MAPI, direction: "down", magnitude: 0.2 * MAPI },
        ],
        total_score, confidence, snapshot: b, computed_at: nowIso,
      },
      status: b.status,
    });
  }

  items.sort((a, b) => b.report.total_score - a.report.total_score);
  const estimatedCost = keywords.length * 0.005;
  return json({ ranAt: new Date().toISOString(), estimatedCost, items });
});