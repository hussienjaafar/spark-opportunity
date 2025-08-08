import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "EcomOps Opportunity Finder — Score-Lite";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          EcomOps Opportunity Finder
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Paste keywords, run Score‑Lite, and get ranked opportunities in seconds. Capped budgets, cache-aware, deploy-ready.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/discover">Start Discover</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link to="/setup">Setup</Link>
          </Button>
        </div>
      </section>

      <section className="container grid md:grid-cols-3 gap-6 pb-20">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Score‑Lite</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Demand, Competition, MAPI blended into a single score with confidence.
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Budget‑Aware</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Daily caps and caching to keep SerpApi spend under control.
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Deploy Fast</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground">
            Works with fixtures out‑of‑the‑box. Connect Supabase to go live.
          </CardContent>
        </Card>
      </section>
    </main>
  );
};

export default Index;
