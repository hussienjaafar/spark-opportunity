import { useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Analyze() {
  const { id } = useParams();
  const last = useMemo(() => {
    const stored = localStorage.getItem("ecomops:lastRun");
    return stored ? JSON.parse(stored) : null;
  }, []);

  const item = last?.items.find((i: any) => i.candidate.id === id);

  useEffect(() => {
    document.title = `Analyze — ${item?.candidate.query ?? "Candidate"}`;
  }, [item?.candidate.query]);

  if (!item) {
    return (
      <main className="container py-10">
        <p className="text-muted-foreground">No data found. Run Discover first.</p>
      </main>
    );
  }

  const r = item.report;
  return (
    <main className="container py-8 space-y-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {item.candidate.query}
            <Badge>{r.total_score.toFixed(2)}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-6">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Demand</div>
            <Progress value={r.subscores.Demand * 100} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Competition</div>
            <Progress value={r.subscores.Competition * 100} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">MAPI</div>
            <Progress value={r.indices.MAPI * 100} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">KGI</div>
            <Progress value={((r.indices.KGI + 1) / 2) * 100} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Drivers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-6 text-sm text-muted-foreground">
            {r.drivers.map((d: any, idx: number) => (
              <li key={idx}>{d.name}: {d.direction === 'up' ? '+' : '-'}{d.magnitude.toFixed(2)} (value {d.value.toFixed(2)})</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Raw Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
            {JSON.stringify(item.signals, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </main>
  );
}
