import { lsGet, lsSet } from "./storage";

export function charge(provider: 'serpapi'|'openai'|'meta', estCost: number) {
  const diag = lsGet("ecomops:diag", { spend: { serpapi: 0, openai: 0, meta: 0 }, cacheHits: 0, cacheMisses: 0 });
  diag.spend[provider] = (diag.spend[provider] || 0) + estCost;
  lsSet("ecomops:diag", diag);
}

export function recordCache(hit: boolean) {
  const diag = lsGet("ecomops:diag", { spend: { serpapi: 0, openai: 0, meta: 0 }, cacheHits: 0, cacheMisses: 0 });
  if (hit) diag.cacheHits++; else diag.cacheMisses++;
  lsSet("ecomops:diag", diag);
}
