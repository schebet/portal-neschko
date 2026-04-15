import { Category, categoryColorMap } from "@/lib/types";
import { cn } from "@/lib/utils";

const colorClasses: Record<string, string> = {
  "cat-news": "bg-cat-news text-primary-foreground",
  "cat-culture": "bg-cat-culture text-primary-foreground",
  "cat-tradition": "bg-cat-tradition text-primary-foreground",
  "cat-events": "bg-cat-events text-primary-foreground",
  "cat-nature": "bg-cat-nature text-primary-foreground",
  "cat-sport": "bg-cat-sport text-primary-foreground",
  "cat-world": "bg-cat-world text-primary-foreground",
};

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const colorKey = categoryColorMap[category as Category] || "cat-news";
  return (
    <span
      className={cn(
        "inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide",
        colorClasses[colorKey],
        className
      )}
    >
      {category}
    </span>
  );
}
