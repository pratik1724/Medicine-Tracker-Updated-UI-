import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Package, ShoppingCart, TrendingUp, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface Medicine {
  id: number;
  name: string;
  remaining: number;
}

const parseTranscript = (text: string) => {
  const cleanedText = text.toLowerCase().replace(/,/g, '');
  const match = cleanedText.match(/^(.+?)\s+(\d+(\.\d+)?)$/);
  if (match) {
    return { name: match[1].trim(), quantity: match[2] };
  }
  return { name: text.trim(), quantity: null };
};

const SuggestionDialog = ({ isOpen, suggestions, onSelect, onClose, originalName }: {
    isOpen: boolean;
    suggestions: Medicine[];
    onSelect: (name: string) => void;
    onClose: () => void;
    originalName: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Did you mean...</DialogTitle>
          <DialogDescription>
            We found some close matches for "{originalName}". Please select the correct item.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-2 pt-4">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              variant="outline"
              onClick={() => onSelect(suggestion.name)}
            >
              {suggestion.name}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => onSelect(originalName)}>
            Keep original: "{originalName}"
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function Dashboard() {
  const [usageText, setUsageText] = useState("");
  const [stats, setStats] = useState({ totalMedicines: 0, criticalStock: 0, lowStock: 0, goodStock: 0 });
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const [suggestionState, setSuggestionState] = useState<{
    isOpen: boolean;
    suggestions: Medicine[];
    originalName: string;
    originalQuantity: string | null;
  }>({
    isOpen: false,
    suggestions: [],
    originalName: '',
    originalQuantity: null,
  });
  const RED_THRESHOLD = 29;
  const ORANGE_THRESHOLD = 30;
  const YELLOW_THRESHOLD = 40;

  const handleLogUsage = async () => {
    if (!usageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter usage information",
        variant: "destructive"
      });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/log_usage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: usageText }),
      });
      const result = await response.json();
      if (result.success) {
        toast({ title: "Success", description: "Usage logged successfully" });
        setUsageText("");
        fetchStats();
      } else {
        toast({ title: "Error", description: result.message || "Failed to log usage. Check format: 'medicine_name quantity'", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error logging usage:", error);
      toast({ title: "Error", description: "Failed to connect to server or log usage.", variant: "destructive" });
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Browser Not Supported", description: "Speech recognition is not supported in your browser.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast({ title: "Listening...", description: "Please speak the medicine name and quantity (e.g., 'betadine 5')." });
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      const { name: potentialName, quantity } = parseTranscript(transcript);

      if (!potentialName) {
        setUsageText(transcript);
        toast({ title: "Text Captured", description: `Could not parse clearly. Please check: "${transcript}"`, variant: "destructive" });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/items/suggest?q=${encodeURIComponent(potentialName)}`);
        const suggestions: Medicine[] = await response.json();

        if (suggestions.length > 0) {
          setSuggestionState({
            isOpen: true,
            suggestions: suggestions,
            originalName: potentialName,
            originalQuantity: quantity
          });
        } else {
          setUsageText(transcript);
          toast({ title: "Text Captured", description: `No close matches found for "${potentialName}". Please verify.` });
        }
      } catch (error) {
        console.error("Suggestion fetch error:", error);
        setUsageText(transcript); // Fallback on error
        // toast({ title: "Error", description: "Could not fetch suggestions. Populating with raw text.", variant: "destructive" });
      }
    };

    recognition.onerror = (event) => {
      setIsListening(false);
      console.error("Speech recognition error:", event.error);
      toast({ title: "Speech Recognition Error", description: `Error: ${event.error}. Please try again.`, variant: "destructive" });
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSuggestionSelect = (selectedName: string) => {
    const { originalQuantity } = suggestionState;
    const correctedText = originalQuantity ? `${selectedName} ${originalQuantity}` : selectedName;
    setUsageText(correctedText);

    setSuggestionState({ isOpen: false, suggestions: [], originalName: '', originalQuantity: null });

    toast({
      title: "Text Corrected",
      description: `Input updated to: "${correctedText}"`
    });
  };

  const fetchStats = async () => {
    const RED_THRESHOLD = 29;
    const ORANGE_THRESHOLD = 30;
    const YELLOW_THRESHOLD = 40;
    try {
      const response = await fetch(`${API_BASE_URL}/restock`);
      if (response.ok) {
        const data = await response.json();
        const medicinesData: { [key: string]: Medicine } = data.summary || {};

        let critical = 0, low = 0, good = 0;
        Object.values(medicinesData).forEach((medicine: Medicine) => {
          if (medicine.remaining <= RED_THRESHOLD) critical++;
          else if (medicine.remaining <= ORANGE_THRESHOLD) low++;
          else if (medicine.remaining <= YELLOW_THRESHOLD) low++;
          else good++;
        });

        setStats({
          totalMedicines: Object.keys(medicinesData).length,
          criticalStock: critical,
          lowStock: low,
          goodStock: good
        });

      } else {
        console.error("Failed to fetch stats:", response.status, response.statusText);
        toast({
          title: "Error",
          description: `Failed to fetch stats: ${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      toast({
        title: "Error",
        description: "Failed to connect to server for stats.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Medical Inventory Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage your surgical medicine inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMedicines}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <ShoppingCart className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Good Stock</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.goodStock}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Log Usage</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter usage in format: "medicine_name quantity" or use the speech button.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter medicine usage (e.g., betadine 5, lidocaine 10)"
            value={usageText}
            onChange={(e) => setUsageText(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex gap-2">
            <Button
              onClick={startListening}
              disabled={isListening}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              {isListening ? "Listening..." : "Start Speaking"}
            </Button>
            <Button onClick={handleLogUsage} className="w-full">
              Log Usage
            </Button>
          </div>
        </CardContent>
      </Card>

      <SuggestionDialog
        isOpen={suggestionState.isOpen}
        suggestions={suggestionState.suggestions}
        originalName={suggestionState.originalName}
        onSelect={handleSuggestionSelect}
        onClose={() => setSuggestionState({ ...suggestionState, isOpen: false })}
      />
    </div>
  );
}