import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateInsights, canMakeRequest, getUsageStats, hasCalledOpenAIToday } from '@/services/openaiService';
import { generateAnalyticsData, type AnalyticsData } from '@/services/analyticsEngine';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Interface for cached insights
interface CachedInsight {
  id: string;
  content: string;
  created_at: string;
  analytics_data: AnalyticsData;
}

// Hook for managing AI-powered insights
export const useInsights = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's scores for analytics
  const { data: userScores = [], isLoading: scoresLoading, error: scoresError } = useQuery({
    queryKey: ['user-scores', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    retry: 2,
  });

  // Fetch cached insights from database
  const { data: cachedInsights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['user-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('user_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching insights:', error);
        return [];
      }
      
      return data?.map(insight => ({
        id: insight.id,
        content: insight.content,
        created_at: insight.created_at,
        analytics_data: insight.analytics_data as AnalyticsData,
      })) || [];
    },
    enabled: !!user?.id,
    retry: 2,
  });

  // Generate new insights mutation
  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || userScores.length === 0) {
        throw new Error('No user data available');
      }

      // Check rate limits
      const rateCheck = canMakeRequest();
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.reason);
      }

      // Generate analytics data
      const analyticsData = generateAnalyticsData(userScores);
      
      // Don't generate insights if user has very little data
      if (analyticsData.overallStats.totalGames < 5) {
        throw new Error('You need at least 5 game scores to generate insights. Keep playing!');
      }

      // Generate insights using OpenAI
      const insights = await generateInsights(analyticsData);

      // Save insights to database
      const insertPromises = insights.map(async (insight) => {
        const { data, error } = await supabase
          .from('user_insights')
          .insert({
            user_id: user.id,
            content: insight,
            analytics_data: analyticsData,
          })
          .select()
          .single();

        if (error) throw error;
        return {
          id: data.id,
          content: data.content,
          created_at: data.created_at,
          analytics_data: analyticsData,
        };
      });

      const savedInsights = await Promise.all(insertPromises);
      return savedInsights;
    },
    onSuccess: (newInsights) => {
      // Invalidate and refetch insights
      queryClient.invalidateQueries({ queryKey: ['user-insights', user?.id] });
      toast.success(`Generated ${newInsights.length} new insights!`);
      setIsGenerating(false); // Reset loading state on success
    },
    onError: (error) => {
      console.error('Error generating insights:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate insights');
      setIsGenerating(false); // Reset loading state on error
    },
    onSettled: () => {
      // Always reset loading state when mutation completes
      setIsGenerating(false);
    },
  });

  // Check if we need a new daily insight (no insight generated today)
  const needsDailyInsight = useCallback(() => {
    if (cachedInsights.length === 0) return true;
    
    const latestInsight = cachedInsights[0];
    const insightDate = new Date(latestInsight.created_at);
    const today = new Date();
    
    // Check if latest insight was created today (same calendar day)
    const isFromToday = 
      insightDate.getFullYear() === today.getFullYear() &&
      insightDate.getMonth() === today.getMonth() &&
      insightDate.getDate() === today.getDate();
    
    return !isFromToday; // Need new insight if latest wasn't from today
  }, [cachedInsights]);

  // Auto-generate insights when needed (with strict daily API call limiting)
  const shouldAutoGenerate = useCallback(() => {
    return userScores.length >= 5 && 
           needsDailyInsight() && 
           canMakeRequest().allowed && 
           !hasCalledOpenAIToday() &&
           !isGenerating && // Prevent multiple calls while one is in progress
           !generateInsightsMutation.isPending; // Prevent multiple calls during mutation
  }, [userScores.length, needsDailyInsight, isGenerating, generateInsightsMutation.isPending]);

  // Don't run effects if no user
  const shouldSkipEffects = !user;

  // Auto-generate daily insights effect (run only once when conditions are met)
  useEffect(() => {
    if (shouldSkipEffects) return;
    if (!scoresLoading && !insightsLoading && !isGenerating && shouldAutoGenerate()) {
      console.log('Auto-generating daily insight...');
      setIsGenerating(true); // Set loading state immediately to prevent duplicate calls
      generateInsightsMutation.mutate();
    }
  }, [shouldSkipEffects, scoresLoading, insightsLoading, isGenerating, shouldAutoGenerate]);

  // Generate insights with loading state (manual trigger)
  const generateNewInsights = useCallback(async () => {
    setIsGenerating(true);
    try {
      await generateInsightsMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  }, [generateInsightsMutation]);

  // Check if user can generate more insights
  const checkCanGenerate = useCallback(() => {
    if (userScores.length < 5) {
      return {
        canGenerate: false,
        reason: 'You need at least 5 game scores to generate insights. Keep playing!',
      };
    }

    const rateCheck = canMakeRequest();
    return {
      canGenerate: rateCheck.allowed,
      reason: rateCheck.reason,
    };
  }, [userScores.length]);

  // Get analytics data for current user
  const getAnalyticsData = useCallback(() => {
    if (userScores.length === 0) return null;
    return generateAnalyticsData(userScores);
  }, [userScores]);

  // Get usage statistics
  const usageStats = getUsageStats();

  // Early return for unauthenticated users (after all hooks are called)
  if (!user) {
    return {
      insights: [],
      analyticsData: null,
      usageStats: { requestsThisMonth: 0, lastResetDate: new Date().toISOString(), estimatedCost: 0 },
      isLoading: false,
      isGenerating: false,
      generateInsights: () => Promise.resolve(),
      checkCanGenerate: () => ({ canGenerate: false, reason: 'Please log in first' }),
      hasEnoughData: false,
      totalScores: 0,
      areInsightsStale: false,
      shouldAutoGenerate: false,
    };
  }

  return {
    // Data
    insights: cachedInsights,
    analyticsData: getAnalyticsData(),
    usageStats,
    
    // Loading states
    isLoading: scoresLoading || insightsLoading,
    isGenerating: isGenerating || generateInsightsMutation.isPending,
    
    // Actions
    generateInsights: generateNewInsights,
    checkCanGenerate,
    
    // Utility
    hasEnoughData: userScores.length >= 5,
    totalScores: userScores.length,
    areInsightsStale: needsDailyInsight(),
    shouldAutoGenerate: shouldAutoGenerate(),
  };
};