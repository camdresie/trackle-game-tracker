
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import AdSense from '@/components/ads/AdSense';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';
import { Skeleton } from '@/components/ui/skeleton';

const Auth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Redirect if user is already logged in
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSwitchToRegister = () => setActiveTab('register');
  const handleSwitchToLogin = () => setActiveTab('login');

  return (
    <div className="flex flex-col min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md mb-6">
        <Card className="glass-card">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm shadow-sm relative" style={{ height: imageLoaded ? 'auto' : '260px', width: imageLoaded ? 'auto' : '260px' }}>
                {!imageLoaded && (
                  <Skeleton className="absolute inset-0 rounded-lg" />
                )}
                <img 
                  src="/lovable-uploads/024cdc2b-a9ed-44eb-af0f-8772dfc665a0.png" 
                  alt="Trackle Logo" 
                  className={`h-64 w-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setImageLoaded(true)}
                  loading="eager"
                />
              </div>
            </div>
            <CardTitle className="mt-4 mb-2">Track Your Game Scores, Together</CardTitle>
            <CardDescription className="text-base">
              Trackle helps you track your daily game scores, compete with friends, and see where you rank on leaderboards. 
              Join other players sharing their Wordle, Connections, Spelling Bee and other game results!
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            <CardContent className="pt-6">
              <TabsContent value="login">
                <LoginForm onSwitchToRegister={handleSwitchToRegister} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm 
                  onSwitchToLogin={handleSwitchToLogin}
                  onRegisterSuccess={handleSwitchToLogin}
                />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
      
      {/* AdSense Ad */}
      <div className="w-full max-w-md mt-4">
        <AdSense 
          adSlot="1234567890" 
          className="w-full" 
          adFormat="rectangle"
          style={{ minHeight: '250px' }}
        />
      </div>
    </div>
  );
};

export default Auth;
