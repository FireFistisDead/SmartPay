import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet, Users, Briefcase, ArrowRight, User, Mail, Lock, Eye, EyeOff, Home } from "lucide-react";
import ParticleBackground from "@/components/particle-background";
import api from "@/services/api";
import firebaseAuthService from "@/firebase/authService";

const FloatingIcon = ({ icon, className, delay = 0 }: { icon: React.ReactNode; className: string; delay?: number }) => (
  <motion.div
    className={`absolute text-2xl opacity-20 ${className} will-change-transform`}
    initial={{
      y: -5,
      rotate: 0,
      opacity: 0.15,
    }}
    animate={{
      y: 5,
      rotate: 10,
      opacity: 0.25,
    }}
    whileHover={{
      y: 0,
      rotate: 180,
      opacity: 0.4,
      scale: 1.1,
      transition: { duration: 0.6 }
    }}
    transition={{
      duration: 4,
      ease: "easeInOut",
      delay,
    }}
  >
    {icon}
  </motion.div>
);

export default function Signup() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer" | null>(null);
  const [activeTab, setActiveTab] = useState("role");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTabSwitch, setIsTabSwitch] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "verified" | "error">("pending");
  const tabTimerRef = useRef<number | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Check for role parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam === 'client' || roleParam === 'freelancer') {
      setSelectedRole(roleParam);
      setActiveTab("details"); // Automatically switch to details tab
    }
  }, []);

  const handleSignup = async (role: "client" | "freelancer") => {
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setErrorMessage("Please fill in all fields");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms of Service and Privacy Policy");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      // Step 1: Register with our backend
      const backendResponse = await api.post('/users/signup', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: role
      });

      if (!backendResponse.data.success) {
        throw new Error(backendResponse.data.message || 'Registration failed');
      }

      // Step 2: Create Firebase user for email verification
      const firebaseResult = await firebaseAuthService.createUser(formData.email, formData.password);
      
      if (!firebaseResult.success) {
        throw new Error(firebaseResult.error || 'Firebase registration failed');
      }

      // Step 3: Send email verification
      if (firebaseResult.user) {
        const verificationResult = await firebaseAuthService.sendEmailVerification(firebaseResult.user);
        
        if (verificationResult.success) {
          setEmailVerificationSent(true);
          setActiveTab("verification");
          
          // Store user data and start verification check
          localStorage.setItem("pendingUserData", JSON.stringify({
            token: backendResponse.data.data.token,
            user: backendResponse.data.data.user,
            role: role,
            firebaseUID: firebaseResult.user.uid
          }));

          // Start checking for email verification
          startVerificationCheck(firebaseResult.user);
        } else {
          throw new Error('Failed to send verification email');
        }
      }

    } catch (error: any) {
      console.error('Signup error:', error);
      setErrorMessage(error.message || 'Registration failed. Please try again.');
      setTimeout(() => setErrorMessage(""), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const startVerificationCheck = (firebaseUser: any) => {
    console.log('Starting verification check for user:', firebaseUser.uid);
    
    const checkInterval = setInterval(async () => {
      try {
        // Get current Firebase user and reload to get latest verification status
        const currentUser = firebaseAuthService.getCurrentUser();
        if (currentUser) {
          console.log('Checking verification status...');
          await firebaseAuthService.reloadUser();
          
          const isVerified = firebaseAuthService.isEmailVerified();
          console.log('Firebase email verified status:', isVerified);
          
          if (isVerified) {
            console.log('Email verified! Updating backend...');
            // Email is verified, update our backend
            const pendingData = localStorage.getItem("pendingUserData");
            if (pendingData) {
              const userData = JSON.parse(pendingData);
              
              try {
                // Update backend verification status
                const verifyResponse = await api.post('/users/verify-email', 
                  { firebaseUID: userData.firebaseUID },
                  { headers: { Authorization: `Bearer ${userData.token}` } }
                );

                console.log('Backend verification response:', verifyResponse.data);

                if (verifyResponse.data.success) {
                  // Update the stored token with the new one that has verified status
                  localStorage.setItem("authToken", verifyResponse.data.data.token);
                  
                  // Clear pending data and redirect
                  localStorage.removeItem("pendingUserData");
                  localStorage.setItem("userRole", userData.role);
                  
                  setVerificationStatus("verified");
                  clearInterval(checkInterval);
                  
                  // Redirect based on role
                  setTimeout(() => {
                    if (userData.role === "client") {
                      setLocation("/client-dashboard");
                    } else if (userData.role === "freelancer") {
                      setLocation("/freelancer-dashboard");
                    } else {
                      setLocation("/dashboard");
                    }
                  }, 1500);
                } else {
                  console.error('Backend verification failed:', verifyResponse.data.message);
                }
              } catch (backendError) {
                console.error('Backend verification error:', backendError);
              }
            }
          }
        } else {
          console.log('No current Firebase user found');
        }
      } catch (error) {
        console.error('Verification check error:', error);
      }
    }, 3000); // Check every 3 seconds

    // Stop checking after 10 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 600000);
  };

  const resendVerificationEmail = async () => {
    try {
      const firebaseUser = firebaseAuthService.getCurrentUser();
      if (firebaseUser) {
        const result = await firebaseAuthService.sendEmailVerification(firebaseUser);
        if (result.success) {
          setErrorMessage("Verification email resent successfully!");
          setTimeout(() => setErrorMessage(""), 3000);
        } else {
          throw new Error(result.error || 'Failed to resend email');
        }
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to resend email');
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleTabChange = (newTab: string) => {
    if (newTab === "details" && !selectedRole) {
      setErrorMessage("Choose a Role to continue");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setErrorMessage("");
    setActiveTab(newTab);
    setIsTabSwitch(true);
    if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
    tabTimerRef.current = window.setTimeout(() => setIsTabSwitch(false), 350);
  };

  useEffect(() => {
    return () => {
      if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
    };
  }, []);

  const handleRoleSelection = (role: "client" | "freelancer") => {
    setSelectedRole(role);
    setErrorMessage("");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 blockchain-grid opacity-10"></div>
      <ParticleBackground />
      
      {/* Back to Home Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute top-6 right-6 z-20"
      >
        <Link href="/">
          <Button
            variant="outline"
            size="sm"
            className="glass-morphism border-border/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300 hover:scale-105 shadow-lg backdrop-blur-md"
          >
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </motion.div>
      
      {/* Floating Icons */}
      <div className="absolute inset-0 z-5">
        <FloatingIcon 
          icon={<span className="text-primary">Ξ</span>} 
          className="top-16 left-8" 
          delay={0} 
        />
        <FloatingIcon 
          icon={<div className="w-6 h-6 bg-secondary rounded border-2 border-secondary"></div>} 
          className="top-24 right-12" 
          delay={1.5} 
        />
        <FloatingIcon 
          icon={<span className="text-accent">₿</span>} 
          className="bottom-24 left-1/4" 
          delay={3} 
        />
        <FloatingIcon 
          icon={<div className="w-4 h-4 bg-primary rounded-full border-2 border-primary"></div>} 
          className="top-1/3 right-8" 
          delay={2} 
        />
        <FloatingIcon 
          icon={<span className="text-secondary">◈</span>} 
          className="bottom-16 right-1/4" 
          delay={4} 
        />
        <FloatingIcon 
          icon={<div className="w-5 h-5 bg-accent rounded-sm border border-accent"></div>} 
          className="top-1/2 left-6" 
          delay={1} 
        />
        <FloatingIcon 
          icon={<span className="text-primary">⬢</span>} 
          className="bottom-1/3 right-6" 
          delay={2.5} 
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-6">
          <motion.div 
            className="flex items-center justify-center space-x-2 mb-3"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center shadow-lg">
              <Wallet className="text-white text-lg" />
            </div>
            <span className="text-2xl font-bold gradient-text">SmartPay</span>
          </motion.div>
          <motion.h1 
            className="text-xl font-bold mb-2" 
            data-testid="text-signup-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Join the Future of Work
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Create your account and start your decentralized freelance journey
          </motion.p>
        </div>

        <Card className="glass-morphism border-border/50">
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-lg">Create Account</CardTitle>
            <CardDescription className="text-sm">
              Choose your role and create your SmartPay account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 pb-6">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm font-medium text-center"
              >
                {errorMessage}
              </motion.div>
            )}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="role" data-testid="tab-role" className="text-sm">Choose Role</TabsTrigger>
                <TabsTrigger value="details" data-testid="tab-details" className="text-sm">Account Details</TabsTrigger>
                <TabsTrigger value="verification" data-testid="tab-verification" className="text-sm" disabled={!emailVerificationSent}>Verify Email</TabsTrigger>
              </TabsList>
              
              <TabsContent value="role" className="space-y-3">
                <div className="space-y-3">
                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedRole === "client" 
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20" 
                        : "border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelection("client")}
                    data-testid="role-client"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0 : 0.2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="text-primary text-lg" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">I'm a Client</h3>
                        <p className="text-xs text-muted-foreground">
                          Post projects and hire talented freelancers
                        </p>
                      </div>
                      {selectedRole === "client" && (
                        <ArrowRight className="text-primary w-4 h-4" />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                      selectedRole === "freelancer" 
                        ? "border-secondary bg-secondary/10 shadow-lg shadow-secondary/20" 
                        : "border-border hover:border-secondary/50 hover:bg-secondary/5"
                    }`}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleRoleSelection("freelancer")}
                    data-testid="role-freelancer"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0.05 : 0.3 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Users className="text-secondary text-lg" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold">I'm a Freelancer</h3>
                        <p className="text-xs text-muted-foreground">
                          Find projects and earn with guaranteed payments
                        </p>
                      </div>
                      {selectedRole === "freelancer" && (
                        <ArrowRight className="text-secondary w-4 h-4" />
                      )}
                    </div>
                  </motion.div>
                </div>
                
                {selectedRole && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: isTabSwitch ? 0.2 : 0.3 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={() => setActiveTab("details")}
                      className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Continue to Account Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0 : 0.1 }}
                  >
                    <Label htmlFor="fullName" className="text-sm">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        id="fullName" 
                        type="text" 
                        placeholder="Enter your full name"
                        data-testid="input-fullname"
                        className="mt-1 h-9 pl-10"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0.05 : 0.15 }}
                  >
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email"
                        data-testid="input-email"
                        className="mt-1 h-9 pl-10"
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0.1 : 0.2 }}
                  >
                    <Label htmlFor="password" className="text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        id="password" 
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        data-testid="input-password"
                        className="mt-1 h-9 pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0.15 : 0.25 }}
                  >
                    <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        data-testid="input-confirm-password"
                        className="mt-1 h-9 pl-10 pr-10"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox 
                      id="terms" 
                      checked={agreedToTerms}
                      onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                      data-testid="checkbox-terms"
                    />
                    <Label htmlFor="terms" className="text-xs text-muted-foreground">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                    </Label>
                  </motion.div>
                </div>

                  <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: isTabSwitch ? 0.25 : 0.5, delay: isTabSwitch ? 0.2 : 0.35 }}
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    disabled={!selectedRole || isLoading}
                    onClick={() => selectedRole && handleSignup(selectedRole)}
                    data-testid="button-create-account"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isLoading ? "Creating Account..." : "Create Account & Connect SmartPay"}
                  </Button>
                </motion.div>

                <motion.div 
                  className="text-center text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <p>
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary hover:underline">
                      Sign in here
                    </Link>
                  </p>
                </motion.div>
              </TabsContent>

              <TabsContent value="verification" className="space-y-4">
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center"
                  >
                    <Mail className="w-8 h-8 text-primary" />
                  </motion.div>
                  
                  <div>
                    <h3 className="text-lg font-semibold">Check Your Email</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We've sent a verification email to <strong>{formData.email}</strong>
                    </p>
                  </div>

                  {verificationStatus === "verified" ? (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-green-50 border border-green-200 rounded-lg p-4"
                    >
                      <p className="text-green-800 font-medium">✓ Email verified successfully!</p>
                      <p className="text-green-600 text-sm mt-1">Redirecting to your dashboard...</p>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                          Please check your email and click the verification link to complete your registration.
                        </p>
                      </div>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resendVerificationEmail}
                        className="w-full"
                      >
                        Resend Verification Email
                      </Button>
                      
                      <p className="text-xs text-muted-foreground">
                        Didn't receive the email? Check your spam folder or try resending.
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Secure, transparent, and decentralized freelance platform powered by blockchain technology
          </p>
        </div>
      </motion.div>
    </div>
  );
}
