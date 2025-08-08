import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/common/CopyButton";

const SQL = `create extension if not exists pgcrypto;

create table if not exists candidates(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  query text not null,
  mode text not null default 'keyword' check (mode in ('keyword','asin','sku')),
  locale text default 'US',
  seed_source text,
  dedupe_hash text,
  created_at timestamptz default now()
);

create table if not exists signals(
  id bigserial primary key,
  candidate_id uuid references candidates(id) on delete cascade,
  signal_id text not null,
  raw jsonb not null,
  collected_at timestamptz default now(),
  ttl_days int default 7,
  provider text,
  unique (candidate_id, signal_id, date_trunc('day', collected_at))
);

create table if not exists reports(
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references candidates(id) on delete cascade,
  indices jsonb not null,
  subscores jsonb not null,
  drivers jsonb not null,
  total_score numeric not null check (total_score>=0 and total_score<=1),
  confidence numeric,
  snapshot jsonb,
  computed_at timestamptz default now()
);

create table if not exists watches(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  candidate_id uuid references candidates(id) on delete cascade,
  cadence text default 'weekly' check (cadence in ('daily','weekly')),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists provider_usage(
  id bigserial primary key,
  provider text not null,
  endpoint text,
  units int default 0,
  cost_usd numeric default 0,
  window_start timestamptz default date_trunc('day', now()),
  last_spent_at timestamptz default now()
);`;

export default function Setup() {
  const [serpKey, setSerpKey] = useState("");
  const [ua, setUa] = useState("");
  const configured = useMemo(() => ({
    serp: !!localStorage.getItem("ecomops:serpapi"),
    ua: !!localStorage.getItem("ecomops:ua"),
    fixtures: localStorage.getItem("ecomops:fixtures") ?? "true",
  }), []);

  useEffect(() => {
    document.title = "Setup — EcomOps";
  }, []);

  return (
    <main className="container py-8 space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <div>Create Supabase project and run the SQL schema below</div>
            <Badge variant={"secondary"}>Owner‑only RLS later</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>Add env vars on Vercel</div>
            <Badge variant={"secondary"}>Guide below</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>SerpApi key</div>
            <Badge>{configured.serp ? "Configured ✓" : "Missing"}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>Fixtures</div>
            <Badge variant="secondary">{configured.fixtures === 'true' ? 'On' : 'Off'}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Supabase SQL</CardTitle>
          <CopyButton value={SQL} />
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">{SQL}</pre>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Provider keys (stored locally for dev)</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">SerpApi API Key</label>
            <div className="flex gap-2 mt-1">
              <Input value={serpKey} onChange={(e)=>setSerpKey(e.target.value)} placeholder="serpapi_key" />
              <Button onClick={()=>{localStorage.setItem('ecomops:serpapi', serpKey)}}>Save</Button>
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Meta Scrape User‑Agent</label>
            <div className="flex gap-2 mt-1">
              <Input value={ua} onChange={(e)=>setUa(e.target.value)} placeholder="Mozilla/5.0 ..." />
              <Button onClick={()=>{localStorage.setItem('ecomops:ua', ua)}}>Save</Button>
            </div>
          </div>
          <div className="col-span-full flex items-center gap-2">
            <Button variant="secondary" onClick={()=>{localStorage.setItem('ecomops:fixtures','true')}}>Turn ON fixtures</Button>
            <Button variant="secondary" onClick={()=>{localStorage.setItem('ecomops:fixtures','false')}}>Turn OFF fixtures</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
