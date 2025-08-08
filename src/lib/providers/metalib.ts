import { getFreshSignal, setSignal } from "../cache";
import { fixtureMeta } from "../fixtures";
import { recordCache } from "../budget";

export async function searchMetaAds(candidateId: string, q: string) {
  const ttlDays = 7;
  const cached = getFreshSignal(candidateId, 'metalib', ttlDays);
  if (cached) { recordCache(true); return { row: cached, status: 'cached' as const }; }
  recordCache(false);

  const raw = fixtureMeta(q);
  const row = setSignal(candidateId, 'metalib', raw, 'meta', ttlDays);
  return { row, status: 'fresh' as const };
}
