import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, CheckCircle, AlertCircle, Loader2, DollarSign, Calendar, FileText, User, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface Milestone {
  _id?: string;
  description: string;
  amount: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'approved' | 'disputed';
  deliverables?: string;
  submittedAt?: string;
  approvedAt?: string;
  notes?: string;
}

interface Project {
  _id: string;
  jobId: number;
  title: string;
  description: string;
  client: string;
  freelancer?: string;
  arbiter: string;
  totalAmount: string;
  milestones: Milestone[];
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'disputed' | 'cancelled';
  deadline: string;
  acceptedAt?: string;
  completedAt?: string;
  disputeRaised: boolean;
  createdAt: string;
  updatedAt: string;
  freelancerProfile?: {
    username?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ProjectManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onUpdate?: () => void;
}

const ProjectManagementModal: React.FC<ProjectManagementModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdate
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    description: '',
    amount: '',
    dueDate: '',
    deliverables: ''
  });

  useEffect(() => {
    if (project) {
      setActiveTab('overview');
      setError(null);
      setSuccess(null);
    }
  }, [project]);

  if (!project) return null;

  const isClient = userProfile?.id === project.client; // Using id instead of address for now
  const isFreelancer = userProfile?.id === project.freelancer;

  const handleApproveMilestone = async (milestoneIndex: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/milestones/job/${project.jobId}/${milestoneIndex}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Milestone approved and funds released'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve milestone');
      }

      const result = await response.json();
      setSuccess('Milestone approved successfully! Funds have been released.');
      onUpdate?.();
    } catch (err) {
      console.error('Error approving milestone:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitMilestone = async (milestoneIndex: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/milestones/job/${project.jobId}/${milestoneIndex}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deliverableHash: 'QmTestDeliverable123', // This should come from IPFS upload
          notes: 'Milestone deliverables completed'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit milestone');
      }

      const result = await response.json();
      setSuccess('Milestone submitted for review!');
      onUpdate?.();
    } catch (err) {
      console.error('Error submitting milestone:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit milestone');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!milestoneForm.description || !milestoneForm.amount || !milestoneForm.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/${project._id}/milestones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: milestoneForm.description,
          amount: milestoneForm.amount,
          dueDate: milestoneForm.dueDate,
          deliverables: milestoneForm.deliverables
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add milestone');
      }

      setSuccess('Milestone added successfully!');
      setMilestoneForm({ description: '', amount: '', dueDate: '', deliverables: '' });
      onUpdate?.();
    } catch (err) {
      console.error('Error adding milestone:', err);
      setError(err instanceof Error ? err.message : 'Failed to add milestone');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'disputed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    const approvedCount = project.milestones.filter(m => m.status === 'approved').length;
    return project.milestones.length > 0 ? (approvedCount / project.milestones.length) * 100 : 0;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{project.title}</h3>
          <p className="text-muted-foreground mb-4">{project.description}</p>
          <div className="flex items-center space-x-4 text-sm">
            <Badge variant="outline" className="capitalize">{project.status.replace('_', ' ')}</Badge>
            <span className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {project.totalAmount} ETH
            </span>
            <span className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Due: {new Date(project.deadline).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary mb-1">
            {getProgressPercentage().toFixed(0)}%
          </div>
          <div className="text-sm text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Project Progress</span>
          <span className="text-sm text-muted-foreground">
            {project.milestones.filter(m => m.status === 'approved').length} / {project.milestones.length} milestones
          </span>
        </div>
        <Progress value={getProgressPercentage()} className="h-2" />
      </div>

      {/* Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Client</p>
                <p className="text-xs text-muted-foreground">
                  {project.client.slice(0, 6)}...{project.client.slice(-4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {project.freelancer && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>F</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Freelancer</p>
                  <p className="text-xs text-muted-foreground">
                    {project.freelancerProfile?.username ||
                     `${project.freelancer.slice(0, 6)}...${project.freelancer.slice(-4)}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Arbiter</p>
                <p className="text-xs text-muted-foreground">
                  {project.arbiter.slice(0, 6)}...{project.arbiter.slice(-4)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMilestones = () => (
    <div className="space-y-6">
      {/* Add New Milestone (Client Only) */}
      {isClient && project.status !== 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add New Milestone</CardTitle>
            <CardDescription>Break down the project into manageable deliverables</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Describe the milestone deliverables"
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({...milestoneForm, description: e.target.value})}
                  rows={2}
                />
              </div>
              <div>
                <Label>Amount (ETH) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={milestoneForm.amount}
                  onChange={(e) => setMilestoneForm({...milestoneForm, amount: e.target.value})}
                />
              </div>
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={milestoneForm.dueDate}
                  onChange={(e) => setMilestoneForm({...milestoneForm, dueDate: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="col-span-2">
                <Label>Specific Deliverables</Label>
                <Textarea
                  placeholder="List specific deliverables and requirements"
                  value={milestoneForm.deliverables}
                  onChange={(e) => setMilestoneForm({...milestoneForm, deliverables: e.target.value})}
                  rows={2}
                />
              </div>
            </div>
            <Button
              onClick={handleAddMilestone}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding Milestone...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Milestones List */}
      <div className="space-y-4">
        {project.milestones.map((milestone, index) => (
          <Card key={milestone._id || index} className="border-border/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base mb-2">Milestone {index + 1}</CardTitle>
                  <p className="text-sm text-muted-foreground">{milestone.description}</p>
                </div>
                <Badge className={getStatusColor(milestone.status)}>
                  {milestone.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{milestone.amount} ETH</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{new Date(milestone.dueDate).toLocaleDateString()}</span>
                </div>
                {milestone.submittedAt && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Submitted</span>
                  </div>
                )}
                {milestone.approvedAt && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Approved</span>
                  </div>
                )}
              </div>

              {milestone.deliverables && (
                <div className="mb-4">
                  <Label className="text-sm font-medium">Deliverables:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{milestone.deliverables}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                {isFreelancer && milestone.status === 'pending' && (
                  <Button
                    size="sm"
                    onClick={() => handleSubmitMilestone(index)}
                    disabled={loading}
                  >
                    Submit for Review
                  </Button>
                )}

                {isClient && milestone.status === 'submitted' && (
                  <Button
                    size="sm"
                    onClick={() => handleApproveMilestone(index)}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Release Funds
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Project Management</DialogTitle>
          <DialogDescription>
            Manage project milestones, track progress, and handle payments
          </DialogDescription>
        </DialogHeader>

        {/* Success/Error Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="milestones" className="mt-6">
            {renderMilestones()}
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Activity log coming soon...</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectManagementModal;