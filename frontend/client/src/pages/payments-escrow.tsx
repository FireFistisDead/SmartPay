import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  DollarSign,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  RefreshCw,
  Shield,
  CreditCard,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Send,
  Receipt,
  FileText,
  Activity,
  Plus,
  Minus,
  ArrowUpRight,
  ArrowDownLeft,
  Star,
  Users,
  Zap,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

// Types for payment and escrow data
interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'fee';
  amount: string;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  projectId?: string;
  projectTitle?: string;
  freelancer?: string;
  freelancerName?: string;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  gasFee?: string;
  timestamp: string;
  confirmations: number;
  requiredConfirmations: number;
}

interface EscrowContract {
  id: string;
  projectId: string;
  projectTitle: string;
  contractAddress: string;
  totalAmount: string;
  releasedAmount: string;
  pendingAmount: string;
  freelancer: string;
  freelancerName: string;
  arbiter: string;
  status: 'active' | 'completed' | 'disputed' | 'cancelled';
  milestones: {
    id: string;
    description: string;
    amount: string;
    status: 'locked' | 'released' | 'disputed';
    releaseDate?: string;
  }[];
  createdAt: string;
  lastUpdated: string;
}

interface PaymentMethod {
  id: string;
  type: 'crypto' | 'bank' | 'card';
  name: string;
  details: string;
  isDefault: boolean;
  isVerified: boolean;
  balance?: string;
  currency?: string;
}

interface WalletBalance {
  currency: string;
  symbol: string;
  balance: string;
  usdValue: string;
  change24h: number;
  icon: string;
}

