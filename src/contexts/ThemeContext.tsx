import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Get the theme from localStorage or return the defaultTheme
const getStoredTheme = (): Theme => {
  if (typeof window === 'undefined') return 'system';
  
  const storedTheme = localStorage.getItem('theme') as Theme | null;
  return storedTheme || 'system';
};

// Get the resolved theme (actual light/dark) based on system preference if needed
const getResolvedTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme !== 'system') return theme as 'light' | 'dark';
  
  if (typeof window === 'undefined') return 'dark'; // Default to dark if SSR
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  // Initialize with stored theme from localStorage or fallback to default
  const [theme, setTheme] = useState<Theme>(getStoredTheme() || defaultTheme);

  // Save theme to localStorage and apply theme class to document
  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    // Store in localStorage for persistence
    localStorage.setItem('theme', newTheme);

    const resolvedTheme = getResolvedTheme(newTheme);
    root.classList.add(resolvedTheme);
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Memoize the setTheme function to prevent unnecessary re-renders
  const setThemeCallback = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({ 
    theme, 
    setTheme: setThemeCallback
  }), [theme, setThemeCallback]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
