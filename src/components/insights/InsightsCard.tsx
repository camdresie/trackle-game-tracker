import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { useInsights } from '@/hooks/useInsights';
import { toast } from 'sonner';

export const InsightsCard = () => {
  const {
    insights,
    analyticsData,
    isLoading,
    isGenerating,
    generateInsights,
    checkCanGenerate,
    hasEnoughData,
    totalScores,
    usageStats,
    areInsightsStale,
    shouldAutoGenerate,
  } = useInsights();

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
            AI Insights
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

  const { canGenerate, reason } = checkCanGenerate();

  const handleGenerateInsights = async () => {
    if (!canGenerate) {
      toast.error(reason);
      return;
    }
    
    await generateInsights();
  };

  // Display when user doesn't have enough data
  if (!hasEnoughData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Insights
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
                You need at least 5 game scores to generate AI insights
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Personalized analysis of your game performance
          </CardDescription>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={!canGenerate || isGenerating}
          size="sm"
          className="shrink-0"
          variant={areInsightsStale ? "default" : "outline"}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {shouldAutoGenerate ? 'Auto-generating...' : 'Analyzing...'}
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 mr-2" />
              {areInsightsStale ? 'Refresh Insights' : 'New Insights'}
            </>
          )}
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Staleness indicator only */}
        {areInsightsStale && insights.length > 0 && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="text-xs">
              Insights are 24h+ old
            </Badge>
          </div>
        )}

        {/* Recent Insights */}
        {insights.length > 0 ? (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <div
                key={insight.id}
                className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {insight.content}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(insight.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            
            {insights.length > 3 && (
              <div className="text-center">
                <Badge variant="outline" className="text-xs">
                  +{insights.length - 3} more insights
                </Badge>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="text-4xl">🎯</div>
            <div>
              <p className="text-sm font-medium mb-1">No insights yet</p>
              <p className="text-xs text-muted-foreground">
                Generate your first AI-powered insights to see personalized analysis
              </p>
            </div>
          </div>
        )}

        {/* Quick Stats Preview */}
        {analyticsData && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <BarChart3 className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Games</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.totalGames}</p>
              </div>
              <div>
                <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Days Active</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.totalDays}</p>
              </div>
              <div>
                <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">This Week</p>
                <p className="text-sm font-semibold">{analyticsData.overallStats.gamesThisWeek}</p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Limit Warning */}
        {!canGenerate && reason && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              {reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};