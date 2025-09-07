import { motion } from "framer-motion";
import { Search, Briefcase, Coins, Star, Trophy, MessageSquare, Calendar, Bell, Settings, LogOut, Code, Award, Clock, Eye, Zap, TrendingUp, CheckCircle, AlertTriangle, Plus, Filter, Download, Wallet, Shield, FileText, Activity, Target, DollarSign, Users, MoreHorizontal, Upload, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Types based on backend models (freelancer perspective)
interface User {
  id: string;
  address: string;
  username?: string;
  email?: string;
  roles: ('freelancer' | 'client' | 'arbiter')[];
  profile: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    location?: string;
    skills?: string[];
    hourlyRate?: string;
    availability?: 'available' | 'busy' | 'not_available';
  };
  reputation: {
    score: number;
    totalReviews: number;
    averageRating: number;
  };
  stats: {
    jobsCompleted: number;
    jobsCreated: number;
    totalEarned: string;
    totalSpent: string;
    successRate: number;
  };
}

interface Milestone {
  description: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'disputed';
  deliverableHash?: string;
  submittedAt?: string;
  approvedAt?: string;
  notes?: string;
}

interface Job {
  _id: string;
  jobId: number;
  title: string;
  description: string;
  category: 'development' | 'design' | 'writing' | 'marketing' | 'consulting' | 'other';
  skills: string[];
  client: string; // address
  freelancer?: string; // address
  arbiter: string; // address
  totalAmount: string;
  milestones: Milestone[];
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
  deadline: string;
  acceptedAt?: string;
  completedAt?: string;
  disputeRaised: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FreelancerAnalytics {
  totalEarnings: string;
  activeProjects: number;
  completedProjects: number;
  successRate: number;
  avgRating: number;
  responseTime: number;
  proposalWinRate: number;
  repeatClients: number;
}

const StatCard = ({ icon, label, value, color, description, trend }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  color: string;
  description: string;
  trend?: string;
}) => (
  <motion.div
    className="group"
    whileHover={{ scale: 1.02, y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300 performance-optimized transform-gpu">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold gradient-text">{value}</p>
            <div className="flex items-center space-x-2 mt-2">
              <p className="text-xs text-muted-foreground">{description}</p>
              {trend && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {trend}
                </Badge>
              )}
            </div>
          </div>
          <div className={`${color} text-3xl group-hover:scale-110 transition-transform duration-200`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ContractCard = ({ 
  title, 
  client, 
  budget, 
  progress, 
  milestones,
  status,
  dueDate,
  priority,
  category,
  nextMilestone,
  setLocation
}: { 
  title: string; 
  client: string; 
  budget: string; 
  progress: number; 
  milestones: string;
  status: string;
  dueDate: string;
  priority: "high" | "medium" | "low";
  category?: string;
  nextMilestone?: string;
  setLocation: (path: string) => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300 performance-optimized transform-gpu">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              {category && (
                <Badge variant="outline" className="text-xs">
                  {category}
                </Badge>
              )}
              <Badge 
                variant={priority === "high" ? "destructive" : priority === "medium" ? "default" : "secondary"} 
                className="text-xs"
              >
                {priority} priority
              </Badge>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20">
                    {client.charAt(1)?.toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{client}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold gradient-text">{budget}</p>
            <Badge 
              variant={status === "active" ? "default" : status === "review" ? "secondary" : "outline"} 
              className="text-xs mt-1"
            >
              {status}
            </Badge>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{milestones}</span>
          </div>
          <Progress value={progress} className="h-2" />
          {nextMilestone && (
            <p className="text-xs text-muted-foreground mt-1">Next: {nextMilestone}</p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Due: {dueDate}</span>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setLocation("/freelancer-messages-disputes")}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button size="sm" className="h-8 px-3" onClick={() => setLocation("/my-contracts")}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ProposalCard = ({
  title,
  client,
  budget,
  proposedRate,
  deadline,
  skills,
  proposalDate,
  status,
  setLocation
}: {
  title: string;
  client: string;
  budget: string;
  proposedRate: string;
  deadline: string;
  skills: string[];
  proposalDate: string;
  status: 'pending' | 'accepted' | 'rejected';
  setLocation: (path: string) => void;
}) => (
  <motion.div
    whileHover={{ scale: 1.01, y: -2 }}
    transition={{ duration: 0.2 }}
  >
    <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <div className="flex items-center space-x-2 mb-3">
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20">
                  {client.charAt(1)?.toUpperCase() || 'C'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">{client}</span>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {skills.slice(0, 3).map(skill => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {skills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{skills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Budget: {budget}</p>
            <p className="text-lg font-bold gradient-text">{proposedRate}</p>
            <Badge 
              variant={status === "accepted" ? "default" : status === "rejected" ? "destructive" : "secondary"}
              className="text-xs mt-1"
            >
              {status}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>Deadline: {deadline}</span>
          <span>Proposed: {proposalDate}</span>
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setLocation("/freelancer-messages-disputes")}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button size="sm" className="flex-1" onClick={() => setLocation("/browse-projects")}>
            View Project
          </Button>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function FreelancerDashboard() {
  const [, setLocation] = useLocation();
  const { calculateAnimationConfig, getViewportConfig } = useSmartAnimations();
  const [activeTab, setActiveTab] = useState("contracts");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for API data
  const [freelancerJobs, setFreelancerJobs] = useState<Job[]>([]);
  const [freelancerStats, setFreelancerStats] = useState<FreelancerAnalytics | null>(null);
  const [pendingProposals, setPendingProposals] = useState<any[]>([]);

  const { userProfile, loading: authLoading } = useAuth();
  
  // Function to extract first name from full name
  const getFirstName = (fullName: string): string => {
    if (!fullName) return 'User';
    const spaceIndex = fullName.indexOf(' ');
    return spaceIndex === -1 ? fullName : fullName.substring(0, spaceIndex);
  };

  // Get the user's first name
    // Safely access profile.firstName using any cast in case TS types don't include profile yet
    const firstName = userProfile
      ? (
          ((userProfile as any)?.profile?.firstName)
            ? getFirstName((userProfile as any).profile.firstName)
            : (getFirstName(userProfile.username || '') || getFirstName(userProfile.email?.split('@')[0] || ''))
        )
      : 'User';

  // Show loading spinner while authenticating
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Current user for API calls
  const currentUser = {
    address: userProfile?.id || "0x8ba1f109551bD432803012645Hac136c0532",
    username: userProfile?.username || "sarah_blockchain",
    roles: ["freelancer"] as const,
  };

  // API functions
  const fetchFreelancerJobs = async () => {
    try {
      // Mock data for freelancer perspective
      const mockJobs: Job[] = [
        {
          _id: "job_1",
          jobId: 12345,
          title: "DeFi Protocol Smart Contract Development",
          description: "Build and audit smart contracts for a new DeFi lending protocol",
          category: "development",
          skills: ["Solidity", "Web3", "DeFi", "Security"],
          client: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F",
          freelancer: currentUser.address,
          arbiter: "0x9ca2f220662bE432803345645Hac147d0643",
          totalAmount: "15.5",
          status: "in_progress",
          deadline: "2024-12-20T23:59:59.000Z",
          disputeRaised: false,
          createdAt: "2024-11-01T10:00:00.000Z",
          updatedAt: "2024-11-15T14:30:00.000Z",
          milestones: [
            { description: "Contract Architecture & Design", amount: "4.0", dueDate: "2024-11-15T23:59:59.000Z", status: "approved", approvedAt: "2024-11-14T15:00:00.000Z" },
            { description: "Core Contract Implementation", amount: "6.0", dueDate: "2024-12-01T23:59:59.000Z", status: "approved", approvedAt: "2024-11-30T16:00:00.000Z" },
            { description: "Testing & Security Audit", amount: "3.5", dueDate: "2024-12-10T23:59:59.000Z", status: "submitted", submittedAt: "2024-12-09T14:00:00.000Z" },
            { description: "Deployment & Documentation", amount: "2.0", dueDate: "2024-12-20T23:59:59.000Z", status: "pending" }
          ]
        },
        {
          _id: "job_2",
          jobId: 12346,
          title: "Brand Identity & UI/UX Design",
          description: "Complete brand identity and user interface design for fintech app",
          category: "design",
          skills: ["UI/UX", "Figma", "Branding", "Mobile Design"],
          client: "0x653b24Bb5342D1433812012645Hac369f0754",
          freelancer: currentUser.address,
          arbiter: "0x6ca4f442884dE654904123456Hac369f0865",
          totalAmount: "4.8",
          status: "in_progress",
          deadline: "2025-01-15T23:59:59.000Z",
          disputeRaised: false,
          createdAt: "2024-11-20T09:00:00.000Z",
          updatedAt: "2024-12-01T11:20:00.000Z",
          milestones: [
            { description: "Brand Research & Strategy", amount: "1.2", dueDate: "2024-12-05T23:59:59.000Z", status: "approved", approvedAt: "2024-12-04T14:00:00.000Z" },
            { description: "Logo & Visual Identity", amount: "1.6", dueDate: "2024-12-20T23:59:59.000Z", status: "submitted", submittedAt: "2024-12-19T10:00:00.000Z" },
            { description: "UI/UX Design System", amount: "1.2", dueDate: "2025-01-05T23:59:59.000Z", status: "pending" },
            { description: "Final Assets & Guidelines", amount: "0.8", dueDate: "2025-01-15T23:59:59.000Z", status: "pending" }
          ]
        }
      ];
      
      setFreelancerJobs(mockJobs);
    } catch (err) {
      setError("Failed to fetch contracts");
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchFreelancerAnalytics = async () => {
    try {
      const mockAnalytics: FreelancerAnalytics = {
        totalEarnings: "127.8",
        activeProjects: 3,
        completedProjects: 47,
        successRate: 98.9,
        avgRating: 4.9,
        responseTime: 1.2,
        proposalWinRate: 73.5,
        repeatClients: 12
      };
      
      setFreelancerStats(mockAnalytics);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchPendingProposals = async () => {
    try {
      const mockProposals = [
        {
          id: "prop_1",
          title: "NFT Marketplace Frontend",
          client: "@crypto_collectibles",
          budget: "8.0 ETH",
          proposedRate: "7.2 ETH",
          deadline: "2025-02-15",
          skills: ["React", "Web3", "TypeScript", "Design"],
          proposalDate: "Dec 3, 2024",
          status: "pending" as const
        },
        {
          id: "prop_2", 
          title: "Token Economics Consulting",
          client: "@defi_startup",
          budget: "12.0 ETH",
          proposedRate: "10.5 ETH",
          deadline: "2025-01-30",
          skills: ["Tokenomics", "DeFi", "Economics", "Analysis"],
          proposalDate: "Nov 28, 2024",
          status: "accepted" as const
        }
      ];
      
      setPendingProposals(mockProposals);
    } catch (err) {
      console.error("Error fetching proposals:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchFreelancerJobs(),
          fetchFreelancerAnalytics(),
          fetchPendingProposals()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getMilestoneProgress = (milestones: Milestone[]) => {
    const completed = milestones.filter(m => m.status === 'approved').length;
    return {
      completed,
      total: milestones.length,
      percentage: milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0
    };
  };

  const getNextMilestone = (milestones: Milestone[]) => {
    const next = milestones.find(m => m.status === 'pending' || m.status === 'submitted');
    return next?.description;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass-morphism max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      <ParticleBackground />
      
      {/* Top Navigation */}
      <motion.nav 
        className="border-b border-border/50 glass-morphism relative z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={calculateAnimationConfig({ duration: 0.6 })}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                <Wallet className="text-white text-lg" />
              </div>
              <div>
                <span className="text-2xl font-bold gradient-text">SmartPay</span>
                <p className="text-xs text-muted-foreground">Freelancer Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search projects, clients..." 
                  className="pl-10 w-80 glass-morphism border-border/50"
                  data-testid="input-search"
                />
              </div>
              
              <Button variant="ghost" size="sm" className="relative" onClick={() => setLocation("/freelancer-notifications")}>
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">2</span>
                </span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => setLocation("/freelancer-profile-settings")}>
                <Settings className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3 px-3 py-2 glass-morphism rounded-xl border border-border/50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(userProfile as any)?.profile?.avatar || ''} />
                  <AvatarFallback className="bg-gradient-to-r from-primary/20 to-secondary/20">
                    {(() => {
                      const p = (userProfile as any)?.profile;
                      const first = p?.firstName || userProfile?.username || userProfile?.email?.split('@')[0] || 'U';
                      const last = p?.lastName || '';
                      if (last) return `${first[0]?.toUpperCase() || ''}${last[0]?.toUpperCase() || ''}`;
                      const parts = first.split(' ');
                      if (parts.length > 1) return `${parts[0][0]?.toUpperCase() || ''}${parts[1][0]?.toUpperCase() || ''}`;
                      return (first[0] || 'U').toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{(userProfile as any)?.profile?.firstName || userProfile?.username || userProfile?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-muted-foreground text-xs">{(() => {
                    const addr = (userProfile as any)?.address || userProfile?.id || '';
                    if (!addr) return '';
                    return `${addr.slice(0,6)}...${addr.slice(-4)}`;
                  })()}</p>
                </div>
              </div>
              
              <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      <div className="container mx-auto px-6 py-8 relative z-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <motion.aside 
            className="w-72 space-y-6"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={calculateAnimationConfig({ duration: 0.6, delay: 0.1 })}
          >
            <Card className="glass-morphism border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <nav className="space-y-2">
                  <Button variant="default" className="w-full justify-start text-sm font-medium">
                    <Briefcase className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/browse-projects")}>
                    <Search className="mr-3 h-4 w-4" />
                    Browse Projects
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/my-contracts")}>
                    <CheckCircle className="mr-3 h-4 w-4" />
                    My Contracts
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/proposals")}>
                    <FileText className="mr-3 h-4 w-4" />
                    Proposals
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/payments-earnings")}>
                    <Wallet className="mr-3 h-4 w-4" />
                    Payments & Earnings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/freelancer-messages-disputes")}>
                    <MessageSquare className="mr-3 h-4 w-4" />
                    Messages & Disputes
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/freelancer-analytics")}>
                    <Activity className="mr-3 h-4 w-4" />
                    Analytics
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/help-support")}>
                    <FileText className="mr-3 h-4 w-4" />
                    Help & Support
                  </Button>
                </nav>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-morphism border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white"
                  onClick={() => setLocation("/browse-projects")}
                >
                  <Search className="mr-2 h-4 w-4" />
                  Find Projects
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/submit-deliverable")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Work
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/my-contracts")}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  My Contracts
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/payments-earnings")}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Payments & Earnings
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  // Export functionality - export earnings/projects data
                  const earningsData = {
                    totalEarnings: freelancerStats?.totalEarnings || "0",
                    activeProjects: freelancerStats?.activeProjects || 0,
                    completedProjects: freelancerStats?.completedProjects || 0,
                    successRate: freelancerStats?.successRate || 0,
                    exportDate: new Date().toISOString().split('T')[0]
                  };
                  
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(earningsData, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `freelancer-earnings-export-${earningsData.exportDate}.json`);
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </CardContent>
            </Card>
          </motion.aside>

          {/* Main Content */}
          <main className="flex-1 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={calculateAnimationConfig({ duration: 0.6, delay: 0.2 })}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-4xl font-bold mb-2 gradient-text">
                    Welcome back, {firstName}! 🚀
                  </h1>
                  <p className="text-lg text-muted-foreground">
                    You have {freelancerStats?.activeProjects || 0} active contracts and 2 pending milestone reviews.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" className="space-x-2">
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                  </Button>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-secondary shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => setLocation("/browse-projects")}
                  >
                    <Search className="mr-2 h-5 w-5" />
                    Find New Projects
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={calculateAnimationConfig({ duration: 0.6, delay: 0.3 })}
            >
              {[
                { 
                  icon: <Briefcase />, 
                  label: "Active Contracts", 
                  value: freelancerStats?.activeProjects.toString() || "0", 
                  color: "text-primary", 
                  description: "Currently working", 
                  trend: "+1 this week" 
                },
                { 
                  icon: <DollarSign />, 
                  label: "Total Earnings", 
                  value: `${freelancerStats?.totalEarnings || "0"} ETH`, 
                  color: "text-secondary", 
                  description: "Lifetime earned", 
                  trend: `+12.3 ETH this month` 
                },
                { 
                  icon: <Star />, 
                  label: "Rating", 
                  value: `${freelancerStats?.avgRating || "0"}★`, 
                  color: "text-yellow-400", 
                  description: `From ${freelancerStats?.completedProjects || 0} reviews`, 
                  trend: `${freelancerStats?.successRate?.toFixed(1) || "0"}% success rate` 
                },
                { 
                  icon: <Trophy />, 
                  label: "Win Rate", 
                  value: `${freelancerStats?.proposalWinRate?.toFixed(1) || "0"}%`, 
                  color: "text-accent", 
                  description: "Proposal success", 
                  trend: `${freelancerStats?.repeatClients || 0} repeat clients` 
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={calculateAnimationConfig({ duration: 0.5, delay: 0.4 + index * 0.1 })}
                >
                  <StatCard
                    icon={stat.icon}
                    label={stat.label}
                    value={stat.value}
                    color={stat.color}
                    description={stat.description}
                    trend={stat.trend}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Main Dashboard Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={calculateAnimationConfig({ duration: 0.6, delay: 0.5 })}
            >
              <Tabs defaultValue="contracts" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
                  <TabsTrigger value="contracts">Active Contracts</TabsTrigger>
                  <TabsTrigger value="proposals">Proposals</TabsTrigger>
                  <TabsTrigger value="earnings">Earnings</TabsTrigger>
                  <TabsTrigger value="analytics">Performance</TabsTrigger>
                </TabsList>
                
                <TabsContent value="contracts" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      Active Contracts
                    </h2>
                    <Button variant="outline" className="space-x-2" onClick={() => setLocation("/my-contracts")}>
                      <Eye className="h-4 w-4" />
                      <span>View All</span>
                    </Button>
                  </div>
                  
                  <div className="grid gap-6">
                    {freelancerJobs.map((job, index) => {
                      const progress = getMilestoneProgress(job.milestones);
                      const nextMilestone = getNextMilestone(job.milestones);
                      return (
                        <motion.div
                          key={job._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={calculateAnimationConfig({ duration: 0.5, delay: 0.6 + index * 0.1 })}
                        >
                          <ContractCard
                            title={job.title}
                            client={`@${job.client.slice(0, 6)}...${job.client.slice(-4)}`}
                            budget={`${job.totalAmount} ETH`}
                            progress={progress.percentage}
                            milestones={`${progress.completed}/${progress.total} Complete`}
                            status={job.status === 'in_progress' ? 'active' : job.status}
                            dueDate={new Date(job.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            priority={index === 0 ? "high" : index === 1 ? "medium" : "low"}
                            category={job.category}
                            nextMilestone={nextMilestone}
                            setLocation={setLocation}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="proposals" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Recent Proposals</h2>
                    <Button variant="outline" onClick={() => setLocation("/browse-projects")}>
                      Submit New Proposal
                    </Button>
                  </div>
                  
                  <div className="grid gap-6">
                    {pendingProposals.map((proposal, index) => (
                      <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={calculateAnimationConfig({ duration: 0.5, delay: 0.1 + index * 0.1 })}
                      >
                        <ProposalCard
                          title={proposal.title}
                          client={proposal.client}
                          budget={proposal.budget}
                          proposedRate={proposal.proposedRate}
                          deadline={proposal.deadline}
                          skills={proposal.skills}
                          proposalDate={proposal.proposalDate}
                          status={proposal.status}
                          setLocation={setLocation}
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="earnings" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Earnings History</h2>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={() => setLocation("/payments-earnings")}>
                        <Eye className="w-4 h-4 mr-2" />
                        View All
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      { project: "DeFi Protocol Development", client: "@crypto_startup", amount: "6.0 ETH", status: "received", date: "Dec 1, 2024", milestone: "Core Implementation" },
                      { project: "Brand Identity Design", client: "@tech_company", amount: "1.2 ETH", status: "received", date: "Dec 4, 2024", milestone: "Brand Research" },
                      { project: "Smart Contract Audit", client: "@defi_protocol", amount: "3.5 ETH", status: "pending", date: "Dec 9, 2024", milestone: "Security Testing" },
                      { project: "NFT Marketplace", client: "@art_platform", amount: "4.8 ETH", status: "received", date: "Nov 28, 2024", milestone: "Frontend Complete" },
                      { project: "DApp Interface", client: "@blockchain_startup", amount: "2.2 ETH", status: "received", date: "Nov 25, 2024", milestone: "UI Components" }
                    ].map((earning, index) => (
                      <motion.div
                        key={`${earning.project}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={calculateAnimationConfig({ duration: 0.5, delay: 0.1 + index * 0.1 })}
                      >
                        <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{earning.project}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{earning.client}</span>
                                  <span>•</span>
                                  <span>{earning.milestone}</span>
                                  <span>•</span>
                                  <span>{earning.date}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold gradient-text text-lg">{earning.amount}</p>
                                <Badge 
                                  variant={earning.status === "received" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {earning.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Performance Analytics</h2>
                    <Button onClick={() => setLocation("/freelancer-analytics")} className="bg-gradient-to-r from-primary to-secondary">
                      <Activity className="w-4 h-4 mr-2" />
                      View Full Analytics
                    </Button>
                  </div>
                  
                  <Card className="glass-morphism border-border/50">
                    <CardContent className="p-8 text-center">
                      <Activity className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Detailed Performance Metrics Available</h3>
                      <p className="text-muted-foreground mb-6">
                        View comprehensive analytics including earnings trends, client satisfaction, 
                        project completion rates, and performance insights on the dedicated analytics page.
                      </p>
                      <Button onClick={() => setLocation("/analytics")} className="bg-gradient-to-r from-primary to-secondary">
                        Go to Analytics Dashboard
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  );
}