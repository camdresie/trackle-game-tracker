
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Hook for fetching user profiles data
 */
export const useProfilesData = (userId: string | undefined) => {
  const { data: profilesData } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');
            
        if (error) throw error;
        
        console.log('Profiles retrieved:', data?.length || 0);
        return data || [];
      } catch (error) {
        console.error('Error fetching profiles:', error);
        toast.error('Failed to load user profiles');
        return [];
      }
    },
    enabled: !!userId
  });

  return { profilesData };
};
