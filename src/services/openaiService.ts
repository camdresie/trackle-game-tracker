import OpenAI from 'openai';

// Lazy-load OpenAI client to avoid initialization errors
let openaiClient: OpenAI | null = null;

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
}

// Rate limiting constants
const MAX_REQUESTS_PER_WEEK = 10; // Increased from 5 to 10 for testing
const MAX_MONTHLY_COST = 10; // $10 limit

// Get usage tracker from localStorage
const getUsageTracker = (): UsageTracker => {
  const stored = localStorage.getItem('openai_usage_tracker');
  if (!stored) {
    return {
      requestsThisMonth: 0,
      lastResetDate: new Date().toISOString(),
      estimatedCost: 0
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
      estimatedCost: 0
    };
  }
  
  return tracker;
};

// Update usage tracker
const updateUsageTracker = (cost: number) => {
  const tracker = getUsageTracker();
  tracker.requestsThisMonth += 1;
  tracker.estimatedCost += cost;
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
  
  // Check weekly rate limit (using actual days instead of approximation)
  const now = new Date();
  const daysInMonth = now.getDate();
  const approximateWeeksElapsed = Math.max(1, Math.floor(daysInMonth / 7));
  const weeklyAllowance = MAX_REQUESTS_PER_WEEK * approximateWeeksElapsed;
  
  if (tracker.requestsThisMonth >= weeklyAllowance) {
    return { 
      allowed: false, 
      reason: `Weekly insight limit reached (${tracker.requestsThisMonth}/${weeklyAllowance} used). Try again later!` 
    };
  }
  
  return { allowed: true };
};

// Generate insights using OpenAI
export const generateInsights = async (analyticsData: any): Promise<string[]> => {
  const rateCheck = canMakeRequest();
  if (!rateCheck.allowed) {
    throw new Error(rateCheck.reason);
  }
  
  try {
    const openai = getOpenAIClient();
    
    // Create optimized data for OpenAI (remove unnecessary details)
    const optimizedData = {
      gameStats: analyticsData.gameStats.map(game => ({
        name: game.gameName,
        totalPlays: game.totalPlays,
        averageScore: game.averageScore,
        bestScore: game.bestScore,
        trend: game.trend,
        improvementPercentage: game.improvementPercentage,
        currentStreak: game.currentStreak,
      })),
      patterns: {
        bestDay: analyticsData.playingPatterns.bestDayOfWeek,
        bestTime: analyticsData.playingPatterns.bestTimeOfDay,
        avgGamesPerDay: analyticsData.playingPatterns.averageGamesPerDay,
        currentStreak: analyticsData.playingPatterns.currentOverallStreak,
      },
      overall: {
        totalGames: analyticsData.overallStats.totalGames,
        gamesThisWeek: analyticsData.overallStats.gamesThisWeek,
        favoriteGame: analyticsData.overallStats.favoriteGame,
        mostImprovedGame: analyticsData.overallStats.mostImprovedGame,
      }
    };
    
    const dataString = JSON.stringify(optimizedData);
    console.log(`Sending ${dataString.length} characters to OpenAI (≈${Math.ceil(dataString.length / 4)} tokens)`);
    
    const prompt = `Analyze this user's game performance data and generate 3 engaging, personalized insights. Be encouraging and specific with numbers. Use emojis and keep each insight to 1-2 sentences.

Game Performance Data:
${dataString}

Generate insights about:
1. Recent performance trends or improvements
2. Playing patterns (time of day, day of week, streaks)
3. Game-specific strengths or interesting statistics

Return ONLY a valid JSON array of 3 strings, no markdown formatting, no backticks, no explanations. Example format:
["🎯 Your Wordle scores improved 15% this month!", "⏰ You perform best on Tuesday mornings!", "🔥 Amazing 7-day playing streak!"]`;

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

    // Only update usage tracker on successful completion
    const inputTokens = prompt.length / 4; // Rough token estimation
    const outputTokens = completion.usage?.completion_tokens || 100;
    const estimatedCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006); // GPT-4o-mini pricing
    
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
    
    // Parse JSON response
    try {
      const insights = JSON.parse(cleanResponse);
      return Array.isArray(insights) ? insights : [cleanResponse];
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response content:', response);
      // Fallback: treat the response as a single insight
      return [response];
    }
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
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
  return tracker;
};