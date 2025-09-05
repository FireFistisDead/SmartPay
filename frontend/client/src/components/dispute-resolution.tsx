import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { AlertTriangle, Pause, Scale, Gavel, Clock, Users, Bot } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const DisputeStep = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="flex items-start space-x-4">
    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  </div>
);

const TrustMetric = ({ label, value, progress, note }: { label: string; value: string; progress: number; note: string }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
    <Progress value={progress} className="h-2 mb-1" />
    <p className="text-xs text-muted-foreground">{note}</p>
  </div>
);

export default function DisputeResolution() {
  const { ref } = useScrollAnimation();

  return (
    <section id="dispute" className="py-24 bg-muted/20" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <h2 className="text-5xl font-bold gradient-text mb-6" data-testid="text-dispute-title">
            Bulletproof Dispute Resolution
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-dispute-subtitle">
            When disagreements arise, our decentralized oracle system ensures fair, fast, and transparent resolution 
            without lengthy arbitration processes.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Dispute Process Illustration */}
            <motion.div 
              className="glass-morphism p-8 rounded-2xl"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-6" data-testid="text-dispute-process">
                How Disputes Are Resolved
              </h3>
              
              <div className="space-y-6">
                <DisputeStep
                  icon={<AlertTriangle className="text-red-400" />}
                  title="Dispute Initiated"
                  description="Either party can raise a dispute if milestone requirements aren't met"
                />

                <DisputeStep
                  icon={<Pause className="text-primary" />}
                  title="Escrow Paused"
                  description="Smart contract automatically freezes all payments until resolution"
                />

                <DisputeStep
                  icon={<Scale className="text-secondary" />}
                  title="Oracle Review"
                  description="Decentralized oracle network reviews evidence and project requirements"
                />

                <DisputeStep
                  icon={<Gavel className="text-green-400" />}
                  title="Automated Resolution"
                  description="Smart contract executes the decision and distributes funds accordingly"
                />
              </div>

              <div className="mt-8 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Clock className="text-accent" />
                  <div>
                    <h5 className="font-semibold text-accent">Average Resolution Time</h5>
                    <p className="text-sm text-muted-foreground">24-48 hours vs weeks in traditional platforms</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Trust Metrics */}
            <div className="space-y-8">
              <motion.div 
                className="glass-morphism p-8 rounded-2xl"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h3 className="text-2xl font-bold mb-6" data-testid="text-trust-metrics">
                  Trust Metrics
                </h3>
                
                <div className="space-y-6">
                  <TrustMetric
                    label="Dispute Rate"
                    value="0.8%"
                    progress={1}
                    note="Industry average: 12%"
                  />

                  <TrustMetric
                    label="Resolution Success"
                    value="96.7%"
                    progress={97}
                    note="Satisfactory outcome for both parties"
                  />

                  <TrustMetric
                    label="Oracle Accuracy"
                    value="99.2%"
                    progress={99}
                    note="Verified through post-resolution surveys"
                  />
                </div>
              </motion.div>

              <motion.div 
                className="glass-morphism p-8 rounded-2xl"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <h3 className="text-xl font-bold mb-4" data-testid="text-oracle-network">
                  Oracle Network
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our decentralized oracle network consists of industry experts, smart contracts, and AI systems 
                  working together to ensure fair dispute resolution.
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <Users className="text-primary text-2xl mb-2 mx-auto" />
                    <div className="text-lg font-semibold">50+</div>
                    <div className="text-xs text-muted-foreground">Expert Reviewers</div>
                  </div>
                  <div className="text-center p-4 bg-muted/20 rounded-lg">
                    <Bot className="text-secondary text-2xl mb-2 mx-auto" />
                    <div className="text-lg font-semibold">AI</div>
                    <div className="text-xs text-muted-foreground">Analysis Engine</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
