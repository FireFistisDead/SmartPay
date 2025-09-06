import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Eye, 
  Edit, 
  Trash2,
  Download,
  Star,
  MessageSquare,
  TrendingUp,
  ArrowLeft,
  FileText,
  Shield,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

// Types based on backend models
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
  client: string;
  freelancer?: string;
  arbiter: string;
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

interface Freelancer {
  address: string;
  username: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  reputation: {
    averageRating: number;
    totalReviews: number;
  };
}

export default function MyProjects() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [projects, setProjects] = useState<Job[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Job[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [isLoading, setIsLoading] = useState(true);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProjects: Job[] = [
        {
          _id: "1",
          jobId: 1001,
          title: "E-commerce Website Development",
          description: "Build a modern e-commerce platform with React and Node.js. Need responsive design, payment integration, and admin dashboard.",
          category: "development",
          skills: ["React", "Node.js", "MongoDB", "Stripe"],
          client: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          freelancer: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          totalAmount: "5000",
          milestones: [
            {
              description: "Frontend Setup & Design",
              amount: "1500",
              dueDate: "2025-09-15T00:00:00Z",
              status: "approved"
            },
            {
              description: "Backend API Development",
              amount: "2000",
              dueDate: "2025-09-25T00:00:00Z",
              status: "submitted"
            },
            {
              description: "Payment Integration & Testing",
              amount: "1500",
              dueDate: "2025-10-05T00:00:00Z",
              status: "pending"
            }
          ],
          status: "in_progress",
          deadline: "2025-10-05T23:59:59Z",
          acceptedAt: "2025-09-01T10:00:00Z",
          disputeRaised: false,
          createdAt: "2025-08-28T10:00:00Z",
          updatedAt: "2025-09-07T12:00:00Z"
        },
        {
          _id: "2",
          jobId: 1002,
          title: "Mobile App UI/UX Design",
          description: "Design a modern and intuitive mobile app interface for a fitness tracking application.",
          category: "design",
          skills: ["Figma", "UI/UX", "Mobile Design", "Prototyping"],
          client: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          freelancer: "0x9ba1f109551bD432803012645Hac136c1c1f3a33",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          totalAmount: "3000",
          milestones: [
            {
              description: "Wireframes & User Flow",
              amount: "1000",
              dueDate: "2025-09-10T00:00:00Z",
              status: "approved"
            },
            {
              description: "High-Fidelity Designs",
              amount: "1500",
              dueDate: "2025-09-20T00:00:00Z",
              status: "approved"
            },
            {
              description: "Prototype & Handoff",
              amount: "500",
              dueDate: "2025-09-25T00:00:00Z",
              status: "approved"
            }
          ],
          status: "completed",
          deadline: "2025-09-25T23:59:59Z",
          acceptedAt: "2025-08-25T10:00:00Z",
          completedAt: "2025-09-24T15:30:00Z",
          disputeRaised: false,
          createdAt: "2025-08-20T10:00:00Z",
          updatedAt: "2025-09-24T15:30:00Z"
        },
        {
          _id: "3",
          jobId: 1003,
          title: "Content Writing for Blog",
          description: "Write engaging blog posts about blockchain technology and cryptocurrency trends.",
          category: "writing",
          skills: ["Content Writing", "Blockchain", "SEO", "Research"],
          client: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          totalAmount: "1200",
          milestones: [
            {
              description: "5 Blog Posts (1000 words each)",
              amount: "1200",
              dueDate: "2025-09-20T00:00:00Z",
              status: "pending"
            }
          ],
          status: "open",
          deadline: "2025-09-20T23:59:59Z",
          disputeRaised: false,
          createdAt: "2025-09-05T10:00:00Z",
          updatedAt: "2025-09-05T10:00:00Z"
        },
        {
          _id: "4",
          jobId: 1004,
          title: "Smart Contract Audit",
          description: "Security audit for DeFi smart contracts including vulnerability assessment.",
          category: "consulting",
          skills: ["Solidity", "Security", "Smart Contracts", "Audit"],
          client: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          freelancer: "0x7ba1f109551bD432803012645Hac136c1c1f3a34",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          totalAmount: "8000",
          milestones: [
            {
              description: "Initial Code Review",
              amount: "3000",
              dueDate: "2025-09-12T00:00:00Z",
              status: "submitted"
            },
            {
              description: "Detailed Security Report",
              amount: "5000",
              dueDate: "2025-09-22T00:00:00Z",
              status: "pending"
            }
          ],
          status: "in_progress",
          deadline: "2025-09-22T23:59:59Z",
          acceptedAt: "2025-09-02T10:00:00Z",
          disputeRaised: false,
          createdAt: "2025-08-30T10:00:00Z",
          updatedAt: "2025-09-07T09:00:00Z"
        }
      ];
      setProjects(mockProjects);
      setFilteredProjects(mockProjects);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = projects;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(project => project.category === categoryFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "amount-high":
        filtered.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
        break;
      case "amount-low":
        filtered.sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount));
        break;
      case "deadline":
        filtered.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
        break;
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, statusFilter, categoryFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "assigned": return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "in_progress": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "disputed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "cancelled": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-500/10 text-gray-500";
      case "submitted": return "bg-blue-500/10 text-blue-500";
      case "approved": return "bg-green-500/10 text-green-500";
      case "disputed": return "bg-red-500/10 text-red-500";
      default: return "bg-gray-500/10 text-gray-500";
    }
  };

  const getProgressPercentage = (milestones: Milestone[]) => {
    const completedMilestones = milestones.filter(m => m.status === "approved").length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStats = () => {
    const total = projects.length;
    const active = projects.filter(p => p.status === "in_progress").length;
    const completed = projects.filter(p => p.status === "completed").length;
    const open = projects.filter(p => p.status === "open").length;
    const totalValue = projects.reduce((sum, p) => sum + parseFloat(p.totalAmount), 0);

    return { total, active, completed, open, totalValue };
  };

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      <ParticleBackground />
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={goToDashboard}
              className="glass-morphism border-border/30 hover:border-primary/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">My Projects</h1>
              <p className="text-muted-foreground">Manage and track your project portfolio</p>
            </div>
          </div>
          <Button 
            onClick={() => setLocation("/create-project")}
            className="bg-gradient-to-r from-primary to-secondary hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
        >
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search projects by title, description, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-morphism border-border/50"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="writing">Writing</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="consulting">Consulting</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="amount-high">Highest Amount</SelectItem>
              <SelectItem value="amount-low">Lowest Amount</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Projects List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="glass-morphism border-border/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-muted rounded w-full mb-2"></div>
                      <div className="h-4 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredProjects.length === 0 ? (
            <Card className="glass-morphism border-border/50">
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Projects Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== "all" || categoryFilter !== "all" 
                    ? "No projects match your current filters." 
                    : "You haven't created any projects yet."}
                </p>
                <Button 
                  onClick={() => setLocation("/create-project")}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredProjects.map((project, index) => (
              <motion.div
                key={project._id}
                initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer">
                            {project.title}
                          </h3>
                          <Badge className={`${getStatusColor(project.status)} border`}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            #{project.jobId}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-medium">${parseFloat(project.totalAmount).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDate(project.deadline)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Created {formatDate(project.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Messages
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="w-4 h-4 mr-2" />
                            Export Data
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="space-y-4">
                      {/* Skills */}
                      <div className="flex flex-wrap gap-2">
                        {project.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>

                      {/* Progress */}
                      {project.milestones.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{getProgressPercentage(project.milestones)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(project.milestones)} className="h-2" />
                        </div>
                      )}

                      {/* Milestones */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Milestones</h4>
                        <div className="space-y-2">
                          {project.milestones.map((milestone, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium">{milestone.description}</span>
                                  <Badge className={`text-xs ${getMilestoneStatusColor(milestone.status)}`}>
                                    {milestone.status}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                                  <span>${parseFloat(milestone.amount).toLocaleString()}</span>
                                  <span>Due {formatDate(milestone.dueDate)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Freelancer Info (if assigned) */}
                      {project.freelancer && (
                        <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.freelancer}`} />
                            <AvatarFallback>
                              {project.freelancer.slice(2, 4).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Assigned Freelancer</p>
                            <p className="text-xs text-muted-foreground">{project.freelancer.slice(0, 6)}...{project.freelancer.slice(-4)}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm">4.8</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
