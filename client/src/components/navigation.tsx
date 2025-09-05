import { motion } from "framer-motion";
import { Link, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 w-full z-50 glass-morphism"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <Link className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold gradient-text">SmartPay</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#how-it-works" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-how-it-works"
            >
              How It Works
            </a>
            <a 
              href="#benefits" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-benefits"
            >
              Benefits
            </a>
            <a 
              href="#dashboard" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="nav-features"
            >
              Features
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm"
              data-testid="button-wallet"
            >
              <Wallet className="h-4 w-4" />
            </Button>
            <Button 
              size="sm"
              onClick={() => window.location.href = "/login"}
              data-testid="button-launch-app"
            >
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
