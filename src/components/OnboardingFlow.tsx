
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { games } from '@/utils/gameData';
import { toast } from 'sonner';

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const { user, profile, updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize form with profile data when available
  useEffect(() => {
    if (profile) {
      console.log('Initializing form with profile data:', profile);
      setUsername(profile.username || '');
      setSelectedGames(profile.selected_games || []);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [profile]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      console.log('Updating profile with:', { username, selected_games: selectedGames });
      
      await updateProfile({
        username,
        selected_games: selectedGames,
      });
      
      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGame = (gameId: string) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
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
          <CardDescription>Set up your profile to start tracking your games</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback>
                  <UserRound className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Username</label>
                <Input 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Games You Play</h3>
            <p className="text-sm text-muted-foreground">
              Choose the games you want to track. You can change this later.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {games.map(game => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => toggleGame(game.id)}
                  className={`p-3 rounded-lg border transition-colors flex flex-col items-center gap-2 hover:bg-secondary ${
                    selectedGames.includes(game.id) 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${game.color} flex items-center justify-center`}>
                    {selectedGames.includes(game.id) && (
                      <Check className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium">{game.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            className="w-full"
            disabled={!username || selectedGames.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Complete Setup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
