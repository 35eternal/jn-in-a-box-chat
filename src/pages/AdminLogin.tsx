import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { toast } from "@/hooks/use-toast";
import { Loader2, Lock } from "lucide-react";

const AdminLogin = () => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validation
    if (!password.trim()) {
      toast({
        title: "Validation Error",
        description: "Password cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(password);
      
      if (success) {
        toast({
          title: "Success",
          description: "Successfully logged in as admin",
        });
        navigate("/admin");
      } else {
        toast({
          title: "Authentication Failed",
          description: "Invalid admin password",
          variant: "destructive",
        });
        setPassword("");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--chat-bg-start))] to-[hsl(var(--chat-bg-end))]">
      <Card className="w-full max-w-md bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border border-white/10 shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)]">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Admin Login
          </CardTitle>
          <CardDescription className="text-white/70">
            Enter your admin password to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={isLoading}
                className="bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-[hsl(164,65%,50%)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white font-semibold py-5 active:scale-98 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
