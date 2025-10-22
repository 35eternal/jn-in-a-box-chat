import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Cpu, Wifi, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchAllWebhooks } from "@/services/webhookService";
import { supabase } from "@/integrations/supabase/client";

export const SystemStatusWidget = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState({
    supabase: "checking",
    webhooks: { total: 0, active: 0 },
    performance: "good",
    lastUpdated: new Date().toLocaleString(),
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      // Check Supabase connection
      const { error } = await supabase.from('webhooks').select('id').limit(1);
      const supabaseStatus = error ? 'disconnected' : 'connected';

      // Fetch webhooks
      const webhooks = await fetchAllWebhooks();
      const total = webhooks.length;
      const active = webhooks.filter(w => w.is_active).length;

      setStatus({
        supabase: supabaseStatus,
        webhooks: { total, active },
        performance: 'good', // Simple static for now
        lastUpdated: new Date().toLocaleString(),
      });

      toast({
        title: "Success",
        description: "Status refreshed",
      });
    } catch (error) {
      setStatus(prev => ({ ...prev, supabase: 'disconnected' }));
      toast({
        title: "Error",
        description: "Failed to refresh status",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const getStatusIcon = (key) => {
    const icons = {
      supabase: Database,
      webhooks: Zap,
      performance: Cpu,
    };
    const Icon = icons[key as keyof typeof icons];
    return Icon ? <Icon className="h-4 w-4" /> : null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold">System Health</h3>
        <Button
          onClick={refreshStatus}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
          className="border-white/20 text-white hover:bg-white/10"
        >
          {isRefreshing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[hsl(174,30%,20%)] border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon('supabase')}
              <CardTitle className="text-sm text-white">Supabase DB</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={status.supabase === 'connected' ? 'default' : 'destructive'} className="text-xs">
              {status.supabase}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(174,30%,20%)] border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon('webhooks')}
              <CardTitle className="text-sm text-white">Active Webhooks</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-xs bg-green-500/20 text-green-400">
              {status.webhooks.active} / {status.webhooks.total}
            </Badge>
          </CardContent>
        </Card>
        <Card className="bg-[hsl(174,30%,20%)] border-white/10">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {getStatusIcon('performance')}
              <CardTitle className="text-sm text-white">Performance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant="default" className="text-xs bg-blue-500/20 text-blue-400">
              {status.performance}
            </Badge>
          </CardContent>
        </Card>
      </div>
      <div className="text-xs text-white/50 text-center">
        Last updated: {status.lastUpdated}
      </div>
    </div>
  );
};
