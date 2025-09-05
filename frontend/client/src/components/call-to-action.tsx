import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
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
  const { ref } = useScrollAnimation();

  return (
    <section className="py-24 relative overflow-hidden blockchain-grid" ref={ref}>
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
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
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Button 
              size="lg" 
              className="px-12 py-6 bg-gradient-to-r from-primary to-secondary text-white rounded-xl text-xl font-semibold hover:scale-105 transition-transform animate-glow"
              data-testid="button-get-started"
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
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <FeatureHighlight
              icon={<Clock className="text-white text-2xl" />}
              title="Launch in Minutes"
              description="Connect your wallet and start your first project immediately"
            />
            <FeatureHighlight
              icon={<Shield className="text-white text-2xl" />}
              title="100% Secure"
              description="Your funds are protected by audited smart contracts"
            />
            <FeatureHighlight
              icon={<Handshake className="text-white text-2xl" />}
              title="Guaranteed Trust"
              description="Blockchain-verified reputation and automatic payments"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
