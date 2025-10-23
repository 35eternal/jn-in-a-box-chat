import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { WebhookManager } from "@/components/admin/WebhookManager";
import { SystemStatusWidget } from "@/components/admin/SystemStatusWidget";
import { ActivityTimeline } from "@/components/admin/ActivityTimeline";
import { LogOut, Shield, ArrowLeft, Loader2, Database, Activity, Zap } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";

const Admin = () => {
  const { isAdmin, isLoading, logout } = useAdminAuth();
  const navigate = useNavigate();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
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

  const handleBackToChat = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 border border-primary/20">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold text-foreground">
                    Admin Dashboard
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-lg">
                    Manage your application settings
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBackToChat}
                  variant="outline"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Chat
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
                <ThemeToggle />
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* System Status Widget */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                System Status
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Real-time application health and configuration overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SystemStatusWidget />
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Recent Activity
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Timeline of system changes and admin actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline />
          </CardContent>
        </Card>

        {/* Webhook Manager */}
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10 border border-primary/20">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-xl font-bold text-foreground">
                Webhook Management
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure AI response endpoints
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <WebhookManager />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
