import { supabase } from '@/integrations/supabase/client';

// Insight generation now happens in the `generate-insights` Supabase edge
// function, which holds the OpenAI API key and enforces the real per-user
// daily rate limit server-side. The localStorage tracker kept here is only a
// client-side convenience so the UI can avoid pointless round-trips.

// In-memory flag to prevent concurrent API calls (race condition protection)
let isGeneratingInsight = false;

// Cost tracking interface
interface UsageTracker {
  requestsThisMonth: number;
  lastResetDate: string;
  estimatedCost: number;
  lastRequestDate?: string; // Track last API call date for daily limiting
}

// Rate limiting constants - STRICT daily limits
const MAX_REQUESTS_PER_DAY = 1; // Maximum 1 insight per user per day
const MAX_MONTHLY_COST = 10; // $10 limit

// Get usage tracker from localStorage
const getUsageTracker = (): UsageTracker => {
  const stored = localStorage.getItem('openai_usage_tracker');
  if (!stored) {
    return {
      requestsThisMonth: 0,
      lastResetDate: new Date().toISOString(),
      estimatedCost: 0,
      lastRequestDate: undefined
    };
  }

  const tracker = JSON.parse(stored);

  // Reset monthly counter if it's a new month
  const lastReset = new Date(tracker.lastResetDate);
  const now = new Date();
  if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    return {
      requestsThisMonth: 0,
      lastResetDate: now.toISOString(),
      estimatedCost: 0,
      lastRequestDate: tracker.lastRequestDate
    };
  }

  return tracker;
};

// Update usage tracker
const updateUsageTracker = (cost: number) => {
  const tracker = getUsageTracker();
  tracker.requestsThisMonth += 1;
  tracker.estimatedCost += cost;
  tracker.lastRequestDate = new Date().toISOString();
  localStorage.setItem('openai_usage_tracker', JSON.stringify(tracker));
};

// Check if user can make more requests
export const canMakeRequest = (): { allowed: boolean; reason?: string } => {
  const tracker = getUsageTracker();

  if (tracker.estimatedCost >= MAX_MONTHLY_COST) {
    return {
      allowed: false,
      reason: `Monthly spending limit of $${MAX_MONTHLY_COST} reached. Limit resets next month.`
    };
  }

  // Check daily rate limit - STRICT: max 1 request per day
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format

  if (tracker.lastRequestDate) {
    const lastRequestDay = tracker.lastRequestDate.split('T')[0];
    if (lastRequestDay === today) {
      return {
        allowed: false,
        reason: `Daily insight already generated today. New insights available tomorrow!`
      };
    }
  }

  return { allowed: true };
};

// Generate insights via the generate-insights edge function
export const generateInsights = async (analyticsData: any): Promise<string[]> => {
  // Prevent concurrent API calls (race condition protection)
  if (isGeneratingInsight) {
    throw new Error('Another insight generation is already in progress. Please wait...');
  }

  const rateCheck = canMakeRequest();
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason);
  }

  isGeneratingInsight = true;

  try {
    const { data, error } = await supabase.functions.invoke('generate-insights', {
      body: { analyticsData }
    });

    if (error) {
      // Surface the server's message (e.g. the daily limit) when available.
      let message = 'Failed to generate insight. Please try again later.';
      try {
        const body = await (error as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch {
        // keep default message
      }
      throw new Error(message);
    }

    const insights: string[] = data?.insights || [];
    if (insights.length === 0) {
      throw new Error('No insight returned. Please try again later.');
    }

    // Track locally for UI-level rate limiting; cost is estimated from the
    // usage the edge function reports (GPT-4o-mini pricing).
    const inputTokens = data?.usage?.prompt_tokens || 0;
    const outputTokens = data?.usage?.completion_tokens || 0;
    const estimatedCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);
    updateUsageTracker(estimatedCost);

    return insights;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  } finally {
    isGeneratingInsight = false;
  }
};

// Get current usage statistics
export const getUsageStats = (): UsageTracker => {
  return getUsageTracker();
};

// Reset usage (for testing purposes)
export const resetUsage = () => {
  localStorage.removeItem('openai_usage_tracker');
};

// Check if we've already made an API call today
export const hasCalledOpenAIToday = (): boolean => {
  const tracker = getUsageTracker();
  if (!tracker.lastRequestDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const lastRequestDay = tracker.lastRequestDate.split('T')[0];

  return lastRequestDay === today;
};

// Check if insight generation is currently in progress
export const isInsightGenerationInProgress = (): boolean => {
  return isGeneratingInsight;
};
