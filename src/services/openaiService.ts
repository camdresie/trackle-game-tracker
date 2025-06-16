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
    
    const prompt = `Analyze this user's game performance data and generate 3 engaging, personalized insights. Be encouraging and specific with numbers. Use emojis and keep each insight to 1-2 sentences.

Game Performance Data:
${JSON.stringify(analyticsData, null, 2)}

Generate insights about:
1. Recent performance trends or improvements
2. Playing patterns (time of day, day of week, streaks)
3. Game-specific strengths or interesting statistics

Format as a JSON array of strings.`;

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

    // Estimate cost (rough calculation)
    const inputTokens = prompt.length / 4; // Rough token estimation
    const outputTokens = completion.usage?.completion_tokens || 100;
    const estimatedCost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006); // GPT-4o-mini pricing
    
    updateUsageTracker(estimatedCost);

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const insights = JSON.parse(response);
    return Array.isArray(insights) ? insights : [response];
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