
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
      <div>
        <div className="mb-1">
          <img 
            src="/lovable-uploads/024cdc2b-a9ed-44eb-af0f-8772dfc665a0.png" 
            alt="Trackle Logo" 
            className="h-10 w-auto"
          />
        </div>
        <p className="text-muted-foreground">Track your daily game scores and compare with friends</p>
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
