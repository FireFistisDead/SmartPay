import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Eye,
  Filter,
  Search,
  CreditCard,
  Wallet,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Target,
  Award,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ParticleBackground from "@/components/particle-background";

interface Transaction {
  id: string;
  type: 'received' | 'pending' | 'withdrawn' | 'fee';
  amount: string;
  currency: 'ETH' | 'USDC' | 'DAI';
  description: string;
  projectTitle: string;
  clientName: string;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  date: string;
  transactionHash?: string;
  milestone?: string;
  feeAmount?: string;
}

interface EarningsData {
  totalEarned: string;
  currentBalance: string;
  pendingPayments: string;
  thisMonthEarnings: string;
  lastMonthEarnings: string;
  growthPercentage: number;
  totalProjects: number;
  avgProjectValue: string;
  successRate: number;
}

interface PaymentMethod {
  id: string;
  type: 'crypto_wallet' | 'bank_account';
  name: string;
  address?: string;
  accountNumber?: string;
  isDefault: boolean;
  isVerified: boolean;
}

export default function PaymentsEarnings() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockEarningsData: EarningsData = {
      totalEarned: "45.7",
      currentBalance: "12.3",
      pendingPayments: "8.4",
      thisMonthEarnings: "15.2",
      lastMonthEarnings: "12.8",
      growthPercentage: 18.75,
      totalProjects: 12,
      avgProjectValue: "3.8",
      successRate: 95.5
    };

    const mockTransactions: Transaction[] = [
      {
        id: "tx_1",
        type: "received",
        amount: "2.5",
        currency: "ETH",
        description: "Milestone 2 payment received",
        projectTitle: "NFT Marketplace Frontend",
        clientName: "CryptoCollectibles Inc",
        status: "completed",
        date: "2024-12-03T14:30:00Z",
        transactionHash: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F...",
        milestone: "Frontend Components Development",
        feeAmount: "0.125"
      },
      {
        id: "tx_2",
        type: "pending",
        amount: "1.8",
        currency: "ETH",
        description: "Milestone 3 payment pending approval",
        projectTitle: "Smart Contract Audit",
        clientName: "DeFi Protocol",
        status: "pending",
        date: "2024-12-02T10:15:00Z",
        milestone: "Security Analysis Complete"
      },
      {
        id: "tx_3",
        type: "received",
        amount: "4.2",
        currency: "ETH",
        description: "Final project payment",
        projectTitle: "Mobile App Design",
        clientName: "TechStartup Ltd",
        status: "completed",
        date: "2024-11-28T16:45:00Z",
        transactionHash: "0x853c24Bb5342D1433812012645Hac369f075...",
        feeAmount: "0.21"
      },
      {
        id: "tx_4",
        type: "withdrawn",
        amount: "5.0",
        currency: "ETH",
        description: "Withdrawal to personal wallet",
        projectTitle: "Withdrawal",
        clientName: "SmartPay Platform",
        status: "completed",
        date: "2024-11-25T09:20:00Z",
        transactionHash: "0x964d46Cc6752E2544823012645Hac480g086..."
      },
      {
        id: "tx_5",
        type: "fee",
        amount: "0.15",
        currency: "ETH",
        description: "Platform service fee",
        projectTitle: "DeFi Analytics Dashboard",
        clientName: "Analytics Corp",
        status: "completed",
        date: "2024-11-20T12:30:00Z",
        transactionHash: "0x123c45Dd6789E1234567890123456789f012..."
      },
      {
        id: "tx_6",
        type: "received",
        amount: "3.5",
        currency: "ETH",
        description: "Milestone 1 payment received",
        projectTitle: "E-commerce Platform",
        clientName: "RetailTech Solutions",
        status: "completed",
        date: "2024-11-15T11:00:00Z",
        transactionHash: "0x456789Ee1234A5678901234567890123h123...",
        milestone: "Initial Development Phase",
        feeAmount: "0.175"
      }
    ];

    const mockPaymentMethods: PaymentMethod[] = [
      {
        id: "pm_1",
        type: "crypto_wallet",
        name: "MetaMask Wallet",
        address: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F1a7",
        isDefault: true,
        isVerified: true
      },
      {
        id: "pm_2",
        type: "crypto_wallet",
        name: "Coinbase Wallet",
        address: "0x853c24Bb5342D1433812012645Hac369f0754c8b",
        isDefault: false,
        isVerified: true
      }
    ];

    setEarningsData(mockEarningsData);
    setTransactions(mockTransactions);
    setFilteredTransactions(mockTransactions);
    setPaymentMethods(mockPaymentMethods);
    setIsLoading(false);
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(tx => tx.type === typeFilter);
    }

    if (selectedTimeframe !== "all") {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch (selectedTimeframe) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
      }
      
      filtered = filtered.filter(tx => new Date(tx.date) >= cutoffDate);
    }

    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, typeFilter, selectedTimeframe]);

  const getTransactionIcon = (type: string, status: string) => {
    if (status === "failed") return <XCircle className="w-5 h-5 text-red-500" />;
    if (status === "pending") return <Clock className="w-5 h-5 text-yellow-500" />;
    
    switch (type) {
      case "received": return <ArrowDownRight className="w-5 h-5 text-green-500" />;
      case "withdrawn": return <ArrowUpRight className="w-5 h-5 text-blue-500" />;
      case "fee": return <CreditCard className="w-5 h-5 text-purple-500" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <DollarSign className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "processing": return "bg-blue-100 text-blue-800 border-blue-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "received": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "withdrawn": return "bg-blue-100 text-blue-800 border-blue-200";
      case "fee": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleExportTransactions = () => {
    const exportData = {
      earningsData,
      transactions: filteredTransactions,
      exportDate: new Date().toISOString().split('T')[0],
      totalTransactions: filteredTransactions.length
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `payments-earnings-export-${exportData.exportDate}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading payments & earnings...</p>
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
              <h1 className="text-3xl font-bold gradient-text">Payments & Earnings</h1>
              <p className="text-muted-foreground">
                Track your income, payments, and financial performance
              </p>
            </div>
          </div>
          
          <Button onClick={handleExportTransactions} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </motion.div>

        {/* Earnings Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <PiggyBank className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold gradient-text">{earningsData?.totalEarned} ETH</p>
                  <p className="text-xs text-green-600 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{earningsData?.growthPercentage}% this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Wallet className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-blue-600">{earningsData?.currentBalance} ETH</p>
                  <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
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
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600">{earningsData?.pendingPayments} ETH</p>
                  <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Target className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{earningsData?.successRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Project completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
        >
          <Card className="lg:col-span-2 glass-morphism border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Monthly Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-xl font-bold gradient-text">{earningsData?.thisMonthEarnings} ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Last Month</p>
                    <p className="text-xl font-bold">{earningsData?.lastMonthEarnings} ETH</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Growth Progress</span>
                    <span className="text-green-600">+{earningsData?.growthPercentage}%</span>
                  </div>
                  <Progress value={earningsData?.growthPercentage} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{earningsData?.totalProjects}</p>
                    <p className="text-xs text-muted-foreground">Total Projects</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-lg font-bold">{earningsData?.avgProjectValue} ETH</p>
                    <p className="text-xs text-muted-foreground">Avg Project Value</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-primary to-secondary">
                <Wallet className="w-4 h-4 mr-2" />
                Withdraw Funds
              </Button>
              <Button variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment Methods
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="w-4 h-4 mr-2" />
                View Tax Report
              </Button>
              <Button variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Export History
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="glass-morphism border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Transaction History</span>
                </CardTitle>
                <Badge variant="outline">{filteredTransactions.length} transactions</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border/50 bg-background text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="failed">Failed</option>
                </select>
                
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border/50 bg-background text-sm"
                >
                  <option value="all">All Types</option>
                  <option value="received">Received</option>
                  <option value="pending">Pending</option>
                  <option value="withdrawn">Withdrawn</option>
                  <option value="fee">Fees</option>
                </select>
                
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-border/50 bg-background text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                </select>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {filteredTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-muted/50 rounded-lg">
                        {getTransactionIcon(transaction.type, transaction.status)}
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{transaction.description}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{transaction.projectTitle}</span>
                          <span>•</span>
                          <span>{transaction.clientName}</span>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                        {transaction.milestone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Milestone: {transaction.milestone}
                          </p>
                        )}
                        {transaction.transactionHash && (
                          <p className="text-xs text-blue-600 mt-1 font-mono">
                            {transaction.transactionHash.slice(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className={`text-lg font-bold ${
                            transaction.type === 'received' ? 'text-green-600' :
                            transaction.type === 'withdrawn' ? 'text-blue-600' :
                            transaction.type === 'fee' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {transaction.type === 'withdrawn' || transaction.type === 'fee' ? '-' : '+'}
                            {transaction.amount} {transaction.currency}
                          </p>
                          {transaction.feeAmount && (
                            <p className="text-xs text-red-600">
                              Fee: -{transaction.feeAmount} {transaction.currency}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(transaction.type)}`}>
                            {transaction.type}
                          </div>
                        </div>
                        
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                      ? "Try adjusting your filters to see more transactions."
                      : "You don't have any transactions yet."
                    }
                  </p>
                  <Button 
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setTypeFilter("all");
                      setSelectedTimeframe("all");
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
