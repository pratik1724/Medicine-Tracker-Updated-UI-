import { useState, useEffect } from "react";
import StockCard from "@/components/StockCard";

interface StockData {
  [medicine: string]: {
    remaining: number;
    depletion_date: string;
  };
}

export default function StockStatus() {
  const [stockData, setStockData] = useState<StockData>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch("http://localhost:5000/restock");
        if (response.ok) {
          const data = await response.json();
          setStockData(data.summary || {});
        }
      } catch (error) {
        console.error("Failed to fetch stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Stock Status</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-accent rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Stock Status</h1>
        <p className="text-muted-foreground mt-2">Current stock levels and predicted depletion dates</p>
      </div>

      {Object.keys(stockData).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No stock data available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(stockData).map(([medicine, data]) => (
            <StockCard
              key={medicine}
              medicine={medicine}
              remaining={data.remaining}
              depletionDate={data.depletion_date}
            />
          ))}
        </div>
      )}
    </div>
  );
}