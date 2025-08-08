import { Settings } from "./types";

export function getSettings(): Settings {
  const env = import.meta.env as any;
  return {
    SUPABASE_URL: env.VITE_SUPABASE_URL,
    SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY,
    SERPAPI_API_KEY: env.VITE_SERPAPI_API_KEY || localStorage.getItem('ecomops:serpapi') || undefined,
    META_SCRAPE_UA: env.VITE_META_SCRAPE_UA || localStorage.getItem('ecomops:ua') || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    SERPAPI_DAILY_BUDGET: parseFloat(env.VITE_SERPAPI_DAILY_BUDGET || '1.00'),
    OPENAI_DAILY_BUDGET: parseFloat(env.VITE_OPENAI_DAILY_BUDGET || '2.00'),
    MAX_RUN_COST_USD: parseFloat(env.VITE_MAX_RUN_COST_USD || '10.00'),
    USE_FIXTURES: (env.VITE_USE_FIXTURES || localStorage.getItem('ecomops:fixtures') || 'true') === 'true',
  };
}
