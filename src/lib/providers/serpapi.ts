import { getSettings } from "../env";
import { charge, recordCache } from "../budget";
import { getFreshSignal, setSignal } from "../cache";
import { fixtureSerp } from "../fixtures";

export async function searchGoogle(candidateId: string, q: string) {
  const s = getSettings();
  const ttlDays = 7;
  const cached = getFreshSignal(candidateId, 'serpapi', ttlDays);
  if (cached) { recordCache(true); return { row: cached, status: 'cached' as const }; }
  recordCache(false);

  if (s.USE_FIXTURES || !s.SERPAPI_API_KEY) {
    const raw = fixtureSerp(q);
    const row = setSignal(candidateId, 'serpapi', raw, 'serpapi', ttlDays);
    return { row, status: 'fresh' as const };
  }

  // Real call placeholder
  const unit_cost_est = 0.005;
  charge('serpapi', unit_cost_est);
  try {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(q)}&engine=google&num=10&api_key=${s.SERPAPI_API_KEY}`;
    const resp = await fetch(url);
    const raw = await resp.json();
    const row = setSignal(candidateId, 'serpapi', raw, 'serpapi', ttlDays);
    return { row, status: 'fresh' as const };
  } catch (e) {
    const raw = fixtureSerp(q);
    const row = setSignal(candidateId, 'serpapi', raw, 'serpapi', ttlDays);
    return { row: { ...row, status: 'partial' as const }, status: 'partial' as const };
  }
}
