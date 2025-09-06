import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Star,
  Clock,
  Target,
  Award,
  Users,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import ParticleBackground from "@/components/particle-background";

interface PerformanceMetrics {
  totalEarnings: string;
  monthlyGrowth: number;
  projectsCompleted: number;
  averageRating: number;
  successRate: number;
  clientRetention: number;
  avgProjectValue: string;
  hoursWorked: number;
  hourlyRate: string;
  activeProjects: number;
}

interface SkillPerformance {
  skill: string;
  projects: number;
  avgRating: number;
  totalEarnings: string;
  marketDemand: number;
}

interface MonthlyData {
  month: string;
  earnings: number;
  projects: number;
  rating: number;
  proposals: number;
  acceptanceRate: number;
}

export default function FreelancerAnalytics() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [skillsData, setSkillsData] = useState<SkillPerformance[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("6months");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockMetrics: PerformanceMetrics = {
      totalEarnings: "127.8",
      monthlyGrowth: 23.5,
      projectsCompleted: 24,
      averageRating: 4.8,
      successRate: 95.8,
      clientRetention: 78.3,
      avgProjectValue: "5.3",
      hoursWorked: 1847,
      hourlyRate: "0.069",
      activeProjects: 3
    };

    const mockSkillsData: SkillPerformance[] = [
      {
        skill: "React Development",
        projects: 8,
        avgRating: 4.9,
        totalEarnings: "42.5",
        marketDemand: 95
      },
      {
        skill: "Smart Contracts",
        projects: 6,
        avgRating: 4.7,
        totalEarnings: "38.2",
        marketDemand: 87
      },
      {
        skill: "UI/UX Design",
        projects: 5,
        avgRating: 4.8,
        totalEarnings: "25.8",
        marketDemand: 78
      },
      {
        skill: "Web3 Integration",
        projects: 4,
        avgRating: 4.6,
        totalEarnings: "18.3",
        marketDemand: 92
      },
      {
        skill: "TypeScript",
        projects: 3,
        avgRating: 4.9,
        totalEarnings: "12.4",
        marketDemand: 85
      }
    ];

    const mockMonthlyData: MonthlyData[] = [
      { month: "Jul", earnings: 18.5, projects: 3, rating: 4.7, proposals: 8, acceptanceRate: 62.5 },
      { month: "Aug", earnings: 22.3, projects: 4, rating: 4.8, proposals: 9, acceptanceRate: 66.7 },
      { month: "Sep", earnings: 19.8, projects: 3, rating: 4.6, proposals: 7, acceptanceRate: 57.1 },
      { month: "Oct", earnings: 25.1, projects: 5, rating: 4.9, proposals: 11, acceptanceRate: 72.7 },
      { month: "Nov", earnings: 28.7, projects: 6, rating: 4.8, proposals: 12, acceptanceRate: 75.0 },
      { month: "Dec", earnings: 31.4, projects: 4, rating: 4.9, proposals: 8, acceptanceRate: 87.5 }
    ];

    setMetrics(mockMetrics);
    setSkillsData(mockSkillsData);
    setMonthlyData(mockMonthlyData);
    setIsLoading(false);
  }, []);

  const getGrowthIcon = (growth: number) => {
    return growth > 0 ? (
      <ArrowUpRight className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowDownRight className="w-4 h-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth > 0 ? "text-green-600" : "text-red-600";
  };

  const exportAnalytics = () => {
    const exportData = {
      metrics,
      skillsData,
      monthlyData,
      exportDate: new Date().toISOString().split('T')[0]
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `freelancer-analytics-${exportData.exportDate}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
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
              <h1 className="text-3xl font-bold gradient-text">Performance Analytics</h1>
              <p className="text-muted-foreground">
                Track your freelance performance and growth metrics
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 Months</SelectItem>
                <SelectItem value="6months">6 Months</SelectItem>
                <SelectItem value="1year">1 Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportAnalytics} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold gradient-text">{metrics?.totalEarnings} ETH</p>
                  <div className={`flex items-center space-x-1 text-sm ${getGrowthColor(metrics?.monthlyGrowth || 0)}`}>
                    {getGrowthIcon(metrics?.monthlyGrowth || 0)}
                    <span>+{metrics?.monthlyGrowth}% this month</span>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">{metrics?.successRate}%</p>
                  <p className="text-sm text-muted-foreground">Project completion</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics?.averageRating}/5.0</p>
                  <p className="text-sm text-muted-foreground">Client satisfaction</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Client Retention</p>
                  <p className="text-2xl font-bold text-blue-600">{metrics?.clientRetention}%</p>
                  <p className="text-sm text-muted-foreground">Repeat clients</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs defaultValue="performance" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Work Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{metrics?.projectsCompleted}</p>
                        <p className="text-sm text-muted-foreground">Projects Completed</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">{metrics?.activeProjects}</p>
                        <p className="text-sm text-muted-foreground">Active Projects</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{metrics?.avgProjectValue} ETH</p>
                        <p className="text-sm text-muted-foreground">Avg Project Value</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{metrics?.hoursWorked}</p>
                        <p className="text-sm text-muted-foreground">Hours Worked</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Hourly Rate</span>
                        <span className="font-medium">{metrics?.hourlyRate} ETH/hour</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Success Rate</span>
                        <span className="font-medium text-green-600">{metrics?.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Client Retention</span>
                        <span className="font-medium text-blue-600">{metrics?.clientRetention}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Monthly Earnings Trend</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyData.map((month, index) => (
                        <div key={month.month} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                          <div>
                            <p className="font-medium">{month.month} 2024</p>
                            <p className="text-sm text-muted-foreground">{month.projects} projects</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold gradient-text">{month.earnings} ETH</p>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">{month.rating}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Skills Analysis Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5" />
                    <span>Skills Performance Analysis</span>
                  </CardTitle>
                  <CardDescription>
                    Analyze which skills generate the most revenue and client satisfaction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {skillsData.map((skill, index) => (
                      <div key={skill.skill} className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="font-semibold">{skill.skill}</h4>
                            <p className="text-sm text-muted-foreground">{skill.projects} projects completed</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold gradient-text">{skill.totalEarnings} ETH</p>
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{skill.avgRating}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Market Demand</span>
                            <span>{skill.marketDemand}%</span>
                          </div>
                          <Progress value={skill.marketDemand} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle>Proposal Success Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyData.map((month, index) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{month.month}</span>
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-muted-foreground">{month.proposals} proposals</span>
                            <Badge variant={month.acceptanceRate > 70 ? "default" : "secondary"}>
                              {month.acceptanceRate}% accepted
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle>Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">Strong Performance</p>
                          <p className="text-sm text-green-600 dark:text-green-300">Your success rate is above 90% - excellent work!</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-blue-800 dark:text-blue-200">Growing Demand</p>
                          <p className="text-sm text-blue-600 dark:text-blue-300">React and Web3 skills are trending upward</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">Opportunity</p>
                          <p className="text-sm text-amber-600 dark:text-amber-300">Consider increasing your hourly rate by 15%</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Award className="w-5 h-5" />
                      <span>2024 Goals Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Annual Earnings Goal</span>
                        <span className="text-sm text-muted-foreground">127.8 / 200 ETH</span>
                      </div>
                      <Progress value={63.9} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">63.9% completed</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Projects Completed</span>
                        <span className="text-sm text-muted-foreground">24 / 40</span>
                      </div>
                      <Progress value={60} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">60% completed</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Client Retention Rate</span>
                        <span className="text-sm text-muted-foreground">78.3 / 80%</span>
                      </div>
                      <Progress value={97.9} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">97.9% completed</p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Average Project Rating</span>
                        <span className="text-sm text-muted-foreground">4.8 / 4.7</span>
                      </div>
                      <Progress value={100} className="h-3" />
                      <p className="text-xs text-green-600 mt-1">Goal exceeded! 🎉</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5" />
                      <span>Quick Actions</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full" onClick={() => setLocation("/browse-projects")}>
                      <Target className="w-4 h-4 mr-2" />
                      Find High-Value Projects
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setLocation("/freelancer-profile-settings")}>
                      <Award className="w-4 h-4 mr-2" />
                      Update Skills & Portfolio
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setLocation("/payments-earnings")}>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Review Earnings
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      Set New Goals
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
