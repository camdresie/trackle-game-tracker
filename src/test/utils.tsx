import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data helpers
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

export const mockProfile = {
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: null,
  selected_games: ['wordle', 'connections'],
};

export const mockScore = {
  id: 'score-1',
  gameId: 'wordle',
  playerId: 'test-user-id',
  value: 3,
  date: '2024-01-01',
  notes: '',
  createdAt: '2024-01-01T10:00:00Z',
};

export const mockGame = {
  id: 'wordle',
  name: 'Wordle',
  description: 'Guess the 5-letter word in 6 tries or less.',
  icon: 'puzzle',
  color: 'bg-emerald-500',
  maxScore: 7,
  externalUrl: 'https://www.nytimes.com/games/wordle/',
};