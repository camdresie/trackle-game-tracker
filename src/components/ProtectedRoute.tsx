
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Check if this is a redirect with error
    const query = new URLSearchParams(window.location.search);
    const error = query.get('error');
    const errorDescription = query.get('error_description');
    
    if (error) {
      console.error('Auth redirect error:', error, errorDescription);
    }
    
    setIsCheckingRedirect(false);
  }, []);

  if (isLoading || isCheckingRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // A user needs onboarding if their profile doesn't exist or has null/empty username
  const needsOnboarding = !profile || !profile.username;
  
  // Only redirect to onboarding if user needs it and not already on the onboarding page
  if (location.pathname !== '/onboarding' && needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is on onboarding page but doesn't need onboarding, redirect to home
  if (location.pathname === '/onboarding' && !needsOnboarding) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
