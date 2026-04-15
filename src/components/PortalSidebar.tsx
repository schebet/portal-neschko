import { categoryColorMap, Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDialect } from "@/contexts/DialectContext";
import { TrendingUp } from "lucide-react";
import type { DisplayArticle } from "@/pages/Index";
import { DialectBanner } from "./sidebar/DialectBanner";
import { OnThisDay } from "./sidebar/OnThisDay";
import { MusicCorner } from "./sidebar/MusicCorner";
import { Link } from "react-router-dom";

const dotClasses: Record<string, string> = {
  "cat-news": "bg-cat-news",
  "cat-culture": "bg-cat-culture",
  "cat-tradition": "bg-cat-tradition",
  "cat-events": "bg-cat-events",
  "cat-nature": "bg-cat-nature",
  "cat-sport": "bg-cat-sport",
  "cat-world": "bg-cat-world",
};

interface PortalSidebarProps {
  articles: DisplayArticle[];
}

export function PortalSidebar({ articles }: PortalSidebarProps) {
  const { t } = useDialect();
  const top5 = articles.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Најчитаније */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="bg-destructive px-5 py-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-destructive-foreground" />
          <h3 className="font-serif font-bold text-sm uppercase tracking-wider text-destructive-foreground">
            {t("НАЈЧИТАНИЈЕ")}
          </h3>
        </div>
        <ol className="p-5 space-y-4">
          {top5.map((article, i) => (
            <li key={article.id}>
              <Link
                to={`/article/${article.id}`}
                className="flex items-start gap-3 group"
              >
                <span className="text-2xl font-serif font-black text-muted-foreground/40 leading-none min-w-[28px]">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        dotClasses[categoryColorMap[article.category as Category] || "cat-news"]
                      )}
                    />
                    <span className="text-xs text-muted-foreground">{article.category}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-accent-foreground transition-colors">
                    {article.title}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </div>

      <DialectBanner />
      <OnThisDay />
      <MusicCorner />
    </div>
  );
}
