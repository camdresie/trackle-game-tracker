
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus, ChevronDown } from 'lucide-react';
import SearchResultItem from './SearchResultItem';
import { Player } from '@/utils/types';

interface SearchResultsListProps {
  searchQuery: string;
  searchResults: Player[];
  onAddFriend: (friendId: string) => void;
  isLoading: boolean;
  isAdding: boolean;
}

const SearchResultsList = ({
  searchQuery,
  searchResults,
  onAddFriend,
  isLoading,
  isAdding
}: SearchResultsListProps) => {
  if (!searchQuery || searchQuery.length < 2) {
    return null;
  }

  const hasMoreResults = searchResults.length > 2;

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Search Results {searchResults.length > 0 && `(${searchResults.length})`}
      </h3>
      
      <div className="relative">
        <ScrollArea className="h-32 border rounded-md bg-secondary/10">
          {isLoading ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2 p-2">
              {searchResults.map(player => (
                <SearchResultItem
                  key={player.id}
                  player={player}
                  onAddFriend={onAddFriend}
                  isLoading={isAdding}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No users found matching '{searchQuery}'
            </div>
          )}
        </ScrollArea>
        
        {/* Visual indicator that there are more results to scroll */}
        {hasMoreResults && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-1 pointer-events-none">
            <div className="bg-secondary/30 rounded-full p-1 shadow-sm animate-bounce">
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResultsList;
