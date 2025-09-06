import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  ArrowLeft,
  Bell,
  Check,
  X,
  Clock,
  User,
  DollarSign,
  FileText,
  MessageSquare,
  Star,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Archive,
  Trash2,
  MoreHorizontal,
  Filter,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

interface Notification {
  id: string;
  type: 'payment' | 'project' | 'message' | 'system' | 'milestone' | 'dispute';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  avatar?: string;
  metadata?: {
    projectId?: string;
    projectTitle?: string;
    amount?: string;
    freelancerName?: string;
  };
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockNotifications: Notification[] = [
        {
          id: "notif_001",
          type: "payment",
          title: "Payment Released",
          message: "Payment of 2.5 ETH has been released for 'E-commerce Website Development'",
          timestamp: "2025-09-07T15:30:00Z",
          isRead: false,
          priority: "high",
          actionUrl: "/payments-escrow",
          metadata: {
            projectId: "proj_001",
            projectTitle: "E-commerce Website Development",
            amount: "2.5 ETH"
          }
        },
        {
          id: "notif_002",
          type: "project",
          title: "Milestone Completed",
          message: "Alex Chen has completed milestone 3 of 4 for your mobile app project",
          timestamp: "2025-09-07T14:15:00Z",
          isRead: false,
          priority: "medium",
          actionUrl: "/my-projects",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
          metadata: {
            projectId: "proj_002",
            projectTitle: "Mobile App Development",
            freelancerName: "Alex Chen"
          }
        },
        {
          id: "notif_003",
          type: "message",
          title: "New Message",
          message: "Sarah Kim sent you a message about the UI/UX design project",
          timestamp: "2025-09-07T13:45:00Z",
          isRead: true,
          priority: "medium",
          actionUrl: "/messages-disputes",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
          metadata: {
            freelancerName: "Sarah Kim"
          }
        },
        {
          id: "notif_004",
          type: "system",
          title: "Platform Update",
          message: "SmartPay has been updated with new features and security improvements",
          timestamp: "2025-09-07T10:00:00Z",
          isRead: true,
          priority: "low",
          actionUrl: "/profile-settings"
        },
        {
          id: "notif_005",
          type: "milestone",
          title: "Milestone Review Required",
          message: "Please review and approve milestone 2 for 'Smart Contract Audit' project",
          timestamp: "2025-09-07T09:30:00Z",
          isRead: false,
          priority: "high",
          actionUrl: "/my-projects",
          metadata: {
            projectId: "proj_003",
            projectTitle: "Smart Contract Audit"
          }
        },
        {
          id: "notif_006",
          type: "dispute",
          title: "Dispute Resolved",
          message: "The dispute for 'Content Writing' project has been resolved in your favor",
          timestamp: "2025-09-06T18:20:00Z",
          isRead: true,
          priority: "medium",
          actionUrl: "/messages-disputes",
          metadata: {
            projectId: "proj_004",
            projectTitle: "Content Writing"
          }
        },
        {
          id: "notif_007",
          type: "project",
          title: "Project Proposal Received",
          message: "Mike Rodriguez has submitted a proposal for your blockchain development project",
          timestamp: "2025-09-06T16:45:00Z",
          isRead: false,
          priority: "medium",
          actionUrl: "/my-projects",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
          metadata: {
            freelancerName: "Mike Rodriguez"
          }
        }
      ];
      
      setNotifications(mockNotifications);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment': return <DollarSign className="w-4 h-4" />;
      case 'project': return <FileText className="w-4 h-4" />;
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      case 'milestone': return <CheckCircle className="w-4 h-4" />;
      case 'dispute': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 border-red-500/20 text-red-500';
      case 'high': return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500';
      case 'low': return 'bg-green-500/10 border-green-500/20 text-green-500';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    let matches = true;
    
    if (activeTab !== "all") {
      if (activeTab === "unread") {
        matches = matches && !notification.isRead;
      } else if (activeTab === "read") {
        matches = matches && notification.isRead;
      } else {
        matches = matches && notification.type === activeTab;
      }
    }
    
