import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { supabase } from "@/integrations/supabase/client";
import { useDialect } from "@/contexts/DialectContext";
import { Loader2, Calendar, Clock, User } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { ArticleComments } from "@/components/ArticleComments";

type DBArticle = Tables<"articles">;

const Article = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<DBArticle | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { dialect, t } = useDialect();

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (!error && data) {
        setArticle(data);
        // Try to get display name from profile
        if (data.author_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("user_id", data.author_id)
            .maybeSingle();
          if (profile?.display_name) {
            setAuthorName(profile.display_name);
          } else {
            setAuthorName(data.author);
          }
        } else {
          setAuthorName(data.author);
        }
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

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

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">{t("Чланак није пронађен")}</p>
        </div>
        <Footer />
      </div>
    );
  }

  let title = article.title;
  let excerpt = article.excerpt;
  let content = article.content || "";

  if (dialect === "Заплањски дијалект" && article.title_zone1) {
    title = article.title_zone1;
    excerpt = article.excerpt_zone1 || article.excerpt;
    content = article.content_zone1 || article.content || "";
  }

  const imageUrl = article.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
        <article className="container mx-auto px-4 py-8 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-3 block">
            {article.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-black text-foreground mb-4 leading-tight">
            {title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 border-b border-border pb-6">
            <span className="flex items-center gap-1"><User className="h-4 w-4" /> {authorName}</span>
            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(article.created_at).toLocaleDateString("sr-Latn-RS")} {new Date(article.created_at).toLocaleTimeString("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {article.read_time || "5 мин"}</span>
          </div>
          <p className="text-lg text-muted-foreground mb-8 font-medium leading-relaxed">{excerpt}</p>
          <div className="prose prose-lg max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
          <ArticleComments articleId={article.id} />
        </article>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};

export default Article;
