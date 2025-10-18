import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { WebhookManager } from "@/components/admin/WebhookManager";
import { LogOut, Shield, Loader2 } from "lucide-react";

const Admin = () => {
  const { isAdmin, isLoading, logout } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--chat-bg-start))] to-[hsl(var(--chat-bg-end))]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated (after loading is complete)
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-[hsl(var(--chat-bg-start))] to-[hsl(var(--chat-bg-end))]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border border-white/10 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)]">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-white">
                    Admin Dashboard
                  </CardTitle>
                  <CardDescription className="text-white/70 text-lg">
                    Welcome, Admin!
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Webhook Manager */}
        <Card className="bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border border-white/10 shadow-2xl">
          <CardContent className="pt-6">
            <WebhookManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
