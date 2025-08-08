import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function Diagnostics() {
  const diag = useMemo(() => {
    const d = localStorage.getItem("ecomops:diag");
    return d ? JSON.parse(d) : { spend: { serpapi: 0, openai: 0, meta: 0 }, cacheHits: 0, cacheMisses: 0 };
  }, []);

  useEffect(() => { document.title = "Diagnostics — EcomOps"; }, []);

  const total = diag.cacheHits + diag.cacheMisses;
  const hitRatio = total ? (diag.cacheHits / total) * 100 : 0;

  return (
    <main className="container py-8 grid md:grid-cols-2 gap-6">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Provider Spend (est)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1"><span>SerpApi</span><span>${'{'}diag.spend.serpapi.toFixed(2){'}'} / $1.00</span></div>
            <Progress value={Math.min(100, diag.spend.serpapi * 100)} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>OpenAI</span><span>${'{'}diag.spend.openai.toFixed(2){'}'} / $2.00</span></div>
            <Progress value={Math.min(100, (diag.spend.openai/2) * 100)} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>Meta</span><span>${'{'}diag.spend.meta.toFixed(2){'}'} / capped</span></div>
            <Progress value={0} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Cache</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm"><span>Cache hit ratio</span><span>{hitRatio.toFixed(1)}%</span></div>
          <Progress value={hitRatio} />
          <div className="text-sm text-muted-foreground">Hits: {diag.cacheHits} • Misses: {diag.cacheMisses}</div>
        </CardContent>
      </Card>
    </main>
  );
}
