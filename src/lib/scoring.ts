export function minmax(values: number[], epsilon=1e-6) {
  const mn = Math.min(...values);
  const mx = Math.max(...values);
  const range = mx - mn + epsilon;
  return (x: number) => (x - mn) / range;
}

export type MetricInputs = {
  serp_brand_share: number;
  serp_paid_density: number;
  gtrends_weekly_mean: number;
  gtrends_yoy: number;
  meta_ads_30d: number;
  meta_advertisers: number;
};

export function computeScores(batch: MetricInputs[]) {
  const N_brandPaid = minmax(batch.map(b => 0.5*b.serp_brand_share + 0.5*b.serp_paid_density));
  const N_demandRaw = minmax(batch.map(b => 0.6*b.gtrends_weekly_mean + 0.4*Math.max(0, b.gtrends_yoy)));
  const N_mapi = minmax(batch.map(b => b.meta_ads_30d + 0.5*b.meta_advertisers));

  return batch.map((b) => {
    const SEO_comp = N_brandPaid(0.5*b.serp_brand_share + 0.5*b.serp_paid_density);
    const Demand = N_demandRaw(0.6*b.gtrends_weekly_mean + 0.4*Math.max(0, b.gtrends_yoy));
    const Competition = 1 - SEO_comp;
    const KGI = Demand - SEO_comp;
    const MAPI = N_mapi(b.meta_ads_30d + 0.5*b.meta_advertisers);
    const Score = 0.45*Demand + 0.35*Competition + 0.20*(1 - MAPI);

    const drivers = [
      { name: 'Competition', value: Competition, direction: 'up' as const, magnitude: 0.35*Competition },
      { name: 'Demand', value: Demand, direction: 'up' as const, magnitude: 0.45*Demand },
      { name: 'MAPI', value: MAPI, direction: 'down' as const, magnitude: 0.20*MAPI },
    ].sort((a,b)=>b.magnitude - a.magnitude);

    return { Demand, Competition, KGI, MAPI, Score, drivers };
  });
}
