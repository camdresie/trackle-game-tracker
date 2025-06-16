import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, BarChart3, Calendar, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { toast } from 'sonner';
import { useState } from 'react';

export const InsightsCard = () => {
  const {
    insights,
    analyticsData,
    isLoading,
    isGenerating,
    hasEnoughData,
    totalScores,
    areInsightsStale,
  } = useInsights();
  
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  // Get last 7 days of insights, most recent first
  const recentInsights = insights.slice(0, 7);
  const currentInsight = recentInsights[currentInsightIndex];
  
  const canGoBack = currentInsightIndex < recentInsights.length - 1;
  const canGoForward = currentInsightIndex > 0;
  
  const goToPrevious = () => {
    if (canGoBack) setCurrentInsightIndex(prev => prev + 1);
  };
  
  const goToNext = () => {
    if (canGoForward) setCurrentInsightIndex(prev => prev - 1);
  };

  // Early return if there's an authentication issue or no data to show
  if (!isLoading && !hasEnoughData && insights.length === 0 && totalScores === 0) {
    return null; // Don't show the card if user isn't authenticated or has no data
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Daily Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }


  // Display when user doesn't have enough data
  if (!hasEnoughData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Daily Insight
          </CardTitle>
          <CardDescription>
            Get personalized insights about your game performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-4">
            <div className="text-2xl">🎯</div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                You need at least 5 game scores to get daily insights
              </p>
              <Badge variant="secondary">
                {totalScores} / 5 scores
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Keep playing games and logging your scores!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Daily Insight
        </CardTitle>
        <CardDescription>
          Personalized analysis of your game performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Insight Display */}
        {recentInsights.length > 0 ? (
          <div className="space-y-4">
            {/* Navigation and Date */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToPrevious}
                disabled={!canGoBack}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {new Date(currentInsight.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </p>
                {recentInsights.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {currentInsightIndex + 1} of {recentInsights.length}
                  </p>
                )}
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNext}
                disabled={!canGoForward}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Insight */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 text-center">
                {currentInsight.content}
              </p>
            </div>

            {/* Auto-generation status */}
            {isGenerating && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating today's insight...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">🎯</div>
            <div>
              <p className="text-sm font-medium mb-1">No insights yet</p>
              <p className="text-xs text-muted-foreground">
                {isGenerating ? "Generating your first daily insight..." : "Your first daily insight will appear here"}
              </p>
            </div>
            {isGenerating && (
              <Loader2 className="h-4 w-4 animate-spin mx-auto" />
            )}
          </div>
        )}

        {/* Enhanced Stats Preview */}
        {analyticsData && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Total Games</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.totalGames}</p>
              </div>
              <div>
                <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Days Active</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.totalDays}</p>
              </div>
              <div>
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Games This Week</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.gamesThisWeek}</p>
              </div>
              <div>
                <Sparkles className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Trackle Streak</p>
                <p className="text-sm font-semibold">{analyticsData.playingPatterns.currentOverallStreak}</p>
              </div>
            </div>
            
            {/* Additional metrics row */}
            <div className="grid grid-cols-2 gap-4 text-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-xs text-muted-foreground">Most-Played Game</p>
                <p className="text-sm font-medium">{analyticsData.overallStats.favoriteGame || 'None yet'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Day</p>
                <p className="text-sm font-medium">{analyticsData.playingPatterns.bestDayOfWeek}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};