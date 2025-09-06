import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  MessageSquare,
  AlertTriangle,
  Send,
  Search,
  Filter,
  Clock,
  CheckCircle,
  Eye,
  MoreHorizontal,
  Phone,
  Video,
  Paperclip,
  Smile,
  Settings,
  Star,
  Flag,
  Shield,
  FileText,
  Calendar,
  Users,
  Award,
  TrendingUp,
  Activity,
  Bell,
  Archive,
  Trash2,
  Reply,
  Forward
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

// Types for messages and disputes
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'file' | 'image' | 'system';
  fileUrl?: string;
  fileName?: string;
  projectId?: string;
  projectTitle?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string;
  participantRole: 'freelancer' | 'client' | 'arbiter';
  projectId?: string;
  projectTitle?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastActive: string;
  conversationType: 'project' | 'support' | 'dispute';
}

interface Dispute {
  id: string;
  projectId: string;
  projectTitle: string;
  disputeType: 'payment' | 'quality' | 'deadline' | 'scope' | 'other';
  status: 'open' | 'in_review' | 'resolved' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  raisedBy: string;
  raisedByName: string;
  raisedByRole: 'client' | 'freelancer';
  againstId: string;
  againstName: string;
  againstRole: 'client' | 'freelancer';
  arbiterAsigned?: string;
  arbiterName?: string;
  description: string;
  evidence: {
    type: 'text' | 'file' | 'image';
    content: string;
    url?: string;
    timestamp: string;
  }[];
  resolution?: string;
  amount: string;
  createdAt: string;
  updatedAt: string;
  deadline: string;
}

interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'freelancer' | 'arbiter' | 'system';
  content: string;
  timestamp: string;
  messageType: 'message' | 'evidence' | 'decision' | 'system';
  attachments?: {
    type: string;
    url: string;
    name: string;
  }[];
}

