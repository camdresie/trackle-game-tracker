import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid initialization errors
let openaiClient: OpenAI | null = null;

// In-memory flag to prevent concurrent API calls (race condition protection)
let isGeneratingInsight = false;

const getOpenAIClient = () => {
  if (!openaiClient) {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your environment configuration.');
    }
    
    openaiClient = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true // Note: In production, this should be server-side
    });
  }
  return openaiClient;
};

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
  
  // Auto-check for abnormal usage on each request check
  const healthCheck = checkUsageHealth();
  if (healthCheck.isHighUsage) {
    console.warn('High usage detected during rate limit check');
  }
  
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

// Generate insights using OpenAI
export const generateInsights = async (analyticsData: any): Promise<string[]> => {
  // Prevent concurrent API calls (race condition protection)
  if (isGeneratingInsight) {
    throw new Error('Another insight generation is already in progress. Please wait...');
  }
  
  const rateCheck = canMakeRequest();
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason);
  }
  
  // Set flag to prevent concurrent calls
  isGeneratingInsight = true;
  console.log('🤖 Making OpenAI API call for daily insight generation...');
  
  try {
    const openai = getOpenAIClient();
    
    // Create comprehensive but streamlined data for OpenAI (all user data, minimal tokens)
    const optimizedData = {
      games: analyticsData.gameStats.map(g => {
        // Format scores based on game type
        const formatScore = (score: number, gameName: string) => {
          if (gameName === 'Mini Crossword') {
            const minutes = Math.floor(score / 60);
            const seconds = score % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
          // Round to 1 decimal place for averages, whole numbers for others
          return score % 1 === 0 ? score.toString() : score.toFixed(1);
        };

        // Determine unit type for context
        const getScoreUnit = (gameName: string) => {
          switch (gameName) {
            case 'Mini Crossword': return 'time';
            case 'Spelling Bee':
            case 'Tightrope':
            case 'Squardle':
            case 'Betweenle': return 'points';
            case 'Minute Cryptic': return 'hints';
            case 'Waffle': return 'swaps';
            default: return 'tries';
          }
        };

        return {
          name: g.gameName,
          plays: g.totalPlays,
          avg: formatScore(g.averageScore, g.gameName),
          best: formatScore(g.bestScore, g.gameName),
          recent: formatScore(g.recentAverage, g.gameName),
          trend: g.trend,
          improvement: g.improvementPercentage,
          streak: g.currentStreak,
          longestStreak: g.longestStreak,
          unit: getScoreUnit(g.gameName),
        };
      }),
      patterns: {
        bestDay: analyticsData.playingPatterns.bestDayOfWeek,
        worstDay: analyticsData.playingPatterns.worstDayOfWeek,
        bestTime: analyticsData.playingPatterns.bestTimeOfDay,
        avgDaily: analyticsData.playingPatterns.averageGamesPerDay,
        totalDays: analyticsData.playingPatterns.totalPlayingDays,
        currentStreak: analyticsData.playingPatterns.currentOverallStreak,
      },
      stats: {
        total: analyticsData.overallStats.totalGames,
        days: analyticsData.overallStats.totalDays,
        thisWeek: analyticsData.overallStats.gamesThisWeek,
        lastWeek: analyticsData.overallStats.gamesLastWeek,
        favorite: analyticsData.overallStats.favoriteGame,
        mostImproved: analyticsData.overallStats.mostImprovedGame,
      },
      flags: {
        improving: analyticsData.insights.hasRecentImprovement,
        streak: analyticsData.insights.hasActiveStreak,
        consistent: analyticsData.insights.hasConsistentPlaying,
        topDay: analyticsData.insights.topPerformanceDay,
      }
    };
    
    const dataString = JSON.stringify(optimizedData);
    console.log(`Sending ${dataString.length} characters to OpenAI (≈${Math.ceil(dataString.length / 4)} tokens)`);
    
    const prompt = `Analyze this user's comprehensive game performance data and generate 1 engaging, personalized daily insight. Be encouraging, specific with numbers, and mention actual game names. Use emojis and keep it to 1-2 sentences.

User Performance Data:
${dataString}

Data includes: per-game stats (plays, averages, bests, recent performance, trends, streaks), playing patterns (best/worst days, times, consistency), overall statistics (totals, weekly comparisons, favorites), and performance flags.

IMPORTANT: Game score formats:
- Mini Crossword: Times are in MM:SS format (e.g., "3:45" means 3 minutes 45 seconds)
- Other games: Numbers are tries/attempts (e.g., "4" means 4 tries)

Focus on the most interesting or encouraging aspect from:
- Recent improvements or trends with exact percentages
- Playing patterns with days/times and streak information  
- Cross-game comparisons or notable achievements
- Current streaks or consistency patterns

Return ONLY a single insight string, no JSON array, no markdown formatting, no backticks, no explanations. Example formats:
🎯 Your Wordle average improved 15% to 3.2 tries this month!
⏱️ Amazing Mini Crossword time of 2:34 - that's your fastest yet!`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an encouraging game performance analyst. Generate personalized, positive insights about puzzle game performance. Be specific with numbers and trends. Use emojis appropriately.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    // Only update usage tracker on successful completion using actual OpenAI usage data
    const actualInputTokens = completion.usage?.prompt_tokens || 0;
    const actualOutputTokens = completion.usage?.completion_tokens || 0;
    const estimatedCost = (actualInputTokens * 0.00000015) + (actualOutputTokens * 0.0000006); // GPT-4o-mini pricing
    
    console.log(`OpenAI usage - Input: ${actualInputTokens} tokens, Output: ${actualOutputTokens} tokens, Cost: $${estimatedCost.toFixed(4)}`);
    
    updateUsageTracker(estimatedCost);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Clean up the response to handle markdown formatting
    let cleanResponse = response.trim();
    
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith('```json')) {
      cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanResponse.startsWith('```')) {
      cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    // Return single insight (no JSON parsing needed)
    return [cleanResponse];
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  } finally {
    // Always clear the flag when function completes
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
  console.log('OpenAI usage tracker reset');
};

// Debug function to check current usage
export const debugUsage = () => {
  const tracker = getUsageTracker();
  console.log('Current usage:', tracker);
  console.log(`Estimated tokens this month: ~${Math.round(tracker.estimatedCost / 0.0000006)} tokens`);
  return tracker;
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

// Check if usage seems abnormally high
export const checkUsageHealth = () => {
  const tracker = getUsageTracker();
  const estimatedTokens = Math.round(tracker.estimatedCost / 0.0000006);
  
  if (estimatedTokens > 100000) {
    console.warn(`⚠️ HIGH TOKEN USAGE DETECTED: ~${estimatedTokens.toLocaleString()} tokens ($${tracker.estimatedCost.toFixed(2)})`);
    console.warn('This seems abnormally high for normal usage. Consider resetting with resetUsage() if this is incorrect.');
  }
  
  return {
    tokens: estimatedTokens,
    cost: tracker.estimatedCost,
    requests: tracker.requestsThisMonth,
    isHighUsage: estimatedTokens > 100000
  };
};