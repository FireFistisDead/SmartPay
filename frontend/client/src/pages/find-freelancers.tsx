import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Users, 
  Eye, 
  MessageSquare, 
  Heart,
  ArrowLeft,
  TrendingUp,
  Award,
  Briefcase,
  Globe,
  Calendar,
  CheckCircle,
  Zap,
  Shield,
  Code,
  Palette,
  PenTool,
  Megaphone,
  BarChart3,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

// Types for freelancer data
interface FreelancerProfile {
  id: string;
  address: string;
  username: string;
  title: string;
  description: string;
  avatar: string;
  location: string;
  hourlyRate: number;
  totalEarned: number;
  jobsCompleted: number;
  successRate: number;
  responseTime: string;
  availability: 'available' | 'busy' | 'not_available';
  skills: string[];
  categories: string[];
  portfolio: {
    title: string;
    image: string;
    description: string;
  }[];
  reputation: {
    averageRating: number;
    totalReviews: number;
    reviews: {
      rating: number;
      comment: string;
      client: string;
      date: string;
    }[];
  };
  verifications: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    payment: boolean;
  };
  memberSince: string;
  languages: string[];
  timezone: string;
  isOnline: boolean;
  lastActive: string;
}

export default function FindFreelancers() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [filteredFreelancers, setFilteredFreelancers] = useState<FreelancerProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [rateRange, setRateRange] = useState<number[]>([0, 200]);
  const [ratingFilter, setRatingFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savedFreelancers, setSavedFreelancers] = useState<string[]>([]);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      const mockFreelancers: FreelancerProfile[] = [
        {
          id: "1",
          address: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          username: "alexdev_crypto",
          title: "Senior Blockchain Developer",
          description: "Full-stack blockchain developer with 5+ years experience in DeFi, NFTs, and smart contract development. Specialized in React, Solidity, and Web3 integration.",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
          location: "San Francisco, CA",
          hourlyRate: 85,
          totalEarned: 125000,
          jobsCompleted: 89,
          successRate: 98,
          responseTime: "< 1 hour",
          availability: "available",
          skills: ["React", "Solidity", "Node.js", "Web3", "TypeScript", "Smart Contracts"],
          categories: ["development", "blockchain"],
          portfolio: [
            {
              title: "DeFi Trading Platform",
              image: "/api/placeholder/300/200",
              description: "Built a comprehensive DeFi trading platform with AMM integration"
            }
          ],
          reputation: {
            averageRating: 4.9,
            totalReviews: 67,
            reviews: [
              {
                rating: 5,
                comment: "Exceptional work on our DeFi project. Delivered ahead of schedule!",
                client: "CryptoTech Solutions",
                date: "2025-08-15"
              }
            ]
          },
          verifications: {
            email: true,
            phone: true,
            identity: true,
            payment: true
          },
          memberSince: "2022-03-15",
          languages: ["English", "Spanish"],
          timezone: "PST",
          isOnline: true,
          lastActive: "2 minutes ago"
        },
        {
          id: "2",
          address: "0x9ba1f109551bD432803012645Hac136c1c1f3a33",
          username: "sarah_design_pro",
          title: "Senior UI/UX Designer",
          description: "Creative UI/UX designer specializing in Web3 and fintech applications. Expert in creating intuitive user experiences for complex blockchain interfaces.",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
          location: "London, UK",
          hourlyRate: 65,
          totalEarned: 89000,
          jobsCompleted: 156,
          successRate: 96,
          responseTime: "< 2 hours",
          availability: "available",
          skills: ["Figma", "Adobe Creative Suite", "Prototyping", "User Research", "Web3 UX"],
          categories: ["design", "user_experience"],
          portfolio: [
            {
              title: "Crypto Wallet Interface",
              image: "/api/placeholder/300/200",
              description: "Redesigned mobile wallet interface resulting in 40% increase in user engagement"
            }
          ],
          reputation: {
            averageRating: 4.8,
            totalReviews: 143,
            reviews: [
              {
                rating: 5,
                comment: "Amazing design work! Really understood our vision and delivered beautiful mockups.",
                client: "BlockchainStartup",
                date: "2025-08-20"
              }
            ]
          },
          verifications: {
            email: true,
            phone: true,
            identity: true,
            payment: true
          },
          memberSince: "2021-11-08",
          languages: ["English", "French"],
          timezone: "GMT",
          isOnline: false,
          lastActive: "1 hour ago"
        },
        {
          id: "3",
          address: "0x7ba1f109551bD432803012645Hac136c1c1f3a34",
          username: "mike_security_expert",
          title: "Smart Contract Auditor",
          description: "Blockchain security specialist with expertise in smart contract auditing, penetration testing, and vulnerability assessment. Certified ethical hacker.",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
          location: "Toronto, Canada",
          hourlyRate: 120,
          totalEarned: 210000,
          jobsCompleted: 45,
          successRate: 100,
          responseTime: "< 3 hours",
          availability: "busy",
          skills: ["Smart Contract Auditing", "Solidity", "Security Testing", "Penetration Testing", "Mythril"],
          categories: ["consulting", "security"],
          portfolio: [
            {
              title: "DeFi Protocol Security Audit",
              image: "/api/placeholder/300/200",
              description: "Comprehensive security audit for $50M TVL DeFi protocol"
            }
          ],
          reputation: {
            averageRating: 5.0,
            totalReviews: 38,
            reviews: [
              {
                rating: 5,
                comment: "Found critical vulnerabilities that could have cost us millions. Highly recommended!",
                client: "DeFi Protocol Inc",
                date: "2025-08-10"
              }
            ]
          },
          verifications: {
            email: true,
            phone: true,
            identity: true,
            payment: true
          },
          memberSince: "2023-01-20",
          languages: ["English"],
          timezone: "EST",
          isOnline: true,
          lastActive: "5 minutes ago"
        },
        {
          id: "4",
          address: "0x6ba1f109551bD432803012645Hac136c1c1f3a35",
          username: "emma_content_writer",
          title: "Blockchain Content Writer",
          description: "Specialized content writer for blockchain, cryptocurrency, and DeFi projects. Technical writing, blog posts, whitepapers, and marketing content.",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
          location: "Austin, TX",
          hourlyRate: 45,
          totalEarned: 67000,
          jobsCompleted: 234,
          successRate: 97,
          responseTime: "< 1 hour",
          availability: "available",
          skills: ["Technical Writing", "Content Strategy", "SEO", "Blockchain Knowledge", "Copywriting"],
          categories: ["writing", "marketing"],
          portfolio: [
            {
              title: "DeFi Educational Series",
              image: "/api/placeholder/300/200",
              description: "Created comprehensive educational content series that increased user engagement by 60%"
            }
          ],
          reputation: {
            averageRating: 4.7,
            totalReviews: 189,
            reviews: [
              {
                rating: 5,
                comment: "Excellent technical writer who really understands blockchain concepts.",
                client: "Crypto Education Platform",
                date: "2025-08-25"
              }
            ]
          },
          verifications: {
            email: true,
            phone: true,
            identity: false,
            payment: true
          },
          memberSince: "2022-06-12",
          languages: ["English"],
          timezone: "CST",
          isOnline: true,
          lastActive: "Just now"
        },
        {
          id: "5",
          address: "0x5ba1f109551bD432803012645Hac136c1c1f3a36",
          username: "david_marketing_guru",
          title: "Crypto Marketing Specialist",
          description: "Digital marketing expert focused on cryptocurrency and blockchain projects. Growth hacking, community building, and influencer marketing.",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=david",
          location: "Miami, FL",
          hourlyRate: 75,
          totalEarned: 156000,
          jobsCompleted: 78,
          successRate: 94,
          responseTime: "< 2 hours",
          availability: "available",
          skills: ["Digital Marketing", "Community Management", "Social Media", "Growth Hacking", "Influencer Marketing"],
          categories: ["marketing", "consulting"],
          portfolio: [
            {
              title: "NFT Project Launch Campaign",
              image: "/api/placeholder/300/200",
              description: "Successfully launched NFT project resulting in $2M in sales within first week"
            }
          ],
          reputation: {
            averageRating: 4.6,
            totalReviews: 92,
            reviews: [
              {
                rating: 5,
                comment: "Incredible results! Our community grew by 500% in just 2 months.",
                client: "NFT Collective",
                date: "2025-08-18"
              }
            ]
          },
          verifications: {
            email: true,
            phone: true,
            identity: true,
            payment: true
          },
          memberSince: "2022-09-03",
          languages: ["English", "Portuguese"],
          timezone: "EST",
          isOnline: false,
          lastActive: "3 hours ago"
        }
      ];
      setFreelancers(mockFreelancers);
      setFilteredFreelancers(mockFreelancers);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = freelancers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(freelancer =>
        freelancer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        freelancer.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(freelancer => 
        freelancer.categories.includes(categoryFilter)
      );
    }

    // Availability filter
    if (availabilityFilter !== "all") {
      filtered = filtered.filter(freelancer => 
        freelancer.availability === availabilityFilter
      );
    }

    // Rate range filter
    filtered = filtered.filter(freelancer => 
      freelancer.hourlyRate >= rateRange[0] && freelancer.hourlyRate <= rateRange[1]
    );

    // Rating filter
    if (ratingFilter > 0) {
      filtered = filtered.filter(freelancer => 
        freelancer.reputation.averageRating >= ratingFilter
      );
    }

    // Skills filter
    if (selectedSkills.length > 0) {
      filtered = filtered.filter(freelancer =>
        selectedSkills.every(skill => 
          freelancer.skills.some(freelancerSkill => 
            freelancerSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    // Sort
    switch (sortBy) {
      case "rating":
        filtered.sort((a, b) => b.reputation.averageRating - a.reputation.averageRating);
        break;
      case "rate-low":
        filtered.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case "rate-high":
        filtered.sort((a, b) => b.hourlyRate - a.hourlyRate);
        break;
      case "experience":
        filtered.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
        break;
      case "newest":
        filtered.sort((a, b) => new Date(b.memberSince).getTime() - new Date(a.memberSince).getTime());
        break;
    }

    setFilteredFreelancers(filtered);
  }, [freelancers, searchTerm, categoryFilter, availabilityFilter, rateRange, ratingFilter, selectedSkills, sortBy]);

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case "available": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "busy": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "not_available": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "development": return <Code className="w-4 h-4" />;
      case "design": return <Palette className="w-4 h-4" />;
      case "writing": return <PenTool className="w-4 h-4" />;
      case "marketing": return <Megaphone className="w-4 h-4" />;
      case "consulting": return <BarChart3 className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const toggleSaveFreelancer = (freelancerId: string) => {
    setSavedFreelancers(prev => 
      prev.includes(freelancerId) 
        ? prev.filter(id => id !== freelancerId)
        : [...prev, freelancerId]
    );
  };

  const allSkills = Array.from(new Set(freelancers.flatMap(f => f.skills)));

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
              <h1 className="text-3xl font-bold gradient-text">Find Freelancers</h1>
              <p className="text-muted-foreground">Discover talented professionals for your projects</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{filteredFreelancers.length} freelancers found</Badge>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:w-80 space-y-6"
          >
            <Card className="glass-morphism border-border/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search freelancers..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass-morphism border-border/50"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="glass-morphism border-border/50">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="blockchain">Blockchain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Availability</label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="glass-morphism border-border/50">
                      <SelectValue placeholder="All Availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Availability</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="not_available">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Hourly Rate Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Hourly Rate: ${rateRange[0]} - ${rateRange[1]}
                  </label>
                  <Slider
                    value={rateRange}
                    onValueChange={setRateRange}
                    max={200}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>

                {/* Minimum Rating */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Minimum Rating</label>
                  <Select value={ratingFilter.toString()} onValueChange={(value) => setRatingFilter(Number(value))}>
                    <SelectTrigger className="glass-morphism border-border/50">
                      <SelectValue placeholder="Any Rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any Rating</SelectItem>
                      <SelectItem value="4">4+ Stars</SelectItem>
                      <SelectItem value="4.5">4.5+ Stars</SelectItem>
                      <SelectItem value="4.8">4.8+ Stars</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Skills */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Skills</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {allSkills.slice(0, 10).map((skill) => (
                      <div key={skill} className="flex items-center space-x-2">
                        <Checkbox
                          id={skill}
                          checked={selectedSkills.includes(skill)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSkills([...selectedSkills, skill]);
                            } else {
                              setSelectedSkills(selectedSkills.filter(s => s !== skill));
                            }
                          }}
                        />
                        <label htmlFor={skill} className="text-sm cursor-pointer">
                          {skill}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort and View Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4"
            >
              <div className="text-sm text-muted-foreground">
                Showing {filteredFreelancers.length} of {freelancers.length} freelancers
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 glass-morphism border-border/50">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Most Relevant</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="rate-low">Lowest Rate</SelectItem>
                  <SelectItem value="rate-high">Highest Rate</SelectItem>
                  <SelectItem value="experience">Most Experience</SelectItem>
                  <SelectItem value="newest">Newest Members</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Freelancers List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="glass-morphism border-border/50">
                      <CardContent className="p-6">
                        <div className="animate-pulse flex space-x-4">
                          <div className="w-16 h-16 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-6 bg-muted rounded w-3/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredFreelancers.length === 0 ? (
                <Card className="glass-morphism border-border/50">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Freelancers Found</h3>
                    <p className="text-muted-foreground mb-6">
                      No freelancers match your current filters. Try adjusting your search criteria.
                    </p>
                    <Button 
                      onClick={() => {
                        setSearchTerm("");
                        setCategoryFilter("all");
                        setAvailabilityFilter("all");
                        setRateRange([0, 200]);
                        setRatingFilter(0);
                        setSelectedSkills([]);
                      }}
                      className="bg-gradient-to-r from-primary to-secondary"
                    >
                      Clear All Filters
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredFreelancers.map((freelancer, index) => (
                  <motion.div
                    key={freelancer.id}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Avatar and Online Status */}
                          <div className="relative">
                            <Avatar className="w-16 h-16">
                              <AvatarImage src={freelancer.avatar} alt={freelancer.username} />
                              <AvatarFallback>
                                {freelancer.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {freelancer.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background"></div>
                            )}
                          </div>

                          {/* Main Content */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center space-x-3 mb-1">
                                  <h3 className="text-xl font-semibold hover:text-primary transition-colors cursor-pointer">
                                    {freelancer.username}
                                  </h3>
                                  <Badge className={`${getAvailabilityColor(freelancer.availability)} border text-xs`}>
                                    {freelancer.availability.replace('_', ' ')}
                                  </Badge>
                                  {freelancer.isOnline && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                                      Online
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-lg font-medium text-muted-foreground mb-2">
                                  {freelancer.title}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                  <div className="flex items-center space-x-1">
                                    <MapPin className="w-4 h-4" />
                                    <span>{freelancer.location}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{freelancer.responseTime} response</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>Member since {new Date(freelancer.memberSince).getFullYear()}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleSaveFreelancer(freelancer.id)}
                                  className={savedFreelancers.includes(freelancer.id) ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}
                                >
                                  <Heart className={`w-4 h-4 ${savedFreelancers.includes(freelancer.id) ? "fill-current" : ""}`} />
                                </Button>
                                <Button variant="outline" size="sm" className="glass-morphism">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </Button>
                                <Button size="sm" className="bg-gradient-to-r from-primary to-secondary">
                                  <MessageSquare className="w-4 h-4 mr-2" />
                                  Contact
                                </Button>
                              </div>
                            </div>

                            <p className="text-muted-foreground mb-4 line-clamp-2">
                              {freelancer.description}
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="flex items-center justify-center space-x-1 mb-1">
                                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                  <span className="font-semibold">{freelancer.reputation.averageRating}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{freelancer.reputation.totalReviews} reviews</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="font-semibold text-green-600 mb-1">
                                  ${freelancer.hourlyRate}/hr
                                </div>
                                <p className="text-xs text-muted-foreground">Hourly rate</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="font-semibold mb-1">
                                  {freelancer.jobsCompleted}
                                </div>
                                <p className="text-xs text-muted-foreground">Jobs completed</p>
                              </div>
                              <div className="text-center p-3 bg-muted/30 rounded-lg">
                                <div className="font-semibold text-green-600 mb-1">
                                  {freelancer.successRate}%
                                </div>
                                <p className="text-xs text-muted-foreground">Success rate</p>
                              </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {freelancer.skills.slice(0, 6).map((skill, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {freelancer.skills.length > 6 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{freelancer.skills.length - 6} more
                                  </Badge>
                                )}
                              </div>

                              {/* Verifications */}
                              <div className="flex items-center space-x-4 mt-3">
                                <span className="text-sm text-muted-foreground">Verified:</span>
                                <div className="flex items-center space-x-2">
                                  {freelancer.verifications.email && (
                                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Email
                                    </Badge>
                                  )}
                                  {freelancer.verifications.identity && (
                                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-500">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Identity
                                    </Badge>
                                  )}
                                  {freelancer.verifications.payment && (
                                    <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-500">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      Payment
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
