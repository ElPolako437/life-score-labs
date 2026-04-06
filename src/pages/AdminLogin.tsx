import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalinessLogo } from "@/components/CalinessLogo";
import { Lock, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("admin-auth", {
        body: { action: "login", password },
      });

      if (fnError || data?.error) {
        setError(data?.error || "Login fehlgeschlagen");
        return;
      }

      if (data?.sessionToken) {
        // Use sessionStorage instead of localStorage for security
        // sessionStorage clears on tab close, reducing XSS exposure window
        sessionStorage.setItem("adminSessionToken", data.sessionToken);
        toast({
          title: "Erfolgreich angemeldet",
          description: "Willkommen im Admin-Bereich",
        });
        navigate("/admin/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />
      
      <Card className="card-elegant w-full max-w-md relative z-10">
        <CardHeader className="text-center">
          <CalinessLogo size="md" className="justify-center mb-6" />
          <CardTitle className="text-2xl font-bold section-title">
            Admin-Bereich
          </CardTitle>
          <p className="text-text-muted mt-2">
            Passwort eingeben um fortzufahren
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
              <Input
                type="password"
                placeholder="Admin-Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 bg-darker-surface/60 border-border/50"
                required
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full glow-neon"
              disabled={isLoading}
            >
              {isLoading ? "Wird geprüft..." : "Anmelden"}
            </Button>
          </form>
          
          <p className="text-xs text-text-muted text-center mt-6">
            Beim ersten Login wird das eingegebene Passwort als Admin-Passwort gesetzt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
