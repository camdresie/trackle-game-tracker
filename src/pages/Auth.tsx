
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import AdSense from '@/components/ads/AdSense';
import LoginForm from '@/components/auth/LoginForm';
import RegisterForm from '@/components/auth/RegisterForm';

const Auth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('login');

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
            <CardTitle className="text-2xl font-bold">Trackle</CardTitle>
            <CardDescription>Sign in to track your game scores</CardDescription>
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
