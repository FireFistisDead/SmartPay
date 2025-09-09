import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, Star, Clock, Coins, Users, Eye } from "lucide-react";

interface Project {
  id: string;
  title: string;
  description: string;
  client: string;
  clientRating: number;
  budget: string;
  milestones: number;
  timeline: string;
  category: string;
  skills: string[];
  applicants: number;
  postedTime: string;
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "DeFi Protocol Frontend Development",
    description: "Looking for an experienced React developer to build a modern, responsive frontend for our DeFi protocol. Must have experience with Web3 integration and wallet connections.",
    client: "@defi_innovations",
    clientRating: 4.8,
    budget: "25.0",
    milestones: 4,
    timeline: "6-8 weeks",
    category: "Web Development",
    skills: ["React", "TypeScript", "Web3", "Tailwind CSS"],
    applicants: 12,
    postedTime: "2 hours ago"
  },
  {
    id: "2",
    title: "Smart Contract Security Audit",
    description: "Need a thorough security audit for our NFT marketplace smart contracts. Looking for experienced auditors with proven track record.",
    client: "@nft_marketplace",
    clientRating: 4.9,
    budget: "40.0",
    milestones: 3,
    timeline: "3-4 weeks",
    category: "Blockchain",
    skills: ["Solidity", "Security", "Smart Contracts", "Audit"],
    applicants: 8,
    postedTime: "5 hours ago"
  },
  {
    id: "3",
    title: "Mobile App UI/UX Design",
    description: "Design a sleek, modern mobile app interface for our crypto trading platform. Need both iOS and Android designs with dark mode support.",
    client: "@crypto_trader",
    clientRating: 4.7,
    budget: "15.5",
    milestones: 5,
    timeline: "4-5 weeks",
    category: "Design",
    skills: ["UI/UX", "Figma", "Mobile Design", "Crypto"],
    applicants: 23,
    postedTime: "1 day ago"
  },
  {
    id: "4",
    title: "Technical Documentation Writing",
    description: "Create comprehensive documentation for our API and smart contract integration. Need someone with technical writing experience in Web3.",
    client: "@blockchain_startup",
    clientRating: 4.6,
    budget: "8.0",
    milestones: 2,
    timeline: "2-3 weeks",
    category: "Writing",
    skills: ["Technical Writing", "API Documentation", "Blockchain"],
    applicants: 15,
    postedTime: "3 days ago"
  }
];

const ProjectCard = ({ project }: { project: Project }) => {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="glass-morphism border-border/50 card-hover h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{project.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-3">
                {project.description}
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-4">
              {project.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {project.client.charAt(1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">{project.client}</p>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs text-muted-foreground">{project.clientRating}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-semibold">{project.budget} ETH</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{project.timeline}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{project.milestones} milestones</span>
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{project.applicants} applicants</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {project.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{project.skills.length - 3} more
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">{project.postedTime}</span>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setLocation(`/project/${project.id}`)}
                data-testid={`button-view-details-${project.id}`}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
              <Button 
                size="sm"
                className="bg-gradient-to-r from-secondary to-accent"
                data-testid={`button-apply-${project.id}`}
              >
                Apply Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function BrowseProjects() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState("all");

  const filteredProjects = mockProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === "all" || project.category === categoryFilter;
    
    const matchesBudget = budgetFilter === "all" || 
      (budgetFilter === "low" && parseFloat(project.budget) < 10) ||
      (budgetFilter === "medium" && parseFloat(project.budget) >= 10 && parseFloat(project.budget) < 25) ||
      (budgetFilter === "high" && parseFloat(project.budget) >= 25);

    return matchesSearch && matchesCategory && matchesBudget;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 glass-morphism">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={goToDashboard}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Browse Projects</h1>
                <p className="text-muted-foreground">Find your next opportunity</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-xl font-bold gradient-text">SmartPay</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 pt-24">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="glass-morphism border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search projects by title, description, or skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-projects"
                    />
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48" data-testid="select-category">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Web Development">Web Development</SelectItem>
                      <SelectItem value="Blockchain">Blockchain</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Writing">Writing</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={budgetFilter} onValueChange={setBudgetFilter}>
                    <SelectTrigger className="w-48" data-testid="select-budget">
                      <SelectValue placeholder="Budget Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Budgets</SelectItem>
                      <SelectItem value="low">Under 10 ETH</SelectItem>
                      <SelectItem value="medium">10-25 ETH</SelectItem>
                      <SelectItem value="high">25+ ETH</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" data-testid="button-filters">
                    <Filter className="h-4 w-4 mr-2" />
                    More Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground" data-testid="text-results-count">
              Showing {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
            </p>
            <Select defaultValue="newest">
              <SelectTrigger className="w-48" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="budget-high">Highest Budget</SelectItem>
                <SelectItem value="budget-low">Lowest Budget</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <ProjectCard project={project} />
            </motion.div>
          ))}
        </motion.div>

        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground text-lg">No projects found matching your criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
                setBudgetFilter("all");
              }}
              data-testid="button-clear-filters"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}