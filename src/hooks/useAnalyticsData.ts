import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { getGameScores } from '@/services/gameStatsService';
import { getUserGameStats } from '@/services/gameStatsService';
import { useFriendsList } from './useFriendsList';
import { games } from '@/utils/gameData';
import { Score } from '@/utils/types';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export const useAnalyticsData = () => {
  const { user } = useAuth();
  const { friends } = useFriendsList();

  const { data: allScoresData, isLoading: scoresLoading } = useQuery({
    queryKey: ['analytics-all-scores', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const allScores: Score[] = [];
      for (const game of games) {
        // Fetch all scores without limit for true all-time analytics
        const scores = await getGameScores(game.id, user.id);
        allScores.push(...scores);
      }
      return allScores;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const { data: gameStats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-game-stats', user?.id],
    queryFn: () => getUserGameStats(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const activityData = useMemo(() => {
    if (!allScoresData) return [];
    
    const last365Days = eachDayOfInterval({
      start: subDays(new Date(), 365),
      end: new Date(),
    });

    return last365Days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const scoresOnDay = allScoresData.filter(s => s.date === dateStr);
      return {
        date: dateStr,
        count: scoresOnDay.length,
        scores: scoresOnDay,
      };
    });
  }, [allScoresData]);

  return {
    allScores: allScoresData || [],
    gameStats: gameStats || [],
    activityData,
    friends,
    isLoading: scoresLoading || statsLoading,
  };
};
