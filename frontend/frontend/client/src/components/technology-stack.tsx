import { motion } from "framer-motion";

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
  return (
    <section className="py-20 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Technology Stack
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with cutting-edge technologies for a robust and scalable platform
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-4xl mx-auto">
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              className="text-center p-6 rounded-xl glass-morphism border border-border/50 hover:border-primary/30 transition-all duration-300 group"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05, y: -5 }}
            >
              <motion.div
                className="text-4xl mb-3"
                animate={{ 
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2
                }}
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
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20">
            <span className="text-sm font-medium">🚀 Deployed on Ethereum & Polygon Testnets</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
