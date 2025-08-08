import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Login — EcomOps";
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Placeholder local login for fixtures mode
    localStorage.setItem("ecomops:user", JSON.stringify({ email }));
    toast({ title: "Signed in (fixtures mode)" });
  }

  return (
    <main className="container py-16 max-w-md">
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="text-sm text-muted-foreground">Email</label>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Password</label>
              <Input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">Sign in</Button>
          </form>
          <p className="text-xs text-muted-foreground mt-4">To enable real auth, connect Supabase in Lovable and we’ll switch this to Supabase Auth automatically.</p>
        </CardContent>
      </Card>
    </main>
  );
}
