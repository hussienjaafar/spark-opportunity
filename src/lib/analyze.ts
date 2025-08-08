import { computeScores } from "./scoring";
import { searchGoogle } from "./providers/serpapi";
import { interestOverTime } from "./providers/trends";
import { searchMetaAds } from "./providers/metalib";
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
  const now = new Date();
  const candidates: Candidate[] = keywords.map(q => ({ id: crypto.randomUUID(), user_id: 'local', query: q, mode: 'keyword', created_at: now.toISOString() }));

  const serpRows = await Promise.all(candidates.map(c => searchGoogle(c.id, c.query)));
  const trendRows = await Promise.all(candidates.map(c => interestOverTime(c.id, c.query)));
  const metaRows = await Promise.all(candidates.map(c => searchMetaAds(c.id, c.query)));

  const metrics = candidates.map((c, i) => {
    const serp = serpRows[i].row.raw;
    const tr = trendRows[i].row.raw;
    const me = metaRows[i].row.raw;
    return {
      serp_brand_share: serp.serp_brand_share ?? 0.5,
      serp_paid_density: serp.serp_paid_density ?? 0.5,
      gtrends_weekly_mean: tr.gtrends_weekly_mean ?? 50,
      gtrends_yoy: tr.gtrends_yoy ?? 0,
      meta_ads_30d: me.meta_ads_30d ?? 0,
      meta_advertisers: me.meta_advertisers ?? 0,
    };
  });

  const scores = computeScores(metrics);

  const items = candidates.map((c, i) => {
    const s = scores[i];
    const status: 'fresh'|'cached'|'partial' = [serpRows[i].status, trendRows[i].status, metaRows[i].status].includes('partial') ? 'partial' :
      ([serpRows[i].status, trendRows[i].status, metaRows[i].status].every(x=>x==='cached') ? 'cached' : 'fresh');

    const report: Report = {
      id: crypto.randomUUID(),
      candidate_id: c.id,
      indices: { KGI: s.KGI, MAPI: s.MAPI },
      subscores: { Demand: s.Demand, Competition: s.Competition },
      drivers: s.drivers,
      total_score: s.Score,
      confidence: status === 'partial' ? 0.6 : 1.0,
      snapshot: {},
      computed_at: now.toISOString(),
    };

    const signals: Record<string, SignalRow> = {
      serpapi: { signal_id: 'serpapi', raw: serpRows[i].row.raw, collected_at: serpRows[i].row.collected_at, ttl_days: 7, provider: 'serpapi', status: serpRows[i].status },
      trends: { signal_id: 'trends', raw: trendRows[i].row.raw, collected_at: trendRows[i].row.collected_at, ttl_days: 7, provider: 'trends', status: trendRows[i].status },
      metalib: { signal_id: 'metalib', raw: metaRows[i].row.raw, collected_at: metaRows[i].row.collected_at, ttl_days: 7, provider: 'meta', status: metaRows[i].status },
    };

    return { candidate: c, signals, report, status };
  }).sort((a,b)=> b.report.total_score - a.report.total_score);

  const estimatedCost = candidates.length * 0.005; // serpapi only rough
  const result: LastRunResult = { ranAt: now.toISOString(), estimatedCost, items };
  lsSet("ecomops:lastRun", result);
  return result;
}
