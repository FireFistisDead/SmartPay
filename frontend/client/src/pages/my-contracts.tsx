import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  Calendar,
  User,
  Filter,
  Search,
  MoreHorizontal,
  Upload,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import ParticleBackground from "@/components/particle-background";

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
}

interface Contract {
  id: string;
  projectTitle: string;
  clientName: string;
  clientAddress: string;
  clientAvatar?: string;
  totalAmount: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled' | 'disputed';
  progress: number;
  milestones: Milestone[];
  description: string;
  skills: string[];
  lastActivity: string;
  earnedAmount: string;
  pendingAmount: string;
  category: string;
}

export default function MyContracts() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for contracts
  useEffect(() => {
    const mockContracts: Contract[] = [
      {
        id: "contract_1",
        projectTitle: "NFT Marketplace Frontend Development",
        clientName: "CryptoCollectibles Inc",
        clientAddress: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F",
        clientAvatar: "",
        totalAmount: "7.2",
        startDate: "2024-11-15T00:00:00Z",
        endDate: "2024-12-31T23:59:59Z",
        status: "active",
        progress: 65,
        earnedAmount: "4.7",
        pendingAmount: "2.5",
        category: "Web Development",
        description: "Building a modern NFT marketplace with Web3 integration and responsive design.",
        skills: ["React", "Web3", "TypeScript", "UI/UX"],
        lastActivity: "2024-12-03T14:30:00Z",
        milestones: [
          {
            id: "m1",
            title: "UI/UX Design & Wireframes",
            description: "Complete design mockups and wireframes",
            amount: "1.8",
            dueDate: "2024-11-30T23:59:59Z",
            status: "approved",
            submittedAt: "2024-11-28T10:00:00Z",
            approvedAt: "2024-11-29T15:30:00Z"
          },
          {
            id: "m2",
            title: "Frontend Components Development",
            description: "Develop reusable React components",
            amount: "2.9",
            dueDate: "2024-12-15T23:59:59Z",
            status: "in_progress"
          },
          {
            id: "m3",
            title: "Web3 Integration & Testing",
            description: "Integrate wallet functionality and testing",
            amount: "2.5",
            dueDate: "2024-12-30T23:59:59Z",
            status: "pending"
          }
        ]
      },
      {
        id: "contract_2",
        projectTitle: "Smart Contract Security Audit",
        clientName: "DeFi Protocol",
        clientAddress: "0x853c24Bb5342D1433812012645Hac369f0754",
        clientAvatar: "",
        totalAmount: "12.5",
        startDate: "2024-10-01T00:00:00Z",
        endDate: "2024-11-30T23:59:59Z",
        status: "completed",
        progress: 100,
        earnedAmount: "12.5",
        pendingAmount: "0",
        category: "Blockchain",
        description: "Comprehensive security audit of DeFi lending protocol smart contracts.",
        skills: ["Solidity", "Security", "Audit", "DeFi"],
        lastActivity: "2024-11-25T16:45:00Z",
        milestones: [
          {
            id: "m4",
            title: "Initial Code Review",
            description: "Review smart contract code for vulnerabilities",
            amount: "4.0",
            dueDate: "2024-10-15T23:59:59Z",
            status: "approved",
            submittedAt: "2024-10-14T09:00:00Z",
            approvedAt: "2024-10-15T11:30:00Z"
          },
          {
            id: "m5",
            title: "Detailed Security Analysis",
            description: "Deep dive security analysis and testing",
            amount: "5.0",
            dueDate: "2024-11-10T23:59:59Z",
            status: "approved",
            submittedAt: "2024-11-08T14:00:00Z",
            approvedAt: "2024-11-09T10:15:00Z"
          },
          {
            id: "m6",
            title: "Final Report & Recommendations",
            description: "Complete audit report with recommendations",
            amount: "3.5",
            dueDate: "2024-11-25T23:59:59Z",
            status: "approved",
            submittedAt: "2024-11-24T12:00:00Z",
            approvedAt: "2024-11-25T16:45:00Z"
          }
        ]
      },
      {
        id: "contract_3",
        projectTitle: "Mobile App UI/UX Design",
        clientName: "TechStartup Ltd",
        clientAddress: "0x964d46Cc6752E2544823012645Hac480g0865",
        clientAvatar: "",
        totalAmount: "4.2",
        startDate: "2024-11-20T00:00:00Z",
        endDate: "2024-12-20T23:59:59Z",
        status: "active",
        progress: 30,
        earnedAmount: "1.3",
        pendingAmount: "2.9",
        category: "Design",
        description: "Modern mobile app interface design for crypto trading platform.",
        skills: ["UI/UX", "Figma", "Mobile Design", "Prototyping"],
        lastActivity: "2024-12-02T11:20:00Z",
        milestones: [
          {
            id: "m7",
            title: "User Research & Wireframes",
            description: "Research and create initial wireframes",
            amount: "1.3",
            dueDate: "2024-12-05T23:59:59Z",
            status: "approved",
            submittedAt: "2024-12-01T16:00:00Z",
            approvedAt: "2024-12-02T11:20:00Z"
          },
          {
            id: "m8",
            title: "High-Fidelity Designs",
            description: "Create detailed UI designs",
            amount: "1.9",
            dueDate: "2024-12-15T23:59:59Z",
            status: "in_progress"
          },
          {
            id: "m9",
            title: "Interactive Prototype",
            description: "Build interactive prototype",
            amount: "1.0",
            dueDate: "2024-12-20T23:59:59Z",
            status: "pending"
          }
        ]
      }
    ];

    setContracts(mockContracts);
    setFilteredContracts(mockContracts);
    setIsLoading(false);
  }, []);

  // Filter contracts
  useEffect(() => {
    let filtered = contracts;

    if (searchTerm) {
      filtered = filtered.filter(contract =>
        contract.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'disputed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'disputed': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const totalEarnings = contracts.reduce((sum, contract) => sum + parseFloat(contract.earnedAmount), 0);
  const totalPending = contracts.reduce((sum, contract) => sum + parseFloat(contract.pendingAmount), 0);
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const completedContracts = contracts.filter(c => c.status === 'completed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
      <div className="absolute inset-0 blockchain-grid opacity-5"></div>
      <ParticleBackground />
      
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
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
              <h1 className="text-3xl font-bold gradient-text">My Contracts</h1>
              <p className="text-muted-foreground">
                Manage your active and completed work contracts
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold gradient-text">{totalEarnings.toFixed(1)} ETH</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payment</p>
                  <p className="text-2xl font-bold text-yellow-600">{totalPending.toFixed(1)} ETH</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Contracts</p>
                  <p className="text-2xl font-bold text-blue-600">{activeContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedContracts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-between mb-6 glass-morphism border border-border/50 rounded-xl p-4"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border/50 bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="disputed">Disputed</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{filteredContracts.length} contracts</Badge>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Contracts List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-6"
        >
          {filteredContracts.map((contract, index) => (
            <motion.div
              key={contract.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold">{contract.projectTitle}</h3>
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(contract.status)}`}>
                          {getStatusIcon(contract.status)}
                          <span className="capitalize">{contract.status}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={contract.clientAvatar} />
                            <AvatarFallback className="text-xs">
                              {contract.clientName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{contract.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>Last activity: {getTimeAgo(contract.lastActivity)}</span>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {contract.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {contract.skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{contract.progress}%</span>
                        </div>
                        <Progress value={contract.progress} className="h-2" />
                      </div>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Total Value</p>
                        <p className="text-2xl font-bold gradient-text">{contract.totalAmount} ETH</p>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Earned:</span>
                          <span className="font-medium text-green-600">{contract.earnedAmount} ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pending:</span>
                          <span className="font-medium text-yellow-600">{contract.pendingAmount} ETH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestones */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-3">Milestones ({contract.milestones.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {contract.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="p-3 border border-border/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{milestone.title}</span>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getMilestoneStatusColor(milestone.status)}`}>
                              {milestone.status.replace('_', ' ')}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{milestone.amount} ETH</span>
                            <span>Due: {formatDate(milestone.dueDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator className="mb-4" />
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {contract.category}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message Client
                      </Button>
                      {contract.status === 'active' && (
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-primary to-secondary"
                          onClick={() => setLocation("/submit-deliverable")}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Work
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredContracts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-12"
          >
            <Card className="glass-morphism border-border/50 max-w-md mx-auto">
              <CardContent className="p-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Contracts Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters to see more contracts."
                    : "You don't have any contracts yet. Start browsing projects to get your first contract!"
                  }
                </p>
                <Button 
                  onClick={() => setLocation("/browse-projects")}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Browse Projects
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
