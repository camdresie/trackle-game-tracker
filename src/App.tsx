import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import GameDetail from "./pages/GameDetail";
import Leaderboard from "./pages/Leaderboard";
import TodayScores from "./pages/TodayScores";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Messages from "./pages/Messages";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import OnboardingFlow from "@/components/OnboardingFlow";
import { useEffect } from "react";

// Add type definition for gtag
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: {
        page_path?: string;
        page_title?: string;
        [key: string]: any;
      }
    ) => void;
  }
}

const queryClient = new QueryClient();

// Google Analytics page view tracking component
const RouteChangeTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Access the gtag function which was added via the script in index.html
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'page_view', {
        page_path: location.pathname + location.search,
        page_title: document.title
      });
    }
  }, [location]);
  
  return null;
};

const AppRoutes = () => (
  <>
    <RouteChangeTracker />
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <OnboardingFlow />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/game/:gameId" 
        element={
          <ProtectedRoute>
            <GameDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/leaderboard" 
        element={
          <ProtectedRoute>
            <Leaderboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/today" 
        element={
          <ProtectedRoute>
            <TodayScores />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/messages" 
        element={
          <ProtectedRoute>
            <Messages />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/contact" 
        element={
          <ProtectedRoute>
            <Contact />
          </ProtectedRoute>
        } 
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
