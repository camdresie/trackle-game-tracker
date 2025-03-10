
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Award, BarChart3, User, Home, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const navItems = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <BarChart3 className="w-5 h-5" /> },
    { name: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  // If screen is mobile, use a hamburger menu
  if (isMobile) {
    return (
      <div className="fixed w-full top-0 z-50">
        <div className="h-16 flex justify-between items-center px-4 glass shadow-sm border-b">
          <Link to="/" className="flex items-center gap-2">
            <Award className="w-6 h-6 text-accent" />
            <span className="font-semibold text-lg">Game Tracker</span>
          </Link>
          
          <button 
            onClick={toggleMenu}
            className="p-2 rounded-full hover:bg-secondary transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          
          {isMenuOpen && (
            <div className="absolute top-16 left-0 w-full glass animate-fade-in p-2 border-b">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
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
            </div>
          )}
        </div>
      </div>
    );
  }

  // For desktop, show a standard horizontal navbar
  return (
    <div className="fixed w-full top-0 z-50">
      <div className="h-16 flex justify-between items-center px-6 glass shadow-sm border-b">
        <Link to="/" className="flex items-center gap-2">
          <Award className="w-6 h-6 text-accent" />
          <span className="font-semibold text-lg">Game Tracker</span>
        </Link>
        
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
      </div>
    </div>
  );
};

export default NavBar;
