import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Users, Briefcase, ArrowRight } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"client" | "freelancer" | null>(null);

  const handleLogin = (role: "client" | "freelancer") => {
    // For now, just redirect to dashboard
    // In production, this would handle wallet connection and authentication
    localStorage.setItem("userRole", role);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-6">
      <div className="absolute inset-0 blockchain-grid opacity-10"></div>
      
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-xl flex items-center justify-center">
              <Wallet className="text-white text-xl" />
            </div>
            <span className="text-3xl font-bold gradient-text">SmartPay</span>
          </div>
          <h1 className="text-2xl font-bold mb-2" data-testid="text-login-title">
            Welcome to the Future of Work
          </h1>
          <p className="text-muted-foreground">
            Connect your wallet and choose your role to get started
          </p>
        </div>

        <Card className="glass-morphism border-border/50">
          <CardHeader>
            <CardTitle>Login / Sign Up</CardTitle>
            <CardDescription>
              Choose your role and connect to start earning or hiring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="role" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="role" data-testid="tab-role">Choose Role</TabsTrigger>
                <TabsTrigger value="wallet" data-testid="tab-wallet">Connect Wallet</TabsTrigger>
              </TabsList>
              
              <TabsContent value="role" className="space-y-4">
                <div className="space-y-4">
                  <motion.div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === "client" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole("client")}
                    data-testid="role-client"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="text-primary text-xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">I'm a Client</h3>
                        <p className="text-sm text-muted-foreground">
                          Post projects and hire talented freelancers
                        </p>
                      </div>
                      {selectedRole === "client" && (
                        <ArrowRight className="text-primary" />
                      )}
                    </div>
                  </motion.div>

                  <motion.div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedRole === "freelancer" 
                        ? "border-secondary bg-secondary/10" 
                        : "border-border hover:border-secondary/50"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedRole("freelancer")}
                    data-testid="role-freelancer"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                        <Users className="text-secondary text-xl" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">I'm a Freelancer</h3>
                        <p className="text-sm text-muted-foreground">
                          Find projects and earn with guaranteed payments
                        </p>
                      </div>
                      {selectedRole === "freelancer" && (
                        <ArrowRight className="text-secondary" />
                      )}
                    </div>
                  </motion.div>
                </div>
              </TabsContent>
              
              <TabsContent value="wallet" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Enter your email"
                      data-testid="input-email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter your password"
                      data-testid="input-password"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Button 
                    className="w-full bg-gradient-to-r from-primary to-secondary"
                    disabled={!selectedRole}
                    onClick={() => selectedRole && handleLogin(selectedRole)}
                    data-testid="button-connect-wallet"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Wallet & Continue
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full glass-morphism"
                    disabled={!selectedRole}
                    onClick={() => selectedRole && handleLogin(selectedRole)}
                    data-testid="button-email-login"
                  >
                    Continue with Email
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-primary hover:underline">
                      Sign up here
                    </Link>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-sm text-muted-foreground">
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