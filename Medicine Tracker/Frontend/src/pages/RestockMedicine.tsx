import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";

export default function RestockMedicine() {
  const [medicines, setMedicines] = useState<string[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch("http://localhost:5000/restock_medicine");
        if (response.ok) {
          const data = await response.json();
          setMedicines(data.medicines || []);
        }
      } catch (error) {
        console.error("Failed to fetch medicines:", error);
      }
    };

    fetchMedicines();
  }, []);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMedicine || !quantity) {
      toast({
        title: "Error",
        description: "Please select a medicine and enter quantity",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      formData.append("medicine", selectedMedicine);
      formData.append("quantity", quantity);

      const response = await fetch("http://localhost:5000/restock_medicine", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `${quantity}ml of ${selectedMedicine} restocked successfully`,
        });
        setSelectedMedicine("");
        setQuantity("");
      } else {
        throw new Error("Failed to restock");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restock medicine",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Restock Medicine</h1>
        <p className="text-muted-foreground mt-2">Add new stock to existing medicines</p>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Restock Form</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRestock} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="medicine">Medicine</Label>
              <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a medicine" />
                </SelectTrigger>
                <SelectContent>
                  {medicines.map((medicine) => (
                    <SelectItem key={medicine} value={medicine}>
                      <span className="capitalize">{medicine}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (ml)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity in ml"
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Restocking..." : "Restock Medicine"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}