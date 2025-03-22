
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

/**
 * Hook that provides mutations for managing connections (friends)
 */
export const useConnectionMutations = (currentPlayerId: string, onFriendRemoved?: () => void) => {
  const queryClient = useQueryClient();

  // Add friend mutation
  const addFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      // Check if connection already exists
      const { data: existingConn, error: checkError } = await supabase
        .from('connections')
        .select('id, status')
        .or(`and(user_id.eq.${currentPlayerId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentPlayerId})`)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking existing connection:', checkError);
        throw new Error('Failed to check connection status');
      }
      
      if (existingConn && existingConn.length > 0) {
        throw new Error('Connection already exists with this user');
      }
      
      // Add new connection
      const { error } = await supabase
        .from('connections')
        .insert({
          user_id: currentPlayerId,
          friend_id: friendId,
          status: 'pending'
        });
      
      if (error) {
        console.error('Error adding friend:', error);
        throw new Error('Failed to send friend request');
      }
      
      return friendId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send friend request',
        variant: "destructive"
      });
    }
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'accepted' })
        .eq('id', connectionId);

      if (error) {
        console.error('Error accepting friend request:', error);
        throw new Error('Failed to accept friend request');
      }

      return connectionId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request accepted"
      });
      queryClient.invalidateQueries({ queryKey: ['friends', currentPlayerId] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to accept friend request',
        variant: "destructive"
      });
    }
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        console.error('Error declining friend request:', error);
        throw new Error('Failed to decline friend request');
      }

      return connectionId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request declined"
      });
      queryClient.invalidateQueries({ queryKey: ['pending-requests', currentPlayerId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to decline friend request',
        variant: "destructive"
      });
    }
  });

  // Remove friend mutation
  const removeFriendMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      console.log('Starting enhanced connection removal process for ID:', connectionId);
      
      if (!connectionId) {
        console.error('Invalid connection ID provided');
        throw new Error('Invalid connection ID');
      }
      
      try {
        // First, fetch the connection to confirm it exists
        const { data: connectionCheck, error: checkError } = await supabase
          .from('connections')
          .select('id, user_id, friend_id')
          .eq('id', connectionId)
          .single();
        
        if (checkError) {
          console.error('Error checking connection before delete:', checkError);
          throw new Error('Connection not found or could not be verified');
        }
        
        console.log('Connection verified before deletion:', connectionCheck);
        
        // Perform DELETE with direct SQL for more reliable deletion
        const { error: deleteError } = await supabase.rpc('force_delete_connection', {
          connection_id: connectionId
        });
        
        if (deleteError) {
          console.error('Error during connection deletion:', deleteError);
          throw new Error('Database error during connection removal');
        }
        
        // Verify the connection was actually deleted
        const { data: verifyDeletion, error: verifyError } = await supabase
          .from('connections')
          .select('id')
          .eq('id', connectionId);
        
        if (verifyError) {
          console.error('Error verifying deletion:', verifyError);
          throw new Error('Could not verify connection deletion');
        }
        
        if (verifyDeletion && verifyDeletion.length > 0) {
          console.error('Connection still exists after deletion attempt');
          throw new Error('Connection could not be removed');
        }
        
        console.log('Connection successfully deleted:', connectionId);
        return connectionId;
      } catch (error) {
        console.error('Error in removeFriendMutation:', error);
        throw error;
      }
    },
    onSuccess: (connectionId) => {
      console.log('Friend removal confirmed successful for connection ID:', connectionId);
      
      // Show success toast
      toast({
        title: "Success",
        description: "Friend removed successfully"
      });
      
      // Completely remove from cache
      queryClient.removeQueries({ queryKey: ['friends'] });
      queryClient.removeQueries({ queryKey: ['game-friends'] });
      
      // Force fresh data fetch with delay to allow DB changes to propagate
      setTimeout(() => {
        console.log('Triggering complete data refresh after connection removal');
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        
        // Call external callback
        if (onFriendRemoved) {
          onFriendRemoved();
        }
      }, 1000);
    },
    onError: (error) => {
      console.error('Error during friend removal:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Failed to remove connection: ${error.message}` 
          : 'Failed to remove friend due to an unknown error',
        variant: "destructive"
      });
    }
  });

  return {
    addFriend: addFriendMutation.mutate,
    isAddingFriend: addFriendMutation.isPending,
    
    acceptRequest: acceptRequestMutation.mutate,
    isAcceptingRequest: acceptRequestMutation.isPending,
    
    declineRequest: declineRequestMutation.mutate,
    isDecliningRequest: declineRequestMutation.isPending,
    
    removeFriend: removeFriendMutation.mutate,
    isRemovingFriend: removeFriendMutation.isPending
  };
};
