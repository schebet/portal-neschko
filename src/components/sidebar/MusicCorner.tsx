import { Music, Play, Pause, Volume2 } from "lucide-react";
import { useDialect } from "@/contexts/DialectContext";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MusicTrack {
  id: string;
  title: string;
  title_dialect: string | null;
  description: string | null;
  description_dialect: string | null;
  audio_url: string;
}

export function MusicCorner() {
  const { dialect } = useDialect();
  const isDialect = dialect === "Заплањски дијалект";
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    supabase
      .from("music_tracks")
      .select("id, title, title_dialect, description, description_dialect, audio_url")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        if (data) setTracks(data);
      });
  }, []);

  const track = tracks[currentIndex];

  const togglePlay = () => {
    if (!audioRef.current || !track) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.src = track.audio_url;
      audioRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (tracks.length <= 1) return;
    const next = (currentIndex + 1) % tracks.length;
    setCurrentIndex(next);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = tracks[next].audio_url;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="rounded-lg overflow-hidden border border-border">
        <div className="bg-primary px-4 py-3 flex items-center gap-2">
          <Music className="h-5 w-5 text-primary-foreground" />
          <h3 className="font-serif font-bold text-primary-foreground text-sm">
            {isDialect ? "Музички угал" : "Музички угао"}
          </h3>
        </div>
        <div className="bg-card p-4">
          <p className="text-xs text-muted-foreground text-center italic">
            {isDialect ? "Нема музике за пуштање" : "Нема музике за репродукцију"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border">
      <div className="bg-primary px-4 py-3 flex items-center gap-2">
        <Music className="h-5 w-5 text-primary-foreground" />
        <h3 className="font-serif font-bold text-primary-foreground text-sm">
          {isDialect ? "Музички угал" : "Музички угао"}
        </h3>
      </div>
      <div className="bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground hover:bg-accent/80 transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {isDialect ? (track.title_dialect || track.title) : track.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isDialect ? (track.description_dialect || track.description) : track.description}
            </p>
          </div>
          <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>

        {tracks.length > 1 && (
          <div className="space-y-1 mb-2">
            {tracks.map((t, i) => (
              <button
                key={t.id}
                onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${i === currentIndex ? "bg-accent/20 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {isDialect ? (t.title_dialect || t.title) : t.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-end gap-[2px] h-8 px-1">
          {Array.from({ length: 32 }).map((_, i) => {
            const height = Math.max(4, Math.sin(i * 0.5) * 20 + Math.random() * 12);
            return (
              <div
                key={i}
                className="flex-1 bg-accent/40 rounded-sm transition-all"
                style={{ height: `${height}px` }}
              />
            );
          })}
        </div>

        <audio ref={audioRef} onEnded={playNext} />
      </div>
    </div>
  );
}
