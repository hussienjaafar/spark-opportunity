import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

export default function Diagnostics() {
  const [totals, setTotals] = useState<{ serpapi: number; openai: number; meta: number }>({ serpapi: 0, openai: 0, meta: 0 });

  useEffect(() => {
    (async () => {
      const { data } = await supabase.functions.invoke('diag');
      if (data) setTotals(data as any);
    })();
    document.title = "Diagnostics — EcomOps";
  }, []);

  const caps = { serpapi: 1, openai: 2, meta: 0 };
  const serpPct = Math.min(100, ((totals.serpapi || 0) / caps.serpapi) * 100);
  const openaiPct = Math.min(100, ((totals.openai || 0) / caps.openai) * 100);

  return (
    <main className="container py-8 grid md:grid-cols-2 gap-6">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle>Provider Spend (today)</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1"><span>SerpApi</span><span>${'{'}totals.serpapi.toFixed(2){'}'} / ${'{'}caps.serpapi.toFixed(2){'}'}</span></div>
            <Progress value={serpPct} />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1"><span>OpenAI</span><span>${'{'}totals.openai.toFixed(2){'}'} / ${'{'}caps.openai.toFixed(2){'}'}</span></div>
            <Progress value={openaiPct} />
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
