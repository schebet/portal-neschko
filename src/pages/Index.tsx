import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { BackToTop } from "@/components/BackToTop";
import { HeroArticle } from "@/components/HeroArticle";
import { ArticleCard } from "@/components/ArticleCard";
import { PortalSidebar } from "@/components/PortalSidebar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useDialect } from "@/contexts/DialectContext";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type DBArticle = Tables<"articles">;

export interface DisplayArticle {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  imageUrl: string;
  isFeatured?: boolean;
}

function toDisplayArticle(a: DBArticle, dialect: string): DisplayArticle {
  let title = a.title;
  let excerpt = a.excerpt;
  let content = a.content || "";

  if (dialect === "Заплањски дијалект" && a.title_zone1) {
    title = a.title_zone1;
    excerpt = a.excerpt_zone1 || a.excerpt;
    content = a.content_zone1 || a.content || "";
  }

  return {
    id: a.id,
    title,
    excerpt,
    content,
    category: a.category,
    author: a.author,
    date: new Date(a.created_at).toLocaleDateString("sr-Latn-RS") + " " + new Date(a.created_at).toLocaleTimeString("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" }),
    readTime: a.read_time || "5 мин",
    imageUrl: a.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    isFeatured: a.is_featured || false,
  };
}

const ARTICLES_PER_PAGE = 6;

const Index = () => {
  const [dbArticles, setDbArticles] = useState<DBArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const { dialect, t } = useDialect();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryFilter = searchParams.get("category");
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (!error && data) setDbArticles(data);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  const allArticles = dbArticles.map((a) => toDisplayArticle(a, dialect));

  // Filter by category
  const filteredArticles = categoryFilter
    ? allArticles.filter((a) => a.category === categoryFilter)
    : allArticles;

  // Pagination
  const featured = !categoryFilter ? filteredArticles[0] : undefined;
  const listArticles = featured ? filteredArticles.slice(1) : filteredArticles;
  const totalPages = Math.max(1, Math.ceil(listArticles.length / ARTICLES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArticles = listArticles.slice(
    (safePage - 1) * ARTICLES_PER_PAGE,
    safePage * ARTICLES_PER_PAGE
  );

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(page));
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
        <Footer />
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">
            {categoryFilter
              ? t("Нема чланака у овој категорији")
              : t("Нема објављених чланака")}
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Hero - only on first page without category filter */}
          {featured && safePage === 1 && (
            <section className="mb-10">
              <HeroArticle article={featured} />
            </section>
          )}

          {categoryFilter && (
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
              {t(categoryFilter)}
            </h2>
          )}

          {paginatedArticles.length > 0 && (
            <section>
              {!categoryFilter && (
                <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
                  {t("Најновије")}
                </h2>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {paginatedArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
                <aside className="lg:col-span-1">
                  <PortalSidebar articles={allArticles} />
                </aside>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage <= 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t("Претходна")}
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
                        page === safePage
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage >= totalPages}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground hover:bg-secondary"
                  >
                    {t("Следећа")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </section>
          )}
        </div>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Index;
