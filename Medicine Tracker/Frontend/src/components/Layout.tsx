import { Link, useLocation } from "react-router-dom";
import { Activity, Package, ShoppingCart, TrendingUp, RotateCcw, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: Activity },
  { name: "Usage Log", href: "/usage-log", icon: FileText },
  { name: "Stock Status", href: "/restock", icon: Package },
  { name: "Buy List", href: "/buy-list", icon: ShoppingCart },
  { name: "Restock", href: "/restock-medicine", icon: RotateCcw },
  { name: "Forecast", href: "/forecast", icon: TrendingUp },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h1 className="text-xl font-bold text-foreground">MedStock Pro</h1>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-card border-r border-border min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}