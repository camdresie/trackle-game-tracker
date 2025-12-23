import { useState, useCallback, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, User, Home, Menu, X, LogOut, Calendar, HelpCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

// Memoize the NavBar component to prevent unnecessary re-renders
const NavBar = memo(() => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, profile, signOut } = useAuth();
  
  // Memoize handlers
  const toggleMenu = useCallback(() => setIsMenuOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const handleSignOut = useCallback(async () => {
    await signOut();
  }, [signOut]);
  
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Today', path: '/today', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Analytics', path: '/analytics', icon: <TrendingUp className="w-5 h-5" /> },
  ];

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  // If screen is mobile, use a hamburger menu
  if (isMobile) {
    return (
      <div className="fixed w-full top-0 z-50">
        <div className="h-20 flex justify-between items-center px-4 glass shadow-sm border-b">
          <Link to="/" className="flex items-center gap-2">
            <img 
              src="/lovable-uploads/024cdc2b-a9ed-44eb-af0f-8772dfc665a0.png" 
              alt="Trackle Logo" 
              className="h-24 w-auto" 
            />
          </Link>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleMenu}
              className="p-2 rounded-full hover:bg-secondary transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          
          {isMenuOpen && (
            <div className="absolute top-20 left-0 w-full bg-background/95 dark:bg-background/95 backdrop-blur-md animate-fade-in p-2 border-b shadow-md">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={cn(
                    "flex items-center gap-3 py-3 px-4 rounded-lg transition-colors mb-1",
                    isActive(item.path) 
                      ? "bg-secondary text-primary font-medium" 
                      : "hover:bg-secondary/50"
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              
              <Link
                to="/profile"
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 py-3 px-4 rounded-lg transition-colors mb-1",
                  isActive('/profile') 
                    ? "bg-secondary text-primary font-medium" 
                    : "hover:bg-secondary/50"
                )}
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              
              <Link
                to="/contact"
                onClick={closeMenu}
                className={cn(
                  "flex items-center gap-3 py-3 px-4 rounded-lg transition-colors mb-1",
                  isActive('/contact') 
                    ? "bg-secondary text-primary font-medium" 
                    : "hover:bg-secondary/50"
                )}
              >
                <HelpCircle className="w-5 h-5" />
                <span>Contact Support</span>
              </Link>
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 py-3 px-4 rounded-lg transition-colors w-full text-left text-rose-500 hover:bg-secondary/50"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For desktop, show a standard horizontal navbar
  return (
    <div className="fixed w-full top-0 z-50">
      <div className="h-24 flex justify-between items-center px-6 glass shadow-sm border-b">
        <Link to="/" className="flex items-center gap-2">
          <img 
            src="/lovable-uploads/024cdc2b-a9ed-44eb-af0f-8772dfc665a0.png" 
            alt="Trackle Logo" 
            className="h-24 w-auto" 
          />
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-3 rounded-lg transition-colors",
                  isActive(item.path) 
                    ? "bg-secondary text-primary font-medium" 
                    : "hover:bg-secondary/50"
                )}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.username || user?.email || ''} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{profile?.username || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/contact" className="cursor-pointer">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Contact Support</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-rose-500 focus:text-rose-500">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
});

export default NavBar;
