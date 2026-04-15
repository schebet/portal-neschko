import { CategoryBadge } from "./CategoryBadge";
import { Clock, User } from "lucide-react";
import { Link } from "react-router-dom";
import type { DisplayArticle } from "@/pages/Index";

interface HeroArticleProps {
  article: DisplayArticle;
}

export function HeroArticle({ article }: HeroArticleProps) {
  return (
    <Link to={`/article/${article.id}`} className="relative rounded-xl overflow-hidden group cursor-pointer block">
      <div className="aspect-[21/9] md:aspect-[3/1]">
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <CategoryBadge category={article.category} className="mb-3" />
        <h2 className="text-xl md:text-3xl font-serif font-bold text-primary-foreground leading-tight mb-3">
          {article.title}
        </h2>
        <p className="text-sm md:text-base text-primary-foreground/80 mb-4 max-w-2xl line-clamp-2">
          {article.excerpt}
        </p>
        <div className="flex items-center gap-4 text-xs text-primary-foreground/70">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {article.author}
          </span>
          <span>{article.date}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {article.readTime}
          </span>
        </div>
      </div>
    </Link>
  );
}
