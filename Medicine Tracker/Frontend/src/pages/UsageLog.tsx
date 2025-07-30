import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Activity, Plus, Minus } from "lucide-react";

interface LogEntry {
  _id: string;
  medicine: string;
  quantity: number;
  timestamp: string;
}

export default function UsageLog() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:5000/usage_log");
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch usage logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Usage Log</h1>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Usage Log</h1>
        <p className="text-muted-foreground mt-2">Complete history of medicine usage and restocking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No usage logs found</p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${log.quantity > 0 ? 'bg-critical/10' : 'bg-success/10'}`}>
                      {log.quantity > 0 ? (
                        <Minus className="h-4 w-4 text-critical" />
                      ) : (
                        <Plus className="h-4 w-4 text-success" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{log.medicine}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={log.quantity > 0 ? "destructive" : "default"}>
                      {log.quantity > 0 ? "Used" : "Restocked"}
                    </Badge>
                    <span className="font-semibold">
                      {Math.abs(log.quantity)}ml
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}