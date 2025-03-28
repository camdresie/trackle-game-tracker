
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      console.log('Initializing form with profile data:', profile);
      
      // If the profile exists but username is null, try to get it from user metadata
      if (!profile.username && user?.user_metadata?.username) {
        setUsername(user.user_metadata.username);
      } else {
        setUsername(profile.username || '');
      }
      
      setFullName(profile.full_name || '');
      setIsLoading(false);
    } else if (user) {
      // If we have user metadata but no profile yet, check if there's a username in user metadata
      const userMetadataUsername = user.user_metadata?.username;
      if (userMetadataUsername) {
        setUsername(userMetadataUsername);
      } else {
        const emailPrefix = user.email?.split('@')[0] || '';
        setUsername(emailPrefix);
      }
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [profile, user]);

  // Check if username is valid
  useEffect(() => {
    if (username.length > 0 && username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
    } else {
      setUsernameError(null);
    }
  }, [username]);

  const handleSubmit = async () => {
    if (!username || username.length < 3) {
      toast.error('Please provide a valid username (at least 3 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('Updating profile with:', { username, full_name: fullName });
      
      await updateProfile({
        username,
        full_name: fullName,
      });
      
      toast.success('Profile setup complete!');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p>Loading profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Complete Your Profile</CardTitle>
          <CardDescription>Personalize your account with a custom username and your full name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>
                  <UserRound className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Your Name</label>
                  <Input 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Username</label>
                  <Input 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className={usernameError ? "border-red-500" : ""}
                  />
                  {usernameError && (
                    <p className="text-xs text-red-500 mt-1">{usernameError}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    This is the username you'll use across the platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!username || username.length < 3 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
