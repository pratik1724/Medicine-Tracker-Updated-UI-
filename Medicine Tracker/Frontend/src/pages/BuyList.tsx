import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ShoppingCart } from "lucide-react";

interface BuyListItem {
  medicine: string;
  remaining: number;
  color: "red" | "orange" | "yellow";
}

export default function BuyList() {
  const [buyList, setBuyList] = useState<BuyListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyList = async () => {
      try {
        const response = await fetch("http://localhost:5000/buy_list");
        if (response.ok) {
          const data = await response.json();
          setBuyList(data.buy_list || []);
        }
      } catch (error) {
        console.error("Failed to fetch buy list:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBuyList();
  }, []);

  const getBadgeVariant = (color: string) => {
    switch (color) {
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

  const getPriorityText = (color: string) => {
    switch (color) {
      case "red":
        return "Critical";
      case "orange":
        return "High";
      case "yellow":
        return "Medium";
      default:
        return "Low";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Buy List</h1>
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
        <h1 className="text-3xl font-bold text-foreground">Buy List</h1>
        <p className="text-muted-foreground mt-2">Medicines that need to be purchased, sorted by priority</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Priority Purchases</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {buyList.length === 0 ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">All Good!</h3>
                  <p className="text-muted-foreground">No immediate purchases needed</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {buyList.map((item) => (
                <div
                  key={item.medicine}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-critical/10 rounded-full">
                      <AlertTriangle className="h-4 w-4 text-critical" />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{item.medicine}</h3>
                      <p className="text-sm text-muted-foreground">
                        Only {item.remaining}ml remaining
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getBadgeVariant(item.color)}>
                      {getPriorityText(item.color)} Priority
                    </Badge>
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