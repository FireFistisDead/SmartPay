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
  Send,
  Plus,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ParticleBackground from "@/components/particle-background";

interface Proposal {
  id: string;
  projectTitle: string;
  clientName: string;
  clientAddress: string;
  proposedAmount: string;
  originalBudget: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: string;
  coverLetter: string;
  deliveryTime: string;
  skills: string[];
  attachments?: string[];
}

export default function Proposals() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [filteredProposals, setFilteredProposals] = useState<Proposal[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for proposals
  useEffect(() => {
    const mockProposals: Proposal[] = [
      {
        id: "prop_1",
        projectTitle: "NFT Marketplace Frontend Development",
        clientName: "CryptoCollectibles Inc",
        clientAddress: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F",
        proposedAmount: "7.2",
        originalBudget: "8.0",
        status: "pending",
        submittedAt: "2024-12-03T10:30:00Z",
        coverLetter: "I have 5+ years of experience in React and Web3 development...",
        deliveryTime: "3 weeks",
        skills: ["React", "Web3", "TypeScript", "UI/UX"]
      },
      {
        id: "prop_2",
        projectTitle: "Smart Contract Security Audit",
        clientName: "DeFi Protocol",
        clientAddress: "0x853c24Bb5342D1433812012645Hac369f0754",
        proposedAmount: "12.5",
        originalBudget: "15.0",
        status: "accepted",
        submittedAt: "2024-11-28T14:20:00Z",
        coverLetter: "As a certified smart contract auditor with 50+ audits...",
        deliveryTime: "2 weeks",
        skills: ["Solidity", "Security", "Audit", "DeFi"]
      },
      {
        id: "prop_3",
        projectTitle: "Brand Identity Design",
        clientName: "TechStartup Ltd",
        clientAddress: "0x964d46Cc6752E2544823012645Hac480g0865",
        proposedAmount: "3.8",
        originalBudget: "4.5",
        status: "rejected",
        submittedAt: "2024-11-20T09:15:00Z",
        coverLetter: "I specialize in modern, minimalist brand design...",
        deliveryTime: "1 week",
        skills: ["Design", "Branding", "Figma", "Illustration"]
      }
    ];

    setProposals(mockProposals);
    setFilteredProposals(mockProposals);
    setIsLoading(false);
  }, []);

  // Filter proposals
  useEffect(() => {
    let filtered = proposals;

    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(proposal => proposal.status === statusFilter);
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'withdrawn': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading proposals...</p>
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
              <h1 className="text-3xl font-bold gradient-text">My Proposals</h1>
              <p className="text-muted-foreground">
                Track and manage your project proposals
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setLocation("/browse-projects")}
            className="bg-gradient-to-r from-primary to-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Submit New Proposal
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex items-center justify-between mb-6 glass-morphism border border-border/50 rounded-xl p-4"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search proposals..."
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
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{filteredProposals.length} proposals</Badge>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </motion.div>

        {/* Proposals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {filteredProposals.map((proposal, index) => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
            >
              <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{proposal.projectTitle}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{proposal.clientName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(proposal.submittedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>{proposal.deliveryTime}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {proposal.skills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {proposal.coverLetter}
                      </p>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">Your Bid</p>
                        <p className="text-xl font-bold gradient-text">{proposal.proposedAmount} ETH</p>
                        <p className="text-xs text-muted-foreground">Budget: {proposal.originalBudget} ETH</p>
                      </div>
                      
                      <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                        {getStatusIcon(proposal.status)}
                        <span className="capitalize">{proposal.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      {proposal.status === 'pending' && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          Withdraw
                        </Button>
                      )}
                    </div>
                    
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredProposals.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center py-12"
          >
            <Card className="glass-morphism border-border/50 max-w-md mx-auto">
              <CardContent className="p-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Proposals Found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your filters to see more proposals."
                    : "You haven't submitted any proposals yet. Start browsing projects!"
                  }
                </p>
                <Button 
                  onClick={() => setLocation("/browse-projects")}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Submit Your First Proposal
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
