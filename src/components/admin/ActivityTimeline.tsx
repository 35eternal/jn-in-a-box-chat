import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, User, Zap, Trash2, Edit3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: "webhook_added" | "webhook_updated" | "webhook_deleted" | "webhook_toggled" | "system";
  description: string;
  timestamp: Date;
  icon: React.ReactNode;
  color: string;
}

export const ActivityTimeline = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Mock data for demonstration - in production, fetch from logs or integrate with event bus
  const getMockActivities = (): ActivityItem[] => [
    {
      id: "1",
      type: "webhook_added",
      description: "Added 'HD Physique Primary Webhook'",
      timestamp: new Date(Date.now() - 3600000), // 1 hour ago
      icon: <Zap className="h-4 w-4 text-primary" />,
      color: "bg-primary/10 border-primary/20 text-primary",
    },
    {
      id: "2",
      type: "system",
      description: "System status refreshed",
      timestamp: new Date(Date.now() - 1800000), // 30 min ago
      icon: <Clock className="h-4 w-4 text-primary" />,
      color: "bg-primary/10 border-primary/20 text-primary",
    },
    {
      id: "3",
      type: "webhook_toggled",
      description: "Toggled 'Test Webhook' to active",
      timestamp: new Date(Date.now() - 600000), // 10 min ago
      icon: <Edit3 className="h-4 w-4 text-primary" />,
      color: "bg-primary/10 border-primary/20 text-primary",
    },
    {
      id: "4",
      type: "webhook_deleted",
      description: "Deleted 'Old Webhook'",
      timestamp: new Date(Date.now() - 300000), // 5 min ago
      icon: <Trash2 className="h-4 w-4 text-destructive" />,
      color: "bg-destructive/10 border-destructive/20 text-destructive",
    },
  ];

  useEffect(() => {
    setActivities(getMockActivities());
    // In production, fetch from API or subscribe to events
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48">
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <Badge 
                  variant="outline" 
                  className={`flex-shrink-0 ${activity.color} border p-2`}
                >
                  {activity.icon}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(activity.timestamp)} ago
                  </p>
                </div>
                <Separator className="flex-1 h-0.5 bg-border" />
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <Separator className="my-4 bg-border" />
        <div className="text-xs text-muted-foreground flex justify-between">
          <span>Showing recent actions</span>
          <Button variant="ghost" size="sm">
            View all logs
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
