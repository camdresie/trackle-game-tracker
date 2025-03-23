
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

interface ThemeSwitchProps {
  id?: string;
}

export function ThemeSwitch({ id = "theme-mode" }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();
  
  // Determine whether switch should be checked based on current theme
  const isDarkMode = theme === "dark" || 
    (theme === "system" && 
    typeof window !== 'undefined' && 
    window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  const handleChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        id={id}
        checked={isDarkMode}
        onCheckedChange={handleChange}
      />
      <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Toggle dark mode</span>
      </Label>
    </div>
  );
}
