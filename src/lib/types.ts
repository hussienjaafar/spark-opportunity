export type Candidate = { id: string; user_id: string; query: string; mode: 'keyword'|'asin'|'sku'; created_at: string };
export type SignalRow = { signal_id: string; raw: any; collected_at: string; ttl_days: number; provider?: string; status?: 'fresh'|'cached'|'partial' };
export type Report = {
  id: string; candidate_id: string;
  indices: { KGI:number; MAPI:number };
  subscores: { Demand:number; Competition:number };
  drivers: Array<{name:string; value:number; direction:'up'|'down'; magnitude:number}>;
  total_score: number; confidence:number; snapshot:any; computed_at:string
};

export type Settings = {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  SERPAPI_API_KEY?: string;
  META_SCRAPE_UA: string;
  SERPAPI_DAILY_BUDGET: number;
  OPENAI_DAILY_BUDGET: number;
  MAX_RUN_COST_USD: number;
  USE_FIXTURES: boolean;
};
