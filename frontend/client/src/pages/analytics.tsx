import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Clock,
  CheckCircle,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Download,
  Filter,
  RefreshCw,
  Target,
  Award,
  Star,
  Eye,
  MessageSquare,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

interface AnalyticsData {
  overview: {
    totalSpent: string;
    activeProjects: number;
    completedProjects: number;
    averageRating: number;
    totalFreelancers: number;
    successRate: number;
  };
  spending: {
    thisMonth: string;
    lastMonth: string;
    growth: number;
    breakdown: {
      development: number;
      design: number;
      marketing: number;
      other: number;
    };
  };
  projects: {
    onTime: number;
    delayed: number;
    early: number;
    avgCompletionTime: string;
  };
  freelancers: {
    topPerformers: Array<{
      name: string;
      rating: number;
      projects: number;
      totalEarned: string;
    }>;
    avgRating: number;
    rehireRate: number;
  };
  timeline: Array<{
    month: string;
    spent: number;
    projects: number;
  }>;
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("6months");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData: AnalyticsData = {
        overview: {
          totalSpent: "45,230",
          activeProjects: 8,
          completedProjects: 24,
          averageRating: 4.7,
          totalFreelancers: 15,
          successRate: 92.3
        },
        spending: {
          thisMonth: "8,450",
          lastMonth: "7,200",
          growth: 17.4,
          breakdown: {
            development: 45,
            design: 30,
            marketing: 15,
            other: 10
          }
        },
        projects: {
          onTime: 78,
          delayed: 15,
          early: 7,
          avgCompletionTime: "3.2 weeks"
        },
        freelancers: {
          topPerformers: [
            { name: "Alex Chen", rating: 4.9, projects: 6, totalEarned: "12,500" },
            { name: "Sarah Kim", rating: 5.0, projects: 4, totalEarned: "8,900" },
            { name: "Mike Rodriguez", rating: 4.8, projects: 5, totalEarned: "7,200" }
          ],
          avgRating: 4.7,
          rehireRate: 85
        },
        timeline: [
          { month: "Jan", spent: 5200, projects: 3 },
          { month: "Feb", spent: 6800, projects: 4 },
          { month: "Mar", spent: 4500, projects: 2 },
          { month: "Apr", spent: 7200, projects: 5 },
          { month: "May", spent: 8900, projects: 6 },
          { month: "Jun", spent: 8450, projects: 4 }
        ]
      };
      setAnalyticsData(mockData);
      setIsLoading(false);
    }, 1000);
  }, [timeRange]);

  const handleExportReport = () => {
    const reportData = {
      analytics: analyticsData,
      timeRange,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `smartpay-analytics-${timeRange}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (isLoading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 relative overflow-hidden">
        <ParticleBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="text-3xl font-bold gradient-text">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track your project performance and spending</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 glass-morphism border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={handleExportReport} className="glass-morphism">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 glass-morphism">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="spending" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Spending</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Projects</span>
            </TabsTrigger>
            <TabsTrigger value="freelancers" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Freelancers</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-2xl font-bold">${analyticsData.overview.totalSpent}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Projects</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.activeProjects}</p>
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
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.completedProjects}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Rating</p>
                      <p className="text-2xl font-bold">{analyticsData.overview.averageRating}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Success Rate and Performance */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Project Success Rate</CardTitle>
                  <CardDescription>Percentage of successfully completed projects</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold gradient-text">{analyticsData.overview.successRate}%</span>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        Excellent
                      </Badge>
                    </div>
                    <Progress value={analyticsData.overview.successRate} className="h-3" />
                    <p className="text-sm text-muted-foreground">
                      Based on {analyticsData.overview.completedProjects} completed projects
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Monthly Spending Trend</CardTitle>
                  <CardDescription>Spending comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">This Month</p>
                        <p className="text-2xl font-bold">${analyticsData.spending.thisMonth}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-green-500 font-medium">+{analyticsData.spending.growth}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Month: ${analyticsData.spending.lastMonth}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Timeline Chart Placeholder */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Spending Timeline</CardTitle>
                  <CardDescription>Monthly spending and project count</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center border-2 border-dashed border-border/50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Chart visualization would be rendered here</p>
                      <p className="text-sm text-muted-foreground">
                        Showing {analyticsData.timeline.length} months of data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Spending Tab */}
          <TabsContent value="spending" className="space-y-6">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Spending Breakdown</CardTitle>
                  <CardDescription>By category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Development</span>
                      <span className="font-medium">{analyticsData.spending.breakdown.development}%</span>
                    </div>
                    <Progress value={analyticsData.spending.breakdown.development} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Design</span>
                      <span className="font-medium">{analyticsData.spending.breakdown.design}%</span>
                    </div>
                    <Progress value={analyticsData.spending.breakdown.design} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Marketing</span>
                      <span className="font-medium">{analyticsData.spending.breakdown.marketing}%</span>
                    </div>
                    <Progress value={analyticsData.spending.breakdown.marketing} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Other</span>
                      <span className="font-medium">{analyticsData.spending.breakdown.other}%</span>
                    </div>
                    <Progress value={analyticsData.spending.breakdown.other} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Spending Insights</CardTitle>
                  <CardDescription>Key findings and recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <p className="font-medium text-green-500">Growth Trend</p>
                    </div>
                    <p className="text-sm">Your spending has increased by {analyticsData.spending.growth}% this month, indicating active project development.</p>
                  </div>
                  
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Target className="w-4 h-4 text-blue-500" />
                      <p className="font-medium text-blue-500">Category Focus</p>
                    </div>
                    <p className="text-sm">Development projects account for the majority of your spending ({analyticsData.spending.breakdown.development}%).</p>
                  </div>
                  
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <p className="font-medium text-yellow-500">ROI Opportunity</p>
                    </div>
                    <p className="text-sm">Consider increasing design spending to improve overall project quality and user satisfaction.</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold">{analyticsData.projects.onTime}%</p>
                    <p className="text-sm text-muted-foreground">On Time</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold">{analyticsData.projects.delayed}%</p>
                    <p className="text-sm text-muted-foreground">Delayed</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Zap className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{analyticsData.projects.early}%</p>
                    <p className="text-sm text-muted-foreground">Early</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Project Performance Metrics</CardTitle>
                  <CardDescription>Detailed project analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Average Completion Time</h4>
                      <p className="text-3xl font-bold gradient-text">{analyticsData.projects.avgCompletionTime}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        15% faster than platform average
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Project Timeline Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>On Time</span>
                          <span className="text-green-500">{analyticsData.projects.onTime}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Delayed</span>
                          <span className="text-yellow-500">{analyticsData.projects.delayed}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Early</span>
                          <span className="text-blue-500">{analyticsData.projects.early}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Freelancers Tab */}
          <TabsContent value="freelancers" className="space-y-6">
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Top Performing Freelancers</CardTitle>
                  <CardDescription>Based on ratings and project success</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analyticsData.freelancers.topPerformers.map((freelancer, index) => (
                      <div key={freelancer.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium">{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{freelancer.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{freelancer.rating}</span>
                              <span>•</span>
                              <span>{freelancer.projects} projects</span>
                            </div>
                          </div>
                        </div>
                        <p className="font-medium">${freelancer.totalEarned}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Freelancer Statistics</CardTitle>
                  <CardDescription>Overall freelancer performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">{analyticsData.freelancers.avgRating}</p>
                    <p className="text-sm text-muted-foreground">Average Freelancer Rating</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">{analyticsData.freelancers.rehireRate}%</p>
                    <p className="text-sm text-muted-foreground">Freelancer Rehire Rate</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">{analyticsData.overview.totalFreelancers}</p>
                    <p className="text-sm text-muted-foreground">Total Freelancers Worked With</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
