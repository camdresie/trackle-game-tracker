import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGameDetails } from '../useGameDetails';
import { mockUser } from '@/test/utils';

// Mock the auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: { id: mockUser.id, username: 'testuser' },
    isLoading: false,
  }),
}));

describe('useGameDetails', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should handle undefined gameId gracefully', () => {
    const { result } = renderHook(
      () => useGameDetails({ gameId: undefined }),
      { wrapper }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.game).toBeNull();
    expect(result.current.scores).toEqual([]);
    expect(result.current.bestScore).toBeNull();
    expect(result.current.averageScore).toBeNull();
  });

  it('should find and return game data for valid gameId', () => {
    const { result } = renderHook(
      () => useGameDetails({ gameId: 'wordle' }),
      { wrapper }
    );

    expect(result.current.game).toBeDefined();
    expect(result.current.game?.id).toBe('wordle');
    expect(result.current.game?.name).toBe('Wordle');
  });

  it('should return null for non-existent gameId', () => {
    const { result } = renderHook(
      () => useGameDetails({ gameId: 'non-existent-game' }),
      { wrapper }
    );

    expect(result.current.game).toBeNull();
  });
});