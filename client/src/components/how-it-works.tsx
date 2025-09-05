import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Plus, Lock, Upload, CheckCircle, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TimelineStep = ({ 
  step, 
  icon, 
  title, 
  description, 
  color, 
  children, 
  delay = 0 
}: { 
  step: number; 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  color: string; 
  children?: React.ReactNode; 
  delay?: number; 
}) => (
  <motion.div 
    className="relative pl-20 pb-16"
    initial={{ opacity: 0, x: -50 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay }}
    viewport={{ once: true }}
    data-testid={`timeline-step-${step}`}
  >
    <div className={`absolute left-4 w-8 h-8 ${color} rounded-full flex items-center justify-center border-4 border-background`}>
      <span className="text-sm font-bold text-white">{step}</span>
    </div>
    <div className="glass-morphism p-8 rounded-xl">
      <div className="flex items-start space-x-6">
        <div className={`w-16 h-16 bg-gradient-to-r ${color.replace('bg-', 'from-')} to-secondary rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-muted-foreground mb-4">{description}</p>
          {children}
        </div>
      </div>
    </div>
  </motion.div>
);

export default function HowItWorks() {
  const { ref } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-24 bg-muted/20" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-bold gradient-text mb-6" data-testid="text-how-it-works-title">
            How SmartyPay Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-how-it-works-subtitle">
            Experience the future of freelancing with our automated, blockchain-powered workflow that ensures 
            trust, transparency, and instant payments.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-secondary to-accent rounded-full"></div>

            <TimelineStep
              step={1}
              icon={<Plus className="text-white text-2xl" />}
              title="Project Creation"
              description="Client creates a project with clear milestones, deliverables, and payment amounts. Each milestone is defined with specific criteria and deadlines."
              color="bg-primary"
              delay={0}
            >
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm">Define Scope</span>
                <span className="px-3 py-1 bg-secondary/20 text-secondary rounded-full text-sm">Set Milestones</span>
                <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">Specify Budget</span>
              </div>
            </TimelineStep>

            <TimelineStep
              step={2}
              icon={<Lock className="text-white text-2xl" />}
              title="Smart Contract Escrow"
              description="Client deposits the full project amount into a smart contract. Funds are locked and cannot be withdrawn until milestones are completed and approved."
              color="bg-secondary"
              delay={0.1}
            >
              <div className="bg-muted/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Escrow Status</span>
                  <span className="text-sm text-green-400">Secured</span>
                </div>
                <Progress value={100} className="h-2" />
              </div>
            </TimelineStep>

            <TimelineStep
              step={3}
              icon={<Upload className="text-white text-2xl" />}
              title="Work Submission"
              description="Freelancer completes milestones and submits deliverables through IPFS for decentralized storage. All submissions are timestamped on the blockchain."
              color="bg-accent"
              delay={0.2}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/20 p-3 rounded-lg">
                  <div className="text-primary mb-2">📄</div>
                  <div className="text-sm text-muted-foreground">Code Delivery</div>
                </div>
                <div className="bg-muted/20 p-3 rounded-lg">
                  <div className="text-secondary mb-2">🎨</div>
                  <div className="text-sm text-muted-foreground">Design Assets</div>
                </div>
              </div>
            </TimelineStep>

            <TimelineStep
              step={4}
              icon={<CheckCircle className="text-white text-2xl" />}
              title="Approval & Auto-Payment"
              description="Client reviews and approves the work. Smart contract automatically releases payment to freelancer's wallet instantly - no delays, no manual processing."
              color="bg-green-400"
              delay={0.3}
            >
              <div className="flex items-center space-x-4 text-green-400">
                <span className="text-2xl animate-pulse">💰</span>
                <span className="text-lg font-semibold">Payment Released: 2.5 ETH</span>
                <span>→</span>
                <span className="text-2xl">👛</span>
              </div>
            </TimelineStep>

            <TimelineStep
              step={5}
              icon={<Star className="text-white text-2xl" />}
              title="Completion & Feedback"
              description="Both parties leave blockchain-verified ratings and reviews. These create permanent reputation scores that cannot be manipulated or deleted."
              color="bg-purple-400"
              delay={0.4}
            >
              <div className="flex space-x-6">
                <div className="text-center">
                  <div className="flex text-yellow-400 text-xl mb-1">
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                  </div>
                  <div className="text-sm text-muted-foreground">Client Rating</div>
                </div>
                <div className="text-center">
                  <div className="flex text-yellow-400 text-xl mb-1">
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                    <Star className="fill-current" />
                  </div>
                  <div className="text-sm text-muted-foreground">Freelancer Rating</div>
                </div>
              </div>
            </TimelineStep>
          </div>
        </div>
      </div>
    </section>
  );
}
