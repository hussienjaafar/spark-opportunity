import { getSettings } from "../env";
import { getFreshSignal, setSignal } from "../cache";
import { fixtureTrends } from "../fixtures";
import { recordCache } from "../budget";

export async function interestOverTime(candidateId: string, q: string) {
  const ttlDays = 7;
  const cached = getFreshSignal(candidateId, 'trends', ttlDays);
  if (cached) { recordCache(true); return { row: cached, status: 'cached' as const }; }
  recordCache(false);

  const s = getSettings();
  if (s.USE_FIXTURES) {
    const raw = fixtureTrends(q);
    const row = setSignal(candidateId, 'trends', raw, 'trends', ttlDays);
    return { row, status: 'fresh' as const };
  }

  try {
    // Placeholder: require google-trends-api on server; fallback to fixtures in client.
    const raw = fixtureTrends(q);
    const row = setSignal(candidateId, 'trends', raw, 'trends', ttlDays);
    return { row, status: 'partial' as const };
  } catch {
    const raw = fixtureTrends(q);
    const row = setSignal(candidateId, 'trends', raw, 'trends', ttlDays);
    return { row, status: 'partial' as const };
  }
}