export default function MessagesDisputes() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [activeTab, setActiveTab] = useState("messages");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [disputeMessages, setDisputeMessages] = useState<DisputeMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDisputeOpen, setIsCreateDisputeOpen] = useState(false);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTimeout(() => {
      const mockConversations: Conversation[] = [
        {
          id: "conv_001",
          participantId: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          participantName: "alexdev_crypto",
          participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
          participantRole: "freelancer",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development",
          lastMessage: "I've completed the frontend setup and uploaded the initial designs for review.",
          lastMessageTime: "2025-09-07T16:30:00Z",
          unreadCount: 2,
          isOnline: true,
          lastActive: "2 minutes ago",
          conversationType: "project"
        },
        {
          id: "conv_002",
          participantId: "0x9ba1f109551bD432803012645Hac136c1c1f3a33",
          participantName: "sarah_design_pro",
          participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
          participantRole: "freelancer",
          projectId: "proj_002",
          projectTitle: "Mobile App UI/UX Design",
          lastMessage: "The final prototype is ready for testing. Please check your email for the Figma link.",
          lastMessageTime: "2025-09-07T14:15:00Z",
          unreadCount: 0,
          isOnline: false,
          lastActive: "1 hour ago",
          conversationType: "project"
        },
        {
          id: "conv_003",
          participantId: "0x7ba1f109551bD432803012645Hac136c1c1f3a34",
          participantName: "mike_security_expert",
          participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
          participantRole: "freelancer",
          projectId: "proj_004",
          projectTitle: "Smart Contract Audit",
          lastMessage: "Found several critical vulnerabilities. Detailed report will be ready by tomorrow.",
          lastMessageTime: "2025-09-07T12:45:00Z",
          unreadCount: 1,
          isOnline: true,
          lastActive: "5 minutes ago",
          conversationType: "project"
        },
        {
          id: "conv_004",
          participantId: "support_001",
          participantName: "SmartPay Support",
          participantAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=support",
          participantRole: "arbiter",
          lastMessage: "Your payment issue has been resolved. Funds will be available in 24 hours.",
          lastMessageTime: "2025-09-06T18:30:00Z",
          unreadCount: 0,
          isOnline: true,
          lastActive: "Online",
          conversationType: "support"
        }
      ];

      const mockDisputes: Dispute[] = [
        {
          id: "dispute_001",
          projectId: "proj_003",
          projectTitle: "Content Writing for Blog",
          disputeType: "quality",
          status: "in_review",
          priority: "medium",
          raisedBy: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          raisedByName: "client_user",
          raisedByRole: "client",
          againstId: "0x6ba1f109551bD432803012645Hac136c1c1f3a35",
          againstName: "emma_content_writer",
          againstRole: "freelancer",
          arbiterAsigned: "0x5ba1f109551bD432803012645Hac136c1c1f3a37",
          arbiterName: "arbiter_pro",
          description: "The delivered content does not meet the specified requirements. Multiple grammatical errors and factual inaccuracies were found.",
          evidence: [
            {
              type: "text",
              content: "Original requirements document attached showing specific guidelines that were not followed.",
              timestamp: "2025-09-06T10:00:00Z"
            },
            {
              type: "file",
              content: "Content review document highlighting issues",
              url: "/files/content-review.pdf",
              timestamp: "2025-09-06T10:15:00Z"
            }
          ],
          amount: "1200.00",
          createdAt: "2025-09-06T09:30:00Z",
          updatedAt: "2025-09-07T14:20:00Z",
          deadline: "2025-09-10T23:59:59Z"
        },
        {
          id: "dispute_002",
          projectId: "proj_005",
          projectTitle: "Logo Design Project",
          disputeType: "payment",
          status: "resolved",
          priority: "low",
          raisedBy: "0x4ba1f109551bD432803012645Hac136c1c1f3a38",
          raisedByName: "designer_pro",
          raisedByRole: "freelancer",
          againstId: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          againstName: "client_user",
          againstRole: "client",
          arbiterAsigned: "0x5ba1f109551bD432803012645Hac136c1c1f3a37",
          arbiterName: "arbiter_pro",
          description: "Client approved the final milestone but payment has not been released after 48 hours.",
          evidence: [
            {
              type: "text",
              content: "Email confirmation from client approving final deliverables",
              timestamp: "2025-09-04T16:30:00Z"
            }
          ],
          resolution: "Payment was released to freelancer. Client was informed about the automatic release mechanism.",
          amount: "800.00",
          createdAt: "2025-09-04T18:00:00Z",
          updatedAt: "2025-09-05T12:00:00Z",
          deadline: "2025-09-08T23:59:59Z"
        }
      ];

      const mockMessages: Message[] = [
        {
          id: "msg_001",
          conversationId: "conv_001",
          senderId: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          senderName: "alexdev_crypto",
          senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
          recipientId: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          content: "Hi! I've completed the initial setup for the e-commerce platform. The basic structure is in place.",
          timestamp: "2025-09-07T15:30:00Z",
          isRead: true,
          messageType: "text",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development"
        },
        {
          id: "msg_002",
          conversationId: "conv_001",
          senderId: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          senderName: "You",
          senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=client",
          recipientId: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          content: "Great! Can you share the preview link so I can take a look?",
          timestamp: "2025-09-07T15:45:00Z",
          isRead: true,
          messageType: "text",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development"
        },
        {
          id: "msg_003",
          conversationId: "conv_001",
          senderId: "0x8ba1f109551bD432803012645Hac136c1c1f3a32",
          senderName: "alexdev_crypto",
          senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
          recipientId: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
          content: "I've completed the frontend setup and uploaded the initial designs for review.",
          timestamp: "2025-09-07T16:30:00Z",
          isRead: false,
          messageType: "text",
          projectId: "proj_001",
          projectTitle: "E-commerce Website Development"
        }
      ];

      setConversations(mockConversations);
      setDisputes(mockDisputes);
      setMessages(mockMessages);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_review": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "resolved": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "escalated": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "closed": return "bg-gray-500/10 text-gray-500 border-gray-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "high": return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low": return "bg-green-500/10 text-green-500 border-green-500/20";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      conversationId: selectedConversation,
      senderId: "0x742d35Cc6634C0532925a3b8D451C89C05B8A5F",
      senderName: "You",
      senderAvatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=client",
      recipientId: conversations.find(c => c.id === selectedConversation)?.participantId || "",
      content: messageText,
      timestamp: new Date().toISOString(),
      isRead: true,
      messageType: "text"
    };

    setMessages(prev => [...prev, newMessage]);
    setMessageText("");

    // Update conversation last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: messageText, lastMessageTime: newMessage.timestamp }
          : conv
      )
    );
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm) {
      return conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
             conv.projectTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  const filteredDisputes = disputes.filter(dispute => {
    let matches = true;
    
    if (searchTerm) {
      matches = matches && (
        dispute.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dispute.againstName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== "all") {
      matches = matches && dispute.status === statusFilter;
    }
    
    if (typeFilter !== "all") {
      matches = matches && dispute.disputeType === typeFilter;
    }
    
    return matches;
  });

  const conversationMessages = messages.filter(msg => msg.conversationId === selectedConversation);

  const getDisputeStats = () => {
    const total = disputes.length;
    const open = disputes.filter(d => d.status === "open").length;
    const inReview = disputes.filter(d => d.status === "in_review").length;
    const resolved = disputes.filter(d => d.status === "resolved").length;

    return { total, open, inReview, resolved };
  };

  const disputeStats = getDisputeStats();

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
              <h1 className="text-3xl font-bold gradient-text">Messages & Disputes</h1>
              <p className="text-muted-foreground">Communicate and resolve project issues</p>
            </div>
          </div>
          <Dialog open={isCreateDisputeOpen} onOpenChange={setIsCreateDisputeOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-red-500 to-orange-500">
                <Flag className="w-4 h-4 mr-2" />
                Raise Dispute
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-morphism border-border/50 max-w-md">
              <DialogHeader>
                <DialogTitle>Raise a Dispute</DialogTitle>
                <DialogDescription>
                  Submit a formal dispute for project-related issues
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dispute-project">Project</Label>
                  <Select>
                    <SelectTrigger className="glass-morphism">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proj_001">E-commerce Website Development</SelectItem>
                      <SelectItem value="proj_002">Mobile App UI/UX Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dispute-type">Dispute Type</Label>
                  <Select>
                    <SelectTrigger className="glass-morphism">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Issue</SelectItem>
                      <SelectItem value="quality">Quality Issue</SelectItem>
                      <SelectItem value="deadline">Deadline Issue</SelectItem>
                      <SelectItem value="scope">Scope Change</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dispute-description">Description</Label>
                  <Textarea 
                    id="dispute-description" 
                    placeholder="Describe the issue in detail..."
                    className="glass-morphism min-h-20"
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-red-500 to-orange-500">
                  <Flag className="w-4 h-4 mr-2" />
                  Submit Dispute
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 glass-morphism">
            <TabsTrigger value="messages" className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Messages</span>
              {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0) > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-5 h-5 rounded-full">
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Disputes</span>
              {disputeStats.open + disputeStats.inReview > 0 && (
                <Badge className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 min-w-5 h-5 rounded-full">
                  {disputeStats.open + disputeStats.inReview}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Conversations List */}
              <Card className="glass-morphism border-border/50 lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Conversations</CardTitle>
                    <Badge variant="outline">{filteredConversations.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 glass-morphism border-border/50"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[480px]">
                    <div className="space-y-1 p-4">
                      {filteredConversations.map((conversation) => (
                        <motion.div
                          key={conversation.id}
                          initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedConversation === conversation.id
                              ? "bg-primary/10 border border-primary/30"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="relative">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={conversation.participantAvatar} alt={conversation.participantName} />
                                <AvatarFallback>
                                  {conversation.participantName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {conversation.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conversation.participantName}</p>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(conversation.lastMessageTime)}
                                </span>
                              </div>
                              {conversation.projectTitle && (
                                <p className="text-xs text-muted-foreground truncate mb-1">
                                  {conversation.projectTitle}
                                </p>
                              )}
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground truncate flex-1">
                                  {conversation.lastMessage}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-5 h-5 rounded-full ml-2">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Area */}
              <Card className="glass-morphism border-border/50 lg:col-span-2">
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {(() => {
                            const conv = conversations.find(c => c.id === selectedConversation);
                            return conv ? (
                              <>
                                <div className="relative">
                                  <Avatar className="w-10 h-10">
                                    <AvatarImage src={conv.participantAvatar} alt={conv.participantName} />
                                    <AvatarFallback>
                                      {conv.participantName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  {conv.isOnline && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium">{conv.participantName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {conv.isOnline ? "Online" : `Last active ${conv.lastActive}`}
                                  </p>
                                </div>
                              </>
                            ) : null;
                          })()}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Video className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Archive className="w-4 h-4 mr-2" />
                                Archive Chat
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Flag className="w-4 h-4 mr-2" />
                                Report User
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Chat
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      <Separator />
                    </CardHeader>

                    {/* Messages */}
                    <CardContent className="px-0">
                      <ScrollArea className="h-[350px] px-4">
                        <div className="space-y-4">
                          {conversationMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.senderName === "You" ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`flex items-start space-x-2 max-w-[70%] ${
                                message.senderName === "You" ? "flex-row-reverse space-x-reverse" : ""
                              }`}>
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                                  <AvatarFallback>
                                    {message.senderName.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className={`p-3 rounded-lg ${
                                  message.senderName === "You"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}>
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    message.senderName === "You" ? "text-primary-foreground/70" : "text-muted-foreground"
                                  }`}>
                                    {formatDate(message.timestamp)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>

                    {/* Message Input */}
                    <div className="p-4 border-t border-border/50">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                            className="glass-morphism border-border/50 pr-10"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2"
                          >
                            <Smile className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          onClick={sendMessage}
                          disabled={!messageText.trim()}
                          className="bg-gradient-to-r from-primary to-secondary"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                      <p className="text-muted-foreground">Choose a conversation from the list to start messaging</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-6">
            {/* Dispute Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6"
            >
              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Disputes</p>
                      <p className="text-2xl font-bold">{disputeStats.total}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Open</p>
                      <p className="text-2xl font-bold">{disputeStats.open}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-morphism border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">In Review</p>
                      <p className="text-2xl font-bold">{disputeStats.inReview}</p>
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
                      <p className="text-sm text-muted-foreground">Resolved</p>
                      <p className="text-2xl font-bold">{disputeStats.resolved}</p>
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
              className="flex flex-col md:flex-row gap-4"
            >
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search disputes..."
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
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="scope">Scope</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </motion.div>

            {/* Disputes List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="space-y-6"
            >
              {filteredDisputes.length === 0 ? (
                <Card className="glass-morphism border-border/50">
                  <CardContent className="p-12 text-center">
                    <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Disputes Found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                        ? "No disputes match your current filters." 
                        : "Great! You don't have any active disputes."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredDisputes.map((dispute, index) => (
                  <motion.div
                    key={dispute.id}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="glass-morphism border-border/50 hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-lg font-semibold">{dispute.projectTitle}</h3>
                              <Badge className={`${getStatusColor(dispute.status)} border`}>
                                {dispute.status.replace('_', ' ')}
                              </Badge>
                              <Badge className={`${getPriorityColor(dispute.priority)} border`}>
                                {dispute.priority}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3">{dispute.description}</p>
                            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Created {formatDate(dispute.createdAt)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>Deadline {formatDate(dispute.deadline)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">${dispute.amount}</span>
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
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Open Chat
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="w-4 h-4 mr-2" />
                                View Evidence
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-1">Raised by</p>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {dispute.raisedByName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{dispute.raisedByName}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.raisedByRole}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm font-medium mb-1">Against</p>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {dispute.againstName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{dispute.againstName}</span>
                              <Badge variant="outline" className="text-xs">
                                {dispute.againstRole}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {dispute.arbiterAsigned && (
                          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span className="text-sm font-medium">Arbiter Assigned:</span>
                              <span className="text-sm">{dispute.arbiterName}</span>
                            </div>
                          </div>
                        )}

                        {dispute.resolution && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center space-x-2 mb-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium">Resolution:</span>
                            </div>
                            <p className="text-sm">{dispute.resolution}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
