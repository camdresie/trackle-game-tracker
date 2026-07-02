import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConnectionMutations } from '../useConnectionMutations';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn()
  }
}));

vi.mock('@/components/ui/use-toast', () => ({
  toast: vi.fn()
}));

describe('useConnectionMutations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false }
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('addFriend mutation', () => {
    it('should successfully send friend request when no existing connection', async () => {
      // Mock check for existing connection - returns empty array
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      // Mock insert new connection
      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect } as any;
        } else {
          return { insert: mockInsert } as any;
        }
      });

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.addFriend('friend-1');

      await waitFor(() => {
        expect(result.current.isAddingFriend).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('connections');
      expect(mockSelect).toHaveBeenCalledWith('id, status');
      expect(mockOr).toHaveBeenCalledWith(
        'and(user_id.eq.user-1,friend_id.eq.friend-1),and(user_id.eq.friend-1,friend_id.eq.user-1)'
      );
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-1',
        friend_id: 'friend-1',
        status: 'pending'
      });
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Friend request sent"
      });
    });

    it('should throw error when connection already exists', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: [{ id: 'conn-1', status: 'pending' }],
        error: null
      });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.addFriend('friend-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Connection already exists with this user',
          variant: "destructive"
        });
      });
    });

    it('should handle check connection error', async () => {
      const mockLimit = vi.fn().mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      vi.mocked(supabase.from).mockReturnValue({ select: mockSelect } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.addFriend('friend-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Failed to check connection status',
          variant: "destructive"
        });
      });
    });

    it('should handle insert connection error', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      const mockInsert = vi.fn().mockResolvedValue({ error: new Error('Insert failed') });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect } as any;
        } else {
          return { insert: mockInsert } as any;
        }
      });

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.addFriend('friend-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Failed to send friend request',
          variant: "destructive"
        });
      });
    });

    it('should have isAddingFriend initially false', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current.isAddingFriend).toBe(false);
    });

    it('should invalidate notification-counts on success', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockSelect = vi.fn().mockReturnValue({ or: mockOr });

      const mockInsert = vi.fn().mockResolvedValue({ error: null });

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { select: mockSelect } as any;
        } else {
          return { insert: mockInsert } as any;
        }
      });

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.addFriend('friend-1');

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notification-counts'] });
      });
    });
  });

  describe('acceptRequest mutation', () => {
    it('should successfully accept friend request', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.acceptRequest('conn-1');

      await waitFor(() => {
        expect(result.current.isAcceptingRequest).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('connections');
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'accepted' });
      expect(mockEq).toHaveBeenCalledWith('id', 'conn-1');
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Friend request accepted"
      });
    });

    it('should handle accept request error', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: new Error('Update failed') });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.acceptRequest('conn-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Failed to accept friend request',
          variant: "destructive"
        });
      });
    });

    it('should invalidate correct queries on success', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ update: mockUpdate } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.acceptRequest('conn-1');

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['friends', 'user-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pending-requests', 'user-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notification-counts'] });
      });
    });

    it('should have isAcceptingRequest initially false', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current.isAcceptingRequest).toBe(false);
    });
  });

  describe('declineRequest mutation', () => {
    it('should successfully decline friend request', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.declineRequest('conn-1');

      await waitFor(() => {
        expect(result.current.isDecliningRequest).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('connections');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', 'conn-1');
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Friend request declined"
      });
    });

    it('should handle decline request error', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: new Error('Delete failed') });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.declineRequest('conn-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Failed to decline friend request',
          variant: "destructive"
        });
      });
    });

    it('should invalidate correct queries on success', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.declineRequest('conn-1');

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['pending-requests', 'user-1'] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['notification-counts'] });
      });
    });

    it('should have isDecliningRequest initially false', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current.isDecliningRequest).toBe(false);
    });
  });

  describe('removeFriend mutation', () => {
    it('should successfully remove friend by deleting the connection row', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.removeFriend('conn-1');

      await waitFor(() => {
        expect(result.current.isRemovingFriend).toBe(false);
      });

      expect(supabase.from).toHaveBeenCalledWith('connections');
      expect(mockEq).toHaveBeenCalledWith('id', 'conn-1');
      expect(toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Friend removed successfully"
      });
    });

    it('should throw error when connectionId is empty', async () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.removeFriend('');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Error",
            variant: "destructive"
          })
        );
      });
    });

    it('should handle delete error', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: new Error('delete failed') });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.removeFriend('conn-1');

      await waitFor(() => {
        expect(toast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Failed to remove connection: Failed to remove connection',
          variant: "destructive"
        });
      });
    });

    it('should remove and invalidate correct queries on success', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const removeSpy = vi.spyOn(queryClient, 'removeQueries');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      result.current.removeFriend('conn-1');

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['friends'] });
        expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['game-friends'] });
      });

      // Wait for the delayed invalidation (500ms)
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['friends'] });
      }, { timeout: 1000 });
    });

    it('should call onFriendRemoved callback on success', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      vi.mocked(supabase.from).mockReturnValue({ delete: mockDelete } as any);

      const onFriendRemoved = vi.fn();
      const { result } = renderHook(() => useConnectionMutations('user-1', onFriendRemoved), { wrapper });

      result.current.removeFriend('conn-1');

      await waitFor(() => {
        expect(onFriendRemoved).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should have isRemovingFriend initially false', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current.isRemovingFriend).toBe(false);
    });
  });

  describe('Hook initialization', () => {
    it('should return all mutation functions and loading states', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current).toHaveProperty('addFriend');
      expect(result.current).toHaveProperty('isAddingFriend');
      expect(result.current).toHaveProperty('acceptRequest');
      expect(result.current).toHaveProperty('isAcceptingRequest');
      expect(result.current).toHaveProperty('declineRequest');
      expect(result.current).toHaveProperty('isDecliningRequest');
      expect(result.current).toHaveProperty('removeFriend');
      expect(result.current).toHaveProperty('isRemovingFriend');

      expect(typeof result.current.addFriend).toBe('function');
      expect(typeof result.current.acceptRequest).toBe('function');
      expect(typeof result.current.declineRequest).toBe('function');
      expect(typeof result.current.removeFriend).toBe('function');

      expect(result.current.isAddingFriend).toBe(false);
      expect(result.current.isAcceptingRequest).toBe(false);
      expect(result.current.isDecliningRequest).toBe(false);
      expect(result.current.isRemovingFriend).toBe(false);
    });

    it('should work with optional onFriendRemoved callback', () => {
      const { result } = renderHook(() => useConnectionMutations('user-1'), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.removeFriend).toBeDefined();
    });
  });
});
