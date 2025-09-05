import { motion } from "framer-motion";
import { PlusCircle, Lock, FileCheck, CreditCard, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: <PlusCircle className="h-8 w-8" />,
    title: "Client Posts Project",
    description: "Client creates a project with detailed requirements and milestone-based payment structure",
    color: "from-slate-600 to-slate-700"
  },
  {
    icon: <Lock className="h-8 w-8" />,
    title: "Funds Secured in Escrow",
    description: "Smart contract locks the agreed payment amount, ensuring funds are available for release",
    color: "from-slate-700 to-slate-800"
  },
  {
    icon: <FileCheck className="h-8 w-8" />,
    title: "Freelancer Submits Work",
    description: "Completed deliverables are submitted and verified against predefined milestone criteria",
    color: "from-slate-600 to-slate-700"
  },
  {
    icon: <CreditCard className="h-8 w-8" />,
    title: "Automatic Payment",
    description: "Smart contract automatically releases payment once milestone conditions are met",
    color: "from-slate-700 to-slate-800"
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-muted/20 relative overflow-hidden blockchain-grid">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, secure, and transparent workflow powered by smart contracts
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              className="flex items-center mb-12 last:mb-0"
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              viewport={{ once: true, margin: "-50px" }}
            >
              <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center text-white mr-6`}>
                {step.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground mr-3">
                    Step {index + 1}
                  </span>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <motion.div
                  className="flex-shrink-0 ml-6 text-muted-foreground"
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <ArrowRight className="h-6 w-6" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20">
            <span className="text-sm font-medium">⚡ Average processing time: 2-5 minutes</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
