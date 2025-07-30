import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface StockCardProps {
  medicine: string;
  remaining: number;
  depletionDate?: string;
  color?: "red" | "orange" | "yellow" | "green";
}

export default function StockCard({ medicine, remaining, depletionDate, color }: StockCardProps) {
  const getStockLevel = () => {
    if (color) return color;
    if (remaining <= 29) return "red";
    if (remaining <= 30) return "orange";
    if (remaining <= 40) return "yellow";
    return "green";
  };

  const getIcon = () => {
    const level = getStockLevel();
    switch (level) {
      case "red":
        return <AlertTriangle className="h-5 w-5 text-critical" />;
      case "orange":
        return <Clock className="h-5 w-5 text-warning" />;
      case "yellow":
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <CheckCircle className="h-5 w-5 text-success" />;
    }
  };

  const getBadgeVariant = () => {
    const level = getStockLevel();
    switch (level) {
      case "red":
        return "destructive";
      case "orange":
        return "secondary";
      case "yellow":
        return "secondary";
      default:
        return "default";
    }
  };

  const getBadgeText = () => {
    const level = getStockLevel();
    switch (level) {
      case "red":
        return "Critical";
      case "orange":
        return "Low";
      case "yellow":
        return "Warning";
      default:
        return "Good";
    }
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold capitalize">{medicine}</CardTitle>
        <div className="flex items-center space-x-2">
          {getIcon()}
          <Badge variant={getBadgeVariant()}>{getBadgeText()}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Remaining</span>
            <span className="font-semibold">{remaining}ml</span>
          </div>
          {depletionDate && depletionDate !== "N/A - No usage data" && depletionDate !== "N/A - No average usage or sufficient stock" && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Depletion Date</span>
              <span className="text-sm font-medium">
                {depletionDate === "Already Depleted" ? (
                  <span className="text-critical">Depleted</span>
                ) : (
                  depletionDate
                )}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}