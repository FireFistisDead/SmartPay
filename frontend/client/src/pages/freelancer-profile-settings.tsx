import { motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  User,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Moon,
  Sun,
  Monitor,
  Save,
  Eye,
  EyeOff,
  Upload,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Camera,
  Key,
  Trash2,
  Download,
  AlertTriangle,
  Plus,
  X,
  Star,
  Award,
  Briefcase,
  DollarSign,
  Clock,
  Target,
  FileText,
  Link as LinkIcon,
  Github,
  Linkedin,
  Twitter,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ParticleBackground from "@/components/particle-background";
import { useSmartAnimations } from "@/hooks/use-smart-animations";

interface Skill {
  name: string;
  level: number;
  yearsOfExperience: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  imageUrl: string;
  projectUrl?: string;
  githubUrl?: string;
}

interface WorkExperience {
  id: string;
  position: string;
  company: string;
  duration: string;
  description: string;
  achievements: string[];
}

export default function FreelancerProfileSettings() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [activeTab, setActiveTab] = useState("profile");
  const [showPassword, setShowPassword] = useState(false);
  const [theme, setTheme] = useState("system");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    projectUpdates: true,
    paymentAlerts: true,
    proposalNotifications: true,
    milestoneReminders: true,
    reviewNotifications: true,
    marketingEmails: false
  });

  const { scrollMetrics, isSlowScrolling } = useSmartAnimations();
  const shouldAnimate = !scrollMetrics.isScrolling || isSlowScrolling;

  const [profileData, setProfileData] = useState({
    firstName: "Alex",
    lastName: "Thompson",
    email: "alex.thompson@example.com",
    phone: "+1 (555) 987-6543",
    location: "Austin, TX",
    title: "Full-Stack Web3 Developer",
    bio: "Passionate full-stack developer specializing in blockchain technology, DeFi protocols, and modern web applications. 5+ years of experience building scalable solutions.",
    hourlyRate: "75",
    availability: "full-time",
    timezone: "America/Chicago",
    languages: ["English (Native)", "Spanish (Conversational)"],
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex"
  });

  const [skills, setSkills] = useState<Skill[]>([
    { name: "React.js", level: 95, yearsOfExperience: 4 },
    { name: "Node.js", level: 90, yearsOfExperience: 4 },
    { name: "Solidity", level: 85, yearsOfExperience: 3 },
    { name: "TypeScript", level: 92, yearsOfExperience: 3 },
    { name: "Web3.js", level: 88, yearsOfExperience: 2 },
    { name: "Smart Contracts", level: 85, yearsOfExperience: 3 },
    { name: "DeFi Protocols", level: 80, yearsOfExperience: 2 },
    { name: "UI/UX Design", level: 75, yearsOfExperience: 5 }
  ]);

  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([
    {
      id: "1",
      title: "DeFi Lending Platform",
      description: "A decentralized lending platform built with React, Solidity, and Web3.js",
      technologies: ["React", "Solidity", "Web3.js", "Hardhat"],
      imageUrl: "/portfolio/defi-platform.jpg",
      projectUrl: "https://defi-platform.example.com",
      githubUrl: "https://github.com/alex/defi-platform"
    },
    {
      id: "2",
      title: "NFT Marketplace",
      description: "Full-featured NFT marketplace with minting, trading, and auction capabilities",
      technologies: ["Next.js", "Ethereum", "IPFS", "The Graph"],
      imageUrl: "/portfolio/nft-marketplace.jpg",
      projectUrl: "https://nft-marketplace.example.com",
      githubUrl: "https://github.com/alex/nft-marketplace"
    }
  ]);

  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([
    {
      id: "1",
      position: "Senior Blockchain Developer",
      company: "CryptoTech Solutions",
      duration: "2022 - Present",
      description: "Lead developer for DeFi protocols and smart contract development",
      achievements: [
        "Developed 15+ smart contracts managing $2M+ in assets",
        "Reduced gas costs by 30% through optimization",
        "Mentored junior developers in Web3 technologies"
      ]
    },
    {
      id: "2",
      position: "Full-Stack Developer",
      company: "TechStart Inc.",
      duration: "2020 - 2022",
      description: "Built scalable web applications using modern JavaScript frameworks",
      achievements: [
        "Increased application performance by 40%",
        "Implemented CI/CD pipelines reducing deployment time by 60%",
        "Led migration from monolith to microservices architecture"
      ]
    }
  ]);

  const [socialLinks, setSocialLinks] = useState({
    github: "https://github.com/alexthompson",
    linkedin: "https://linkedin.com/in/alexthompson",
    twitter: "https://twitter.com/alexthompson",
    website: "https://alexthompson.dev",
    portfolio: "https://portfolio.alexthompson.dev"
  });

  const [newSkill, setNewSkill] = useState<Skill>({
    name: "",
    level: 50,
    yearsOfExperience: 1
  });

  const addSkill = () => {
    if (newSkill.name.trim()) {
      setSkills([...skills, { ...newSkill }]);
      setNewSkill({ name: "", level: 50, yearsOfExperience: 1 });
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string | number) => {
    const updatedSkills = [...skills];
    updatedSkills[index] = { ...updatedSkills[index], [field]: value };
    setSkills(updatedSkills);
  };

  const handleProfileUpdate = () => {
    console.log("Saving freelancer profile:", { profileData, skills, portfolioItems, workExperience, socialLinks });
    alert("Profile updated successfully!");
  };

  const handlePasswordChange = () => {
    alert("Password change functionality would be implemented here");
  };

  const handleDeleteAccount = () => {
    alert("Account deletion functionality would be implemented here");
  };

  const handleExportData = () => {
    const userData = {
      profile: profileData,
      skills,
      portfolio: portfolioItems,
      experience: workExperience,
      socialLinks,
      settings: { theme, notifications },
      exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(userData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "freelancer-profile-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
              <h1 className="text-3xl font-bold gradient-text">Freelancer Profile & Settings</h1>
              <p className="text-muted-foreground">Manage your professional profile and preferences</p>
            </div>
          </div>
          <Badge variant="outline" className="glass-morphism">
            Freelancer Account
          </Badge>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 glass-morphism">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Skills</span>
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4" />
                <span>Portfolio</span>
              </TabsTrigger>
              <TabsTrigger value="rates" className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Rates</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Picture & Basic Info */}
                <Card className="glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="w-32 h-32">
                        <AvatarImage src={profileData.avatar} />
                        <AvatarFallback>{profileData.firstName[0]}{profileData.lastName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex space-x-2">
                        <Button size="sm">
                          <Upload className="w-4 h-4 mr-2" />
                          Upload
                        </Button>
                        <Button size="sm" variant="outline">
                          <Camera className="w-4 h-4 mr-2" />
                          Take Photo
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="lg:col-span-2 glass-morphism border-border/50">
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details and contact information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          value={profileData.email}
                          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input 
                          id="phone" 
                          value={profileData.phone}
                          onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input 
                          id="location" 
                          value={profileData.location}
                          onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="title">Professional Title</Label>
                        <Input 
                          id="title" 
                          value={profileData.title}
                          onChange={(e) => setProfileData({...profileData, title: e.target.value})}
                          placeholder="e.g., Full-Stack Web3 Developer"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea 
                        id="bio" 
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={4}
                        placeholder="Describe your experience, specializations, and what makes you unique..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="availability">Availability</Label>
                        <Select value={profileData.availability} onValueChange={(value) => setProfileData({...profileData, availability: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full-time">Full-time (40+ hrs/week)</SelectItem>
                            <SelectItem value="part-time">Part-time (20-39 hrs/week)</SelectItem>
                            <SelectItem value="project-based">Project-based</SelectItem>
                            <SelectItem value="unavailable">Currently Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={profileData.timezone} onValueChange={(value) => setProfileData({...profileData, timezone: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time (EST)</SelectItem>
                            <SelectItem value="America/Chicago">Central Time (CST)</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time (MST)</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time (PST)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Europe/London">London (GMT)</SelectItem>
                            <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Social Links */}
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Social Links & Portfolio</CardTitle>
                  <CardDescription>Add links to your professional profiles and portfolio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="github">GitHub Profile</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                          <Github className="w-4 h-4" />
                        </div>
                        <Input 
                          id="github" 
                          value={socialLinks.github}
                          onChange={(e) => setSocialLinks({...socialLinks, github: e.target.value})}
                          className="rounded-l-none"
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                          <Linkedin className="w-4 h-4" />
                        </div>
                        <Input 
                          id="linkedin" 
                          value={socialLinks.linkedin}
                          onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                          className="rounded-l-none"
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Personal Website</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                          <Globe className="w-4 h-4" />
                        </div>
                        <Input 
                          id="website" 
                          value={socialLinks.website}
                          onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})}
                          className="rounded-l-none"
                          placeholder="https://yourwebsite.com"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="portfolio">Portfolio Site</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <Input 
                          id="portfolio" 
                          value={socialLinks.portfolio}
                          onChange={(e) => setSocialLinks({...socialLinks, portfolio: e.target.value})}
                          className="rounded-l-none"
                          placeholder="https://portfolio.yoursite.com"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Skills Tab */}
            <TabsContent value="skills" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Technical Skills</CardTitle>
                  <CardDescription>Manage your skills and expertise levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Skill */}
                  <div className="p-4 border border-dashed border-border/50 rounded-lg">
                    <h4 className="font-medium mb-4">Add New Skill</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="skillName">Skill Name</Label>
                        <Input 
                          id="skillName" 
                          value={newSkill.name}
                          onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                          placeholder="e.g., React.js"
                        />
                      </div>
                      <div>
                        <Label htmlFor="skillLevel">Proficiency Level (%)</Label>
                        <Input 
                          id="skillLevel" 
                          type="number" 
                          min="0" 
                          max="100"
                          value={newSkill.level}
                          onChange={(e) => setNewSkill({...newSkill, level: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input 
                          id="experience" 
                          type="number" 
                          min="0" 
                          max="20"
                          value={newSkill.yearsOfExperience}
                          onChange={(e) => setNewSkill({...newSkill, yearsOfExperience: parseInt(e.target.value)})}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={addSkill} className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Skill
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Skills List */}
                  <div className="space-y-4">
                    {skills.map((skill, index) => (
                      <div key={index} className="p-4 border border-border/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{skill.name}</h4>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => removeSkill(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label>Proficiency Level</Label>
                            <div className="space-y-2">
                              <Progress value={skill.level} className="h-2" />
                              <p className="text-sm text-muted-foreground">{skill.level}%</p>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`level-${index}`}>Level (%)</Label>
                            <Input 
                              id={`level-${index}`}
                              type="number" 
                              min="0" 
                              max="100"
                              value={skill.level}
                              onChange={(e) => updateSkill(index, 'level', parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`exp-${index}`}>Years Experience</Label>
                            <Input 
                              id={`exp-${index}`}
                              type="number" 
                              min="0" 
                              max="20"
                              value={skill.yearsOfExperience}
                              onChange={(e) => updateSkill(index, 'yearsOfExperience', parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Portfolio Projects</CardTitle>
                  <CardDescription>Showcase your best work and achievements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Work Experience */}
                  <div>
                    <h4 className="font-semibold mb-4">Work Experience</h4>
                    <div className="space-y-4">
                      {workExperience.map((job, index) => (
                        <div key={job.id} className="p-4 border border-border/50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h5 className="font-medium">{job.position}</h5>
                              <p className="text-sm text-muted-foreground">{job.company} • {job.duration}</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-sm mb-3">{job.description}</p>
                          <div className="space-y-1">
                            {job.achievements.map((achievement, achIndex) => (
                              <div key={achIndex} className="flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                                <p className="text-sm text-muted-foreground">{achievement}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Portfolio Projects */}
                  <div>
                    <h4 className="font-semibold mb-4">Featured Projects</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {portfolioItems.map((item) => (
                        <div key={item.id} className="border border-border/50 rounded-lg overflow-hidden">
                          <div className="h-48 bg-muted flex items-center justify-center">
                            <FileText className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <div className="p-4">
                            <h5 className="font-medium mb-2">{item.title}</h5>
                            <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.technologies.map((tech, techIndex) => (
                                <Badge key={techIndex} variant="secondary" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex space-x-2">
                              {item.projectUrl && (
                                <Button size="sm" variant="outline">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  Live Demo
                                </Button>
                              )}
                              {item.githubUrl && (
                                <Button size="sm" variant="outline">
                                  <Github className="w-3 h-3 mr-1" />
                                  Code
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rates Tab */}
            <TabsContent value="rates" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Rates & Availability</CardTitle>
                  <CardDescription>Set your hourly rates and availability preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate (ETH)</Label>
                      <div className="flex">
                        <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0">
                          <DollarSign className="w-4 h-4" />
                        </div>
                        <Input 
                          id="hourlyRate" 
                          type="number" 
                          step="0.01"
                          value={profileData.hourlyRate}
                          onChange={(e) => setProfileData({...profileData, hourlyRate: e.target.value})}
                          className="rounded-l-none"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="availability">Current Availability</Label>
                      <Select value={profileData.availability} onValueChange={(value) => setProfileData({...profileData, availability: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full-time">Available Full-time</SelectItem>
                          <SelectItem value="part-time">Available Part-time</SelectItem>
                          <SelectItem value="project-based">Project-based Only</SelectItem>
                          <SelectItem value="unavailable">Currently Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Rate Guidelines</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="p-4">
                        <h5 className="font-medium text-green-600 mb-2">Market Rate</h5>
                        <p className="text-2xl font-bold">0.065 ETH</p>
                        <p className="text-sm text-muted-foreground">Average for your skills</p>
                      </Card>
                      <Card className="p-4">
                        <h5 className="font-medium text-blue-600 mb-2">Your Rate</h5>
                        <p className="text-2xl font-bold">{profileData.hourlyRate} ETH</p>
                        <p className="text-sm text-muted-foreground">15% above market</p>
                      </Card>
                      <Card className="p-4">
                        <h5 className="font-medium text-purple-600 mb-2">Premium Rate</h5>
                        <p className="text-2xl font-bold">0.085 ETH</p>
                        <p className="text-sm text-muted-foreground">Top-tier specialists</p>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security and privacy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Change Password</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input 
                            id="currentPassword" 
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input 
                          id="newPassword" 
                          type="password"
                          placeholder="Enter new password"
                        />
                      </div>
                    </div>
                    <Button onClick={handlePasswordChange} className="mt-4">
                      <Key className="w-4 h-4 mr-2" />
                      Update Password
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                      <div>
                        <p className="font-medium">SMS Authentication</p>
                        <p className="text-sm text-muted-foreground">Receive verification codes via SMS</p>
                      </div>
                      <Switch />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4 text-red-600">Danger Zone</h4>
                    <Card className="border-red-200 dark:border-red-800">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-medium">Delete Account</h5>
                            <p className="text-sm text-muted-foreground mb-4">
                              Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Account
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. This will permanently delete your account
                                    and remove your data from our servers.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline">Cancel</Button>
                                  <Button variant="destructive" onClick={handleDeleteAccount}>
                                    Yes, delete my account
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Application Preferences</CardTitle>
                  <CardDescription>Customize your experience</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-4">Theme</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "light", icon: Sun, label: "Light" },
                        { value: "dark", icon: Moon, label: "Dark" },
                        { value: "system", icon: Monitor, label: "System" }
                      ].map((themeOption) => (
                        <div
                          key={themeOption.value}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            theme === themeOption.value 
                              ? "border-primary bg-primary/5" 
                              : "border-border/50 hover:border-border"
                          }`}
                          onClick={() => setTheme(themeOption.value)}
                        >
                          <div className="flex flex-col items-center space-y-2">
                            <themeOption.icon className="w-6 h-6" />
                            <span className="text-sm font-medium">{themeOption.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Notification Preferences</h4>
                    <div className="space-y-4">
                      {[
                        { key: "email", label: "Email Notifications", description: "Receive notifications via email" },
                        { key: "push", label: "Push Notifications", description: "Browser push notifications" },
                        { key: "projectUpdates", label: "Project Updates", description: "Notifications about project changes" },
                        { key: "paymentAlerts", label: "Payment Alerts", description: "Payment and milestone notifications" },
                        { key: "proposalNotifications", label: "Proposal Updates", description: "Updates on your proposals" },
                        { key: "milestoneReminders", label: "Milestone Reminders", description: "Reminders for upcoming deadlines" },
                        { key: "reviewNotifications", label: "Review Notifications", description: "Client reviews and ratings" }
                      ].map((setting) => (
                        <div key={setting.key} className="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                          <div>
                            <p className="font-medium">{setting.label}</p>
                            <p className="text-sm text-muted-foreground">{setting.description}</p>
                          </div>
                          <Switch
                            checked={notifications[setting.key as keyof typeof notifications]}
                            onCheckedChange={(checked) => 
                              setNotifications({...notifications, [setting.key]: checked})
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-4">Data & Privacy</h4>
                    <div className="space-y-4">
                      <Button variant="outline" onClick={handleExportData} className="w-full justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export My Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex justify-end"
          >
            <Button onClick={handleProfileUpdate} size="lg" className="bg-gradient-to-r from-primary to-secondary">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
