import { BarChart3, TrendingUp, Calendar } from 'lucide-react';
import NavBar from '@/components/NavBar';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ActivityHeatMap } from '@/components/analytics/ActivityHeatMap';
import { PerformanceChartsSection } from '@/components/analytics/PerformanceChartsSection';
import { ComparativeAnalyticsSection } from '@/components/analytics/ComparativeAnalyticsSection';
import { Skeleton } from '@/components/ui/skeleton';

const Analytics = () => {
  const { allScores, activityData, friends, isLoading } = useAnalyticsData();

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="pt-28 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Visualize your performance trends and compare with friends
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="glass-card rounded-xl p-6 animate-slide-up" style={{animationDelay: '0ms'}}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Performance Trends</h2>
              </div>
              <PerformanceChartsSection allScores={allScores} />
            </div>

            <div className="glass-card rounded-xl p-6 animate-slide-up" style={{animationDelay: '100ms'}}>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Score Overview</h2>
              </div>
              <ComparativeAnalyticsSection allScores={allScores} friends={friends} />
            </div>

            <div className="glass-card rounded-xl p-6 animate-slide-up" style={{animationDelay: '200ms'}}>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold">Activity Pattern</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Your gaming activity over the past year
              </p>
              <ActivityHeatMap data={activityData} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
