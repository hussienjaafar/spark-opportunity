import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { analyzeKeywords, LastRunResult } from "@/lib/analyze";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const placeholder = "Paste 5–100 keywords, one per line";

export default function Discover() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<LastRunResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Discover — EcomOps Opportunity Finder";
    const stored = localStorage.getItem("ecomops:lastRun");
    if (stored) setLast(JSON.parse(stored));
  }, []);

  const keywords = useMemo(() => input.split(/\n+/).map(k => k.trim()).filter(Boolean), [input]);

  async function handleAnalyze() {
    if (keywords.length < 1) {
      toast({ title: "Please add some keywords" });
      return;
    }
    setLoading(true);
    try {
      const res = await analyzeKeywords(keywords);
      setLast(res);
      toast({ title: `Analyzed ${res.items.length} keywords` });
    } catch (e: any) {
      toast({ title: "Analyze failed", description: e?.message ?? String(e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-8">
      <Card className="rounded-2xl mb-8">
        <CardHeader>
          <CardTitle>Discover — Score‑Lite</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} className="min-h-40" />
          <div className="flex items-center gap-3 mt-4">
            <Button onClick={handleAnalyze} disabled={loading}>{loading ? "Analyzing..." : "Analyze (Score‑Lite)"}</Button>
            {last && (
              <span className="text-sm text-muted-foreground">Last run: {format(new Date(last.ranAt), "PPpp")} • est ${'{'}last.estimatedCost.toFixed(2){'}'}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {last && (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Top results sorted by Score.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Demand</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>MAPI</TableHead>
                  <TableHead>KGI</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {last.items.map((it) => (
                  <TableRow key={it.candidate.id} className="cursor-pointer" onClick={() => navigate(`/analyze/${it.candidate.id}`)}>
                    <TableCell className="font-medium">{it.candidate.query}</TableCell>
                    <TableCell><Badge>{it.report.total_score.toFixed(2)}</Badge></TableCell>
                    <TableCell>{it.report.subscores.Demand.toFixed(2)}</TableCell>
                    <TableCell>{it.report.subscores.Competition.toFixed(2)}</TableCell>
                    <TableCell>{it.report.indices.MAPI.toFixed(2)}</TableCell>
                    <TableCell>{((it.report.indices.KGI + 1) / 2).toFixed(2)}</TableCell>
                    <TableCell>{(it.report.confidence ?? 1).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(it.report.computed_at), "PPp")}</TableCell>
                    <TableCell>
                      {it.status === 'fresh' && <Badge>Fresh</Badge>}
                      {it.status === 'cached' && <Badge variant="secondary">Cached</Badge>}
                      {it.status === 'partial' && <Badge className="bg-amber-200 text-foreground">Partial</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
