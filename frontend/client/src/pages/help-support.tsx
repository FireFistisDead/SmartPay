import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  HelpCircle,
  Search,
  MessageCircle,
  Book,
  Video,
  FileText,
  Mail,
  Phone,
  Send,
  Star,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Globe,
  Zap,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  views: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: 'open' | 'pending' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created: string;
  lastUpdate: string;
}

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'guide' | 'video' | 'documentation' | 'tutorial';
  duration?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  category: string;
}

export default function HelpSupport() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [activeTab, setActiveTab] = useState("faq");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [supportForm, setSupportForm] = useState({
    subject: "",
    category: "",
    priority: "",
    description: "",
    email: ""
  });

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  const faqs: FAQ[] = [
    {
      id: "faq_001",
      question: "How do I create my first project on SmartPay?",
      answer: "To create a project, go to your dashboard and click 'Create New Project'. Fill in the project details including title, description, budget, and timeline. Once submitted, freelancers can view and submit proposals for your project.",
      category: "getting-started",
      helpful: 45,
      views: 234
    },
    {
      id: "faq_002",
      question: "How does the escrow system work?",
      answer: "SmartPay uses smart contracts to automatically hold funds in escrow. When you fund a milestone, the payment is locked in a smart contract. Funds are only released when you approve the completed milestone or through our dispute resolution process.",
      category: "payments",
      helpful: 78,
      views: 456
    },
    {
      id: "faq_003",
      question: "What happens if I have a dispute with a freelancer?",
      answer: "If a dispute arises, you can open a dispute case through the Messages & Disputes page. Our arbitrators will review the evidence from both parties and make a fair decision. The smart contract will automatically execute the arbitrator's decision.",
      category: "disputes",
      helpful: 32,
      views: 189
    },
    {
      id: "faq_004",
      question: "What cryptocurrencies does SmartPay support?",
      answer: "SmartPay currently supports Ethereum (ETH), our native SmartPay Token (SPT), and major stablecoins like USDC and USDT. We're constantly adding support for more cryptocurrencies based on user demand.",
      category: "payments",
      helpful: 56,
      views: 312
    },
    {
      id: "faq_005",
      question: "How do I set up milestones for my project?",
      answer: "When creating or editing a project, you can break down the work into milestones. Each milestone should have a clear deliverable, timeline, and payment amount. This helps track progress and ensures freelancers are paid for completed work.",
      category: "projects",
      helpful: 67,
      views: 298
    },
    {
      id: "faq_006",
      question: "Is my personal information secure on SmartPay?",
      answer: "Yes, we take security seriously. We use industry-standard encryption, secure authentication methods including 2FA, and never store private keys. Your personal information is protected according to our privacy policy.",
      category: "security",
      helpful: 89,
      views: 445
    }
  ];

  const resources: Resource[] = [
    {
      id: "res_001",
      title: "Getting Started with SmartPay",
      description: "Complete guide to creating your first project and hiring freelancers",
      type: "guide",
      difficulty: "beginner",
      url: "/guides/getting-started",
      category: "getting-started"
    },
    {
      id: "res_002",
      title: "Understanding Smart Contracts",
      description: "Learn how our smart contract escrow system protects your payments",
      type: "video",
      duration: "12 min",
      difficulty: "intermediate",
      url: "/videos/smart-contracts",
      category: "blockchain"
    },
    {
      id: "res_003",
      title: "API Documentation",
      description: "Technical documentation for developers building on SmartPay",
      type: "documentation",
      difficulty: "advanced",
      url: "/docs/api",
      category: "developers"
    },
    {
      id: "res_004",
      title: "Project Management Best Practices",
      description: "Tips for effectively managing freelance projects and milestones",
      type: "tutorial",
      duration: "8 min",
      difficulty: "beginner",
      url: "/tutorials/project-management",
      category: "projects"
    }
  ];

  const supportTickets: SupportTicket[] = [
    {
      id: "ticket_001",
      subject: "Payment not released after milestone approval",
      status: "pending",
      priority: "high",
      created: "2025-09-07T10:30:00Z",
      lastUpdate: "2025-09-07T14:15:00Z"
    },
    {
      id: "ticket_002",
      subject: "Unable to connect MetaMask wallet",
      status: "resolved",
      priority: "medium",
      created: "2025-09-06T16:20:00Z",
      lastUpdate: "2025-09-07T09:45:00Z"
    }
  ];

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "getting-started", label: "Getting Started" },
    { id: "payments", label: "Payments & Escrow" },
    { id: "projects", label: "Project Management" },
    { id: "disputes", label: "Disputes" },
    { id: "security", label: "Security" },
    { id: "blockchain", label: "Blockchain" },
    { id: "developers", label: "Developers" }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmitTicket = () => {
    // Simulate ticket submission
    alert("Support ticket submitted successfully! We'll get back to you within 24 hours.");
    setSupportForm({
      subject: "",
      category: "",
      priority: "",
      description: "",
      email: ""
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'guide': return <Book className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'documentation': return <FileText className="w-4 h-4" />;
      case 'tutorial': return <Zap className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

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
              <h1 className="text-3xl font-bold gradient-text">Help & Support</h1>
              <p className="text-muted-foreground">Get help with SmartPay and find answers to your questions</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Live Chat</h3>
              <p className="text-sm text-muted-foreground">Get instant help</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Mail className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground">support@smartpay.io</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Community</h3>
              <p className="text-sm text-muted-foreground">Join discussions</p>
            </CardContent>
          </Card>

          <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-colors cursor-pointer">
            <CardContent className="p-4 text-center">
              <Globe className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <h3 className="font-medium mb-1">Status Page</h3>
              <p className="text-sm text-muted-foreground">Service status</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search help articles, guides, and FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-morphism border-border/50"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 glass-morphism">
              <TabsTrigger value="faq">FAQs</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="support">Contact Support</TabsTrigger>
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Find quick answers to common questions about SmartPay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredFAQs.length === 0 ? (
                    <div className="text-center py-8">
                      <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or category filter.
                      </p>
                    </div>
                  ) : (
                    <Accordion type="single" collapsible className="space-y-2">
                      {filteredFAQs.map((faq, index) => (
                        <motion.div
                          key={faq.id}
                          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <AccordionItem value={faq.id} className="border glass-morphism rounded-lg px-4">
                            <AccordionTrigger className="text-left">
                              <div className="flex items-center justify-between w-full mr-4">
                                <span>{faq.question}</span>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <Star className="w-4 h-4" />
                                  <span>{faq.helpful}</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4">
                              <p className="text-muted-foreground mb-4">{faq.answer}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span>{faq.views} views</span>
                                  <Badge variant="outline">{faq.category}</Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button variant="ghost" size="sm">
                                    <Star className="w-4 h-4 mr-1" />
                                    Helpful
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </motion.div>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Learning Resources</CardTitle>
                  <CardDescription>
                    Guides, tutorials, and documentation to help you master SmartPay
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredResources.length === 0 ? (
                    <div className="text-center py-8">
                      <Book className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No resources found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search terms or category filter.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredResources.map((resource, index) => (
                        <motion.div
                          key={resource.id}
                          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="glass-morphism border-border/30 hover:border-primary/30 transition-colors cursor-pointer h-full">
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    {getResourceIcon(resource.type)}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-medium text-sm">{resource.title}</h3>
                                    <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {resource.description}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <Badge variant="outline" className="text-xs">
                                        {resource.type}
                                      </Badge>
                                      <Badge className={`${getDifficultyColor(resource.difficulty)} border text-xs`}>
                                        {resource.difficulty}
                                      </Badge>
                                    </div>
                                    {resource.duration && (
                                      <span className="text-xs text-muted-foreground">
                                        {resource.duration}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contact Support Tab */}
            <TabsContent value="support">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Contact Support</CardTitle>
                  <CardDescription>
                    Can't find what you're looking for? Send us a message and we'll help you out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Brief description of your issue"
                        value={supportForm.subject}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, subject: e.target.value }))}
                        className="glass-morphism border-border/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={supportForm.email}
                        onChange={(e) => setSupportForm(prev => ({ ...prev, email: e.target.value }))}
                        className="glass-morphism border-border/50"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={supportForm.category} onValueChange={(value) => setSupportForm(prev => ({ ...prev, category: value }))}>
                        <SelectTrigger className="glass-morphism border-border/50">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="payments">Payments & Escrow</SelectItem>
                          <SelectItem value="projects">Project Management</SelectItem>
                          <SelectItem value="disputes">Disputes</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="technical">Technical Issues</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={supportForm.priority} onValueChange={(value) => setSupportForm(prev => ({ ...prev, priority: value }))}>
                        <SelectTrigger className="glass-morphism border-border/50">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - General inquiry</SelectItem>
                          <SelectItem value="medium">Medium - Issue affecting work</SelectItem>
                          <SelectItem value="high">High - Urgent issue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, and what you expected to happen."
                      value={supportForm.description}
                      onChange={(e) => setSupportForm(prev => ({ ...prev, description: e.target.value }))}
                      className="glass-morphism border-border/50 min-h-32"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleSubmitTicket}
                    className="w-full bg-gradient-to-r from-primary to-primary/80"
                    disabled={!supportForm.subject || !supportForm.email || !supportForm.description}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Submit Support Ticket
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Tickets Tab */}
            <TabsContent value="tickets">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>My Support Tickets</CardTitle>
                  <CardDescription>
                    Track the status of your support requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {supportTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No support tickets</h3>
                      <p className="text-muted-foreground">
                        You haven't submitted any support tickets yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {supportTickets.map((ticket, index) => (
                        <motion.div
                          key={ticket.id}
                          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                        >
                          <Card className="glass-morphism border-border/30 hover:border-primary/30 transition-colors cursor-pointer">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <h3 className="font-medium">{ticket.subject}</h3>
                                    <Badge className={`${getStatusColor(ticket.status)} border text-xs`}>
                                      {ticket.status}
                                    </Badge>
                                    <Badge className={`${getPriorityColor(ticket.priority)} border text-xs`}>
                                      {ticket.priority}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>Created: {new Date(ticket.created).toLocaleDateString()}</span>
                                    <span>Updated: {new Date(ticket.lastUpdate).toLocaleDateString()}</span>
                                    <span>ID: {ticket.id}</span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
