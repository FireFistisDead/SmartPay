import { motion } from "framer-motion";
import { Rocket, Globe, Users, TrendingUp, Zap, Star } from "lucide-react";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

const visionItems = [
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Global Marketplace",
    description: "Expand to a worldwide platform connecting millions of freelancers and clients",
    timeline: "Phase 1"
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "DAO Governance",
    description: "Community-driven platform decisions through decentralized autonomous organization",
    timeline: "Phase 2"
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Advanced Analytics",
    description: "AI-powered matching, performance analytics, and predictive project success rates",
    timeline: "Phase 3"
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Cross-Chain Support",
    description: "Multi-blockchain compatibility for broader cryptocurrency and DeFi integration",
    timeline: "Phase 4"
  },
  {
    icon: <Star className="h-6 w-6" />,
    title: "Reputation System",
    description: "NFT-based reputation tokens and skill verification through blockchain credentials",
    timeline: "Phase 5"
  }
];

export default function FutureVision() {
  const { calculateAnimationConfig, getViewportConfig, scrollMetrics } = useSmartAnimations();

  return (
    <section id="future-vision" className="py-20 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={calculateAnimationConfig({ duration: 0.8 })}
          viewport={getViewportConfig({ once: true })}
        >
          <motion.div
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-primary rounded-full mb-6"
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
          >
            <Rocket className="h-4 w-4 mr-2" />
            <span className="text-sm font-semibold">Future Roadmap</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            The Future of Decentralized Work
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From hackathon prototype to global marketplace - our vision for transforming the future of work
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent hidden md:block"></div>
            
            {visionItems.map((item, index) => {
              const animationConfig = calculateAnimationConfig({ 
                duration: 0.8,
                delay: scrollMetrics.isScrolling ? 0 : index * 0.1
              });

              return (
                <motion.div
                  key={item.title}
                  className="flex items-start mb-12 last:mb-0 relative"
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={animationConfig}
                  viewport={getViewportConfig({ once: true })}
                >
                  {/* Timeline dot */}
                  <motion.div
                    className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center text-white mr-6 relative z-10 will-change-transform"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 0 25px rgba(139, 92, 246, 0.6)",
                      transition: { duration: 0.2 }
                    }}
                  >
                    {item.icon}
                  </motion.div>
                  
                  <div className="flex-1 pt-2">
                    <div className="flex items-center mb-3">
                      <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full mr-3">
                        {item.timeline}
                      </span>
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <motion.div
          className="text-center mt-16 space-y-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={calculateAnimationConfig({ duration: 0.8, delay: 0.3 })}
          viewport={getViewportConfig({ once: true })}
        >
          <div className="max-w-2xl mx-auto p-6 glass-morphism rounded-2xl border border-primary/20">
            <h3 className="text-lg font-semibold mb-3 gradient-text">Ready to Join the Revolution?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              This hackathon prototype represents just the beginning. Help us build the future of decentralized work.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <div className="px-3 py-1 bg-green-500/10 text-green-600 rounded-full text-xs font-medium">
                Open Source
              </div>
              <div className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-xs font-medium">
                Community Driven
              </div>
              <div className="px-3 py-1 bg-purple-500/10 text-purple-600 rounded-full text-xs font-medium">
                DAO Governed
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
