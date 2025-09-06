import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Users, Briefcase, ArrowRight } from "lucide-react";
import ParticleBackground from "@/components/particle-background";

const FloatingIcon = ({ icon, className, delay = 0 }: { icon: React.ReactNode; className: string; delay?: number }) => (
  <motion.div
    className={`absolute text-2xl opacity-20 ${className}`}
    animate={{
      y: [-15, 15, -15],
      rotate: [0, 180, 360],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  >
    {icon}
  </motion.div>
);

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer" | null>(null);
  const [activeTab, setActiveTab] = useState("role");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for role parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const roleParam = urlParams.get('role');
    
    if (roleParam === 'client' || roleParam === 'freelancer') {
      setSelectedRole(roleParam);
      setActiveTab("wallet"); // Automatically switch to wallet tab
    }
  }, []);

  const handleLogin = (role: "client" | "freelancer") => {
    setIsLoading(true);
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      // For now, just redirect to dashboard
      // In production, this would handle SmartPay connection and authentication
      localStorage.setItem("userRole", role);
      setLocation("/dashboard");
    }, 1000);
  };

  const handleTabChange = (newTab: string) => {
    if (newTab === "wallet" && !selectedRole) {
      setErrorMessage("Choose a Role to login/register");
      // Clear error message after 3 seconds
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    setErrorMessage(""); // Clear any existing error
    setActiveTab(newTab);
  };

  const handleRoleSelection = (role: "client" | "freelancer") => {
    setSelectedRole(role);
    setErrorMessage(""); // Clear any error when role is selected
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 blockchain-grid opacity-10"></div>
      <ParticleBackground />
      
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
            data-testid="text-login-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Welcome to the Future of Work
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            Connect your SmartPay and choose your role to get started
          </motion.p>
        </div>

        <Card className="glass-morphism border-border/50">
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-lg">Login / Sign Up</CardTitle>
            <CardDescription className="text-sm">
              Choose your role and connect to start earning or hiring
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
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="role" data-testid="tab-role" className="text-sm">Choose Role</TabsTrigger>
                <TabsTrigger value="wallet" data-testid="tab-wallet" className="text-sm">Connect SmartPay</TabsTrigger>
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
                    transition={{ duration: 0.5, delay: 0.8 }}
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
                    transition={{ duration: 0.5, delay: 1.0 }}
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
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <Button
                      onClick={() => setActiveTab("wallet")}
                      className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-lg text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Continue to Connect SmartPay
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </motion.div>
                )}
              </TabsContent>
              
              <TabsContent value="wallet" className="space-y-4">
                <div className="space-y-3">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Label htmlFor="email" className="text-sm">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email"
                      data-testid="input-email"
                      className="mt-1 h-9"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm">Password</Label>
                      <Link 
                        href="/forgot-password" 
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter your password"
                      data-testid="input-password"
                      className="mt-1 h-9"
                    />
                  </motion.div>
                </div>

                <motion.div 
                  className="space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    disabled={!selectedRole || isLoading}
                    onClick={() => selectedRole && handleLogin(selectedRole)}
                    data-testid="button-connect-wallet"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {isLoading ? "Connecting..." : "Connect SmartPay & Continue"}
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full glass-morphism h-10 text-sm font-semibold hover:bg-primary/10 transition-all duration-300 hover:scale-105"
                    disabled={!selectedRole || isLoading}
                    onClick={() => selectedRole && handleLogin(selectedRole)}
                    data-testid="button-email-login"
                  >
                    {isLoading ? "Processing..." : "Continue with Email"}
                  </Button>
                </motion.div>

                <motion.div 
                  className="text-center text-xs text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  <p>
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline">
                      Sign up here
                    </Link>
                  </p>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}