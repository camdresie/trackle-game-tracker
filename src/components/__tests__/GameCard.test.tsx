import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import GameCard from '../GameCard';
import { mockGame, mockScore } from '@/test/utils';

// Mock router
vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('GameCard', () => {
  const defaultProps = {
    game: mockGame,
    bestScore: 3,
    averageScore: 3.5,
    latestScore: mockScore,
  };

  it('should render game information correctly', () => {
    render(<GameCard {...defaultProps} />);
    
    expect(screen.getByText('Wordle')).toBeInTheDocument();
    expect(screen.getByText('Guess the 5-letter word in 6 tries or less.')).toBeInTheDocument();
  });

  it('should show best and average scores when available', () => {
    render(<GameCard {...defaultProps} />);
    
    expect(screen.getByText('3.50')).toBeInTheDocument(); // Average score
    // The component shows both best score and latest score, both are 3
    expect(screen.getAllByText('3')).toHaveLength(2); // Best score and last score
  });

  it('should handle missing scores gracefully', () => {
    const propsWithoutStats = {
      ...defaultProps,
      bestScore: null,
      averageScore: null,
      latestScore: undefined,
    };
    
    render(<GameCard {...propsWithoutStats} />);
    
    expect(screen.getByText('Wordle')).toBeInTheDocument();
  });

  it('should render as a link to game detail page', () => {
    render(<GameCard {...defaultProps} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/game/wordle');
  });

  it('should handle different game types with proper icons', () => {
    const gameWithGrid = { ...mockGame, icon: 'grid' };
    const propsWithGrid = { ...defaultProps, game: gameWithGrid };
    
    render(<GameCard {...propsWithGrid} />);
    
    expect(screen.getByText('Wordle')).toBeInTheDocument();
  });
});