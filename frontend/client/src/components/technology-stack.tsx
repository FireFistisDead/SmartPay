import { motion } from "framer-motion";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

const technologies = [
  { name: "Solidity", icon: "⚡", category: "Smart Contracts" },
  { name: "Hardhat", icon: "🔨", category: "Development" },
  { name: "React", icon: "⚛️", category: "Frontend" },
  { name: "Tailwind", icon: "🎨", category: "Styling" },
  { name: "Node.js", icon: "🟢", category: "Backend" },
  { name: "MongoDB", icon: "🍃", category: "Database" },
  { name: "IPFS", icon: "🌐", category: "Storage" },
  { name: "ethers.js", icon: "📱", category: "Web3" },
  { name: "Chainlink", icon: "🔗", category: "Oracles" }
];

export default function TechnologyStack() {
  const { calculateAnimationConfig, getViewportConfig, scrollMetrics } = useSmartAnimations();

  return (
    <section id="technology-stack" className="py-20 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={calculateAnimationConfig({ duration: 0.8 })}
          viewport={getViewportConfig({ once: true })}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Technology Stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with cutting-edge technologies for a robust and scalable platform
          </p>
        </motion.div>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
          {technologies.map((tech, index) => {
            const animationConfig = calculateAnimationConfig({ 
              duration: 0.5,
              delay: scrollMetrics.isScrolling ? 0 : index * 0.03
            });

            return (
              <motion.div
                key={tech.name}
    className="text-center p-6 rounded-xl glass-morphism border border-border/50 hover:border-primary/30 transition-transform duration-300 group performance-optimized transform-gpu composite-layer"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
    transition={animationConfig}
    viewport={{ once: true, amount: 0.25 }}
    style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', willChange: 'transform, opacity', contain: 'layout paint style' }}
                whileHover={{ 
                  scale: 1.02, 
                  y: -2,
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
              >
                <motion.div
      className="text-4xl mb-3"
                  whileHover={{ 
                    rotate: [0, 10, -10, 0],
                    transition: { duration: 0.6 }
                  }}
      style={{ willChange: 'transform', backfaceVisibility: 'hidden' }}
                >
                  {tech.icon}
                </motion.div>
                <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
                  {tech.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {tech.category}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={calculateAnimationConfig({ duration: 0.8, delay: 0.3 })}
          viewport={getViewportConfig({ once: true })}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20">
            <span className="text-sm font-medium">🚀 Deployed on Ethereum & Polygon Testnets</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
