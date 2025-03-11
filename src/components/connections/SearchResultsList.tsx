
import { ScrollArea } from '@/components/ui/scroll-area';
import { UserPlus } from 'lucide-react';
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

  return (
    <div className="mb-4">
      <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
        <UserPlus className="h-4 w-4" />
        Search Results
      </h3>
      <ScrollArea className="h-32">
        {isLoading ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            Searching...
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
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
    </div>
  );
};

export default SearchResultsList;
