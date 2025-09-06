import { Switch, Route } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
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
import BrowseProjects from "@/pages/browse-projects";
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
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/create-project" component={CreateProject} />
      <Route path="/my-projects" component={MyProjects} />
      <Route path="/find-freelancers" component={FindFreelancers} />
      <Route path="/payments-escrow" component={PaymentsEscrow} />
      <Route path="/browse-projects" component={BrowseProjects} />
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
