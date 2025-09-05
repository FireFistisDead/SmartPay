import { motion } from "framer-motion";
import { Shield, Coins, Scale, Eye } from "lucide-react";

const features = [
  {
    icon: <Coins className="h-8 w-8" />,
    title: "Milestone Payments",
    description: "Break down projects into milestones with automatic payment release upon completion. Reduces risk for both parties.",
    color: "from-slate-600 to-slate-700",
    benefits: ["Reduced project risk", "Better cash flow", "Clear progress tracking"]
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: "Escrow Security",
    description: "Smart contracts hold funds securely until work is completed and verified. No more payment disputes.",
    color: "from-slate-700 to-slate-800",
    benefits: ["Guaranteed payments", "Fraud protection", "Trust building"]
  },
  {
    icon: <Scale className="h-8 w-8" />,
    title: "Dispute Handling",
    description: "Automated dispute resolution through smart contract logic and optional human arbitration.",
    color: "from-slate-600 to-slate-700",
    benefits: ["Fair resolution", "Quick processing", "Cost effective"]
  },
  {
    icon: <Eye className="h-8 w-8" />,
    title: "Blockchain Transparency",
    description: "All transactions, payments, and project progress are recorded on-chain for complete transparency.",
    color: "from-slate-700 to-slate-800",
    benefits: ["Full transparency", "Immutable records", "Audit trail"]
  }
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            Core Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Innovative features designed to revolutionize freelance work through blockchain technology
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group p-8 rounded-2xl glass-morphism border border-border/50 hover:border-primary/30 transition-all duration-500 relative overflow-hidden"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              <div className="relative z-10">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="space-y-2">
                  {feature.benefits.map((benefit, idx) => (
                    <motion.div
                      key={benefit}
                      className="flex items-center text-sm"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: (index * 0.2) + (idx * 0.1) }}
                      viewport={{ once: true, margin: "-30px" }}
                    >
                      <div className={`w-2 h-2 bg-gradient-to-r ${feature.color} rounded-full mr-3`}></div>
                      <span className="text-muted-foreground">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full">
            <span className="text-sm font-medium">🔒 All features secured by smart contracts</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
