import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Brain, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface ForecastData {
  [medicine: string]: string;
}

export default function Forecast() {
  const [forecastData, setForecastData] = useState<ForecastData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        const response = await fetch("http://localhost:5000/forecast");
        if (response.ok) {
          const data = await response.json();
          setForecastData(data.stock_alerts || {});
        }
      } catch (error) {
        console.error("Failed to fetch forecast:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, []);

  const getIcon = (forecast: string) => {
    if (forecast.includes("already depleted") || forecast.includes("needed in 0 days")) {
      return <AlertTriangle className="h-5 w-5 text-critical" />;
    } else if (forecast.includes("needed in") && !forecast.includes("sufficient")) {
      const days = parseInt(forecast.match(/\d+/)?.[0] || "0");
      if (days <= 7) {
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      } else {
        return <Clock className="h-5 w-5 text-primary" />;
      }
    } else if (forecast.includes("sufficient")) {
      return <CheckCircle className="h-5 w-5 text-success" />;
    } else {
      return <Brain className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getBadgeVariant = (forecast: string) => {
    if (forecast.includes("already depleted") || forecast.includes("needed in 0 days")) {
      return "destructive";
    } else if (forecast.includes("needed in") && !forecast.includes("sufficient")) {
      const days = parseInt(forecast.match(/\d+/)?.[0] || "0");
      if (days <= 7) {
        return "secondary";
      } else {
        return "default";
      }
    } else if (forecast.includes("sufficient")) {
      return "default";
    } else {
      return "secondary";
    }
  };

  const getBadgeText = (forecast: string) => {
    if (forecast.includes("already depleted")) {
      return "Depleted";
    } else if (forecast.includes("needed in") && !forecast.includes("sufficient")) {
      const days = parseInt(forecast.match(/\d+/)?.[0] || "0");
      if (days <= 7) {
        return "Urgent";
      } else {
        return "Monitor";
      }
    } else if (forecast.includes("sufficient")) {
      return "Good";
    } else {
      return "Analysis";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">AI Forecast</h1>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse">Loading AI predictions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Forecast</h1>
        <p className="text-muted-foreground mt-2">Machine learning predictions for medicine depletion</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Predictive Analytics</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on usage patterns and Prophet forecasting model
          </p>
        </CardHeader>
        <CardContent>
          {Object.keys(forecastData).length === 0 ? (
            <div className="text-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Brain className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">No Forecast Data</h3>
                  <p className="text-muted-foreground">Insufficient usage data for predictions</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(forecastData).map(([medicine, forecast]) => (
                <div
                  key={medicine}
                  className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent/80 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-background rounded-full">
                      {getIcon(forecast)}
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{medicine}</h3>
                      <p className="text-sm text-muted-foreground">
                        {forecast}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getBadgeVariant(forecast)}>
                      {getBadgeText(forecast)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How AI Forecasting Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>• Uses Facebook Prophet machine learning model for time series forecasting</p>
          <p>• Analyzes historical usage patterns and trends</p>
          <p>• Predicts future consumption based on past behavior</p>
          <p>• Accounts for daily seasonality in medicine usage</p>
          <p>• Provides early warning system for stock management</p>
        </CardContent>
      </Card>
    </div>
  );
}