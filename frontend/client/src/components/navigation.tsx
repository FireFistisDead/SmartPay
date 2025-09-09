import { motion } from "framer-motion";
import { Wallet, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
    setIsMenuOpen(false);
  };

  return (
    <motion.nav 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 w-full z-50 glass-morphism backdrop-blur-xl border-b border-white/10"
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
              <Wallet className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold gradient-text">SmartPay</span>
          </motion.div>
          
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              data-testid="nav-how-it-works"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              data-testid="nav-about"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              data-testid="nav-features"
            >
              Features
            </button>
          </div>

          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={toggleMenu}
              data-testid="button-mobile-menu"
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            {/* Desktop buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                size="sm"
                onClick={() => window.location.href = "/login"}
                data-testid="button-launch-app"
              >
                Login/SignUp
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isMenuOpen ? 1 : 0, 
            height: isMenuOpen ? "auto" : 0 
          }}
          transition={{ duration: 0.3 }}
          className="md:hidden overflow-hidden border-t border-border/20"
        >
          <div className="px-6 py-4 space-y-4">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              data-testid="nav-mobile-how-it-works"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              data-testid="nav-mobile-about"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              data-testid="nav-mobile-features"
            >
              Features
            </button>
            <div className="flex items-center space-x-3 pt-2">
              <Button 
                size="sm"
                onClick={() => window.location.href = "/login"}
                data-testid="button-mobile-launch-app"
                className="flex-1"
              >
                Login/SignUp
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
  );
}
