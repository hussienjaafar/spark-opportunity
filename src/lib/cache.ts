import { lsGet, lsSet } from "./storage";
import { SignalRow } from "./types";

export function getFreshSignal(candidateId: string, signal_id: string, ttlDays: number): SignalRow | null {
  const key = `ecomops:signal:${candidateId}:${signal_id}`;
  const row = lsGet<SignalRow | null>(key, null);
  if (!row) return null;
  const ageMs = Date.now() - new Date(row.collected_at).getTime();
  if (ageMs <= ttlDays*24*60*60*1000) return row;
  return null;
}

export function setSignal(candidateId: string, signal_id: string, raw: any, provider?: string, ttlDays=7): SignalRow {
  const row: SignalRow = { signal_id, raw, collected_at: new Date().toISOString(), ttl_days: ttlDays, provider, status: 'fresh' };
  const key = `ecomops:signal:${candidateId}:${signal_id}`;
  lsSet(key, row);
  return row;
}
