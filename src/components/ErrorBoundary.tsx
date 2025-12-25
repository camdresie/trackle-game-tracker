import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log to your error reporting service (e.g., Sentry)
    // Sentry.captureException(error, { extra: errorInfo });
  }

  private handleRefresh = () => {
    // Clear error state and reload the page
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img
                src="/lovable-uploads/024cdc2b-a9ed-44eb-af0f-8772dfc665a0.png"
                alt="Trackle Logo"
                className="h-32 w-auto opacity-90"
              />
            </div>

            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
            </div>

            {/* Refresh Button */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={this.handleRefresh}
                className="w-full"
                size="lg"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh App
              </Button>

              <p className="text-xs text-muted-foreground">
                If the problem persists, please contact support
              </p>
            </div>

            {/* Developer Info (only in development) */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Error Details (Dev Only)
                </summary>
                <div className="mt-2 p-4 bg-muted rounded-lg text-xs font-mono overflow-auto">
                  <p className="text-destructive font-semibold mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="whitespace-pre-wrap text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
