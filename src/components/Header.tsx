import { useState } from "react";
import { Menu, X, Globe, Settings } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Category, DialectZone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDialect } from "@/contexts/DialectContext";
import { useAuth } from "@/hooks/useAuth";

const categories: { name: Category; colorClass: string }[] = [
  { name: "Вести", colorClass: "text-cat-news hover:text-cat-news/80" },
  { name: "Култура", colorClass: "text-cat-culture hover:text-cat-culture/80" },
  { name: "Традиција", colorClass: "text-cat-tradition hover:text-cat-tradition/80" },
  { name: "Туризам", colorClass: "text-cat-events hover:text-cat-events/80" },
  { name: "Белосветске вести", colorClass: "text-cat-world hover:text-cat-world/80" },
];

const dialects: DialectZone[] = ["Стандардни српски", "Заплањски дијалект"];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { dialect, setDialect, t } = useDialect();
  const { user, role } = useAuth();
  const [searchParams] = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <header className="bg-card border-b border-border">
      <div className="accent-border-strip" />
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-2 -left-4 -top-3">
                <svg viewBox="0 0 140 90" className="w-[120px] md:w-[160px] h-auto" aria-hidden="true">
                  <path d="M20,45 Q5,20 35,10 Q60,-5 90,8 Q120,5 130,25 Q140,45 125,65 Q115,85 80,82 Q50,90 25,75 Q5,65 20,45Z" fill="hsl(45, 93%, 55%)" opacity="0.85" />
                  <path d="M30,40 Q15,25 40,15 Q60,5 85,12 Q110,10 120,30 Q130,50 115,65 Q100,80 70,78 Q40,82 28,68 Q12,55 30,40Z" fill="hsl(45, 93%, 60%)" opacity="0.6" />
                </svg>
              </div>
              <div className="relative z-10">
                <h1 className="text-2xl md:text-3xl font-serif font-black text-foreground leading-none">
                  Заплање
                </h1>
                <p className="text-[10px] md:text-xs font-sans font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {t("Локални портал")}
                </p>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 border border-[#e8ba30]/30">
              <Globe className="h-4 w-4 text-[#e8ba30] mr-1" />
              {dialects.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    dialect === d
                      ? "bg-[#e8ba30] text-black font-semibold"
                      : "text-muted-foreground hover:text-[#e8ba30]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
            {(role === "admin" || role === "editor") ? (
              <Link to="/admin" className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <Settings className="h-4 w-4" /> CMS
              </Link>
            ) : (
              <Link to="/login" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Пријава
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Category nav - desktop */}
        <nav className="hidden md:flex items-center justify-end gap-6 pb-3">
          <Link
            to="/"
            className={cn(
              "text-sm font-semibold transition-colors",
              !activeCategory ? "text-primary underline underline-offset-4" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t("Све")}
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.name}
              to={`/?category=${encodeURIComponent(cat.name)}`}
              className={cn(
                "text-sm font-semibold transition-colors",
                activeCategory === cat.name
                  ? cn(cat.colorClass, "underline underline-offset-4")
                  : cat.colorClass
              )}
            >
              {t(cat.name)}
            </Link>
          ))}
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "text-sm font-semibold py-1",
                  !activeCategory ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t("Све")}
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.name}
                  to={`/?category=${encodeURIComponent(cat.name)}`}
                  onClick={() => setMobileOpen(false)}
                  className={cn("text-sm font-semibold py-1", cat.colorClass)}
                >
                  {t(cat.name)}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1 w-fit border border-[#e8ba30]/30">
              <Globe className="h-4 w-4 text-[#e8ba30] mr-1" />
              {dialects.map((d) => (
                <button
                  key={d}
                  onClick={() => setDialect(d)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                    dialect === d
                      ? "bg-[#e8ba30] text-black font-semibold"
                      : "text-muted-foreground hover:text-[#e8ba30]"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
