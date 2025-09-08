import { motion } from "framer-motion";
import { Plus, BarChart3, Lock, CheckCircle, TrendingUp, MessageSquare, Search, Bell, Settings, LogOut, Users, DollarSign, Calendar, Star, Filter, Download, Wallet, Shield, Clock, Eye, Zap, MoreHorizontal, AlertTriangle, FileText, Activity } from "lucide-react";
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
// import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Types based on backend models
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

interface PlatformStats {
  overview: {
    totalJobs: number;
    totalUsers: number;
    totalVolume: number;
    completedJobs: number;
    activeJobs: number;
    successRate: string;
    disputeRate: string;
    avgJobValue: number;
  };
}

interface UserAnalytics {
  totalJobs: number;
  completedJobs: number;
  totalValue: string;
  successRate: number;
  avgRating: number;
  responseTime: number;
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

const ProjectCard = ({ 
  title, 
  freelancer, 
  budget, 
  progress, 
  milestones,
  status,
  dueDate,
  rating,
  category,
  setLocation
}: { 
  title: string; 
  freelancer: string; 
  budget: string; 
  progress: number; 
  milestones: string;
  status: string;
  dueDate: string;
  rating?: number;
  category?: string;
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
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Avatar className="w-7 h-7">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-xs bg-gradient-to-r from-primary/20 to-secondary/20">
                    {freelancer.split('@')[1]?.charAt(0).toUpperCase() || 'F'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{freelancer}</span>
              </div>
              {rating && (
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="text-sm text-muted-foreground">{rating}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold gradient-text">{budget}</p>
            <Badge 
              variant={status === "active" ? "default" : status === "completed" ? "secondary" : "outline"} 
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
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Due: {dueDate}</span>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setLocation("/messages-disputes")}>
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button size="sm" className="h-8 px-3" onClick={() => setLocation("/my-projects")}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { calculateAnimationConfig, getViewportConfig } = useSmartAnimations();
  // const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("projects");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for API data
  const [userJobs, setUserJobs] = useState<Job[]>([]);
  const [userStats, setUserStats] = useState<UserAnalytics | null>(null);
  const [topFreelancers, setTopFreelancers] = useState<User[]>([]);


  const { userProfile, loading: authLoading } = useAuth();
  
  // Function to extract first name from full name
  const getFirstName = (fullName: string): string => {
    if (!fullName) return 'User';
    const spaceIndex = fullName.indexOf(' ');
    return spaceIndex === -1 ? fullName : fullName.substring(0, spaceIndex);
  };

  // Get user display name
  const getUserDisplayName = () => {
    if (!userProfile) {
      return "User";
    }
    
    const extendedProfile = userProfile as any;
    
    // Backend returns firstName and lastName directly, not nested under profile
    const firstName = extendedProfile.firstName || extendedProfile.profile?.firstName;
    const lastName = extendedProfile.lastName || extendedProfile.profile?.lastName;
    const fullName = extendedProfile.fullName;
    const username = extendedProfile.username;
    const email = extendedProfile.email;
    
    if (fullName) {
      return fullName;
    } else if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (username) {
      return username;
    } else if (email) {
      return email.split('@')[0];
    } else {
      return "User";
    }
  };

  // Get the user's first name (prefer profile.firstName)
  // Safely access profile.firstName (cast to any to avoid mismatched shared type)
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
    address: userProfile?.id || "0x742d35Cc6641C0532a2100D35458f8b5d9E2F",
    username: userProfile?.username || "client_user",
    roles: ["client"] as const,

  };

  // API functions
  const fetchUserJobs = async () => {
    try {
      // Mock data based on backend Job model
      const mockJobs: Job[] = [
        {
          _id: "job_1",
          jobId: 12345,
          title: "E-commerce Platform Development",
          description: "Build a modern e-commerce platform with React and Node.js",
          category: "development",
          skills: ["React", "Node.js", "MongoDB", "Express"],
          client: userProfile?.id || "unknown",
          freelancer: "0x8ba1f109551bD432803012645Hac136c0532",
          arbiter: "0x9ca2f220662bE432803345645Hac147d0643",
          totalAmount: "12.5",
          status: "in_progress",
          deadline: "2024-12-15T23:59:59.000Z",
          disputeRaised: false,
          createdAt: "2024-11-01T10:00:00.000Z",
          updatedAt: "2024-11-15T14:30:00.000Z",
          milestones: [
            { description: "Project Setup & Planning", amount: "3.0", dueDate: "2024-11-10T23:59:59.000Z", status: "approved", approvedAt: "2024-11-09T15:00:00.000Z" },
            { description: "Frontend Development", amount: "4.0", dueDate: "2024-11-25T23:59:59.000Z", status: "approved", approvedAt: "2024-11-24T10:00:00.000Z" },
            { description: "Backend API Development", amount: "3.5", dueDate: "2024-12-05T23:59:59.000Z", status: "submitted", submittedAt: "2024-12-04T16:00:00.000Z" },
            { description: "Testing & Deployment", amount: "2.0", dueDate: "2024-12-15T23:59:59.000Z", status: "pending" }
          ]
        },
        {
          _id: "job_2",
          jobId: 12346,
          title: "Smart Contract Security Audit",
          description: "Comprehensive security audit of DeFi smart contracts",
          category: "development",
          skills: ["Solidity", "Security", "Ethereum", "Web3"],
          client: userProfile?.id || "unknown",
          freelancer: "0x7ba3f331773cD543903012645Hac258e0754",
          arbiter: "0x6ca4f442884dE654904123456Hac369f0865",
          totalAmount: "18.0",
          status: "in_progress",
          deadline: "2025-01-08T23:59:59.000Z",
          disputeRaised: false,
          createdAt: "2024-11-15T09:00:00.000Z",
          updatedAt: "2024-12-01T11:20:00.000Z",
          milestones: [
            { description: "Code Review & Analysis", amount: "6.0", dueDate: "2024-12-01T23:59:59.000Z", status: "approved", approvedAt: "2024-11-30T14:00:00.000Z" },
            { description: "Vulnerability Assessment", amount: "5.0", dueDate: "2024-12-15T23:59:59.000Z", status: "submitted", submittedAt: "2024-12-14T09:00:00.000Z" },
            { description: "Security Report", amount: "4.0", dueDate: "2024-12-25T23:59:59.000Z", status: "pending" },
            { description: "Recommendations & Documentation", amount: "3.0", dueDate: "2025-01-08T23:59:59.000Z", status: "pending" }
          ]
        }
      ];
      
      setUserJobs(mockJobs);
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error("Error fetching jobs:", err);
    }
  };

  const fetchUserAnalytics = async () => {
    try {
      const mockAnalytics: UserAnalytics = {
        totalJobs: 24,
        completedJobs: 19,
        totalValue: "186.7",
        successRate: 97.3,
        avgRating: 4.7,
        responseTime: 2.4
      };
      
      setUserStats(mockAnalytics);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const fetchTopFreelancers = async () => {
    try {
      const mockFreelancers: User[] = [
        {
          id: "user_1",
          address: "0x8ba1f109551bD432803012645Hac136c0532",
          username: "alex_designer",
          roles: ["freelancer"],
          profile: { firstName: "Alex", lastName: "Chen", avatar: "" },
          reputation: { score: 95, totalReviews: 47, averageRating: 4.9 },
          stats: { jobsCompleted: 47, jobsCreated: 0, totalEarned: "124.8", totalSpent: "0", successRate: 98.9 }
        },
        {
          id: "user_2", 
          address: "0x7ba3f331773cD543903012645Hac258e0754",
          username: "blockchain_dev",
          roles: ["freelancer"],
          profile: { firstName: "Sarah", lastName: "Kim", avatar: "" },
          reputation: { score: 98, totalReviews: 23, averageRating: 5.0 },
          stats: { jobsCompleted: 23, jobsCreated: 0, totalEarned: "89.2", totalSpent: "0", successRate: 100 }
        }
      ];
      
      setTopFreelancers(mockFreelancers);
    } catch (err) {
      console.error("Error fetching freelancers:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUserJobs(),
          fetchUserAnalytics(),
          fetchTopFreelancers()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMilestoneProgress = (milestones: Milestone[]) => {
    const completed = milestones.filter(m => m.status === 'approved').length;
    return {
      completed,
      total: milestones.length,
      percentage: milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0
    };
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
                <p className="text-xs text-muted-foreground">Client Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  placeholder="Search projects, freelancers..." 
                  className="pl-10 w-80 glass-morphism border-border/50"
                  data-testid="input-search"
                />
              </div>
              
              <Button variant="ghost" size="sm" className="relative" onClick={() => setLocation("/notifications")}>
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-xs text-white">3</span>
                </span>
              </Button>
              
              <Button variant="ghost" size="sm" onClick={() => setLocation("/profile-settings")}>
                <Settings className="h-5 w-5" />
              </Button>
              
              <div className="flex items-center space-x-3 px-3 py-2 glass-morphism rounded-xl border border-border/50">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={(userProfile as any)?.avatar || (userProfile as any)?.profile?.avatar || ""} />
                  <AvatarFallback className="bg-gradient-to-r from-primary/20 to-secondary/20">
                    {(() => {
                      const displayName = getUserDisplayName();
                      return displayName.substring(0, 2).toUpperCase();
                    })()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium">{getUserDisplayName()}</p>
                  <p className="text-muted-foreground text-xs">
                    {userProfile?.email ? userProfile.email.substring(0, 10) + "..." : "Client"}
                  </p>
                </div>
              </div>              <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-muted-foreground hover:text-foreground">
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
                    <BarChart3 className="mr-3 h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/create-project")}>
                    <Plus className="mr-3 h-4 w-4" />
                    Create Project
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/my-projects")}>
                    <CheckCircle className="mr-3 h-4 w-4" />
                    My Projects
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/find-freelancers")}>
                    <Users className="mr-3 h-4 w-4" />
                    Find Freelancers
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/payments-escrow")}>
                    <Lock className="mr-3 h-4 w-4" />
                    Payments & Escrow
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/messages-disputes")}>
                    <MessageSquare className="mr-3 h-4 w-4" />
                    Messages & Disputes
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setLocation("/analytics")}>
                    <BarChart3 className="mr-3 h-4 w-4" />
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
                  onClick={() => setLocation("/create-project")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setLocation("/find-freelancers")}>
                  <Users className="mr-2 h-4 w-4" />
                  Hire Talent
                </Button>
                <Button variant="outline" className="w-full" onClick={() => {
                  // Export functionality - could be implemented to export project data as CSV/PDF
                  const projectData = {
                    totalProjects: 12,
                    activeProjects: 8,
                    completedProjects: 4,
                    totalBudget: "$45,230",
                    exportDate: new Date().toISOString().split('T')[0]
                  };
                  
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", `smartpay-dashboard-export-${projectData.exportDate}.json`);
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

                    Welcome back, {getUserDisplayName()}! 👋

                  </h1>
                  <p className="text-lg text-muted-foreground">
                    Manage your projects and track milestone progress from your decentralized dashboard.
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
                    onClick={() => setLocation("/create-project")}
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create New Project
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
                  icon: <BarChart3 />, 
                  label: "Active Projects", 
                  value: userJobs.filter(job => ['assigned', 'in_progress'].includes(job.status)).length.toString(), 
                  color: "text-primary", 
                  description: "Currently running", 
                  trend: "+2 this month" 
                },
                { 
                  icon: <Lock />, 
                  label: "In Escrow", 
                  value: `${userJobs.reduce((sum, job) => {
                    const pendingAmount = job.milestones
                      .filter(m => m.status === 'submitted' || m.status === 'pending')
                      .reduce((total, m) => total + parseFloat(m.amount), 0);
                    return sum + pendingAmount;
                  }, 0).toFixed(1)} ETH`, 
                  color: "text-secondary", 
                  description: "Pending milestones", 
                  trend: `${userJobs.reduce((count, job) => count + job.milestones.filter(m => m.status === 'submitted').length, 0)} pending approvals` 
                },
                { 
                  icon: <CheckCircle />, 
                  label: "Completed", 
                  value: userStats?.completedJobs.toString() || "0", 
                  color: "text-green-400", 
                  description: "Projects finished", 
                  trend: `${userStats?.successRate.toFixed(1)}% success rate` 
                },
                { 
                  icon: <TrendingUp />, 
                  label: "Total Budget", 
                  value: `${userStats?.totalValue || "0"} ETH`, 
                  color: "text-accent", 
                  description: "Lifetime allocated", 
                  trend: `Avg: ${userStats ? (parseFloat(userStats.totalValue) / userStats.totalJobs).toFixed(1) : "0"} ETH/project` 
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
              <Tabs defaultValue="projects" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-1/2">
                  <TabsTrigger value="projects">Active Projects</TabsTrigger>
                  <TabsTrigger value="freelancers">Top Freelancers</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="projects" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">
                      Active Projects
                    </h2>
                    <Button variant="outline" className="space-x-2" onClick={() => setLocation("/my-projects")}>
                      <Eye className="h-4 w-4" />
                      <span>View All</span>
                    </Button>
                  </div>
                  
                  <div className="grid gap-6">
                    {[
                      { 
                        title: "E-commerce Platform Redesign", 
                        freelancer: "@alex_designer", 
                        budget: "12.5 ETH", 
                        progress: 75, 
                        milestones: "3/4 Complete", 
                        status: "active", 
                        dueDate: "Dec 15, 2024",
                        rating: 4.9,
                        category: "UI/UX Design"
                      },
                      { 
                        title: "Smart Contract Audit & Development", 
                        freelancer: "@blockchain_dev", 
                        budget: "18.0 ETH", 
                        progress: 45, 
                        milestones: "2/5 Complete", 
                        status: "active", 
                        dueDate: "Jan 8, 2025",
                        rating: 5.0,
                        category: "Blockchain"
                      },
                      { 
                        title: "Mobile App Development", 
                        freelancer: "@mobile_expert", 
                        budget: "8.7 ETH", 
                        progress: 90, 
                        milestones: "4/4 Complete", 
                        status: "review", 
                        dueDate: "Dec 10, 2024",
                        rating: 4.8,
                        category: "Mobile Dev"
                      },
                      { 
                        title: "Marketing Website & SEO", 
                        freelancer: "@digital_marketer", 
                        budget: "6.2 ETH", 
                        progress: 60, 
                        milestones: "2/3 Complete", 
                        status: "active", 
                        dueDate: "Dec 20, 2024",
                        rating: 4.7,
                        category: "Marketing"
                      }
                    ].map((project, index) => (
                      <motion.div
                        key={project.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={calculateAnimationConfig({ duration: 0.5, delay: 0.6 + index * 0.1 })}
                      >
                        <ProjectCard
                          title={project.title}
                          freelancer={project.freelancer}
                          budget={project.budget}
                          progress={project.progress}
                          milestones={project.milestones}
                          status={project.status}
                          dueDate={project.dueDate}
                          rating={project.rating}
                          category={project.category}
                          setLocation={setLocation}
                        />
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="freelancers" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Top Freelancers</h2>
                    <Button variant="outline" onClick={() => setLocation("/find-freelancers")}>
                      Browse All Talent
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                      { name: "Alex Chen", username: "@alex_designer", rating: 4.9, projects: 47, specialty: "UI/UX Design", rate: "0.8 ETH/week", avatar: "AC" },
                      { name: "Sarah Kim", username: "@blockchain_dev", rating: 5.0, projects: 23, specialty: "Smart Contracts", rate: "1.2 ETH/week", avatar: "SK" },
                      { name: "Mike Rodriguez", username: "@mobile_expert", rating: 4.8, projects: 61, specialty: "Mobile Development", rate: "0.9 ETH/week", avatar: "MR" },
                      { name: "Emma Wilson", username: "@digital_marketer", rating: 4.7, projects: 34, specialty: "Digital Marketing", rate: "0.6 ETH/week", avatar: "EW" },
                      { name: "David Park", username: "@fullstack_pro", rating: 4.9, projects: 52, specialty: "Full Stack Dev", rate: "1.1 ETH/week", avatar: "DP" },
                      { name: "Lisa Zhang", username: "@data_scientist", rating: 4.8, projects: 29, specialty: "Data Science", rate: "1.0 ETH/week", avatar: "LZ" }
                    ].map((freelancer, index) => (
                      <motion.div
                        key={freelancer.username}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={calculateAnimationConfig({ duration: 0.5, delay: 0.1 + index * 0.1 })}
                      >
                        <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300 performance-optimized transform-gpu group">
                          <CardContent className="p-6">
                            <div className="flex items-center space-x-4 mb-4">
                              <Avatar className="w-12 h-12">
                                <AvatarFallback className="bg-gradient-to-r from-primary/20 to-secondary/20 text-lg font-semibold">
                                  {freelancer.avatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h3 className="font-semibold">{freelancer.name}</h3>
                                <p className="text-sm text-muted-foreground">{freelancer.username}</p>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{freelancer.rating}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Specialty:</span>
                                <span>{freelancer.specialty}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Projects:</span>
                                <span>{freelancer.projects} completed</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Rate:</span>
                                <span className="font-medium gradient-text">{freelancer.rate}</span>
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="flex-1" onClick={() => setLocation("/messages-disputes")}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Message
                              </Button>
                              <Button size="sm" className="flex-1" onClick={() => setLocation("/create-project")}>
                                Hire Now
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="payments" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Payment History</h2>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="grid gap-4">
                    {[
                      { project: "E-commerce Platform", freelancer: "@alex_designer", amount: "4.2 ETH", status: "completed", date: "Dec 5, 2024", milestone: "Design Phase" },
                      { project: "Smart Contract Audit", freelancer: "@blockchain_dev", amount: "6.0 ETH", status: "in-escrow", date: "Dec 3, 2024", milestone: "Security Review" },
                      { project: "Mobile App Development", freelancer: "@mobile_expert", amount: "2.1 ETH", status: "completed", date: "Dec 1, 2024", milestone: "MVP Delivery" },
                      { project: "Marketing Campaign", freelancer: "@digital_marketer", amount: "1.8 ETH", status: "pending", date: "Nov 28, 2024", milestone: "Campaign Setup" },
                      { project: "Website Redesign", freelancer: "@fullstack_pro", amount: "3.5 ETH", status: "completed", date: "Nov 25, 2024", milestone: "Frontend Complete" }
                    ].map((payment, index) => (
                      <motion.div
                        key={`${payment.project}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={calculateAnimationConfig({ duration: 0.5, delay: 0.1 + index * 0.1 })}
                      >
                        <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold mb-1">{payment.project}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{payment.freelancer}</span>
                                  <span>•</span>
                                  <span>{payment.milestone}</span>
                                  <span>•</span>
                                  <span>{payment.date}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold gradient-text text-lg">{payment.amount}</p>
                                <Badge 
                                  variant={payment.status === "completed" ? "default" : payment.status === "in-escrow" ? "secondary" : "outline"}
                                  className="text-xs"
                                >
                                  {payment.status}
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
                    <h2 className="text-2xl font-bold">Analytics & Insights</h2>
                    <Button onClick={() => setLocation("/analytics")} className="bg-gradient-to-r from-primary to-secondary">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Full Analytics
                    </Button>
                  </div>
                  
                  <Card className="glass-morphism border-border/50">
                    <CardContent className="p-8 text-center">
                      <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Detailed Analytics Available</h3>
                      <p className="text-muted-foreground mb-6">
                        View comprehensive analytics including spending patterns, project performance, 
                        freelancer statistics, and more insights on the dedicated analytics page.
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