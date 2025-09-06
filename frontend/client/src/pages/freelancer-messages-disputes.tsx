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
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  FileText,
  Upload,
  Download,
  User,
  Calendar,
  Flag,
  Eye,
  Reply,
  Forward,
  Archive,
  Paperclip,
  Image,
  Video,
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ParticleBackground from "@/components/particle-background";

interface Message {
  id: string;
  fromName: string;
  fromAvatar: string;
  projectTitle: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  isClient: boolean;
  priority: "low" | "medium" | "high";
  hasAttachment: boolean;
}

interface Dispute {
  id: string;
  title: string;
  projectTitle: string;
  clientName: string;
  status: "open" | "in-review" | "mediation" | "resolved" | "closed";
  priority: "low" | "medium" | "high";
  createdDate: string;
  amount: string;
  description: string;
  lastUpdate: string;
  messages: number;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isFromMe: boolean;
  hasAttachment?: boolean;
  attachmentType?: "file" | "image" | "video";
  attachmentName?: string;
}

export default function FreelancerMessagesDisputes() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: "msg1",
        fromName: "Sarah Chen",
        fromAvatar: "/avatars/sarah.jpg",
        projectTitle: "E-commerce DApp Development",
        lastMessage: "Thanks for the latest update. The smart contract integration looks great!",
        timestamp: "2 hours ago",
        unread: true,
        isClient: true,
        priority: "medium",
        hasAttachment: false
      },
      {
        id: "msg2",
        fromName: "Michael Rodriguez",
        fromAvatar: "/avatars/michael.jpg",
        projectTitle: "NFT Marketplace Frontend",
        lastMessage: "Can we schedule a call to discuss the user interface changes?",
        timestamp: "5 hours ago",
        unread: false,
        isClient: true,
        priority: "high",
        hasAttachment: true
      },
      {
        id: "msg3",
        fromName: "Emma Thompson",
        fromAvatar: "/avatars/emma.jpg",
        projectTitle: "DeFi Dashboard",
        lastMessage: "The milestone has been approved. Payment will be released shortly.",
        timestamp: "1 day ago",
        unread: false,
        isClient: true,
        priority: "low",
        hasAttachment: false
      },
      {
        id: "msg4",
        fromName: "David Kim",
        fromAvatar: "/avatars/david.jpg",
        projectTitle: "Web3 Portfolio Site",
        lastMessage: "Could you provide an estimate for the additional features we discussed?",
        timestamp: "2 days ago",
        unread: true,
        isClient: true,
        priority: "medium",
        hasAttachment: false
      }
    ];

    const mockDisputes: Dispute[] = [
      {
        id: "disp1",
        title: "Milestone Payment Delayed",
        projectTitle: "Smart Contract Audit",
        clientName: "TechCorp Inc.",
        status: "in-review",
        priority: "high",
        createdDate: "2024-01-10",
        amount: "2.5 ETH",
        description: "Client has not released milestone payment despite deliverable completion and approval.",
        lastUpdate: "2 hours ago",
        messages: 8
      },
      {
        id: "disp2",
        title: "Scope Creep Disagreement",
        projectTitle: "DeFi Protocol Frontend",
        clientName: "BlockChain Ventures",
        status: "mediation",
        priority: "medium",
        createdDate: "2024-01-08",
        amount: "1.8 ETH",
        description: "Client requesting additional features not included in original scope.",
        lastUpdate: "1 day ago",
        messages: 12
      },
      {
        id: "disp3",
        title: "Quality Dispute",
        projectTitle: "Token Sale Platform",
        clientName: "CryptoStart",
        status: "resolved",
        priority: "low",
        createdDate: "2024-01-05",
        amount: "0.8 ETH",
        description: "Disagreement about code quality standards. Resolved through mediation.",
        lastUpdate: "3 days ago",
        messages: 6
      }
    ];

    const mockChatMessages: ChatMessage[] = [
      {
        id: "chat1",
        sender: "Sarah Chen",
        content: "Hi! I've reviewed the latest code update. The smart contract integration is looking really solid.",
        timestamp: "10:30 AM",
        isFromMe: false
      },
      {
        id: "chat2",
        sender: "You",
        content: "Thank you! I've also added the additional security checks we discussed. Would you like me to walk you through the changes?",
        timestamp: "10:32 AM",
        isFromMe: true
      },
      {
        id: "chat3",
        sender: "Sarah Chen",
        content: "That would be great. Also, I've attached the updated requirements document with the final UI mockups.",
        timestamp: "10:35 AM",
        isFromMe: false,
        hasAttachment: true,
        attachmentType: "file",
        attachmentName: "UI_Requirements_v2.pdf"
      },
      {
        id: "chat4",
        sender: "You",
        content: "Perfect! I'll review the mockups and implement the changes. Should have the updated version ready by tomorrow.",
        timestamp: "10:38 AM",
        isFromMe: true
      },
      {
        id: "chat5",
        sender: "Sarah Chen",
        content: "Thanks for the latest update. The smart contract integration looks great!",
        timestamp: "2:15 PM",
        isFromMe: false
      }
    ];

    setMessages(mockMessages);
    setDisputes(mockDisputes);
    setChatMessages(mockChatMessages);
    setIsLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "in-review":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "mediation":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `chat${chatMessages.length + 1}`,
      sender: "You",
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isFromMe: true
    };
    
    setChatMessages([...chatMessages, message]);
    setNewMessage("");
  };

  const filteredMessages = messages.filter(msg =>
    msg.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    msg.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDisputes = disputes.filter(dispute => {
    if (filterStatus === "all") return true;
    return dispute.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading messages...</p>
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
              <h1 className="text-3xl font-bold gradient-text">Messages & Disputes</h1>
              <p className="text-muted-foreground">
                Communicate with clients and manage project disputes
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm">
              {messages.filter(m => m.unread).length} unread
            </Badge>
            <Badge variant="destructive" className="text-sm">
              {disputes.filter(d => d.status === "open" || d.status === "in-review").length} active disputes
            </Badge>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="messages" className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="disputes" className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Disputes</span>
              </TabsTrigger>
            </TabsList>

            {/* Messages Tab */}
            <TabsContent value="messages" className="space-y-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-300px)]">
                {/* Messages List */}
                <div className="lg:col-span-1">
                  <Card className="glass-morphism border-border/50 h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search messages..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="border-0 bg-transparent"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2 p-4">
                          {filteredMessages.map((message) => (
                            <div
                              key={message.id}
                              onClick={() => setSelectedConversation(message.id)}
                              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                                selectedConversation === message.id
                                  ? "bg-primary/10 border border-primary/20"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={message.fromAvatar} />
                                  <AvatarFallback>{message.fromName[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm truncate">{message.fromName}</p>
                                    <div className="flex items-center space-x-1">
                                      {message.hasAttachment && (
                                        <Paperclip className="w-3 h-3 text-muted-foreground" />
                                      )}
                                      {message.unread && (
                                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{message.projectTitle}</p>
                                  <p className="text-sm text-muted-foreground truncate mt-1">{message.lastMessage}</p>
                                  <p className="text-xs text-muted-foreground mt-1">{message.timestamp}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Chat Area */}
                <div className="lg:col-span-2">
                  <Card className="glass-morphism border-border/50 h-full">
                    {selectedConversation ? (
                      <>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarImage src="/avatars/sarah.jpg" />
                                <AvatarFallback>SC</AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold">Sarah Chen</h3>
                                <p className="text-sm text-muted-foreground">E-commerce DApp Development</p>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Project
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive Chat
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Flag className="w-4 h-4 mr-2" />
                                  Report Issue
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="p-0 flex flex-col h-[420px]">
                          <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                              {chatMessages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}
                                >
                                  <div className={`max-w-[70%] ${msg.isFromMe ? "order-2" : "order-1"}`}>
                                    <div
                                      className={`p-3 rounded-lg ${
                                        msg.isFromMe
                                          ? "bg-primary text-primary-foreground"
                                          : "bg-muted"
                                      }`}
                                    >
                                      <p className="text-sm">{msg.content}</p>
                                      {msg.hasAttachment && (
                                        <div className="mt-2 p-2 bg-background/10 rounded border border-border/20">
                                          <div className="flex items-center space-x-2">
                                            <File className="w-4 h-4" />
                                            <span className="text-xs">{msg.attachmentName}</span>
                                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                              <Download className="w-3 h-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 px-1">
                                      {msg.timestamp}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                          <Separator />
                          <div className="p-4">
                            <div className="flex items-end space-x-2">
                              <div className="flex-1">
                                <Textarea
                                  placeholder="Type your message..."
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  className="min-h-[60px] resize-none"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      sendMessage();
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex flex-col space-y-2">
                                <Button size="sm" variant="outline">
                                  <Paperclip className="w-4 h-4" />
                                </Button>
                                <Button size="sm" onClick={sendMessage}>
                                  <Send className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>Select a conversation to start messaging</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Disputes</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-review">In Review</SelectItem>
                      <SelectItem value="mediation">Mediation</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Flag className="w-4 h-4 mr-2" />
                      File New Dispute
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>File a New Dispute</DialogTitle>
                      <DialogDescription>
                        Describe the issue you're experiencing with your project.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div>
                        <label className="text-sm font-medium">Project</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="project1">E-commerce DApp Development</SelectItem>
                            <SelectItem value="project2">NFT Marketplace Frontend</SelectItem>
                            <SelectItem value="project3">DeFi Dashboard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Dispute Type</label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="payment">Payment Issue</SelectItem>
                            <SelectItem value="scope">Scope Disagreement</SelectItem>
                            <SelectItem value="quality">Quality Dispute</SelectItem>
                            <SelectItem value="timeline">Timeline Issue</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <Textarea placeholder="Describe the issue in detail..." />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline">Cancel</Button>
                        <Button>Submit Dispute</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {filteredDisputes.map((dispute) => (
                  <Card key={dispute.id} className="glass-morphism border-border/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold">{dispute.title}</h3>
                            <Badge className={getStatusColor(dispute.status)}>
                              {dispute.status.replace('-', ' ')}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(dispute.priority)}>
                              {dispute.priority} priority
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{dispute.projectTitle}</p>
                          <p className="text-sm">Client: {dispute.clientName}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold gradient-text">{dispute.amount}</p>
                          <p className="text-sm text-muted-foreground">{dispute.createdDate}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{dispute.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Updated {dispute.lastUpdate}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{dispute.messages} messages</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            View Messages
                          </Button>
                          <Button size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
