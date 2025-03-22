
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
      
      if (checkError) throw new Error('Failed to check connection status');
      
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
      
      if (error) throw new Error('Failed to send friend request');
      
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

      if (error) throw new Error('Failed to accept friend request');

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

      if (error) throw new Error('Failed to decline friend request');

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
      if (!connectionId) {
        throw new Error('Invalid connection ID');
      }
      
      // Use the RPC function to ensure proper deletion
      const { error } = await supabase.rpc('force_delete_connection', {
        connection_id: connectionId
      });
      
      if (error) throw new Error('Failed to remove connection');
      
      return connectionId;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend removed successfully"
      });
      
      // Clear cache completely
      queryClient.removeQueries({ queryKey: ['friends'] });
      queryClient.removeQueries({ queryKey: ['game-friends'] });
      
      // Refresh data after a short delay
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['friends'] });
        if (onFriendRemoved) onFriendRemoved();
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Failed to remove connection: ${error.message}` 
          : 'Failed to remove friend',
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
