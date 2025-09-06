import { useLocation } from "wouter";
import { useEffect, ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ('client' | 'freelancer' | 'admin')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['client', 'freelancer'], 
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    const userRole = localStorage.getItem("userRole") as 'client' | 'freelancer' | null;
    const isAuthenticated = userRole !== null;
    
    if (!isAuthenticated) {
      setLocation(redirectTo);
      return;
    }
    
    if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
      // Redirect to appropriate dashboard based on role
      if (userRole === 'client') {
        setLocation('/client-dashboard');
      } else if (userRole === 'freelancer') {
        setLocation('/freelancer-dashboard');
      } else {
        setLocation('/dashboard');
      }
      return;
    }
  }, [allowedRoles, redirectTo, setLocation]);

  const userRole = localStorage.getItem("userRole");
  const isAuthenticated = userRole !== null;
  const hasPermission = allowedRoles.length === 0 || (userRole && allowedRoles.includes(userRole as any));

  if (!isAuthenticated || !hasPermission) {
    return null;
  }

  return <>{children}</>;
}

// Role-specific route helpers
export function ClientOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      {children}
    </ProtectedRoute>
  );
}

export function FreelancerOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['freelancer']}>
      {children}
    </ProtectedRoute>
  );
}
