
import { Button } from '@/components/ui/button';
import { Plus, UsersRound } from 'lucide-react';
import { Game } from '@/utils/types';
import { useToast } from '@/hooks/use-toast';

interface HomeHeaderProps {
  onShowAddScore: () => void;
  onShowConnections: () => void;
  gamesList: Game[];
}

const HomeHeader = ({
  onShowAddScore,
  onShowConnections,
  gamesList
}: HomeHeaderProps) => {
  const { toast } = useToast();

  const handleAddScoreClick = () => {
    if (gamesList.length > 0) {
      onShowAddScore();
    } else {
      toast({
        title: "No games available",
        description: "Please add a game first",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
      <div className="flex items-center gap-2">
        <img 
          src="/lovable-uploads/d15dd151-d315-44b0-b08b-77ec26d6aa77.png" 
          alt="Trackle" 
          className="h-10 w-auto hidden sm:block" 
        />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Trackle</h1>
          <p className="text-muted-foreground">Track your daily game scores and compare with friends</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline"
          onClick={onShowConnections}
          className="flex items-center gap-2"
        >
          <UsersRound className="w-4 h-4" />
          Friends
        </Button>
        
        <Button 
          onClick={handleAddScoreClick}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Score
        </Button>
      </div>
    </div>
  );
};

export default HomeHeader;
