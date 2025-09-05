import { motion } from "framer-motion";
import { Plus, BarChart3, Lock, CheckCircle, TrendingUp, MessageSquare, Search, Bell, Settings, LogOut } from "lucide-react";
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

const ProjectCard = ({ 
  title, 
  freelancer, 
  budget, 
  progress, 
  milestones,
  status,
  dueDate
}: { 
  title: string; 
  freelancer: string; 
  budget: string; 
  progress: number; 
  milestones: string;
  status: string;
  dueDate: string;
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
                {freelancer.charAt(1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{freelancer}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{budget}</p>
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
        <span className="text-sm text-muted-foreground">Due: {dueDate}</span>
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" data-testid="button-message">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button size="sm" data-testid="button-view-details">
            View Details
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ClientDashboard() {
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
                  placeholder="Search projects..." 
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
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">0x742d...8bE2</p>
                  <p className="text-muted-foreground">Client</p>
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
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/create-project")} data-testid="nav-create-project">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" data-testid="nav-my-projects">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    My Projects
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setLocation("/payments")} data-testid="nav-payments">
                    <Lock className="mr-2 h-4 w-4" />
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
                Welcome back, John! 👋
              </h1>
              <p className="text-muted-foreground mb-6">
                Manage your projects and track milestone progress from your dashboard.
              </p>
              
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-secondary"
                onClick={() => setLocation("/create-project")}
                data-testid="button-create-new-project"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Project
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
                icon={<BarChart3 />}
                label="Active Projects"
                value="8"
                color="text-primary"
                description="+2 from last month"
              />
              <StatCard
                icon={<Lock />}
                label="In Escrow"
                value="24.7 ETH"
                color="text-secondary"
                description="$58,432 USD"
              />
              <StatCard
                icon={<CheckCircle />}
                label="Completed"
                value="156"
                color="text-green-400"
                description="98.5% success rate"
              />
              <StatCard
                icon={<TrendingUp />}
                label="Total Spent"
                value="340.2 ETH"
                color="text-accent"
                description="This year"
              />
            </motion.div>

            {/* Active Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" data-testid="text-active-projects">
                  Active Projects
                </h2>
                <Button variant="outline" data-testid="button-view-all">
                  View All
                </Button>
              </div>
              
              <div className="grid gap-6">
                <ProjectCard
                  title="E-commerce Platform Redesign"
                  freelancer="@alex_designer"
                  budget="8.5 ETH"
                  progress={75}
                  milestones="3/4 Complete"
                  status="active"
                  dueDate="Dec 15, 2024"
                />
                <ProjectCard
                  title="Smart Contract Development"
                  freelancer="@web3_dev"
                  budget="12.0 ETH"
                  progress={40}
                  milestones="2/5 Complete"
                  status="active"
                  dueDate="Jan 8, 2025"
                />
                <ProjectCard
                  title="Mobile App UI/UX"
                  freelancer="@mobile_expert"
                  budget="6.2 ETH"
                  progress={90}
                  milestones="4/4 Complete"
                  status="review"
                  dueDate="Dec 10, 2024"
                />
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}