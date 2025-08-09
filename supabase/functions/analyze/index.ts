// Supabase Edge Function: analyze (single keyword)
// Reuses the same logic shape as discover by accepting an array with one keyword.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  let body: any; try { body = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const q: string | undefined = body?.keyword ?? body?.q ?? body?.query;
  if (!q) return json({ error: "keyword required" }, 400);

  // Proxy call to discover with a single keyword by invoking the function URL internally
  // Note: Using same deployment origin
  const url = new URL(req.url);
  const discoverUrl = `${url.origin}/functions/v1/discover`;
  const r = await fetch(discoverUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ keywords: [q] }) });
  const payload = await r.json().catch(() => ({}));
  return new Response(JSON.stringify(payload), { status: r.status, headers: { "content-type": "application/json", ...corsHeaders } });
});