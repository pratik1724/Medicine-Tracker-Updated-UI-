import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import UsageLog from "./pages/UsageLog";
import StockStatus from "./pages/StockStatus";
import BuyList from "./pages/BuyList";
import RestockMedicine from "./pages/RestockMedicine";
import Forecast from "./pages/Forecast";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usage-log" element={<UsageLog />} />
            <Route path="/restock" element={<StockStatus />} />
            <Route path="/buy-list" element={<BuyList />} />
            <Route path="/restock-medicine" element={<RestockMedicine />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
