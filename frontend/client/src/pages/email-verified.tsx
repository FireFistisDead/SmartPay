import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Mail } from "lucide-react";
import firebaseAuthService from "@/firebase/authService";
import api from "@/services/api";

export default function EmailVerified() {
  const [verificationStatus, setVerificationStatus] = useState<"checking" | "verified" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        // Check if user is signed in and verified
        const user = firebaseAuthService.getCurrentUser();
        
        if (user) {
          await firebaseAuthService.reloadUser();
          
          if (firebaseAuthService.isEmailVerified()) {
            setVerificationStatus("verified");
            
            // Check for pending user data in localStorage
            const pendingData = localStorage.getItem("pendingUserData");
            if (pendingData) {
              try {
                const userData = JSON.parse(pendingData);
                
                // Update backend verification status
                const verifyResponse = await api.post('/users/verify-email', 
                  { firebaseUID: userData.firebaseUID },
                  { headers: { Authorization: `Bearer ${userData.token}` } }
                );

                if (verifyResponse.data.success) {
                  // Update the stored token with the new one that has verified status
                  localStorage.setItem("authToken", verifyResponse.data.data.token);
                  localStorage.setItem("userRole", userData.role);
                  localStorage.removeItem("pendingUserData");
                  
                  setMessage("Your email has been verified successfully! You will be redirected to your dashboard.");
                  
                  // Auto-redirect after 3 seconds
                  setTimeout(() => {
                    if (userData.role === "client") {
                      window.location.href = "/client-dashboard";
                    } else if (userData.role === "freelancer") {
                      window.location.href = "/freelancer-dashboard";
                    } else {
                      window.location.href = "/dashboard";
                    }
                  }, 3000);
                } else {
                  setMessage("Email verified in Firebase, but backend update failed. Please contact support.");
                }
              } catch (error) {
                console.error("Backend verification error:", error);
                setMessage("Email verified in Firebase, but there was an issue updating your account. Please try logging in.");
              }
            } else {
              setMessage("Your email has been verified! Please return to the signup page or try logging in.");
            }
          } else {
            setVerificationStatus("error");
            setMessage("Email verification is still pending. Please check your email again.");
          }
        } else {
          setVerificationStatus("error");
          setMessage("No user found. Please try signing up again.");
        }
      } catch (error) {
        console.error("Verification check error:", error);
        setVerificationStatus("error");
        setMessage("An error occurred while checking verification status.");
      }
    };

    checkVerificationStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 mx-auto mb-4"
          >
            {verificationStatus === "checking" && (
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            )}
            {verificationStatus === "verified" && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            )}
            {verificationStatus === "error" && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            )}
          </motion.div>
          
          <CardTitle className="text-xl">
            {verificationStatus === "checking" && "Checking Verification..."}
            {verificationStatus === "verified" && "Email Verified!"}
            {verificationStatus === "error" && "Verification Error"}
          </CardTitle>
          
          <CardDescription className="text-center">
            {message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {verificationStatus === "verified" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <p className="text-sm text-muted-foreground">
                Your email verification is complete. You can now access all features of SmartPay.
              </p>
              
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/signup">Return to Signup</Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>
            </motion.div>
          )}
          
          {verificationStatus === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href="/signup">Try Signing Up Again</Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">Go to Home</Link>
                </Button>
              </div>
            </motion.div>
          )}
          
          {verificationStatus === "checking" && (
            <div className="space-y-2">
              <div className="animate-pulse h-4 bg-muted rounded"></div>
              <div className="animate-pulse h-4 bg-muted rounded w-3/4 mx-auto"></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
