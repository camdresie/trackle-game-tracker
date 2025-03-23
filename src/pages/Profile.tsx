
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Trophy, 
  Calendar, 
  BarChart3, 
  Award, 
  Star,
  Settings,
  Clock,
  Medal,
  Target,
  Crown,
  Sparkles,
  Flag,
  Grid,
  GemIcon as Gem,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import NavBar from '@/components/NavBar';
import GameCard from '@/components/GameCard';
import ConnectionsModal from '@/components/ConnectionsModal';
import { Game, Score, Achievement, GameStats } from '@/utils/types';
import { 
  games, 
  getGameById
} from '@/utils/gameData';
import { getPlayerAchievements, getAchievementsByCategory } from '@/utils/achievements';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { getUserGameStats, getPlayedGames, getUserRankByTotalGamesPlayed } from '@/services/statsService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useFriendsList } from '@/hooks/useFriendsList';
import { useIsMobile } from '@/hooks/use-mobile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [activeAchievementCategory, setActiveAchievementCategory] = useState('all');
  const [showConnectionsModal, setShowConnectionsModal] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Use our refactored friends hook
  const { refreshFriends } = useFriendsList();
  
  // Use React Query to fetch game stats
  const { 
    data: gameStats = [], 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useQuery({
    queryKey: ['gameStats', user?.id],
    queryFn: () => user ? getUserGameStats(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  // Use React Query to fetch played games
  const { 
    data: playedGameIds = [], 
    isLoading: isLoadingGames, 
    error: gamesError 
  } = useQuery({
    queryKey: ['playedGames', user?.id],
    queryFn: () => user ? getPlayedGames(user.id) : Promise.resolve([]),
    enabled: !!user,
  });

  // Use React Query to fetch user rank
  const {
    data: userRank = { rank: 1, totalUsers: 1 },
    isLoading: isLoadingRank,
    error: rankError
  } = useQuery({
    queryKey: ['userRank', user?.id],
    queryFn: () => user ? getUserRankByTotalGamesPlayed(user.id) : Promise.resolve({ rank: 1, totalUsers: 1 }),
    enabled: !!user,
  });

  // Show error if needed
  useEffect(() => {
    if (statsError) {
      console.error('Error loading game stats:', statsError);
      toast.error('Failed to load your game statistics');
    }
    if (gamesError) {
      console.error('Error loading played games:', gamesError);
      toast.error('Failed to load your games');
    }
    if (rankError) {
      console.error('Error calculating rank:', rankError);
      toast.error('Failed to calculate your ranking');
    }
  }, [statsError, gamesError, rankError]);
  
  // Get achievements based on stats
  const [playerAchievements, setPlayerAchievements] = useState<Achievement[]>([]);
  
  useEffect(() => {
    const fetchAchievements = async () => {
      if (user) {
        const achievements = await getPlayerAchievements(user.id);
        setPlayerAchievements(achievements);
      }
    };
    
    fetchAchievements();
  }, [user, gameStats]);
  
  // Filter achievements by category
  const filteredAchievements = activeAchievementCategory === 'all'
    ? playerAchievements
    : playerAchievements.filter(achievement => achievement.category === activeAchievementCategory);
  
  // Calculate unlocked achievements count
  const unlockedAchievements = playerAchievements.filter(a => a.unlockedAt).length;
  const totalAchievements = playerAchievements.length;
  
  // Get achievements for display
  const displayAchievements = filteredAchievements.slice(0, 8);
  
  // Calculate profile statistics
  const totalGamesPlayed = gameStats.reduce((total, stat) => total + stat.total_plays, 0);
  const uniqueGamesPlayed = playedGameIds.length;
  
  // Get icon component based on string name
  const getIconByName = (iconName: string) => {
    const iconMap: Record<string, any> = {
      trophy: Trophy,
      star: Star,
      award: Award,
      medal: Medal,
      target: Target,
      crown: Crown,
      sparkles: Sparkles,
      flag: Flag,
      calendar: Calendar,
      grid: Grid,
      gem: Gem,
      clock: Clock
    };
    
    const IconComponent = iconMap[iconName] || Award;
    return <IconComponent className="w-6 h-6" />;
  };

  // Get played games data
  const playedGames = games.filter(game => playedGameIds.includes(game.id));
  
  // Loading state
  if (isLoadingStats || isLoadingGames || isLoadingRank) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="h-[80vh] flex items-center justify-center">
            <p className="text-muted-foreground">Loading your profile data...</p>
          </div>
        </main>
      </div>
    );
  }
  
  // Handle friend removal from the connections modal
  const handleFriendRemoved = async () => {
    console.log("Friend removed, refreshing friends data...");
    await refreshFriends();
  };

  // Generate the rank label
  const rankLabel = `#${userRank.rank} Most Games Played`;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-6 animate-slide-up">
          <div className="glass-card rounded-xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold">{profile?.full_name || profile?.username || 'User'}</h1>
                <p className="text-muted-foreground mb-4">Joined {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                
                <div className="flex flex-wrap justify-center sm:justify-start gap-4 mb-4">
                  <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span className="text-sm">{rankLabel}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">{totalGamesPlayed} Games</span>
                  </div>
                  
                  <div className="flex items-center gap-1 bg-secondary px-3 py-1 rounded-full">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm">{uniqueGamesPlayed}/{games.length} Games</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Track your game scores and compare with friends. Add new scores daily to maintain your streaks and improve your ranking.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => setShowConnectionsModal(true)}
                >
                  <Users className="w-4 h-4" />
                  <span>Friends</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          {isMobile ? (
            <Collapsible
              open={achievementsOpen}
              onOpenChange={setAchievementsOpen}
              className="glass-card rounded-xl p-5"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Your Achievements ({unlockedAchievements}/{totalAchievements})
                </h2>
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    {achievementsOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="mt-4">
                <div className="overflow-x-auto pb-2 -mx-1 px-1">
                  <ToggleGroup 
                    type="single" 
                    value={activeAchievementCategory}
                    onValueChange={(value) => {
                      if (value) setActiveAchievementCategory(value);
                    }}
                    className="flex space-x-1 mb-4"
                  >
                    <ToggleGroupItem value="all" className="text-xs">All</ToggleGroupItem>
                    <ToggleGroupItem value="general" className="text-xs">General</ToggleGroupItem>
                    <ToggleGroupItem value="wordle" className="text-xs">Wordle</ToggleGroupItem>
                    <ToggleGroupItem value="quordle" className="text-xs">Quordle</ToggleGroupItem>
                  </ToggleGroup>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {displayAchievements.slice(0, 4).map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`glass-card rounded-xl p-3 flex flex-col items-center text-center ${!achievement.unlockedAt ? 'opacity-40 hover:opacity-100 transition-opacity' : ''}`}
                    >
                      <div className={`p-2 rounded-full ${achievement.unlockedAt ? `bg-${games.find(g => g.id === achievement.gameId)?.color || 'primary'}/10` : 'bg-secondary'} mb-2`}>
                        {getIconByName(achievement.icon)}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{achievement.title}</h3>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 text-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View All</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>All Achievements</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {filteredAchievements.map((achievement) => (
                          <div 
                            key={achievement.id}
                            className={`glass-card rounded-xl p-5 flex items-center gap-4 ${!achievement.unlockedAt ? 'opacity-40' : ''}`}
                          >
                            <div className={`p-3 rounded-full ${achievement.unlockedAt ? 'bg-primary/10' : 'bg-secondary'}`}>
                              {getIconByName(achievement.icon)}
                            </div>
                            <div>
                              <h3 className="font-semibold">{achievement.title}</h3>
                              <p className="text-sm text-muted-foreground">{achievement.description}</p>
                              {achievement.unlockedAt && (
                                <div className="text-xs flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Award className="w-5 h-5 text-accent" />
                  Your Achievements ({unlockedAchievements}/{totalAchievements})
                </h2>
                
                <div className="flex gap-2">
                  <Badge 
                    className={`cursor-pointer ${activeAchievementCategory === 'all' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`} 
                    onClick={() => setActiveAchievementCategory('all')}
                  >
                    All
                  </Badge>
                  <Badge 
                    className={`cursor-pointer ${activeAchievementCategory === 'general' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setActiveAchievementCategory('general')}
                  >
                    General
                  </Badge>
                  <Badge 
                    className={`cursor-pointer ${activeAchievementCategory === 'wordle' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setActiveAchievementCategory('wordle')}
                  >
                    Wordle
                  </Badge>
                  <Badge 
                    className={`cursor-pointer ${activeAchievementCategory === 'quordle' ? 'bg-primary' : 'bg-secondary hover:bg-secondary/80'}`}
                    onClick={() => setActiveAchievementCategory('quordle')}
                  >
                    Quordle
                  </Badge>
                </div>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">View All</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>All Achievements</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {filteredAchievements.map((achievement) => (
                        <div 
                          key={achievement.id}
                          className={`glass-card rounded-xl p-5 flex items-center gap-4 ${!achievement.unlockedAt ? 'opacity-40' : ''}`}
                        >
                          <div className={`p-3 rounded-full ${achievement.unlockedAt ? 'bg-primary/10' : 'bg-secondary'}`}>
                            {getIconByName(achievement.icon)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{achievement.title}</h3>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                            {achievement.unlockedAt && (
                              <div className="text-xs flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className={`glass-card rounded-xl p-5 flex flex-col items-center text-center ${!achievement.unlockedAt ? 'opacity-40 hover:opacity-100 transition-opacity' : ''}`}
                  >
                    <div className={`p-3 rounded-full ${achievement.unlockedAt ? `bg-${games.find(g => g.id === achievement.gameId)?.color || 'primary'}/10` : 'bg-secondary'} mb-4`}>
                      {getIconByName(achievement.icon)}
                    </div>
                    <h3 className="font-semibold mb-1">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                    <div className="mt-auto text-xs flex items-center gap-1 bg-secondary px-2 py-1 rounded-full">
                      {achievement.unlockedAt ? (
                        <>
                          <Clock className="w-3 h-3" />
                          <span>Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                        </>
                      ) : (
                        <span>Not yet unlocked</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="animate-slide-up" style={{animationDelay: '200ms'}}>
          <Tabs defaultValue="games">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="games" className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  <span>Your Games</span>
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Activity</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="games" className="animate-fade-in mt-0">
              {playedGames.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {playedGames.map(game => {
                    const gameStat = gameStats.find(stat => stat.game_id === game.id);
                    
                    return (
                      <GameCard 
                        key={game.id}
                        game={game}
                        latestScore={gameStat ? {
                          id: `latest-${game.id}`,
                          gameId: game.id,
                          playerId: user?.id || '',
                          value: gameStat.best_score || 0,
                          date: new Date().toISOString(),
                          createdAt: new Date().toISOString()
                        } : undefined}
                        averageScore={gameStat?.average_score}
                        bestScore={gameStat?.best_score}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="glass-card rounded-xl p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No games played yet</h3>
                  <p className="text-muted-foreground mb-4">Add your first game score to start tracking your progress</p>
                  <Button variant="default">Add Your First Score</Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="activity" className="animate-fade-in mt-0">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                
                {gameStats.length > 0 ? (
                  <div className="space-y-4">
                    {gameStats
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .slice(0, 10)
                      .map(stat => {
                        const game = getGameById(stat.game_id);
                        if (!game) return null;
                        
                        return (
                          <div 
                            key={stat.id}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                          >
                            <div className={`w-10 h-10 rounded-lg ${game.color} flex items-center justify-center`}>
                              <span className="font-semibold text-white">{stat.best_score}</span>
                            </div>
                            
                            <div className="flex-1">
                              <div className="font-medium">{game.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {stat.total_plays} plays | {stat.current_streak} day streak
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Best: {stat.best_score}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Avg: {Math.round(stat.average_score * 10) / 10}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {showConnectionsModal && user && (
        <ConnectionsModal
          open={showConnectionsModal}
          onOpenChange={setShowConnectionsModal}
          currentPlayerId={user.id}
          onFriendRemoved={handleFriendRemoved}
        />
      )}
    </div>
  );
};

export default Profile;
