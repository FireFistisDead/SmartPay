import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { useSmartAnimations } from "@/hooks/use-smart-animations";
import { Rocket, PlayCircle, Clock, Shield, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeatureHighlight = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="text-center">
    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

export default function CallToAction() {
  const [, setLocation] = useLocation();
  const { ref } = useScrollAnimation();
  const { calculateAnimationConfig, getViewportConfig } = useSmartAnimations();

  const handleGetStarted = () => {
    setLocation("/login");
  };

  return (
    <section className="py-24 relative overflow-hidden blockchain-grid" ref={ref}>
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={calculateAnimationConfig({ duration: 0.8 })}
          viewport={getViewportConfig()}
        >
          <h2 className="text-6xl md:text-7xl font-bold gradient-text mb-8" data-testid="text-cta-title">
            Ready to Experience the Future?
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12" data-testid="text-cta-subtitle">
            Join thousands of clients and freelancers who have already discovered the power of 
            blockchain-based freelancing. Start your first project today.
          </p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={calculateAnimationConfig({ duration: 0.8, delay: 0.2 })}
            viewport={getViewportConfig()}
          >
            <Button 
              size="lg" 
              className="px-12 py-6 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xl font-semibold hover:scale-105 transition-transform animate-glow"
              data-testid="button-get-started"
              onClick={handleGetStarted}
            >
              <Rocket className="mr-3" />
              Get Started on Blockchain Freelancing
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="px-12 py-6 glass-morphism text-foreground rounded-xl text-xl font-semibold hover:scale-105 transition-transform"
              data-testid="button-watch-demo"
            >
              <PlayCircle className="mr-3" />
              Watch Demo
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={calculateAnimationConfig({ duration: 0.8, delay: 0.4 })}
            viewport={getViewportConfig()}
          >
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={calculateAnimationConfig({ 
                  duration: 0.6, 
                  delay: 0.6 + index * 0.1 
                })}
                viewport={getViewportConfig()}
              >
                <FeatureHighlight
                  icon={index === 0 ? <Clock className="text-white text-2xl" /> : index === 1 ? <Shield className="text-white text-2xl" /> : <Handshake className="text-white text-2xl" />}
                  title={index === 0 ? "Launch in Minutes" : index === 1 ? "100% Secure" : "Guaranteed Trust"}
                  description={index === 0 ? "Connect your wallet and start your first project immediately" : index === 1 ? "Your funds are protected by audited smart contracts" : "Blockchain-verified reputation and automatic payments"}
                />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
