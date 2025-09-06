import { useLocation } from "wouter";

export function useDashboardNavigation() {
  const [, setLocation] = useLocation();

  const goToDashboard = () => {
    // Get user role from localStorage (or from auth context in production)
    const userRole = localStorage.getItem("userRole");
    
    if (userRole === "client") {
      setLocation("/client-dashboard");
    } else if (userRole === "freelancer") {
      setLocation("/freelancer-dashboard");
    } else {
      // Fallback to the generic dashboard router
      setLocation("/dashboard");
    }
  };

  const getDashboardPath = () => {
    const userRole = localStorage.getItem("userRole");
    
    if (userRole === "client") {
      return "/client-dashboard";
    } else if (userRole === "freelancer") {
      return "/freelancer-dashboard";
    } else {
      return "/dashboard";
    }
  };

  return { goToDashboard, getDashboardPath };
}
