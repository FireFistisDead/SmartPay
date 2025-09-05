import { motion } from "framer-motion";
import { Search, Briefcase, Coins, Star, Trophy, MessageSquare, Calendar, Bell, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

const StatCard = ({ icon, label, value, color, description }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
  description: string;
}) => (
  <Card className="glass-morphism border-border/50">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        <div className={`${color} text-2xl`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

const JobCard = ({ 
  title, 
  client, 
  budget, 
  progress, 
  milestones,
  status,
  dueDate,
  priority
}: { 
  title: string; 
  client: string; 
  budget: string; 
  progress: number; 
  milestones: string;
  status: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
}) => (
  <Card className="glass-morphism border-border/50 card-hover">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {client.charAt(1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{client}</span>
            <Badge 
              variant={priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary"} 
              className="text-xs"
            >
              {priority} priority
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-green-400">{budget}</p>
          <Badge variant={status === "active" ? "default" : "secondary"} className="text-xs">
            {status}
          </Badge>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{milestones}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Due: {dueDate}</span>
        </div>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" data-testid="button-message-client">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button size="sm" data-testid="button-continue-work">
            Continue Work
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function FreelancerDashboard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Top Navigation */}
      <nav className="border-b border-border/50 glass-morphism">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">SmartPay</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search jobs..." 
                  className="pl-10 w-64"
                  data-testid="input-search"
                />
              </div>
              
              <Button variant="ghost" size="sm" data-testid="button-notifications">
                <Bell className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" data-testid="button-settings">
                <Settings className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center space-x-2">
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>SM</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">0x8f1A...3cB9</p>
                  <p className="text-muted-foreground">Freelancer</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => setLocation("/")} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 space-y-2">
            <Card className="glass-morphism border-border/50">
              <CardContent className="p-4">
                <nav className="space-y-2">
                  <Button variant="default" className="w-full justify-start" data-testid="nav-dashboard">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/browse-projects")} data-testid="nav-browse-projects">
                    <Search className="mr-2 h-4 w-4" />
                    Browse Projects
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="nav-my-contracts">
                    <Briefcase className="mr-2 h-4 w-4" />
                    My Contracts
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/payments")} data-testid="nav-payments">
                    <Coins className="mr-2 h-4 w-4" />
                    Payments
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/disputes")} data-testid="nav-disputes">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Disputes
                  </Button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2" data-testid="text-welcome">
                Good morning, Sarah! 🌟
              </h1>
              <p className="text-muted-foreground mb-6">
                You have 3 active projects and 2 payment approvals pending.
              </p>
              
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-secondary to-accent"
                onClick={() => setLocation("/browse-projects")}
                data-testid="button-browse-projects"
              >
                <Search className="mr-2 h-4 w-4" />
                Browse New Projects
              </Button>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <StatCard
                icon={<Briefcase />}
                label="Active Jobs"
                value="3"
                color="text-primary"
                description="2 due this week"
              />
              <StatCard
                icon={<Coins />}
                label="This Month"
                value="42.3 ETH"
                color="text-secondary"
                description="$98,745 USD"
              />
              <StatCard
                icon={<Star />}
                label="Rating"
                value="4.9★"
                color="text-yellow-400"
                description="From 127 reviews"
              />
              <StatCard
                icon={<Trophy />}
                label="Success Rate"
                value="98.5%"
                color="text-accent"
                description="245 completed jobs"
              />
            </motion.div>

            {/* Current Jobs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" data-testid="text-current-jobs">
                  Current Jobs
                </h2>
                <Button variant="outline" data-testid="button-view-all">
                  View All Contracts
                </Button>
              </div>
              
              <div className="grid gap-6">
                <JobCard
                  title="DeFi Dashboard Development"
                  client="@crypto_startup"
                  budget="15.5 ETH"
                  progress={65}
                  milestones="2/3 Complete"
                  status="active"
                  dueDate="Dec 20, 2024"
                  priority="high"
                />
                <JobCard
                  title="Brand Identity Design"
                  client="@tech_company"
                  budget="4.8 ETH"
                  progress={30}
                  milestones="1/4 Complete"
                  status="active"
                  dueDate="Jan 15, 2025"
                  priority="medium"
                />
                <JobCard
                  title="Smart Contract Audit"
                  client="@defi_protocol"
                  budget="22.0 ETH"
                  progress={85}
                  milestones="3/3 Complete"
                  status="review"
                  dueDate="Dec 12, 2024"
                  priority="low"
                />
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-6" data-testid="text-recent-activity">
                Recent Activity
              </h2>
              
              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Payment received: 7.5 ETH</p>
                        <p className="text-sm text-muted-foreground">DeFi Dashboard - Milestone 2 completed</p>
                      </div>
                      <span className="text-sm text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">New message from @tech_company</p>
                        <p className="text-sm text-muted-foreground">Feedback on logo designs submitted</p>
                      </div>
                      <span className="text-sm text-muted-foreground">5 hours ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Milestone submitted for review</p>
                        <p className="text-sm text-muted-foreground">Smart Contract Audit - Final report uploaded</p>
                      </div>
                      <span className="text-sm text-muted-foreground">1 day ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}