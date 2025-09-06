import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useDashboardNavigation } from "@/hooks/use-dashboard-navigation";
import { 
  ArrowLeft,
  Upload,
  FileText,
  Link,
  Calendar,
  Check,
  AlertCircle,
  DollarSign,
  Clock,
  User,
  Send,
  Paperclip,
  Eye,
  Download,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import ParticleBackground from "@/components/particle-background";

interface Project {
  id: string;
  title: string;
  clientName: string;
  clientAddress: string;
  totalAmount: string;
  milestones: Milestone[];
  description: string;
  deadline: string;
  status: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected';
  isNext: boolean;
}

interface DeliverableFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url?: string;
}

export default function SubmitDeliverable() {
  const [, setLocation] = useLocation();
  const { goToDashboard } = useDashboardNavigation();
  const [project, setProject] = useState<Project | null>(null);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [deliverableDescription, setDeliverableDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<DeliverableFile[]>([]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for active project
  useEffect(() => {
    const mockProject: Project = {
      id: "proj_1",
      title: "NFT Marketplace Frontend Development",
      clientName: "CryptoCollectibles Inc",
      clientAddress: "0x742d35Cc6641C0532a2100D35458f8b5d9E2F",
      totalAmount: "7.2",
      description: "Build a modern, responsive NFT marketplace with wallet integration...",
      deadline: "2024-12-31T23:59:59Z",
      status: "in_progress",
      milestones: [
        {
          id: "milestone_1",
          title: "UI/UX Design & Wireframes",
          description: "Complete design mockups and user interface wireframes",
          amount: "1.8",
          dueDate: "2024-12-10T23:59:59Z",
          status: "approved",
          isNext: false
        },
        {
          id: "milestone_2",
          title: "Frontend Components Development",
          description: "Develop reusable React components and basic functionality",
          amount: "2.4",
          dueDate: "2024-12-20T23:59:59Z",
          status: "in_progress",
          isNext: true
        },
        {
          id: "milestone_3",
          title: "Wallet Integration & Testing",
          description: "Integrate Web3 wallet functionality and conduct thorough testing",
          amount: "3.0",
          dueDate: "2024-12-30T23:59:59Z",
          status: "pending",
          isNext: false
        }
      ]
    };

    setProject(mockProject);
    setSelectedMilestone(mockProject.milestones.find(m => m.isNext) || null);
    setIsLoading(false);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles: DeliverableFile[] = Array.from(files).map((file, index) => ({
        id: `file_${Date.now()}_${index}`,
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        type: file.type,
        url: URL.createObjectURL(file)
      }));
      
      setAttachedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleSubmitDeliverable = async () => {
    if (!selectedMilestone || !deliverableDescription.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Update milestone status
      if (project) {
        const updatedMilestones = project.milestones.map(m => 
          m.id === selectedMilestone.id 
            ? { ...m, status: 'submitted' as const }
            : m
        );
        setProject({ ...project, milestones: updatedMilestones });
      }
      
      setIsSubmitting(false);
      setLocation("/freelancer-dashboard");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading project details...</p>
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
              <h1 className="text-3xl font-bold gradient-text">Submit Deliverable</h1>
              <p className="text-muted-foreground">
                Submit your work for milestone approval
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <Card className="glass-morphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Project Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">{project?.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                    <User className="w-4 h-4" />
                    <span>{project?.clientName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <DollarSign className="w-4 h-4" />
                    <span>{project?.totalAmount} ETH Total</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Milestones</h4>
                  <div className="space-y-2">
                    {project?.milestones.map((milestone) => (
                      <div
                        key={milestone.id}
                        className={`p-3 rounded-lg border transition-all cursor-pointer ${
                          selectedMilestone?.id === milestone.id 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border/50 hover:border-border'
                        }`}
                        onClick={() => milestone.status === 'in_progress' && setSelectedMilestone(milestone)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{milestone.title}</span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(milestone.status)}`}>
                            {milestone.status.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{milestone.amount} ETH</span>
                          <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submission Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="glass-morphism border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="w-5 h-5" />
                  <span>Deliverable Submission</span>
                </CardTitle>
                {selectedMilestone && (
                  <CardDescription>
                    Submitting for: <strong>{selectedMilestone.title}</strong> ({selectedMilestone.amount} ETH)
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedMilestone ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Milestone</h3>
                    <p className="text-muted-foreground">
                      Please select an in-progress milestone to submit deliverables.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Deliverable Description */}
                    <div>
                      <Label htmlFor="description">Deliverable Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what you've completed for this milestone..."
                        value={deliverableDescription}
                        onChange={(e) => setDeliverableDescription(e.target.value)}
                        rows={6}
                        className="mt-2"
                      />
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label>Attach Files</Label>
                      <div className="mt-2">
                        <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground mb-2">
                            Drag and drop files here, or click to browse
                          </p>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Paperclip className="w-4 h-4 mr-2" />
                            Choose Files
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Attached Files */}
                    {attachedFiles.length > 0 && (
                      <div>
                        <Label>Attached Files ({attachedFiles.length})</Label>
                        <div className="mt-2 space-y-2">
                          {attachedFiles.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border border-border/50 rounded-lg"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">{file.size}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(file.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Additional Notes */}
                    <div>
                      <Label htmlFor="notes">Additional Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional information for the client..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-2"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex items-center justify-between pt-6">
                      <div className="text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4 inline mr-2" />
                        Once submitted, you cannot edit the deliverable
                      </div>
                      <Button
                        onClick={handleSubmitDeliverable}
                        disabled={!deliverableDescription.trim() || isSubmitting}
                        className="bg-gradient-to-r from-primary to-secondary min-w-32"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Submit Deliverable
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
