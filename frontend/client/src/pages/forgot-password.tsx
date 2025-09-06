import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Home } from "lucide-react";
import ParticleBackground from "@/components/particle-background";

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

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<"email" | "code" | "reset">("email");
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSendResetEmail = () => {
    if (!email) {
      setErrorMessage("Please enter your email address");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please enter a valid email address");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    // Simulate sending reset email
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Reset code sent to your email!");
      setStep("code");
      setTimeout(() => setSuccessMessage(""), 3000);
    }, 2000);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      setErrorMessage("Please enter the verification code");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (verificationCode.length !== 6) {
      setErrorMessage("Verification code must be 6 digits");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    // Simulate code verification
    setTimeout(() => {
      setIsLoading(false);
      if (verificationCode === "123456") { // Demo code
        setSuccessMessage("Code verified successfully!");
        setStep("reset");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage("Invalid verification code. Try 123456 for demo.");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    }, 1500);
  };

  const handleResetPassword = () => {
    if (!newPassword || !confirmPassword) {
      setErrorMessage("Please fill in all password fields");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters long");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    
    // Simulate password reset
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMessage("Password reset successfully!");
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    }, 2000);
  };

  const renderStepContent = () => {
    switch (step) {
      case "email":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-primary w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Reset Your Password</h2>
              <p className="text-sm text-muted-foreground">
                Enter your email address and we'll send you a verification code to reset your password.
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter your email address"
                  data-testid="input-email"
                  className="mt-1 h-10 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-primary to-secondary h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={handleSendResetEmail}
              disabled={isLoading}
              data-testid="button-send-reset"
            >
              {isLoading ? "Sending..." : "Send Reset Code"}
            </Button>
          </motion.div>
        );

      case "code":
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-secondary w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Enter Verification Code</h2>
              <p className="text-sm text-muted-foreground">
                We've sent a 6-digit verification code to{" "}
                <span className="font-medium text-foreground">{email}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Demo code: <span className="font-mono font-bold text-primary">123456</span>
              </p>
            </div>

            <div>
              <Label htmlFor="code" className="text-sm">Verification Code</Label>
              <Input 
                id="code" 
                type="text" 
                placeholder="Enter 6-digit code"
                data-testid="input-verification-code"
                className="mt-1 h-10 text-center text-lg font-mono tracking-widest"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
              />
            </div>

            <div className="space-y-2">
              <Button 
                className="w-full bg-gradient-to-r from-secondary to-primary h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={handleVerifyCode}
                disabled={isLoading || verificationCode.length !== 6}
                data-testid="button-verify-code"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>

              <Button 
                variant="outline" 
                className="w-full glass-morphism h-10 text-sm"
                onClick={() => setStep("email")}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back to Email
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Didn't receive the code?{" "}
                <button 
                  onClick={handleSendResetEmail}
                  className="text-primary hover:underline"
                  disabled={isLoading}
                >
                  Resend
                </button>
              </p>
            </div>
          </motion.div>
        );

      case "reset":
        return (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-accent w-8 h-8" />
              </div>
              <h2 className="text-lg font-semibold mb-2">Create New Password</h2>
              <p className="text-sm text-muted-foreground">
                Choose a strong password for your SmartPay account.
              </p>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-sm">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="newPassword" 
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  data-testid="input-new-password"
                  className="mt-1 h-10 pl-10 pr-10"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  data-testid="input-confirm-password"
                  className="mt-1 h-10 pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="space-y-1">
                <li className={newPassword.length >= 8 ? "text-green-500" : ""}>
                  • At least 8 characters long
                </li>
                <li className={/[A-Z]/.test(newPassword) ? "text-green-500" : ""}>
                  • Contains uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? "text-green-500" : ""}>
                  • Contains lowercase letter
                </li>
                <li className={/\d/.test(newPassword) ? "text-green-500" : ""}>
                  • Contains number
                </li>
              </ul>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-accent to-primary h-10 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              onClick={handleResetPassword}
              disabled={isLoading}
              data-testid="button-reset-password"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </motion.div>
        );

      default:
        return null;
    }
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
            data-testid="text-forgot-password-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Forgot Your Password?
          </motion.h1>
          <motion.p 
            className="text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            No worries! We'll help you get back into your account
          </motion.p>
        </div>

        <Card className="glass-morphism border-border/50">
          <CardHeader className="pb-4 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Reset Password</CardTitle>
                <CardDescription className="text-sm">
                  Step {step === "email" ? "1" : step === "code" ? "2" : "3"} of 3
                </CardDescription>
              </div>
              {step !== "email" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(step === "code" ? "email" : "code")}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
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

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-sm font-medium text-center"
              >
                {successMessage}
              </motion.div>
            )}

            {renderStepContent()}
          </CardContent>
        </Card>

        <motion.div 
          className="mt-4 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <p>
            Remember your password?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in here
            </Link>
          </p>
        </motion.div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>
            Need help?{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
