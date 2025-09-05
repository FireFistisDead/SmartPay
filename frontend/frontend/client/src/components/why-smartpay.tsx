import { motion } from "framer-motion";
import { Shield, Zap, Eye, Lock } from "lucide-react";

const features = [
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Trust",
    description: "Smart contracts ensure automatic payment release based on predefined milestones"
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: "Automation",
    description: "No manual intervention needed - payments are triggered automatically upon milestone completion"
  },
  {
    icon: <Lock className="h-8 w-8" />,
    title: "Security",
    description: "Funds are securely held in escrow smart contracts until work is completed and verified"
  },
  {
    icon: <Eye className="h-8 w-8" />,
    title: "Transparency",
    description: "All transactions and milestone progress are recorded on the blockchain for full transparency"
  }
];

export default function WhySmartPay() {
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
            Why SmartPay?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built with blockchain technology to solve the fundamental trust issues in freelance work
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="text-center p-6 rounded-xl glass-morphism border border-border/50 hover:border-primary/30 transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <div className="text-primary">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