export default function PaymentsEscrow() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [escrowContracts, setEscrowContracts] = useState<EscrowContract[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [walletBalances, setWalletBalances] = useState<WalletBalance[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      const mockTransactions: Transaction[] = [
        {
          id: "tx_001",
          type: "payment",
          amount: "1500.00",
          currency: "USDC",
          status: "completed",
          description: "Milestone 1 payment for E-commerce Website Development",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development",
          freelancer: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          freelancerName: "alexdev_crypto",
          txHash: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F9",
          blockNumber: 18456789,
          gasUsed: "21000",
          gasFee: "0.0021",
          timestamp: "2025-09-07T10:30:00Z",
          confirmations: 12,
          requiredConfirmations: 6
        },
        {
          id: "tx_002",
          type: "deposit",
          amount: "5000.00",
          currency: "USDC",
          status: "completed",
          description: "Project funding deposit",
          txHash: "0x8ba1f109551bD432803012645Hac136c1c1f3a33",
          blockNumber: 18456234,
          gasUsed: "45000",
          gasFee: "0.0045",
          timestamp: "2025-09-06T14:15:00Z",
          confirmations: 24,
          requiredConfirmations: 6
        },
        {
          id: "tx_003",
          type: "payment",
          amount: "3000.00",
          currency: "USDC",
          status: "pending",
          description: "Final payment for Mobile App UI/UX Design",
          projectId: "proj_002",
          projectTitle: "Mobile App UI/UX Design",
          freelancer: "0x9ba1f109551bD432803012645Hac136c1c1f3a33",
          freelancerName: "sarah_design_pro",
          timestamp: "2025-09-07T16:45:00Z",
          confirmations: 0,
          requiredConfirmations: 6
        },
        {
          id: "tx_004",
          type: "refund",
          amount: "1200.00",
          currency: "USDC",
          status: "completed",
          description: "Refund for cancelled project",
          projectId: "proj_003",
          projectTitle: "Content Writing for Blog",
          timestamp: "2025-09-05T11:20:00Z",
          confirmations: 18,
          requiredConfirmations: 6
        },
        {
          id: "tx_005",
          type: "fee",
          amount: "75.00",
          currency: "USDC",
          status: "completed",
          description: "Platform service fee",
          timestamp: "2025-09-07T10:30:00Z",
          confirmations: 12,
          requiredConfirmations: 6
        }
      ];

      const mockEscrowContracts: EscrowContract[] = [
        {
          id: "escrow_001",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development",
          contractAddress: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F9",
          totalAmount: "5000.00",
          releasedAmount: "1500.00",
          pendingAmount: "3500.00",
          freelancer: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          freelancerName: "alexdev_crypto",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          status: "active",
          milestones: [
            {
              id: "milestone_001",
              description: "Frontend Setup & Design",
              amount: "1500.00",
              status: "released",
              releaseDate: "2025-09-07T10:30:00Z"
            },
            {
              id: "milestone_002",
              description: "Backend API Development",
              amount: "2000.00",
              status: "locked"
            },
            {
              id: "milestone_003",
              description: "Payment Integration & Testing",
              amount: "1500.00",
              status: "locked"
            }
          ],
          createdAt: "2025-09-01T10:00:00Z",
          lastUpdated: "2025-09-07T10:30:00Z"
        },
        {
          id: "escrow_002",
          projectId: "proj_002",
          projectTitle: "Mobile App UI/UX Design",
          contractAddress: "0x8ba1f109551bD432803012645Hac136c1c1f3a33",
          totalAmount: "3000.00",
          releasedAmount: "3000.00",
          pendingAmount: "0.00",
          freelancer: "0x9ba1f109551bD432803012645Hac136c1c1f3a33",
          freelancerName: "sarah_design_pro",
          arbiter: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          status: "completed",
          milestones: [
            {
              id: "milestone_004",
              description: "Wireframes & User Flow",
              amount: "1000.00",
              status: "released",
              releaseDate: "2025-09-10T14:20:00Z"
            },
            {
              id: "milestone_005",
              description: "High-Fidelity Designs",
              amount: "1500.00",
              status: "released",
              releaseDate: "2025-09-20T16:15:00Z"
            },
            {
              id: "milestone_006",
              description: "Prototype & Handoff",
              amount: "500.00",
              status: "released",
              releaseDate: "2025-09-24T15:30:00Z"
            }
          ],
          createdAt: "2025-08-25T10:00:00Z",
          lastUpdated: "2025-09-24T15:30:00Z"
        }
      ];

      const mockPaymentMethods: PaymentMethod[] = [
        {
          id: "pm_001",
          type: "crypto",
          name: "MetaMask Wallet",
          details: "0x742...A5F",
          isDefault: true,
          isVerified: true,
          balance: "12,456.78",
          currency: "USDC"
        },
        {
          id: "pm_002",
          type: "crypto",
          name: "Coinbase Wallet",
          details: "0x8ba...a32",
          isDefault: false,
          isVerified: true,
          balance: "2,340.56",
          currency: "ETH"
        },
        {
          id: "pm_003",
          type: "bank",
          name: "Chase Bank",
          details: "****1234",
          isDefault: false,
          isVerified: true
        }
      ];

      const mockWalletBalances: WalletBalance[] = [
        {
          currency: "USDC",
          symbol: "USDC",
          balance: "12,456.78",
          usdValue: "12,456.78",
          change24h: 0.02,
          icon: "💵"
        },
        {
          currency: "Ethereum",
          symbol: "ETH",
          balance: "3.45678",
          usdValue: "8,234.56",
          change24h: 2.34,
          icon: "⟠"
        },
        {
          currency: "Polygon",
          symbol: "MATIC",
          balance: "1,234.567",
          usdValue: "987.65",
          change24h: -1.23,
          icon: "🟣"
        }
      ];

      setTransactions(mockTransactions);
      setEscrowContracts(mockEscrowContracts);
      setPaymentMethods(mockPaymentMethods);
      setWalletBalances(mockWalletBalances);
      setFilteredTransactions(mockTransactions);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.freelancerName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, typeFilter, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "cancelled": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "deposit": return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case "withdrawal": return <ArrowUpRight className="w-4 h-4 text-blue-500" />;
      case "payment": return <Send className="w-4 h-4 text-purple-500" />;
      case "refund": return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case "fee": return <Receipt className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTotalBalance = () => {
    return walletBalances.reduce((sum, balance) => sum + parseFloat(balance.usdValue.replace(/,/g, '')), 0);
  };

  const getEscrowStats = () => {
    const total = escrowContracts.length;
    const active = escrowContracts.filter(e => e.status === "active").length;
    const completed = escrowContracts.filter(e => e.status === "completed").length;
    const totalLocked = escrowContracts.reduce((sum, e) => sum + parseFloat(e.pendingAmount), 0);
    const totalReleased = escrowContracts.reduce((sum, e) => sum + parseFloat(e.releasedAmount), 0);

    return { total, active, completed, totalLocked, totalReleased };
  };

  const escrowStats = getEscrowStats();

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
              onClick={() => setLocation("/dashboard")}
              className="glass-morphism border-border/30 hover:border-primary/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Payments & Escrow</h1>
              <p className="text-muted-foreground">Manage your transactions and escrow contracts</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog open={isDepositDialogOpen} onOpenChange={setIsDepositDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="glass-morphism">
                  <Plus className="w-4 h-4 mr-2" />
                  Deposit Funds
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-morphism border-border/50">
                <DialogHeader>
                  <DialogTitle>Deposit Funds</DialogTitle>
                  <DialogDescription>
                    Add funds to your SmartPay wallet for project payments
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="deposit-amount">Amount</Label>
                    <Input id="deposit-amount" placeholder="Enter amount" className="glass-morphism" />
                  </div>
                  <div>
                    <Label htmlFor="deposit-currency">Currency</Label>
                    <Select>
                      <SelectTrigger className="glass-morphism">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usdc">USDC</SelectItem>
                        <SelectItem value="eth">ETH</SelectItem>
                        <SelectItem value="matic">MATIC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet & Deposit
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <Minus className="w-4 h-4 mr-2" />
                  Withdraw
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-morphism border-border/50">
                <DialogHeader>
                  <DialogTitle>Withdraw Funds</DialogTitle>
                  <DialogDescription>
                    Withdraw available funds to your wallet
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="withdraw-amount">Amount</Label>
                    <Input id="withdraw-amount" placeholder="Enter amount" className="glass-morphism" />
                  </div>
                  <div>
                    <Label htmlFor="withdraw-address">Withdrawal Address</Label>
                    <Input id="withdraw-address" placeholder="0x..." className="glass-morphism" />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                    <Send className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-morphism">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="escrow">Escrow Contracts</TabsTrigger>
            <TabsTrigger value="wallets">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Balance Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Balance</p>
                      <p className="text-2xl font-bold">${getTotalBalance().toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Locked in Escrow</p>
                      <p className="text-2xl font-bold">${escrowStats.totalLocked.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Released</p>
                      <p className="text-2xl font-bold">${escrowStats.totalReleased.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Escrows</p>
                      <p className="text-2xl font-bold">{escrowStats.active}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Wallet Balances */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wallet className="w-5 h-5 mr-2" />
                    Wallet Balances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {walletBalances.map((balance) => (
                      <div key={balance.currency} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{balance.icon}</div>
                          <div>
                            <p className="font-medium">{balance.currency}</p>
                            <p className="text-sm text-muted-foreground">{balance.balance} {balance.symbol}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${balance.usdValue}</p>
                          <div className={`flex items-center text-sm ${balance.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {balance.change24h >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                            {Math.abs(balance.change24h)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Recent Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Activity className="w-5 h-5 mr-2" />
                      Recent Transactions
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab("transactions")}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-muted-foreground">{formatDate(transaction.timestamp)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{transaction.amount} {transaction.currency}</p>
                          <Badge className={`${getStatusColor(transaction.status)} border text-xs`}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-morphism border-border/50"
                  />
                </div>
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="payment">Payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                  <SelectItem value="fee">Fees</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Transactions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {filteredTransactions.map((transaction, index) => (
                <motion.div
                  key={transaction.id}
                  initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getTypeIcon(transaction.type)}
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{formatDate(transaction.timestamp)}</span>
                              {transaction.txHash && (
                                <button
                                  onClick={() => copyToClipboard(transaction.txHash!)}
                                  className="flex items-center space-x-1 hover:text-primary transition-colors"
                                >
                                  <span>Tx: {transaction.txHash.slice(0, 8)}...{transaction.txHash.slice(-6)}</span>
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                              {transaction.confirmations !== undefined && (
                                <span>
                                  {transaction.confirmations}/{transaction.requiredConfirmations} confirmations
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold">
                            {transaction.type === 'deposit' || transaction.type === 'refund' ? '+' : '-'}
                            {transaction.amount} {transaction.currency}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${getStatusColor(transaction.status)} border text-xs`}>
                              {transaction.status}
                            </Badge>
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
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Receipt
                                </DropdownMenuItem>
                                {transaction.txHash && (
                                  <DropdownMenuItem>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View on Explorer
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </TabsContent>

          {/* Escrow Contracts Tab */}
          <TabsContent value="escrow" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              {escrowContracts.map((contract, index) => (
                <Card key={contract.id} className="glass-morphism border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{contract.projectTitle}</CardTitle>
                        <CardDescription className="flex items-center space-x-2">
                          <span>Contract: {contract.contractAddress.slice(0, 8)}...{contract.contractAddress.slice(-6)}</span>
                          <button onClick={() => copyToClipboard(contract.contractAddress)}>
                            <Copy className="w-3 h-3" />
                          </button>
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(contract.status)} border`}>
                        {contract.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Contract Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-blue-500">${contract.totalAmount}</p>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-green-500">${contract.releasedAmount}</p>
                        <p className="text-sm text-muted-foreground">Released</p>
                      </div>
                      <div className="text-center p-4 bg-muted/30 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-500">${contract.pendingAmount}</p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round((parseFloat(contract.releasedAmount) / parseFloat(contract.totalAmount)) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(parseFloat(contract.releasedAmount) / parseFloat(contract.totalAmount)) * 100} 
                        className="h-2" 
                      />
                    </div>

                    {/* Milestones */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Milestones</h4>
                      {contract.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{milestone.description}</p>
                            <p className="text-sm text-muted-foreground">${milestone.amount}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${
                              milestone.status === 'released' 
                                ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                : milestone.status === 'disputed'
                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                            } border text-xs`}>
                              {milestone.status}
                            </Badge>
                            {milestone.status === 'locked' && contract.status === 'active' && (
                              <Button size="sm" variant="outline">
                                Release
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Freelancer Info */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${contract.freelancer}`} />
                          <AvatarFallback>
                            {contract.freelancerName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{contract.freelancerName}</p>
                          <p className="text-sm text-muted-foreground">{contract.freelancer.slice(0, 8)}...{contract.freelancer.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Contract
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </motion.div>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="wallets" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              {paymentMethods.map((method) => (
                <Card key={method.id} className="glass-morphism border-border/50">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          method.type === 'crypto' ? 'bg-purple-500/20' : 
                          method.type === 'bank' ? 'bg-blue-500/20' : 'bg-green-500/20'
                        }`}>
                          {method.type === 'crypto' ? <Wallet className="w-6 h-6 text-purple-500" /> :
                           method.type === 'bank' ? <CreditCard className="w-6 h-6 text-blue-500" /> :
                           <CreditCard className="w-6 h-6 text-green-500" />}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{method.name}</p>
                            {method.isDefault && (
                              <Badge variant="outline" className="text-xs">Default</Badge>
                            )}
                            {method.isVerified && (
                              <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{method.details}</p>
                          {method.balance && (
                            <p className="text-sm font-medium">{method.balance} {method.currency}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Card className="glass-morphism border-border/50 border-dashed">
                <CardContent className="p-6 text-center">
                  <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Add Payment Method</h3>
                  <p className="text-muted-foreground mb-4">Connect a new wallet or bank account</p>
                  <Button className="bg-gradient-to-r from-primary to-secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Method
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
