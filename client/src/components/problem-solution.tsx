import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Clock, AlertTriangle, UserX, Percent, Zap, Shield, Handshake, Coins } from "lucide-react";

const ProblemCard = ({ icon, title, description, delay = 0 }: { icon: React.ReactNode; title: string; description: string; delay?: number }) => (
  <motion.div 
    className="glass-morphism p-6 rounded-xl border-l-4 border-red-400"
    initial={{ opacity: 0, x: -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-red-400/20 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="text-xl font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  </motion.div>
);

const SolutionCard = ({ icon, title, description, delay = 0 }: { icon: React.ReactNode; title: string; description: string; delay?: number }) => (
  <motion.div 
    className="glass-morphism p-6 rounded-xl border-l-4 border-green-400"
    initial={{ opacity: 0, x: 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
  >
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="text-xl font-semibold mb-2">{title}</h4>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  </motion.div>
);

export default function ProblemSolution() {
  const { ref } = useScrollAnimation();

  return (
    <section id="problem-solution" className="py-24 pt-32" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-bold gradient-text mb-6" data-testid="text-problem-title">
            Why Traditional Freelancing Fails
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-problem-subtitle">
            From payment delays to trust issues, the current freelance ecosystem is broken. 
            SmartPay fixes these fundamental problems with blockchain technology.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Problems */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-red-400 mb-8" data-testid="text-problems-heading">
              Traditional Problems
            </h3>
            
            <ProblemCard
              icon={<Clock className="text-red-400 text-xl" />}
              title="Payment Delays"
              description="Freelancers wait weeks or months for payment, affecting cash flow and trust."
              delay={0}
            />

            <ProblemCard
              icon={<AlertTriangle className="text-red-400 text-xl" />}
              title="Dispute Nightmares"
              description="Lengthy arbitration processes with unclear outcomes and high fees."
              delay={0.1}
            />

            <ProblemCard
              icon={<UserX className="text-red-400 text-xl" />}
              title="Trust Issues"
              description="No guarantee that work will be paid for or delivered as promised."
              delay={0.2}
            />

            <ProblemCard
              icon={<Percent className="text-red-400 text-xl" />}
              title="High Platform Fees"
              description="Traditional platforms charge 10-20% fees, reducing earnings significantly."
              delay={0.3}
            />
          </div>

          {/* Solutions */}
          <div className="space-y-8">
            <h3 className="text-3xl font-bold text-green-400 mb-8" data-testid="text-solutions-heading">
              SmartPay Solutions
            </h3>
            
            <SolutionCard
              icon={<Zap className="text-green-400 text-xl" />}
              title="Instant Payments"
              description="Smart contracts automatically release payments upon milestone completion."
              delay={0}
            />

            <SolutionCard
              icon={<Shield className="text-green-400 text-xl" />}
              title="Automated Escrow"
              description="Funds are secured in smart contracts, ensuring payment security for all parties."
              delay={0.1}
            />

            <SolutionCard
              icon={<Handshake className="text-green-400 text-xl" />}
              title="Transparent Trust"
              description="Blockchain-verified ratings and immutable transaction history."
              delay={0.2}
            />

            <SolutionCard
              icon={<Coins className="text-green-400 text-xl" />}
              title="Minimal Fees"
              description="Only blockchain transaction fees - no platform commissions."
              delay={0.3}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
