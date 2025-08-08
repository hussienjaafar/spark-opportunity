export const sampleKeywords = ["acupressure mat","cold plunge mat","bamboo drawer organizer","silk pillowcase king"];

export function fixtureSerp(keyword: string) {
  return {
    keyword,
    paid_ads_top: Math.floor(Math.random()*3),
    paid_ads_bottom: Math.floor(Math.random()*3),
    shopping_results: Math.floor(Math.random()*8),
    people_also_ask_count: Math.floor(Math.random()*6),
    serp_paid_density: Math.random(),
    serp_top10_density: Math.random(),
    serp_brand_share: Math.random()*0.8,
    domains: ["amazon.com","walmart.com","etsy.com"],
    _status: 'fresh'
  };
}

export function fixtureTrends(keyword: string) {
  // weekly mean ~ 30-90, yoy -0.2..0.5
  const mean = 30 + Math.random()*60;
  const yoy = -0.2 + Math.random()*0.7;
  return { keyword, gtrends_weekly_mean: mean, gtrends_yoy: yoy, partial: false, _status: 'fresh' };
}

export function fixtureMeta(keyword: string) {
  const ads = Math.floor(Math.random()*500);
  const adv = Math.floor(Math.random()*120);
  return { keyword, meta_ads_30d: ads, meta_advertisers: adv, partial: false, _status: 'fresh' };
}
