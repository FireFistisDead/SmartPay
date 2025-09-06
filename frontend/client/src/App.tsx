import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, ClientOnlyRoute, FreelancerOnlyRoute } from "@/components/protected-route";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import ClientDashboard from "@/pages/client-dashboard";
import FreelancerDashboard from "@/pages/freelancer-dashboard";
import CreateProject from "@/pages/create-project";
import MyProjects from "@/pages/my-projects";
import FindFreelancers from "@/pages/find-freelancers";
import PaymentsEscrow from "@/pages/payments-escrow";
import MessagesDisputes from "@/pages/messages-disputes";
import BrowseProjects from "@/pages/browse-projects";
import Proposals from "@/pages/proposals";
import SubmitDeliverable from "@/pages/submit-deliverable";
import MyContracts from "@/pages/my-contracts";
import PaymentsEarnings from "@/pages/payments-earnings";
import ProfileSettings from "@/pages/profile-settings";
import Analytics from "@/pages/analytics";
import Notifications from "@/pages/notifications";
import HelpSupport from "@/pages/help-support";
import FreelancerAnalytics from "@/pages/freelancer-analytics";
import FreelancerMessagesDisputes from "@/pages/freelancer-messages-disputes";
import FreelancerNotifications from "@/pages/freelancer-notifications";
import FreelancerProfileSettings from "@/pages/freelancer-profile-settings";
import NotFound from "@/pages/not-found";

function DashboardRouter() {
  const userRole = localStorage.getItem("userRole");
  
  if (userRole === "client") {
    return <ClientDashboard />;
  } else if (userRole === "freelancer") {
    return <FreelancerDashboard />;
  } else {
    return <Login />;
  }
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      
      {/* General Dashboard Route */}
      <Route path="/dashboard" component={DashboardRouter} />
      
      {/* Client-Only Routes */}
      <Route path="/client-dashboard">
        <ClientOnlyRoute>
          <ClientDashboard />
        </ClientOnlyRoute>
      </Route>
      <Route path="/create-project">
        <ClientOnlyRoute>
          <CreateProject />
        </ClientOnlyRoute>
      </Route>
      <Route path="/my-projects">
        <ClientOnlyRoute>
          <MyProjects />
        </ClientOnlyRoute>
      </Route>
      <Route path="/find-freelancers">
        <ClientOnlyRoute>
          <FindFreelancers />
        </ClientOnlyRoute>
      </Route>
      
      {/* Freelancer-Only Routes */}
      <Route path="/freelancer-dashboard">
        <FreelancerOnlyRoute>
          <FreelancerDashboard />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/browse-projects">
        <FreelancerOnlyRoute>
          <BrowseProjects />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/proposals">
        <FreelancerOnlyRoute>
          <Proposals />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/submit-deliverable">
        <FreelancerOnlyRoute>
          <SubmitDeliverable />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/my-contracts">
        <FreelancerOnlyRoute>
          <MyContracts />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/payments-earnings">
        <FreelancerOnlyRoute>
          <PaymentsEarnings />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/freelancer-analytics">
        <FreelancerOnlyRoute>
          <FreelancerAnalytics />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/freelancer-messages-disputes">
        <FreelancerOnlyRoute>
          <FreelancerMessagesDisputes />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/freelancer-notifications">
        <FreelancerOnlyRoute>
          <FreelancerNotifications />
        </FreelancerOnlyRoute>
      </Route>
      <Route path="/freelancer-profile-settings">
        <FreelancerOnlyRoute>
          <FreelancerProfileSettings />
        </FreelancerOnlyRoute>
      </Route>
      
      {/* Shared Protected Routes (Both Roles) */}
      <Route path="/payments-escrow">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <PaymentsEscrow />
        </ProtectedRoute>
      </Route>
      <Route path="/messages-disputes">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <MessagesDisputes />
        </ProtectedRoute>
      </Route>
      <Route path="/profile-settings">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <ProfileSettings />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <Notifications />
        </ProtectedRoute>
      </Route>
      <Route path="/help-support">
        <ProtectedRoute allowedRoles={['client', 'freelancer']}>
          <HelpSupport />
        </ProtectedRoute>
      </Route>
      
      {/* 404 Route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Hide loading spinner once React has loaded
    document.body.classList.add('app-loaded');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
