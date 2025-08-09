// Supabase Edge Function: diag
// Returns today's provider_usage totals by provider.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE") ?? "";

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const dayStart = new Date(); dayStart.setUTCHours(0,0,0,0);
  const window_start = dayStart.toISOString();
  const { data, error } = await supabaseAdmin
    .from('provider_usage')
    .select('provider, cost_usd')
    .eq('window_start', window_start);

  const totals = { serpapi: 0, openai: 0, meta: 0 };
  for (const row of (data ?? [])) {
    const p = String((row as any).provider);
    const c = Number((row as any).cost_usd ?? 0);
    if (p in totals) (totals as any)[p] += c;
  }

  return new Response(JSON.stringify(totals), { status: 200, headers: { 'content-type': 'application/json', ...corsHeaders } });
});