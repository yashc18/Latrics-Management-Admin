import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login, user, adminData, loading: authLoading } = useAuth();

  // Redirect to dashboard when authentication is successful
  useEffect(() => {
    if (!authLoading && user && adminData) {
      console.log('Login successful, redirecting to dashboard...');
      navigate("/dashboard");
    }
  }, [user, adminData, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Signed in successfully");
      // Don't navigate here - let the useEffect handle it
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg md:mb-4 md:h-14 md:w-14">
            <img 
              src="/latrics-logo.png" 
              alt="Latrics Logo" 
              className="h-10 w-10 md:h-12 md:w-12"
            />
          </div>
          <CardTitle className="text-xl font-semibold md:text-2xl">Latrics Admin</CardTitle>
          <CardDescription className="text-sm">Sign in to access the admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm md:text-base">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 md:h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm md:text-base">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11 md:h-10"
              />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Terms of Service</a>
            {" • "}
            <a href="#" className="hover:text-primary">Privacy Policy</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
