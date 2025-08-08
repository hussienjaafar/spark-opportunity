import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Opportunities() {
  const last = useMemo(() => {
    const stored = localStorage.getItem("ecomops:lastRun");
    return stored ? JSON.parse(stored) : null;
  }, []);

  useEffect(() => {
    document.title = "Opportunities — EcomOps";
  }, []);

  const items = last?.items?.slice(0, 25) ?? [];
  return (
    <main className="container py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Top Opportunities</h1>
        <span className="text-sm text-muted-foreground">Last run: {last ? new Date(last.ranAt).toLocaleString() : '—'} • est ${'{'}last?.estimatedCost.toFixed?.(2) ?? '0.00'{'}'}</span>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((it: any) => (
          <Link key={it.candidate.id} to={`/analyze/${'{'}it.candidate.id{'}'}`}>
            <Card className="rounded-2xl hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{it.candidate.query}</span>
                  <Badge>{it.report.total_score.toFixed(2)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <div>Demand: {it.report.subscores.Demand.toFixed(2)}</div>
                <div>Competition: {it.report.subscores.Competition.toFixed(2)}</div>
                <div>MAPI: {it.report.indices.MAPI.toFixed(2)}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {!items.length && (
        <p className="text-muted-foreground mt-8">No results yet. Run a Discover.</p>
      )}
    </main>
  );
}
