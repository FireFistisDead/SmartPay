import { motion } from "framer-motion";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import { Plus, MessageSquare, Search, BarChart3, Lock, CheckCircle, TrendingUp, Briefcase, Coins, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) => (
  <div className="bg-muted/20 p-6 rounded-xl">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
      <div className={`${color} text-2xl`}>
        {icon}
      </div>
    </div>
  </div>
);

const ProjectCard = ({ 
  title, 
  freelancer, 
  budget, 
  progress, 
  milestones 
}: { 
  title: string; 
  freelancer: string; 
  budget: string; 
  progress: number; 
  milestones: string; 
}) => (
  <div className="bg-muted/10 border border-border p-6 rounded-xl">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h6 className="text-lg font-semibold">{title}</h6>
        <p className="text-muted-foreground">{freelancer}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{budget}</p>
        <p className="text-sm text-muted-foreground">Budget</p>
      </div>
    </div>
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span>Milestone Progress</span>
        <span>{milestones}</span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
    <div className="flex space-x-3">
      <Button size="sm" data-testid="button-view-details">
        View Details
      </Button>
      <Button variant="outline" size="sm" data-testid="button-message">
        <MessageSquare className="w-4 h-4 mr-2" />
        Message
      </Button>
    </div>
  </div>
);

export default function DashboardShowcase() {
  const { ref } = useScrollAnimation();

  return (
    <section id="dashboard" className="py-24" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-5xl font-bold gradient-text mb-6" data-testid="text-dashboard-title">
            Powerful Dashboards for Everyone
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-dashboard-subtitle">
            Intuitive interfaces designed for both clients and freelancers, with real-time blockchain integration 
            and comprehensive project management tools.
          </p>
        </motion.div>

        {/* Client Dashboard */}
        <motion.div 
          className="mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="text-client-dashboard">
            Client Dashboard
          </h3>
          <div className="glass-morphism rounded-2xl p-8 card-hover">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-bold">Project Overview</h4>
                <p className="text-muted-foreground">Manage your projects and track progress</p>
              </div>
              <Button data-testid="button-new-project">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<BarChart3 />}
                label="Active Projects"
                value="12"
                color="text-primary"
              />
              <StatCard
                icon={<Lock />}
                label="In Escrow"
                value="45.2 ETH"
                color="text-secondary"
              />
              <StatCard
                icon={<CheckCircle />}
                label="Completed"
                value="89"
                color="text-green-400"
              />
              <StatCard
                icon={<TrendingUp />}
                label="Success Rate"
                value="98.5%"
                color="text-accent"
              />
            </div>

            {/* Active Projects */}
            <div>
              <h5 className="text-xl font-semibold mb-4">Active Projects</h5>
              <div className="space-y-4">
                <ProjectCard
                  title="E-commerce Website Redesign"
                  freelancer="by @alexdesigner"
                  budget="5.0 ETH"
                  progress={60}
                  milestones="3/5 Complete"
                />
                <ProjectCard
                  title="Mobile App Development"
                  freelancer="by @reactninja"
                  budget="12.5 ETH"
                  progress={25}
                  milestones="1/4 Complete"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Freelancer Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <h3 className="text-3xl font-bold text-center mb-12" data-testid="text-freelancer-dashboard">
            Freelancer Dashboard
          </h3>
          <div className="glass-morphism rounded-2xl p-8 card-hover">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h4 className="text-2xl font-bold">Work Overview</h4>
                <p className="text-muted-foreground">Track your projects and earnings</p>
              </div>
              <Button variant="secondary" data-testid="button-browse-jobs">
                <Search className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <StatCard
                icon={<Briefcase />}
                label="Active Jobs"
                value="6"
                color="text-primary"
              />
              <StatCard
                icon={<Coins />}
                label="This Month"
                value="18.7 ETH"
                color="text-secondary"
              />
              <StatCard
                icon={<Star />}
                label="Rating"
                value="4.9★"
                color="text-yellow-400"
              />
              <StatCard
                icon={<Trophy />}
                label="Success Rate"
                value="100%"
                color="text-accent"
              />
            </div>

            {/* Current Jobs */}
            <div>
              <h5 className="text-xl font-semibold mb-4">Current Jobs</h5>
              <div className="space-y-4">
                <div className="bg-muted/10 border border-border p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h6 className="text-lg font-semibold">Smart Contract Development</h6>
                      <p className="text-muted-foreground">Client: @cryptostartup</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">Due in 5 days</p>
                      <p className="text-sm text-muted-foreground">Next milestone</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>2/3 Milestones</span>
                    </div>
                    <Progress value={66} className="h-2" />
                  </div>
                  <div className="flex space-x-3">
                    <Button size="sm" data-testid="button-submit-work">
                      Submit Work
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-message-client">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Client
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/10 border border-border p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h6 className="text-lg font-semibold">UI/UX Design System</h6>
                      <p className="text-muted-foreground">Client: @fintech_corp</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-yellow-400">Due in 12 days</p>
                      <p className="text-sm text-muted-foreground">Next milestone</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Overall Progress</span>
                      <span>1/4 Milestones</span>
                    </div>
                    <Progress value={25} className="h-2" />
                  </div>
                  <div className="flex space-x-3">
                    <Button size="sm" data-testid="button-continue-work">
                      Continue Work
                    </Button>
                    <Button variant="outline" size="sm" data-testid="button-message-client-2">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Message Client
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
