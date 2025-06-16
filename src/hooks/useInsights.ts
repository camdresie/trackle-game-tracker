import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { generateInsights, canMakeRequest, getUsageStats } from '@/services/openaiService';
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
  const { data: userScores = [], isLoading: scoresLoading } = useQuery({
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
  });

  // Fetch cached insights from localStorage for now (TODO: Add database table)
  const { data: cachedInsights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['user-insights', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      // Temporarily use localStorage until we create the database table
      const stored = localStorage.getItem(`insights_${user.id}`);
      if (!stored) return [];
      
      try {
        const insights = JSON.parse(stored);
        return Array.isArray(insights) ? insights : [];
      } catch {
        return [];
      }
    },
    enabled: !!user?.id,
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

      // Save insights to localStorage for now (TODO: Save to database)
      const savedInsights = insights.map((insight, index) => ({
        id: `insight_${Date.now()}_${index}`,
        content: insight,
        created_at: new Date().toISOString(),
        analytics_data: analyticsData,
      }));

      // Get existing insights and prepend new ones
      const existing = JSON.parse(localStorage.getItem(`insights_${user.id}`) || '[]');
      const allInsights = [...savedInsights, ...existing].slice(0, 20); // Keep max 20 insights
      localStorage.setItem(`insights_${user.id}`, JSON.stringify(allInsights));

      return savedInsights;
    },
    onSuccess: (newInsights) => {
      // Invalidate and refetch insights
      queryClient.invalidateQueries({ queryKey: ['user-insights', user?.id] });
      toast.success(`Generated ${newInsights.length} new insights!`);
    },
    onError: (error) => {
      console.error('Error generating insights:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate insights');
    },
  });

  // Generate insights with loading state
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
  };
};