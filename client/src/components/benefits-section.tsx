import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Wand2, Shield, Eye, Lock, Globe, Percent } from "lucide-react";
import { CheckCircle } from "lucide-react";

const BenefitCard = ({ 
  icon, 
  title, 
  description, 
  features, 
  delay = 0 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  features: string[]; 
  delay?: number; 
}) => (
  <motion.div 
    className="glass-morphism p-8 rounded-2xl card-hover"
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center mb-6">
      {icon}
    </div>
    <h3 className="text-2xl font-bold mb-4">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    <ul className="space-y-2 text-sm">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center space-x-2">
          <CheckCircle className="text-green-400 w-4 h-4" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

export default function BenefitsSection() {
  const { ref } = useScrollAnimation();

  return (
    <section id="benefits" className="py-24" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-bold gradient-text mb-6" data-testid="text-benefits-title">
            Why Choose SmartPay
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-benefits-subtitle">
            Experience the benefits of blockchain-powered freelancing that puts trust, transparency, 
            and automation at the center of every project.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <BenefitCard
            icon={<Wand2 className="text-white text-2xl" />}
            title="Complete Automation"
            description="Smart contracts handle everything automatically - from escrow to payments to dispute resolution. No manual intervention needed."
            features={[
              "Automatic milestone payments",
              "Smart escrow management",
              "Automated dispute handling"
            ]}
            delay={0}
          />

          <BenefitCard
            icon={<Shield className="text-white text-2xl" />}
            title="Unbreakable Trust"
            description="Blockchain-verified ratings, immutable transaction history, and cryptographic proof of work completion ensure complete trust."
            features={[
              "Immutable reputation system",
              "Cryptographic work proof",
              "Transparent transaction history"
            ]}
            delay={0.1}
          />

          <BenefitCard
            icon={<Eye className="text-white text-2xl" />}
            title="Full Transparency"
            description="Every transaction, rating, and interaction is recorded on the blockchain. Complete visibility into all aspects of the freelancing process."
            features={[
              "Public transaction records",
              "Open smart contract code",
              "Verifiable platform metrics"
            ]}
            delay={0.2}
          />

          <BenefitCard
            icon={<Lock className="text-white text-2xl" />}
            title="Bank-Level Security"
            description="Multi-signature wallets, audited smart contracts, and decentralized infrastructure provide enterprise-grade security."
            features={[
              "Multi-signature protection",
              "Audited smart contracts",
              "Decentralized infrastructure"
            ]}
            delay={0.3}
          />

          <BenefitCard
            icon={<Globe className="text-white text-2xl" />}
            title="Global Access"
            description="Work with anyone, anywhere in the world. No geographic restrictions, currency barriers, or banking limitations."
            features={[
              "No geographic limits",
              "Instant global payments",
              "Universal currency support"
            ]}
            delay={0.4}
          />

          <BenefitCard
            icon={<Percent className="text-white text-2xl" />}
            title="Minimal Fees"
            description="Only pay blockchain transaction fees - no platform commissions or hidden charges. Keep more of what you earn."
            features={[
              "No platform commissions",
              "Only gas fees apply",
              "Transparent fee structure"
            ]}
            delay={0.5}
          />
        </div>
      </div>
    </section>
  );
}