    if (searchTerm) {
      matches = matches && (
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterType !== "all") {
      matches = matches && notification.priority === filterType;
    }
    
    return matches;
  });

  const markAsRead = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setSelectedNotifications([]);
  };

  const markAsUnread = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, isRead: false }
          : notification
      )
    );
    setSelectedNotifications([]);
  };

  const deleteNotifications = (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.filter(notification => !notificationIds.includes(notification.id))
    );
    setSelectedNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    if (notification.actionUrl) {
      setLocation(notification.actionUrl);
    }
  };

  const toggleNotificationSelection = (notificationId: string) => {
    setSelectedNotifications(prev =>
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredNotifications.map(n => n.id);
    setSelectedNotifications(filteredIds);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
              <h1 className="text-3xl font-bold gradient-text">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with your projects and messages</p>
            </div>
          </div>
          
          {unreadCount > 0 && (
            <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
              {unreadCount} unread
            </Badge>
          )}
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass-morphism border-border/50"
              />
            </div>
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full md:w-48 glass-morphism border-border/50">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {selectedNotifications.length > 0 && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(selectedNotifications)}
                className="glass-morphism"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteNotifications(selectedNotifications)}
                className="glass-morphism text-red-500"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          )}
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 glass-morphism">
              <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
              <TabsTrigger value="payment">Payments</TabsTrigger>
              <TabsTrigger value="project">Projects</TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>

            <Card className="glass-morphism border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {activeTab === "all" ? "All Notifications" :
                     activeTab === "unread" ? "Unread Notifications" :
                     activeTab === "read" ? "Read Notifications" :
                     `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Notifications`}
                  </CardTitle>
                  
                  {filteredNotifications.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={selectAllFiltered}
                        className="text-sm"
                      >
                        Select All
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => markAsRead(filteredNotifications.map(n => n.id))}>
                            <Check className="w-4 h-4 mr-2" />
                            Mark All as Read
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setLocation("/profile-settings")}>
                            <Settings className="w-4 h-4 mr-2" />
                            Notification Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Bell className="w-8 h-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
                        <p>Loading notifications...</p>
                      </div>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No notifications found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm || filterType !== "all" 
                            ? "No notifications match your current filters." 
                            : "You're all caught up!"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 p-4">
                      {filteredNotifications.map((notification, index) => (
                        <motion.div
                          key={notification.id}
                          initial={shouldAnimate ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                            notification.isRead 
                              ? "bg-muted/20 border-transparent hover:bg-muted/30" 
                              : "bg-primary/5 border-primary/20 hover:bg-primary/10"
                          } ${selectedNotifications.includes(notification.id) ? "ring-2 ring-primary" : ""}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <Checkbox
                              checked={selectedNotifications.includes(notification.id)}
                              onCheckedChange={() => toggleNotificationSelection(notification.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            
                            <div className="flex-shrink-0">
                              {notification.avatar ? (
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={notification.avatar} alt="Avatar" />
                                  <AvatarFallback>
                                    {getNotificationIcon(notification.type)}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  notification.type === 'payment' ? 'bg-green-500/20 text-green-500' :
                                  notification.type === 'project' ? 'bg-blue-500/20 text-blue-500' :
                                  notification.type === 'message' ? 'bg-purple-500/20 text-purple-500' :
                                  notification.type === 'milestone' ? 'bg-yellow-500/20 text-yellow-500' :
                                  notification.type === 'dispute' ? 'bg-red-500/20 text-red-500' :
                                  'bg-gray-500/20 text-gray-500'
                                }`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                      {notification.title}
                                    </p>
                                    <Badge className={`${getPriorityColor(notification.priority)} border text-xs`}>
                                      {notification.priority}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notification.message}
                                  </p>
                                  {notification.metadata && (
                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                      {notification.metadata.projectTitle && (
                                        <span>Project: {notification.metadata.projectTitle}</span>
                                      )}
                                      {notification.metadata.amount && (
                                        <span>Amount: {notification.metadata.amount}</span>
                                      )}
                                      {notification.metadata.freelancerName && (
                                        <span>From: {notification.metadata.freelancerName}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-col items-end space-y-2">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(notification.timestamp)}
                                  </span>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
