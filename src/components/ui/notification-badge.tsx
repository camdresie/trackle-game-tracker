import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showZero?: boolean;
}

export function NotificationBadge({ count, className, showZero = false }: NotificationBadgeProps) {
  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn(
        "absolute -top-1 -right-1 h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs",
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  );
} 