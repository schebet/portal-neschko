import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, LogOut, Trash2, Edit, Eye, EyeOff, Star, Sparkles, Loader2, Users, Upload, Image as ImageIcon, UserCheck, UserX, Music, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Article = Tables<"articles">;
type MusicTrack = Tables<"music_tracks">;
type OnThisDayEvent = Tables<"on_this_day">;
const categories = ["Вести", "Култура", "Традиција", "Догађаји", "Природа", "Спорт", "Белосветске вести"] as const;

interface EditorUser {
  user_id: string;
  role: "admin" | "editor" | "lektor";
  email?: string;
  display_name?: string;
}

interface PendingUser {
  user_id: string;
  display_name?: string;
}

const Admin = () => {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [translating, setTranslating] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Editor management
  const [editors, setEditors] = useState<EditorUser[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [newEditorEmail, setNewEditorEmail] = useState("");
  const [newEditorRole, setNewEditorRole] = useState<"editor" | "lektor">("editor");
  const [addingEditor, setAddingEditor] = useState(false);
  const [approvingUser, setApprovingUser] = useState<string | null>(null);
  const [approveRoles, setApproveRoles] = useState<Record<string, "editor" | "lektor">>({});

  // Music tracks
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [musicForm, setMusicForm] = useState({ title: "", title_dialect: "", description: "", description_dialect: "", audio_url: "" });
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [showMusicForm, setShowMusicForm] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);

  // On this day
  const [otdEvents, setOtdEvents] = useState<OnThisDayEvent[]>([]);
  const [otdForm, setOtdForm] = useState({ day_key: "", year: "", event_text: "", event_text_dialect: "" });
  const [editingOtd, setEditingOtd] = useState<string | null>(null);
  const [showOtdForm, setShowOtdForm] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "Вести" as string,
    image_url: "",
    is_featured: false,
    is_published: false,
    title_zone1: "",
    excerpt_zone1: "",
    content_zone1: "",
  });
  const [showDialectFields, setShowDialectFields] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !role)) {
      navigate("/login");
    }
  }, [user, role, authLoading, navigate]);

  useEffect(() => {
    if (user && role) {
      fetchArticles();
    if (role === "admin") {
      fetchEditors();
      fetchPendingUsers();
      fetchMusicTracks();
      fetchOtdEvents();
    }
    }
  }, [user, role]);

  const fetchArticles = async () => {
    let query = supabase
      .from("articles")
      .select("*")
      .order("created_at", { ascending: false });
    // Lektor only sees published articles
    if (role === "lektor") {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query;
    if (error) toast.error("Грешка при учитавању чланака");
    else setArticles(data || []);
    setLoading(false);
  };

  const fetchEditors = async () => {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("user_id, role");
    if (error || !roles) return;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");

    const editorList: EditorUser[] = roles.map((r) => {
      const profile = profiles?.find((p) => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        role: r.role as "admin" | "editor" | "lektor",
        display_name: profile?.display_name || undefined,
      };
    });
    setEditors(editorList);
  };

  const fetchPendingUsers = async () => {
    // Get all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name");
    if (!profiles) return;

    // Get all users who already have roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id");
    
    const roleUserIds = new Set(roles?.map(r => r.user_id) || []);
    
    // Filter profiles that don't have roles yet (excluding current user)
    const pending = profiles
      .filter(p => !roleUserIds.has(p.user_id) && p.user_id !== user?.id)
      .map(p => ({ user_id: p.user_id, display_name: p.display_name || undefined }));
    
    setPendingUsers(pending);
  };

  // Music tracks management
  const fetchMusicTracks = async () => {
    const { data } = await supabase.from("music_tracks").select("*").order("sort_order");
    if (data) setMusicTracks(data);
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { toast.error("Само аудио фајлови"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Макс 20MB"); return; }
    setUploadingMusic(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${file.name.split(".").pop()}`;
      const { error: upErr } = await supabase.storage.from("music-files").upload(fileName, file);
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("music-files").getPublicUrl(fileName);
      setMusicForm({ ...musicForm, audio_url: urlData.publicUrl });
      toast.success("Аудио отпремљен!");
    } catch (e: any) { toast.error("Грешка: " + e.message); }
    finally { setUploadingMusic(false); }
  };

  const handleSaveTrack = async () => {
    if (!musicForm.title.trim() || !musicForm.audio_url.trim()) { toast.error("Наслов и аудио су обавезни"); return; }
    if (editingTrack) {
      const { error } = await supabase.from("music_tracks").update({
        title: musicForm.title, title_dialect: musicForm.title_dialect || null,
        description: musicForm.description || null, description_dialect: musicForm.description_dialect || null,
        audio_url: musicForm.audio_url,
      }).eq("id", editingTrack);
      if (error) toast.error(error.message);
      else { toast.success("Нумера ажурирана"); setShowMusicForm(false); setEditingTrack(null); fetchMusicTracks(); }
    } else {
      const { error } = await supabase.from("music_tracks").insert({
        title: musicForm.title, title_dialect: musicForm.title_dialect || null,
        description: musicForm.description || null, description_dialect: musicForm.description_dialect || null,
        audio_url: musicForm.audio_url, sort_order: musicTracks.length,
      } as any);
      if (error) toast.error(error.message);
      else { toast.success("Нумера додата"); setShowMusicForm(false); fetchMusicTracks(); }
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm("Обрисати нумеру?")) return;
    const { error } = await supabase.from("music_tracks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Обрисано"); fetchMusicTracks(); }
  };

  // On this day management
  const fetchOtdEvents = async () => {
    const { data } = await supabase.from("on_this_day").select("*").order("day_key");
    if (data) setOtdEvents(data);
  };

  const handleSaveOtd = async () => {
    if (!otdForm.day_key.trim() || !otdForm.year.trim() || !otdForm.event_text.trim()) {
      toast.error("Датум, година и текст су обавезни"); return;
    }
    if (editingOtd) {
      const { error } = await supabase.from("on_this_day").update({
        day_key: otdForm.day_key, year: otdForm.year, event_text: otdForm.event_text,
        event_text_dialect: otdForm.event_text_dialect || null,
      }).eq("id", editingOtd);
      if (error) toast.error(error.message);
      else { toast.success("Догађај ажуриран"); setShowOtdForm(false); setEditingOtd(null); fetchOtdEvents(); }
    } else {
      const { error } = await supabase.from("on_this_day").insert({
        day_key: otdForm.day_key, year: otdForm.year, event_text: otdForm.event_text,
        event_text_dialect: otdForm.event_text_dialect || null,
      } as any);
      if (error) toast.error(error.message);
      else { toast.success("Догађај додат"); setShowOtdForm(false); fetchOtdEvents(); }
    }
  };

  const handleDeleteOtd = async (id: string) => {
    if (!confirm("Обрисати догађај?")) return;
    const { error } = await supabase.from("on_this_day").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Обрисано"); fetchOtdEvents(); }
  };

  const handleGenerateAI = async () => {
    const now = new Date();
    const dayKey = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-on-this-day", { body: { dayKey } });
      if (error) throw error;
      if (!data?.events?.length) { toast.error("AI није вратио догађаје"); return; }
      for (const ev of data.events) {
        await supabase.from("on_this_day").insert({
          day_key: dayKey, year: ev.year, event_text: ev.event_text,
          event_text_dialect: ev.event_text_dialect || null,
        } as any);
      }
      toast.success(`${data.events.length} догађаја додато помоћу AI`);
      fetchOtdEvents();
    } catch (e: any) { toast.error("Грешка: " + (e.message || "Непозната")); }
    finally { setGeneratingAI(false); }
  };

  const handleApproveUser = async (userId: string) => {
    setApprovingUser(userId);
    const selectedRole = approveRoles[userId] || "editor";
    try {
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role: selectedRole as any,
      });
      if (error) throw error;
      toast.success(selectedRole === "lektor" ? "Лектор одобрен!" : "Уредник одобрен!");
      fetchEditors();
      fetchPendingUsers();
    } catch (e: any) {
      toast.error("Грешка: " + (e.message || "Непозната грешка"));
    } finally {
      setApprovingUser(null);
    }
  };

  const handleAddEditor = async () => {
    if (!newEditorEmail.trim()) {
      toast.error("Унесите email адресу");
      return;
    }
    setAddingEditor(true);
    try {
      // Find user by email via profiles (display_name often stores email initially)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .ilike("display_name", newEditorEmail.trim());

      if (!profiles || profiles.length === 0) {
        toast.error("Корисник са тим email-ом није пронађен. Корисник мора прво да се региструје.");
        setAddingEditor(false);
        return;
      }

      const targetUserId = profiles[0].user_id;

      // Check if already has a role
      const existing = editors.find((e) => e.user_id === targetUserId);
      if (existing) {
        toast.error("Корисник већ има улогу: " + existing.role);
        setAddingEditor(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: targetUserId,
        role: newEditorRole as any,
      });

      if (error) throw error;
      toast.success(newEditorRole === "lektor" ? "Лектор додат!" : "Уредник додат!");
      setNewEditorEmail("");
      fetchEditors();
    } catch (e: any) {
      toast.error("Грешка: " + (e.message || "Непозната грешка"));
    } finally {
      setAddingEditor(false);
    }
  };

  const handleRemoveEditor = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("Не можете уклонити себе");
      return;
    }
    if (!confirm("Да ли сте сигурни да желите да уклоните овог корисника?")) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (error) toast.error("Грешка: " + error.message);
    else {
      toast.success("Уредник уклоњен");
      fetchEditors();
    }
  };

  const resetForm = () => {
    setForm({ title: "", excerpt: "", content: "", category: "Вести", image_url: "", is_featured: false, is_published: false, title_zone1: "", excerpt_zone1: "", content_zone1: "" });
    setEditing(null);
    setShowForm(false);
    setShowDialectFields(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Само слике су дозвољене");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Максимална величина слике је 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("article-images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("article-images")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: urlData.publicUrl });
      toast.success("Слика отпремљена!");
    } catch (e: any) {
      toast.error("Грешка при отпремању: " + (e.message || "Непозната грешка"));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.excerpt.trim()) {
      toast.error("Наслов и извод су обавезни");
      return;
    }

    if (editing) {
      const { error } = await supabase
        .from("articles")
        .update({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          category: form.category,
          image_url: form.image_url,
          is_featured: form.is_featured,
          is_published: form.is_published,
          title_zone1: form.title_zone1 || null,
          excerpt_zone1: form.excerpt_zone1 || null,
          content_zone1: form.content_zone1 || null,
        })
        .eq("id", editing);
      if (error) toast.error("Грешка: " + error.message);
      else {
        toast.success("Чланак ажуриран");
        resetForm();
        fetchArticles();
      }
    } else {
      const { error } = await supabase.from("articles").insert({
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        category: form.category,
        image_url: form.image_url || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
        is_featured: form.is_featured,
        is_published: form.is_published,
        author: user?.user_metadata?.display_name || "Уредник",
        author_id: user?.id,
      });
      if (error) toast.error("Грешка: " + error.message);
      else {
        toast.success("Чланак креиран");
        resetForm();
        fetchArticles();
      }
    }
  };

  const handleEdit = (article: Article) => {
    setForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content || "",
      category: article.category,
      image_url: article.image_url || "",
      is_featured: article.is_featured || false,
      is_published: article.is_published || false,
      title_zone1: article.title_zone1 || "",
      excerpt_zone1: article.excerpt_zone1 || "",
      content_zone1: article.content_zone1 || "",
    });
    setEditing(article.id);
    setShowForm(true);
    setShowDialectFields(!!(article.title_zone1 || article.excerpt_zone1 || article.content_zone1));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Да ли сте сигурни?")) return;
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) toast.error("Грешка: " + error.message);
    else {
      toast.success("Чланак обрисан");
      fetchArticles();
    }
  };

  const handleTranslate = async (article: Article) => {
    setTranslating(article.id);
    try {
      const { data, error } = await supabase.functions.invoke("translate-dialect", {
        body: {
          title: article.title,
          excerpt: article.excerpt,
          content: article.content || "",
        },
      });

      if (error) throw error;

      const { error: updateError } = await supabase
        .from("articles")
        .update({
          title_zone1: data.zone1.title,
          excerpt_zone1: data.zone1.excerpt,
          content_zone1: data.zone1.content,
          title_zone2: data.zone2.title,
          excerpt_zone2: data.zone2.excerpt,
          content_zone2: data.zone2.content,
        })
        .eq("id", article.id);

      if (updateError) throw updateError;
      toast.success("Превод генерисан за обе зоне!");
      fetchArticles();
    } catch (e: any) {
      toast.error("Грешка при превођењу: " + (e.message || "Непозната грешка"));
    } finally {
      setTranslating(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="accent-border-strip" />
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-serif font-black text-foreground">Заплање CMS</h1>
            <p className="text-xs text-muted-foreground">
              {role === "admin" ? "Администратор" : role === "lektor" ? "Лектор" : "Уредник"} — {user?.user_metadata?.display_name || user?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Портал
            </Button>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-1" /> Одјави се
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Укупно", value: articles.length },
            { label: "Објављено", value: articles.filter((a) => a.is_published).length },
            { label: "Нацрти", value: articles.filter((a) => !a.is_published).length },
            { label: "Преведено", value: articles.filter((a) => a.title_zone1).length },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-lg border border-border p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="articles">
          <TabsList className="mb-6">
            <TabsTrigger value="articles">Чланци</TabsTrigger>
            {role === "admin" && <TabsTrigger value="editors"><Users className="h-4 w-4 mr-1" /> Уредници</TabsTrigger>}
            {role === "admin" && <TabsTrigger value="music"><Music className="h-4 w-4 mr-1" /> Музика</TabsTrigger>}
            {role === "admin" && <TabsTrigger value="otd"><Calendar className="h-4 w-4 mr-1" /> На данашњи дан</TabsTrigger>}
          </TabsList>

          <TabsContent value="articles">
            {/* Actions */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-foreground">
                {role === "lektor" ? "Објављени чланци — лектура" : "Чланци"}
              </h2>
              {role !== "lektor" && (
                <Button onClick={() => { resetForm(); setShowForm(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Нови чланак
                </Button>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h3 className="font-serif font-bold text-foreground mb-4">
                  {editing ? "Измени чланак" : "Нови чланак"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Наслов</label>
                    <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Извод</label>
                    <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-foreground mb-1 block">Садржај</label>
                    <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={6} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Категорија</label>
                    <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Слика</label>
                    <div className="flex gap-2">
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="URL слике или отпремите..."
                        className="flex-1"
                      />
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Button type="button" variant="outline" size="icon" disabled={uploading} asChild>
                          <span>{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                        </Button>
                      </label>
                    </div>
                    {form.image_url && (
                      <div className="mt-2 relative rounded-lg overflow-hidden h-32 bg-muted">
                        <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
                      Објави
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                      Истакнут
                    </label>
                  </div>
                </div>

                {/* Dialect translation section */}
                <div className="mt-6 border-t border-border pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDialectFields(!showDialectFields)}
                    className="flex items-center gap-2 text-sm font-medium text-accent-foreground hover:text-foreground transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-accent" />
                    {showDialectFields ? "Сакриј превод на дијалект" : "Прикажи/уреди превод на заплањски дијалект"}
                  </button>
                  {showDialectFields && (
                    <div className="grid grid-cols-1 gap-4 mt-4 bg-accent/5 rounded-lg p-4 border border-accent/20">
                      <p className="text-xs text-muted-foreground">
                        Овде можете ручно уредити или исправити AI-генерисани превод на заплањски дијалект.
                      </p>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Наслов (дијалект)</label>
                        <Input
                          value={form.title_zone1}
                          onChange={(e) => setForm({ ...form, title_zone1: e.target.value })}
                          placeholder="Наслов на заплањском дијалекту..."
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Извод (дијалект)</label>
                        <Textarea
                          value={form.excerpt_zone1}
                          onChange={(e) => setForm({ ...form, excerpt_zone1: e.target.value })}
                          placeholder="Извод на заплањском дијалекту..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1 block">Садржај (дијалект)</label>
                        <Textarea
                          value={form.content_zone1}
                          onChange={(e) => setForm({ ...form, content_zone1: e.target.value })}
                          placeholder="Садржај на заплањском дијалекту..."
                          rows={6}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleSave}>{editing ? "Сачувај" : "Креирај"}</Button>
                  <Button variant="outline" onClick={resetForm}>Откажи</Button>
                </div>
              </div>
            )}

            {/* Articles list */}
            <div className="space-y-3">
              {articles.map((article) => (
                <div key={article.id} className="bg-card rounded-lg border border-border p-4 flex items-center gap-4">
                  {article.image_url && (
                    <img src={article.image_url} alt="" className="w-16 h-16 rounded object-cover hidden sm:block" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        {article.category}
                      </span>
                      {article.is_published ? (
                        <Eye className="h-3 w-3 text-cat-tradition" />
                      ) : (
                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                      )}
                      {article.is_featured && <Star className="h-3 w-3 text-accent" />}
                      {article.title_zone1 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-cat-tradition rounded">AI преведено</span>
                      )}
                    </div>
                    <h4 className="font-serif font-bold text-foreground text-sm truncate">{article.title}</h4>
                    <p className="text-xs text-muted-foreground truncate">{article.excerpt}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {role !== "lektor" && (
                      <Button size="sm" variant="ghost" onClick={() => handleTranslate(article)} disabled={translating === article.id}>
                        {translating === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(article)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {role === "admin" && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(article.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {articles.length === 0 && (
                <p className="text-center text-muted-foreground py-12">
                  Нема чланака. Креирајте први чланак!
                </p>
              )}
            </div>
          </TabsContent>

          {role === "admin" && (
            <TabsContent value="editors">
              {/* Pending approval */}
              {pendingUsers.length > 0 && (
                <div className="bg-card rounded-xl border-2 border-accent p-6 mb-6">
                  <h3 className="font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-accent" />
                    Чекају одобрење ({pendingUsers.length})
                  </h3>
                  <div className="space-y-3">
                    {pendingUsers.map((pu) => (
                      <div key={pu.user_id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                        <div>
                          <p className="font-medium text-foreground text-sm">{pu.display_name || pu.user_id}</p>
                          <span className="text-xs text-muted-foreground">Регистрован корисник — чека одобрење</span>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Select
                            value={approveRoles[pu.user_id] || "editor"}
                            onValueChange={(v) => setApproveRoles({ ...approveRoles, [pu.user_id]: v as "editor" | "lektor" })}
                          >
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Уредник</SelectItem>
                              <SelectItem value="lektor">Лектор</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={() => handleApproveUser(pu.user_id)} disabled={approvingUser === pu.user_id}>
                            {approvingUser === pu.user_id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                            Одобри
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add user manually */}
              <div className="bg-card rounded-xl border border-border p-6 mb-6">
                <h3 className="font-serif font-bold text-foreground mb-4">Додај корисника ручно</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Корисник мора прво да се региструје на порталу. Затим унесите његов email и изаберите улогу.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newEditorEmail}
                    onChange={(e) => setNewEditorEmail(e.target.value)}
                    placeholder="email@primer.com"
                    className="max-w-sm"
                  />
                  <Select value={newEditorRole} onValueChange={(v) => setNewEditorRole(v as "editor" | "lektor")}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Уредник</SelectItem>
                      <SelectItem value="lektor">Лектор</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddEditor} disabled={addingEditor}>
                    {addingEditor ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                    Додај
                  </Button>
                </div>
              </div>

              {/* Current editors */}
              <h3 className="font-serif font-bold text-foreground mb-3">Активни корисници</h3>
              <div className="space-y-3">
                {editors.map((editor) => (
                  <div key={editor.user_id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{editor.display_name || editor.user_id}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        editor.role === "admin" ? "bg-primary/10 text-primary" : editor.role === "lektor" ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>
                        {editor.role === "admin" ? "Администратор" : editor.role === "lektor" ? "Лектор" : "Уредник"}
                      </span>
                    </div>
                    {(editor.role === "editor" || editor.role === "lektor") && editor.user_id !== user?.id && (
                      <Button size="sm" variant="ghost" onClick={() => handleRemoveEditor(editor.user_id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
                {editors.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Нема корисника са улогама.</p>
                )}
              </div>
            </TabsContent>
          )}

          {/* Music Tab */}
          {role === "admin" && (
            <TabsContent value="music">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-foreground">Музичке нумере</h2>
                <Button onClick={() => { setMusicForm({ title: "", title_dialect: "", description: "", description_dialect: "", audio_url: "" }); setEditingTrack(null); setShowMusicForm(true); }}>
                  <Plus className="h-4 w-4 mr-1" /> Додај нумеру
                </Button>
              </div>

              {showMusicForm && (
                <div className="bg-card rounded-xl border border-border p-6 mb-6">
                  <h3 className="font-serif font-bold text-foreground mb-4">{editingTrack ? "Измени нумеру" : "Нова нумера"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Наслов</label>
                      <Input value={musicForm.title} onChange={(e) => setMusicForm({ ...musicForm, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Наслов (дијалект)</label>
                      <Input value={musicForm.title_dialect} onChange={(e) => setMusicForm({ ...musicForm, title_dialect: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Опис</label>
                      <Input value={musicForm.description} onChange={(e) => setMusicForm({ ...musicForm, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Опис (дијалект)</label>
                      <Input value={musicForm.description_dialect} onChange={(e) => setMusicForm({ ...musicForm, description_dialect: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-1 block">Аудио фајл</label>
                      <div className="flex gap-2">
                        <Input value={musicForm.audio_url} onChange={(e) => setMusicForm({ ...musicForm, audio_url: e.target.value })} placeholder="URL или отпремите..." className="flex-1" />
                        <label className="cursor-pointer">
                          <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                          <Button type="button" variant="outline" size="icon" disabled={uploadingMusic} asChild>
                            <span>{uploadingMusic ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}</span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveTrack}>{editingTrack ? "Сачувај" : "Додај"}</Button>
                    <Button variant="outline" onClick={() => { setShowMusicForm(false); setEditingTrack(null); }}>Откажи</Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {musicTracks.map((track) => (
                  <div key={track.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">{track.title}</p>
                      <p className="text-xs text-muted-foreground">{track.description || "Без описа"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setMusicForm({
                          title: track.title, title_dialect: track.title_dialect || "",
                          description: track.description || "", description_dialect: track.description_dialect || "",
                          audio_url: track.audio_url,
                        });
                        setEditingTrack(track.id); setShowMusicForm(true);
                      }}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteTrack(track.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {musicTracks.length === 0 && <p className="text-center text-muted-foreground py-8">Нема нумера. Додајте прву!</p>}
              </div>
            </TabsContent>
          )}

          {/* On This Day Tab */}
          {role === "admin" && (
            <TabsContent value="otd">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-serif font-bold text-foreground">На данашњи дан</h2>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleGenerateAI} disabled={generatingAI}>
                    {generatingAI ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    AI генериши за данас
                  </Button>
                  <Button onClick={() => { setOtdForm({ day_key: "", year: "", event_text: "", event_text_dialect: "" }); setEditingOtd(null); setShowOtdForm(true); }}>
                    <Plus className="h-4 w-4 mr-1" /> Додај ручно
                  </Button>
                </div>
              </div>

              {showOtdForm && (
                <div className="bg-card rounded-xl border border-border p-6 mb-6">
                  <h3 className="font-serif font-bold text-foreground mb-4">{editingOtd ? "Измени догађај" : "Нови догађај"}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Датум (ММ-ДД)</label>
                      <Input value={otdForm.day_key} onChange={(e) => setOtdForm({ ...otdForm, day_key: e.target.value })} placeholder="нпр. 04-14" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Година</label>
                      <Input value={otdForm.year} onChange={(e) => setOtdForm({ ...otdForm, year: e.target.value })} placeholder="нпр. 1878" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-1 block">Текст догађаја</label>
                      <Textarea value={otdForm.event_text} onChange={(e) => setOtdForm({ ...otdForm, event_text: e.target.value })} rows={2} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-foreground mb-1 block">Текст на дијалекту</label>
                      <Textarea value={otdForm.event_text_dialect} onChange={(e) => setOtdForm({ ...otdForm, event_text_dialect: e.target.value })} rows={2} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveOtd}>{editingOtd ? "Сачувај" : "Додај"}</Button>
                    <Button variant="outline" onClick={() => { setShowOtdForm(false); setEditingOtd(null); }}>Откажи</Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {otdEvents.map((ev) => (
                  <div key={ev.id} className="bg-card rounded-lg border border-border p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-accent">{ev.day_key}</span>
                        <span className="text-xs font-bold text-foreground">{ev.year}</span>
                      </div>
                      <p className="text-sm text-foreground">{ev.event_text}</p>
                      {ev.event_text_dialect && <p className="text-xs text-muted-foreground italic">{ev.event_text_dialect}</p>}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => {
                        setOtdForm({
                          day_key: ev.day_key, year: ev.year, event_text: ev.event_text,
                          event_text_dialect: ev.event_text_dialect || "",
                        });
                        setEditingOtd(ev.id); setShowOtdForm(true);
                      }}><Edit className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteOtd(ev.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {otdEvents.length === 0 && <p className="text-center text-muted-foreground py-8">Нема унетих догађаја. Додајте ручно или користите AI.</p>}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
