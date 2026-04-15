import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDialect } from "@/contexts/DialectContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Comment {
  id: string;
  article_id: string;
  user_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface ArticleCommentsProps {
  articleId: string;
}

export function ArticleComments({ articleId }: ArticleCommentsProps) {
  const { user, role } = useAuth();
  const { t } = useDialect();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: true });
    if (data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();

    const channel = supabase
      .channel(`comments-${articleId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `article_id=eq.${articleId}` },
        () => fetchComments()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [articleId]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    if (!user) { toast.error(t("Морате бити пријављени")); return; }
    setSubmitting(true);

    const displayName = user.user_metadata?.display_name || "Корисник";

    const { error } = await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      display_name: displayName,
      content: newComment.trim(),
    });

    if (error) toast.error("Грешка: " + error.message);
    else setNewComment("");
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm(t("Обрисати коментар?"))) return;
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) toast.error("Грешка: " + error.message);
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h3 className="text-xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
        <MessageCircle className="h-5 w-5" />
        {t("Коментари")} ({comments.length})
      </h3>

      {user ? (
        <div className="mb-6">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("Напишите коментар...")}
            rows={3}
            maxLength={1000}
          />
          <div className="flex justify-end mt-2">
            <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()} size="sm">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {t("Објави коментар")}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-6">
          <a href="/login" className="text-primary underline">{t("Пријавите се")}</a> {t("да бисте оставили коментар.")}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{t("Нема коментара. Будите први!")}</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{comment.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString("sr-Latn-RS")} {new Date(comment.created_at).toLocaleTimeString("sr-Latn-RS", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                {(user?.id === comment.user_id || role === "admin") && (
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(comment.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
