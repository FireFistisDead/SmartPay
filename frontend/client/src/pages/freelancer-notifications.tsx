import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  Bell,
  BellRing,
  Settings,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  MessageSquare,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Zap,
  Trash,
  Archive,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Smartphone,
  Mail,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
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

interface Notification {
  id: string;
  type: "message" | "payment" | "project" | "review" | "milestone" | "dispute" | "system";
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  metadata?: {
    projectTitle?: string;
    clientName?: string;
    amount?: string;
    rating?: number;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  projectUpdates: boolean;
  paymentAlerts: boolean;
  messageAlerts: boolean;
  reviewNotifications: boolean;
  milestoneReminders: boolean;
  disputeUpdates: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  instantAlerts: boolean;
}

export default function FreelancerNotifications() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [filterRead, setFilterRead] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: "notif1",
        type: "payment",
        title: "Payment Received",
        description: "Milestone payment of 2.5 ETH has been released for E-commerce DApp Development",
        timestamp: "2 hours ago",
        read: false,
        priority: "high",
        actionUrl: "/payments-earnings",
        metadata: {
          projectTitle: "E-commerce DApp Development",
          clientName: "Sarah Chen",
          amount: "2.5 ETH"
        }
      },
      {
        id: "notif2",
        type: "message",
        title: "New Message from Client",
        description: "Michael Rodriguez sent you a message about NFT Marketplace Frontend project",
        timestamp: "4 hours ago",
        read: false,
        priority: "medium",
        actionUrl: "/freelancer-messages-disputes",
        metadata: {
          clientName: "Michael Rodriguez",
          projectTitle: "NFT Marketplace Frontend"
        }
      },
      {
        id: "notif3",
        type: "review",
        title: "New Project Review",
        description: "Emma Thompson left a 5-star review for your work on DeFi Dashboard",
        timestamp: "6 hours ago",
        read: true,
        priority: "medium",
        metadata: {
          clientName: "Emma Thompson",
          projectTitle: "DeFi Dashboard",
          rating: 5
        }
      },
      {
        id: "notif4",
        type: "project",
        title: "Project Invitation",
        description: "You've been invited to submit a proposal for 'Web3 Portfolio Site'",
        timestamp: "1 day ago",
        read: true,
        priority: "medium",
        actionUrl: "/browse-projects",
        metadata: {
          projectTitle: "Web3 Portfolio Site",
          clientName: "David Kim"
        }
      },
      {
        id: "notif5",
        type: "milestone",
        title: "Milestone Deadline Approaching",
        description: "Milestone 2 for Smart Contract Audit is due in 2 days",
        timestamp: "1 day ago",
        read: false,
        priority: "high",
        actionUrl: "/my-contracts",
        metadata: {
          projectTitle: "Smart Contract Audit"
        }
      },
      {
        id: "notif6",
        type: "dispute",
        title: "Dispute Update",
        description: "Your dispute for 'Token Sale Platform' has been resolved in your favor",
        timestamp: "2 days ago",
        read: true,
        priority: "medium",
        actionUrl: "/freelancer-messages-disputes",
        metadata: {
          projectTitle: "Token Sale Platform",
          amount: "0.8 ETH"
        }
      },
      {
        id: "notif7",
        type: "system",
        title: "Platform Update",
        description: "New features released: Enhanced project management and improved messaging",
        timestamp: "3 days ago",
        read: true,
        priority: "low"
      }
    ];

    const mockSettings: NotificationSettings = {
      emailNotifications: true,
      pushNotifications: true,
      inAppNotifications: true,
      projectUpdates: true,
      paymentAlerts: true,
      messageAlerts: true,
      reviewNotifications: true,
      milestoneReminders: true,
      disputeUpdates: true,
      marketingEmails: false,
      weeklyDigest: true,
      instantAlerts: false
    };

    setNotifications(mockNotifications);
    setSettings(mockSettings);
    setIsLoading(false);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "payment":
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case "project":
        return <Briefcase className="w-5 h-5 text-purple-500" />;
      case "review":
        return <Star className="w-5 h-5 text-yellow-500" />;
      case "milestone":
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case "dispute":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "system":
        return <Bell className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500";
      case "medium":
        return "border-l-yellow-500";
      case "low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notif => ({ ...notif, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filterType !== "all" && notif.type !== filterType) return false;
    if (filterRead === "unread" && notif.read) return false;
    if (filterRead === "read" && !notif.read) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
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
              <h1 className="text-3xl font-bold gradient-text">Notifications</h1>
              <p className="text-muted-foreground">
                Stay updated with your project activities and important updates
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="text-sm">
              {unreadCount} unread
            </Badge>
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs defaultValue="notifications" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications" className="flex items-center space-x-2">
                <Bell className="w-4 h-4" />
                <span>Notifications</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              {/* Filters */}
              <div className="flex items-center space-x-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="message">Messages</SelectItem>
                    <SelectItem value="payment">Payments</SelectItem>
                    <SelectItem value="project">Projects</SelectItem>
                    <SelectItem value="review">Reviews</SelectItem>
                    <SelectItem value="milestone">Milestones</SelectItem>
                    <SelectItem value="dispute">Disputes</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterRead} onValueChange={setFilterRead}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className={`glass-morphism border-border/50 border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold">{notification.title}</h4>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {notification.type}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                  {notification.timestamp}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    {!notification.read && (
                                      <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                        <Eye className="w-4 h-4 mr-2" />
                                        Mark as Read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem>
                                      <Archive className="w-4 h-4 mr-2" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                                      <Trash className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground mb-3">{notification.description}</p>
                            
                            {notification.metadata && (
                              <div className="flex items-center space-x-4 text-sm">
                                {notification.metadata.projectTitle && (
                                  <span className="text-muted-foreground">
                                    Project: {notification.metadata.projectTitle}
                                  </span>
                                )}
                                {notification.metadata.clientName && (
                                  <span className="text-muted-foreground">
                                    Client: {notification.metadata.clientName}
                                  </span>
                                )}
                                {notification.metadata.amount && (
                                  <span className="font-medium gradient-text">
                                    {notification.metadata.amount}
                                  </span>
                                )}
                                {notification.metadata.rating && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                    <span>{notification.metadata.rating}/5</span>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {notification.actionUrl && (
                              <div className="mt-3">
                                <Button 
                                  size="sm" 
                                  onClick={() => setLocation(notification.actionUrl!)}
                                >
                                  View Details
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="glass-morphism border-border/50">
                    <CardContent className="flex items-center justify-center py-12">
                      <div className="text-center text-muted-foreground">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No notifications found</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>General Settings</span>
                    </CardTitle>
                    <CardDescription>
                      Configure how you receive notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.emailNotifications}
                        onCheckedChange={(checked) => updateSetting("emailNotifications", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive push notifications on mobile</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.pushNotifications}
                        onCheckedChange={(checked) => updateSetting("pushNotifications", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">In-App Notifications</p>
                          <p className="text-sm text-muted-foreground">Show notifications in the application</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.inAppNotifications}
                        onCheckedChange={(checked) => updateSetting("inAppNotifications", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Zap className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Instant Alerts</p>
                          <p className="text-sm text-muted-foreground">Immediate notifications for urgent items</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.instantAlerts}
                        onCheckedChange={(checked) => updateSetting("instantAlerts", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Settings */}
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle>Notification Categories</CardTitle>
                    <CardDescription>
                      Choose which types of notifications to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">Payment Alerts</p>
                          <p className="text-sm text-muted-foreground">Payments, releases, and withdrawals</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.paymentAlerts}
                        onCheckedChange={(checked) => updateSetting("paymentAlerts", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Message Alerts</p>
                          <p className="text-sm text-muted-foreground">New messages from clients</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.messageAlerts}
                        onCheckedChange={(checked) => updateSetting("messageAlerts", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Briefcase className="w-5 h-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Project Updates</p>
                          <p className="text-sm text-muted-foreground">Project invitations and status changes</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.projectUpdates}
                        onCheckedChange={(checked) => updateSetting("projectUpdates", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <div>
                          <p className="font-medium">Review Notifications</p>
                          <p className="text-sm text-muted-foreground">New reviews and ratings</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.reviewNotifications}
                        onCheckedChange={(checked) => updateSetting("reviewNotifications", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-orange-500" />
                        <div>
                          <p className="font-medium">Milestone Reminders</p>
                          <p className="text-sm text-muted-foreground">Deadline reminders and updates</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.milestoneReminders}
                        onCheckedChange={(checked) => updateSetting("milestoneReminders", checked)}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium">Dispute Updates</p>
                          <p className="text-sm text-muted-foreground">Dispute status changes and resolutions</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.disputeUpdates}
                        onCheckedChange={(checked) => updateSetting("disputeUpdates", checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional Settings */}
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Additional Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Weekly Digest</p>
                        <p className="text-sm text-muted-foreground">Summary of weekly activity</p>
                      </div>
                      <Switch
                        checked={settings?.weeklyDigest}
                        onCheckedChange={(checked) => updateSetting("weeklyDigest", checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Product updates and promotions</p>
                      </div>
                      <Switch
                        checked={settings?.marketingEmails}
                        onCheckedChange={(checked) => updateSetting("marketingEmails", checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
