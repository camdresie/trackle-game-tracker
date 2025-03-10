
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Search,
  Filter,
  User,
  ChevronsUpDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NavBar from '@/components/NavBar';
import PlayerCard from '@/components/PlayerCard';
import { Game, Player, Score } from '@/utils/types';
import { 
  games, 
  players, 
  sampleScores, 
  getScoresByGameAndPlayer,
  calculateBestScore,
  calculateAverageScore
} from '@/utils/gameData';

const Leaderboard = () => {
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('totalScore');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Calculate player ranks based on their performance
  const getPlayerRanks = () => {
    const playerScores = players.map(player => {
      let totalScore = 0;
      let totalGames = 0;
      let bestScore = 0;
      let averageScore = 0;
      
      if (selectedGame === 'all') {
        // Calculate across all games
        games.forEach(game => {
          const playerGameScores = getScoresByGameAndPlayer(game.id, player.id);
          
          if (playerGameScores.length > 0) {
            const gameScore = playerGameScores.reduce((sum, s) => sum + s.value, 0);
            totalScore += game.id === 'wordle' ? -gameScore : gameScore; // Invert Wordle scores
            totalGames += playerGameScores.length;
            
            const best = calculateBestScore(playerGameScores, game);
            bestScore += game.id === 'wordle' ? -best : best; // Invert Wordle scores
            
            const avg = calculateAverageScore(playerGameScores);
            averageScore += avg;
          }
        });
        
        if (totalGames > 0) {
          averageScore /= games.length;
        }
      } else {
        // Calculate for specific game
        const game = games.find(g => g.id === selectedGame);
        if (game) {
          const playerGameScores = getScoresByGameAndPlayer(game.id, player.id);
          
          totalGames = playerGameScores.length;
          bestScore = calculateBestScore(playerGameScores, game);
          averageScore = calculateAverageScore(playerGameScores);
          
          // For Wordle, lower is better, so invert the score
          if (game.id === 'wordle') {
            totalScore = playerGameScores.length > 0 
              ? -playerGameScores.reduce((sum, s) => sum + s.value, 0)
              : 0;
            bestScore = bestScore > 0 ? -bestScore : 0;
          } else {
            totalScore = playerGameScores.reduce((sum, s) => sum + s.value, 0);
          }
        }
      }
      
      return { 
        player, 
        totalScore,
        totalGames,
        bestScore,
        averageScore
      };
    });
    
    // Filter by search term if needed
    const filteredPlayers = searchTerm 
      ? playerScores.filter(ps => ps.player.name.toLowerCase().includes(searchTerm.toLowerCase()))
      : playerScores;
    
    // Sort players based on selected criteria
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
      switch (sortBy) {
        case 'totalScore':
          return b.totalScore - a.totalScore;
        case 'bestScore':
          return b.bestScore - a.bestScore;
        case 'totalGames':
          return b.totalGames - a.totalGames;
        case 'averageScore':
          return b.averageScore - a.averageScore;
        default:
          return b.totalScore - a.totalScore;
      }
    });
    
    // Assign ranks
    return sortedPlayers.map((ps, index) => ({
      ...ps,
      rank: index + 1
    }));
  };
  
  const playerRanks = getPlayerRanks();
  
  // Get scores for a specific game or all games
  const getScoresForPlayer = (playerId: string): Score[] => {
    if (selectedGame === 'all') {
      return sampleScores.filter(score => score.playerId === playerId);
    } else {
      return getScoresByGameAndPlayer(selectedGame, playerId);
    }
  };
  
  // Get relevant game info
  const getSelectedGameObject = (): Game | undefined => {
    if (selectedGame === 'all') return undefined;
    return games.find(game => game.id === selectedGame);
  };
  
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8 animate-slide-up">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">See who's winning across all games</p>
        </div>
        
        <div className="glass-card rounded-xl p-5 mb-6 animate-slide-up" style={{animationDelay: '100ms'}}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search players..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Button
                variant="outline"
                className="flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filter</span>
              </Button>
            </div>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-full sm:w-auto">
                <Select 
                  value={selectedGame} 
                  onValueChange={setSelectedGame}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Game" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Games</SelectItem>
                    {games.map(game => (
                      <SelectItem key={game.id} value={game.id}>
                        {game.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-auto">
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="totalScore">Total Score</SelectItem>
                    <SelectItem value="bestScore">Best Score</SelectItem>
                    <SelectItem value="totalGames">Games Played</SelectItem>
                    <SelectItem value="averageScore">Average Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {playerRanks.length > 0 ? (
              playerRanks.map(({ player, rank }) => (
                <PlayerCard 
                  key={player.id}
                  player={player}
                  rank={rank}
                  scores={getScoresForPlayer(player.id)}
                  game={getSelectedGameObject()}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <User className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No players found</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-5 animate-slide-up" style={{animationDelay: '200ms'}}>
          <h2 className="text-lg font-semibold mb-4">Stats Overview</h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-2xl font-semibold">{players.length}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div className="text-2xl font-semibold">{games.length}</div>
              <div className="text-sm text-muted-foreground">Games Tracked</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <ChevronsUpDown className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-2xl font-semibold">{sampleScores.length}</div>
              <div className="text-sm text-muted-foreground">Total Scores</div>
            </div>
            
            <div className="bg-secondary/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <User className="w-5 h-5 text-purple-500" />
              </div>
              <div className="text-2xl font-semibold">
                {playerRanks.length > 0 ? playerRanks[0].player.name : '-'}
              </div>
              <div className="text-sm text-muted-foreground">Current Leader</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Leaderboard;
