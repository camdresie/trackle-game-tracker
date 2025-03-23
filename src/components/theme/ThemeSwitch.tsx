
import { useTheme } from "@/contexts/ThemeContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Moon, Sun } from "lucide-react";

interface ThemeSwitchProps {
  id?: string;
}

export function ThemeSwitch({ id = "theme-mode" }: ThemeSwitchProps) {
  const { theme, setTheme } = useTheme();
  
  const handleChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light");
  };

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        id={id}
        checked={theme === "dark"}
        onCheckedChange={handleChange}
      />
      <Label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <span className="sr-only">Toggle dark mode</span>
      </Label>
    </div>
  );
}
