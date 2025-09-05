import { useState } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, ArrowLeft, ArrowRight, CheckCircle, Coins } from "lucide-react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  payment: string;
}

export default function CreateProject() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({
    title: "",
    description: "",
    category: "",
    budget: "",
    timeline: ""
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: "1", title: "", description: "", payment: "" }
  ]);

  const addMilestone = () => {
    setMilestones([...milestones, { 
      id: Date.now().toString(), 
      title: "", 
      description: "", 
      payment: "" 
    }]);
  };

  const removeMilestone = (id: string) => {
    if (milestones.length > 1) {
      setMilestones(milestones.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id: string, field: keyof Milestone, value: string) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const totalBudget = milestones.reduce((sum, m) => sum + (parseFloat(m.payment) || 0), 0);

  const handleSubmit = () => {
    // In production, this would create the smart contract and deploy
    console.log("Creating project:", { projectData, milestones });
    setLocation("/dashboard");
  };

  const steps = [
    { number: 1, title: "Project Details", description: "Basic information about your project" },
    { number: 2, title: "Milestones", description: "Define payment milestones and deliverables" },
    { number: 3, title: "Review & Deploy", description: "Review and deploy smart contract" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b border-border/50 glass-morphism">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/dashboard")}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold" data-testid="text-page-title">Create New Project</h1>
                <p className="text-muted-foreground">Set up automated milestone payments</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center space-x-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
                      currentStep >= step.number 
                        ? "bg-primary border-primary text-primary-foreground" 
                        : "border-border text-muted-foreground"
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 rounded-full transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-border"
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                  <CardDescription>
                    Provide basic information about your project to attract the right freelancers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="title">Project Title</Label>
                    <Input
                      id="title"
                      placeholder="E.g., E-commerce Website Development"
                      value={projectData.title}
                      onChange={(e) => setProjectData({...projectData, title: e.target.value})}
                      data-testid="input-project-title"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Project Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your project requirements, goals, and expectations..."
                      rows={4}
                      value={projectData.description}
                      onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                      data-testid="textarea-project-description"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        placeholder="Web Development"
                        value={projectData.category}
                        onChange={(e) => setProjectData({...projectData, category: e.target.value})}
                        data-testid="input-category"
                      />
                    </div>
                    <div>
                      <Label htmlFor="timeline">Timeline</Label>
                      <Input
                        id="timeline"
                        placeholder="4-6 weeks"
                        value={projectData.timeline}
                        onChange={(e) => setProjectData({...projectData, timeline: e.target.value})}
                        data-testid="input-timeline"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Supporting Files</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Upload project files, requirements, or mockups
                      </p>
                      <Button variant="outline" data-testid="button-upload-files">
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Project Milestones</CardTitle>
                  <CardDescription>
                    Break your project into milestones with specific deliverables and payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {milestones.map((milestone, index) => (
                    <motion.div
                      key={milestone.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-lg p-6 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Milestone {index + 1}</h3>
                        {milestones.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMilestone(milestone.id)}
                            data-testid={`button-remove-milestone-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor={`milestone-title-${milestone.id}`}>Title</Label>
                        <Input
                          id={`milestone-title-${milestone.id}`}
                          placeholder="E.g., Frontend Design & Implementation"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, "title", e.target.value)}
                          data-testid={`input-milestone-title-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`milestone-description-${milestone.id}`}>Description</Label>
                        <Textarea
                          id={`milestone-description-${milestone.id}`}
                          placeholder="Describe the deliverables for this milestone..."
                          rows={3}
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, "description", e.target.value)}
                          data-testid={`textarea-milestone-description-${index}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`milestone-payment-${milestone.id}`}>Payment (ETH)</Label>
                        <Input
                          id={`milestone-payment-${milestone.id}`}
                          type="number"
                          placeholder="5.0"
                          value={milestone.payment}
                          onChange={(e) => updateMilestone(milestone.id, "payment", e.target.value)}
                          data-testid={`input-milestone-payment-${index}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                  
                  <Button
                    variant="outline"
                    onClick={addMilestone}
                    className="w-full"
                    data-testid="button-add-milestone"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Milestone
                  </Button>
                  
                  {totalBudget > 0 && (
                    <div className="bg-muted/20 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Total Project Budget:</span>
                        <div className="flex items-center space-x-2">
                          <Coins className="h-5 w-5 text-primary" />
                          <span className="text-xl font-bold text-primary">
                            {totalBudget} ETH
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="glass-morphism border-border/50">
                <CardHeader>
                  <CardTitle>Review & Deploy</CardTitle>
                  <CardDescription>
                    Review your project details and deploy the smart contract to lock funds in escrow.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Project Summary</h3>
                      <div className="space-y-3">
                        <div>
                          <Label>Title</Label>
                          <p className="text-sm text-muted-foreground">{projectData.title}</p>
                        </div>
                        <div>
                          <Label>Category</Label>
                          <p className="text-sm text-muted-foreground">{projectData.category}</p>
                        </div>
                        <div>
                          <Label>Timeline</Label>
                          <p className="text-sm text-muted-foreground">{projectData.timeline}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Milestones ({milestones.length})</h3>
                      <div className="space-y-2">
                        {milestones.map((milestone, index) => (
                          <div key={milestone.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <span className="text-sm">Milestone {index + 1}</span>
                            <Badge variant="outline">{milestone.payment} ETH</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-primary">Smart Contract Deployment</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label>Total Escrow Amount</Label>
                        <p className="text-2xl font-bold text-primary">{totalBudget} ETH</p>
                      </div>
                      <div>
                        <Label>Gas Fee (estimated)</Label>
                        <p className="text-muted-foreground">~0.015 ETH</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Funds will be locked in a smart contract and automatically released upon milestone completion.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              data-testid="button-previous"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
                data-testid="button-next"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-primary to-secondary"
                data-testid="button-deploy-contract"
              >
                Deploy Contract & Create Project
                <CheckCircle className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}