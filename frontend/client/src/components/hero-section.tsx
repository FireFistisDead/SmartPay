import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useParallax } from "@/hooks/use-parallax";
import { useSmartAnimations, useCursorSpeed } from "@/hooks/use-smart-animations";
import { Button } from "@/components/ui/button";
import { UserCheck, Laptop } from "lucide-react";
import ParticleBackground from "./particle-background";

const FloatingIcon = ({ icon, className, delay = 0 }: { icon: React.ReactNode; className: string; delay?: number }) => {
  const { cursorSpeed } = useCursorSpeed();
  
  return (
    <motion.div
      className={`absolute text-4xl opacity-20 ${className} will-change-transform`}
      initial={{ y: -5, opacity: 0.15 }}
      animate={{ y: 5, opacity: 0.25 }}
      whileHover={{ 
        y: 0, 
        opacity: 0.4,
        scale: 1.1,
        transition: { 
          duration: cursorSpeed > 300 ? 0.2 : 0.6,
          ease: "easeOut"
        }
      }}
      transition={{
        duration: 4,
        ease: "easeInOut",
        delay,
      }}
    >
      {icon}
    </motion.div>
  );
};

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const { ref } = useParallax(0.5);
  const { calculateAnimationConfig } = useSmartAnimations();
  const { cursorSpeed } = useCursorSpeed();

  const handleHireTalent = () => {
    setLocation("/login?role=client");
  };

  const handleWorkAsFreelancer = () => {
    setLocation("/login?role=freelancer");
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden blockchain-grid pt-20" ref={ref}>
      <ParticleBackground />
      {/* Floating Icons */}
      <div className="absolute inset-0 z-10">
        <FloatingIcon 
          icon={<span className="text-primary">Ξ</span>} 
          className="top-20 left-10" 
          delay={0} 
        />
        <FloatingIcon 
          icon={<div className="w-8 h-8 bg-secondary rounded border-2 border-secondary"></div>} 
          className="top-32 right-20" 
          delay={1} 
        />
        <FloatingIcon 
          icon={<span className="text-accent">₿</span>} 
          className="bottom-32 left-1/4" 
          delay={2} 
        />
        <FloatingIcon 
          icon={<div className="w-6 h-6 bg-primary rounded-full border-2 border-primary"></div>} 
          className="top-1/2 right-10" 
          delay={1.5} 
        />
        <FloatingIcon 
          icon={<span className="text-secondary">◈</span>} 
          className="bottom-20 right-1/3" 
          delay={0.5} 
        />
      </div>

      <div className="container mx-auto px-6 text-center z-20">
        <div className="max-w-5xl mx-auto">
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight tracking-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={calculateAnimationConfig({ duration: 0.8 })}
            data-testid="text-hero-title"
          >
            <span className="gradient-text block">Decentralized Freelance.</span>
            <span className="gradient-text block">Automated Payments.</span>
            <span className="gradient-text block">Total Trust.</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={calculateAnimationConfig({ duration: 0.8, delay: 0.2 })}
            data-testid="text-hero-subtitle"
          >
            A blockchain-powered platform that automates milestone-based payments through smart contracts, 
            eliminating disputes and ensuring trust between clients and freelancers.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-5 justify-center mb-13"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={calculateAnimationConfig({ duration: 0.8, delay: 0.4 })}
          >
            <motion.div
              whileHover={{ 
                scale: 1.05,
                transition: { duration: cursorSpeed > 300 ? 0.15 : 0.3 }
              }}
            >
              <Button 
                size="lg" 
                className="px-7 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-lg font-semibold hover:scale-105 transition-all duration-300 animate-glow shadow-lg hover:shadow-xl"
                data-testid="button-hire-talent"
                onClick={handleHireTalent}
              >
                <UserCheck className="mr-2" />
                Hire Talent
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ 
                scale: 1.05,
                transition: { duration: cursorSpeed > 300 ? 0.15 : 0.3 }
              }}
            >
              <Button 
                size="lg" 
                variant="outline" 
                className="px-7 py-4 glass-morphism text-foreground rounded-xl text-lg font-semibold hover:scale-105 transition-all duration-300 hover:bg-muted/20 border-muted-foreground/30 animate-glow-secondary shadow-lg hover:shadow-xl"
                data-testid="button-work-freelancer"
                onClick={handleWorkAsFreelancer}
              >
                <Laptop className="mr-2" />
                Work as Freelancer
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
