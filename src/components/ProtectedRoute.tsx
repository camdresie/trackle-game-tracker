
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, isLoading } = useAuth();
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);
  const [hasShownUsernameNotice, setHasShownUsernameNotice] = useState(false);
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

  // Show username customization notice
  useEffect(() => {
    if (profile && !hasShownUsernameNotice) {
      // Check if username is likely an email prefix (no custom username set yet)
      const emailPrefix = user?.email?.split('@')[0];
      
      if (profile.username === emailPrefix && location.pathname !== '/onboarding') {
        toast.info(
          'Your username has been set to your email prefix. You can change it in your profile settings.',
          { duration: 6000 }
        );
        setHasShownUsernameNotice(true);
      }
    }
  }, [profile, user, hasShownUsernameNotice, location.pathname]);

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

  // Check if this is a new user that needs to complete onboarding
  const isNewUser = profile?.username === null && profile?.full_name === null;
  
  console.log('Protected route check - profile:', profile);
  console.log('Is new user needing onboarding:', isNewUser);
  
  // Only redirect to onboarding if it's a new user and not already on the onboarding page
  if (location.pathname !== '/onboarding' && isNewUser) {
    console.log('Redirecting to onboarding - new user with incomplete profile');
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
