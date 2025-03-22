
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { Player } from '@/utils/types';

/**
 * Hook to search for users to add as connections
 */
export const useConnectionSearch = (searchQuery: string, currentPlayerId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['search-users', searchQuery, currentPlayerId],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', currentPlayerId)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        toast({
          title: "Error",
          description: "Failed to search users",
          variant: "destructive"
        });
        return [];
      }
      
      return data.map(profile => ({
        id: profile.id,
        name: profile.username || profile.full_name || 'Unknown User',
        avatar: profile.avatar_url
      })) as Player[];
    },
    enabled: enabled && !!searchQuery && searchQuery.length >= 2 && !!currentPlayerId
  });
};
