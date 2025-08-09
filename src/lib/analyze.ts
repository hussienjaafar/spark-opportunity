import { supabase } from "@/integrations/supabase/client";
import { Candidate, Report, SignalRow } from "./types";
import { lsSet } from "./storage";

export type LastRunResult = {
  ranAt: string;
  estimatedCost: number;
  items: Array<{
    candidate: Candidate;
    signals: Record<string, SignalRow>;
    report: Report;
    status: 'fresh'|'cached'|'partial';
  }>;
};

export async function analyzeKeywords(keywords: string[]): Promise<LastRunResult> {
  // Delegate to Supabase Edge Function (server-only secrets & budgets)
  const { data, error } = await supabase.functions.invoke('discover', {
    body: { keywords },
  });
  if (error) throw new Error(error.message || 'discover_failed');
  // Persist last run locally for fast UI access
  lsSet("ecomops:lastRun", data);
  return data as LastRunResult;
}
